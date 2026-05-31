import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccessToken,
  AgentDispatchClient,
  RoomServiceClient,
} from 'livekit-server-sdk';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AllConfigType } from '../config/config.type';
import {
  LIVEKIT_DISPATCH_CLIENT,
  LIVEKIT_ROOM_SERVICE,
} from '../livekit/livekit.module';
import { CreateSessionResponseDto } from './dto/create-session-response.dto';
import { RecordTurnsDto } from './dto/record-turns.dto';
import { SessionSummaryResponseDto } from './dto/session-summary-response.dto';
import { PhonemeErrorsResponseDto } from './dto/phoneme-errors-response.dto';
import { PHONEME_WORD_PAIRS } from './phoneme-word-pairs.const';

const LEARNER_TOKEN_TTL_SECONDS = 3600;

@Injectable()
export class ConversationSessionsService {
  private readonly logger = new Logger(ConversationSessionsService.name);
  private static readonly PHONEME_ERROR_THRESHOLD = 60;

  constructor(
    @Inject(LIVEKIT_ROOM_SERVICE)
    private readonly roomService: RoomServiceClient,
    @Inject(LIVEKIT_DISPATCH_CLIENT)
    private readonly dispatchClient: AgentDispatchClient,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService<AllConfigType>,
  ) {}

  async create(
    boilerplateUserId: number,
    scenarioId?: string,
  ): Promise<CreateSessionResponseDto> {
    const lecaUserId = await this.resolveLecaUser(boilerplateUserId);

    const roomName = randomUUID();
    await this.roomService.createRoom({ name: roomName, emptyTimeout: 300 });

    const session = await this.prisma.conversationSession.create({
      data: {
        userId: lecaUserId,
        livekitRoomId: roomName,
        mode: 'free_talk',
        status: 'active',
      },
    });

    const learnerToken = await this.buildLearnerToken(roomName, lecaUserId);

    // Dispatch agent worker into room — fire and forget
    this.dispatchAgent(roomName, session.id, scenarioId).catch(
      (err: unknown) => {
        this.logger.warn(
          `Agent dispatch failed for session ${session.id}: ${String(err)}`,
        );
      },
    );

    return {
      sessionId: session.id,
      livekitToken: learnerToken,
      livekitUrl: this.config.getOrThrow('livekit.url', { infer: true }),
    };
  }

  async end(sessionId: string): Promise<void> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const durationSeconds = session.livekitRoomId
      ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
      : null;

    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        ...(durationSeconds !== null ? { durationSeconds } : {}),
      },
    });

    if (session.livekitRoomId) {
      try {
        await this.roomService.deleteRoom(session.livekitRoomId);
      } catch (err: unknown) {
        this.logger.warn(
          `Failed to delete LiveKit room ${session.livekitRoomId}: ${String(err)}`,
        );
      }
    }
  }

  async recordTurns(
    sessionId: string,
    dto: RecordTurnsDto,
  ): Promise<{ recorded: number }> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    for (const turn of dto.turns) {
      await this.prisma.conversationTurn.create({
        data: {
          sessionId,
          speaker: turn.speaker,
          transcript: turn.transcript,
          turnIndex: turn.turnIndex,
          durationMs: turn.durationMs ?? null,
          feedback:
            (turn.feedback as unknown as Prisma.InputJsonValue) ??
            Prisma.JsonNull,
        },
      });
    }
    return { recorded: dto.turns.length };
  }

  async getSummary(sessionId: string): Promise<SessionSummaryResponseDto> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
      include: {
        scenario: {
          select: {
            title: true,
            scenarioPhrases: {
              select: { phrase: true, exampleSentence: true },
            },
          },
        },
        turns: {
          select: { speaker: true, durationMs: true, transcript: true },
          orderBy: { turnIndex: 'asc' },
        },
      },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    const learnerTurns = session.turns.filter((t) => t.speaker === 'learner');
    const turnCount = learnerTurns.length;
    const speakingMs = learnerTurns.reduce(
      (sum, t) => sum + (t.durationMs ?? 0),
      0,
    );

    const allTranscript = learnerTurns
      .map((t) => t.transcript.toLowerCase())
      .join(' ');
    const phrasesUsed: string[] = [];
    const phrasesMissed: { phrase: string; exampleSentence: string }[] = [];
    for (const p of session.scenario?.scenarioPhrases ?? []) {
      if (allTranscript.includes(p.phrase.toLowerCase())) {
        phrasesUsed.push(p.phrase);
      } else {
        phrasesMissed.push({
          phrase: p.phrase,
          exampleSentence: p.exampleSentence,
        });
      }
    }

    const pronScores = await this.prisma.pronunciationScore.findMany({
      where: { sessionId },
      select: { phonemeScores: true },
    });
    const phonemeErrorCounts = this.countPhonemeErrors(pronScores);
    const topPhonemeEntry = Object.entries(phonemeErrorCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      sessionId,
      scenarioTitle: session.scenario?.title ?? null,
      fluencyScore:
        session.fluencyScore != null ? Number(session.fluencyScore) : null,
      pronunciationScore:
        session.pronunciationScore != null
          ? Number(session.pronunciationScore)
          : null,
      vocabularyScore:
        session.vocabularyScore != null
          ? Number(session.vocabularyScore)
          : null,
      durationSeconds: session.durationSeconds ?? null,
      turnCount,
      speakingMs,
      phrasesUsed,
      phrasesMissed: phrasesMissed.slice(0, 3),
      topPhonemeError: topPhonemeEntry?.[0] ?? null,
      phonemeErrorCount: topPhonemeEntry?.[1] ?? 0,
    };
  }

  async getPhonemeErrors(sessionId: string): Promise<PhonemeErrorsResponseDto> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    const pronScores = await this.prisma.pronunciationScore.findMany({
      where: { sessionId },
      select: { phonemeScores: true },
    });

    const errorCounts = this.countPhonemeErrors(pronScores);

    const topEntry = Object.entries(errorCounts).sort((a, b) => b[1] - a[1])[0];
    if (!topEntry) return { topPhoneme: null, errorCount: 0, wordPairs: [] };

    const [topPhoneme, errorCount] = topEntry;
    return {
      topPhoneme,
      errorCount,
      wordPairs: PHONEME_WORD_PAIRS[topPhoneme] ?? [],
    };
  }

  private countPhonemeErrors(
    pronScores: Array<{ phonemeScores: unknown }>,
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const ps of pronScores) {
      const scores = ps.phonemeScores as Record<string, number>;
      for (const [phoneme, score] of Object.entries(scores)) {
        if (score < ConversationSessionsService.PHONEME_ERROR_THRESHOLD) {
          counts[phoneme] = (counts[phoneme] ?? 0) + 1;
        }
      }
    }
    return counts;
  }

  // ── private helpers ──────────────────────────────────────────────────────────

  private async resolveLecaUser(boilerplateUserId: number): Promise<string> {
    const user = await this.usersService.findById(boilerplateUserId);
    if (!user || !user.email) {
      throw new NotFoundException('User not found');
    }

    let lecaUser = await this.prisma.lecaUser.findUnique({
      where: { email: user.email },
    });

    if (!lecaUser) {
      lecaUser = await this.prisma.lecaUser.create({
        data: {
          email: user.email,
          displayName:
            [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            user.email,
        },
      });
    }

    return lecaUser.id;
  }

  private async buildLearnerToken(
    roomName: string,
    identity: string,
  ): Promise<string> {
    const apiKey = this.config.getOrThrow('livekit.apiKey', { infer: true });
    const apiSecret = this.config.getOrThrow('livekit.apiSecret', {
      infer: true,
    });

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: LEARNER_TOKEN_TTL_SECONDS,
    });
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canSubscribe: true,
      canPublish: true,
    });
    return token.toJwt();
  }

  private async dispatchAgent(
    roomName: string,
    sessionId: string,
    scenarioId?: string,
  ): Promise<void> {
    const agentName = this.config.getOrThrow('livekit.agentName', {
      infer: true,
    });
    await this.dispatchClient.createDispatch(roomName, agentName, {
      metadata: JSON.stringify({
        sessionId,
        scenarioId: scenarioId ?? null,
      }),
    });
    this.logger.log(
      `Agent dispatched to room ${roomName} for session ${sessionId}`,
    );
  }
}
