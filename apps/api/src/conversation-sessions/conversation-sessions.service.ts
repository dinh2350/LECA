import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AllConfigType } from '../config/config.type';
import { LIVEKIT_ROOM_SERVICE } from '../livekit/livekit.module';
import { CreateSessionResponseDto } from './dto/create-session-response.dto';

const LEARNER_TOKEN_TTL_SECONDS = 3600;

@Injectable()
export class ConversationSessionsService {
  private readonly logger = new Logger(ConversationSessionsService.name);

  constructor(
    @Inject(LIVEKIT_ROOM_SERVICE)
    private readonly roomService: RoomServiceClient,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService<AllConfigType>,
  ) {}

  async create(boilerplateUserId: number): Promise<CreateSessionResponseDto> {
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

    // Fire-and-forget: notify agent to join the room
    this.notifyAgent(roomName, session.id).catch((err: unknown) => {
      this.logger.warn(
        `Agent notification failed for session ${session.id}: ${String(err)}`,
      );
    });

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

  private async notifyAgent(
    roomName: string,
    sessionId: string,
  ): Promise<void> {
    const apiKey = this.config.getOrThrow('livekit.apiKey', { infer: true });
    const apiSecret = this.config.getOrThrow('livekit.apiSecret', {
      infer: true,
    });
    const livekitUrl = this.config.getOrThrow('livekit.url', { infer: true });
    const agentUrl = this.config.getOrThrow('livekit.agentUrl', {
      infer: true,
    });

    const agentToken = new AccessToken(apiKey, apiSecret, {
      identity: `leca-agent-${sessionId}`,
      ttl: LEARNER_TOKEN_TTL_SECONDS,
    });
    agentToken.addGrant({
      roomJoin: true,
      room: roomName,
      canSubscribe: true,
      canPublish: true,
      hidden: true,
    });
    const agentJwt = await agentToken.toJwt();

    const res = await fetch(`${agentUrl}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        roomName,
        livekitUrl,
        token: agentJwt,
      }),
    });

    if (!res.ok) {
      throw new Error(`Agent responded ${res.status}`);
    }
  }
}
