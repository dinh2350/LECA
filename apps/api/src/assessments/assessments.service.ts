import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AssessmentsScorer } from './assessments.scorer';
import { ASSESSMENT_PROMPTS, TOTAL_PROMPTS } from './assessments.prompts';
import { StartAssessmentResponseDto } from './dto/start-assessment-response.dto';
import { AnswerAssessmentResponseDto } from './dto/answer-assessment-response.dto';
import { CompleteAssessmentResponseDto } from './dto/complete-assessment-response.dto';
import { AssessmentStatusDto } from './dto/assessment-status.dto';

const REDIS_TTL_SECONDS = 7200; // 2 hours
const REDIS_PREFIX = 'assessment:progress:';

const LEVEL_LABELS: Record<'A2' | 'B1' | 'C1', string> = {
  A2: 'Beginner',
  B1: 'Intermediate',
  C1: 'Advanced',
};

interface AssessmentProgress {
  id: string;
  lecaUserId: string;
  scores: number[];
}

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly scorer: AssessmentsScorer,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────

  /** Resolve boilerplate User → LecaUser (find or auto-create bridging record). */
  private async resolveLecaUser(
    boilerplateUserId: number | string,
  ): Promise<string> {
    const user = await this.usersService.findById(Number(boilerplateUserId));
    if (!user || !user.email) {
      throw new NotFoundException('User not found');
    }

    let lecaUser = await this.prisma.lecaUser.findUnique({
      where: { email: user.email },
    });

    if (!lecaUser) {
      // Auto-create a minimal LecaUser record (bridge until Issue #2 lands)
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

  private redisKey(id: string): string {
    return `${REDIS_PREFIX}${id}`;
  }

  private async getProgress(id: string): Promise<AssessmentProgress> {
    const raw = await this.redis.get(this.redisKey(id));
    if (!raw) {
      throw new NotFoundException('Assessment session not found or expired');
    }
    return JSON.parse(raw) as AssessmentProgress;
  }

  private async saveProgress(progress: AssessmentProgress): Promise<void> {
    await this.redis.set(
      this.redisKey(progress.id),
      JSON.stringify(progress),
      'EX',
      REDIS_TTL_SECONDS,
    );
  }

  // ─── Public API ───────────────────────────────────────────────

  async getStatus(
    boilerplateUserId: number | string,
  ): Promise<AssessmentStatusDto> {
    const lecaUserId = await this.resolveLecaUser(boilerplateUserId);

    const assessment = await this.prisma.levelAssessment.findFirst({
      where: { userId: lecaUserId },
      orderBy: { assessedAt: 'desc' },
    });

    if (!assessment) {
      return { hasCompleted: false };
    }

    const level = assessment.assessedLevel as 'A2' | 'B1' | 'C1';
    return {
      hasCompleted: true,
      level,
      levelLabel: LEVEL_LABELS[level] ?? level,
    };
  }

  async start(
    boilerplateUserId: number | string,
  ): Promise<StartAssessmentResponseDto> {
    const lecaUserId = await this.resolveLecaUser(boilerplateUserId);

    const alreadyDone = await this.prisma.levelAssessment.findFirst({
      where: { userId: lecaUserId },
    });
    if (alreadyDone) {
      throw new BadRequestException('Assessment already completed');
    }

    const id = randomUUID();
    const progress: AssessmentProgress = { id, lecaUserId, scores: [] };
    await this.saveProgress(progress);

    const first = ASSESSMENT_PROMPTS[0];
    return {
      id,
      promptIndex: 0,
      promptText: first.text,
      totalPrompts: TOTAL_PROMPTS,
    };
  }

  async answer(
    id: string,
    transcript: string | undefined,
  ): Promise<AnswerAssessmentResponseDto> {
    const progress = await this.getProgress(id);
    const currentIndex = progress.scores.length;

    if (currentIndex >= TOTAL_PROMPTS) {
      throw new BadRequestException('All prompts already answered');
    }

    const score = await this.scorer.score(currentIndex, transcript ?? '');
    progress.scores.push(score);
    await this.saveProgress(progress);

    const currentPrompt = ASSESSMENT_PROMPTS[currentIndex];
    const isComplete = progress.scores.length === TOTAL_PROMPTS;

    if (isComplete) {
      return { isComplete: true, aiFollowUp: currentPrompt.aiFollowUp };
    }

    const next = ASSESSMENT_PROMPTS[progress.scores.length];
    return {
      isComplete: false,
      aiFollowUp: currentPrompt.aiFollowUp,
      nextPromptIndex: next.index,
      nextPromptText: next.text,
    };
  }

  async complete(id: string): Promise<CompleteAssessmentResponseDto> {
    const progress = await this.getProgress(id);

    if (progress.scores.length < TOTAL_PROMPTS) {
      throw new BadRequestException(
        `Assessment incomplete: ${progress.scores.length}/${TOTAL_PROMPTS} prompts answered`,
      );
    }

    const avgScore =
      progress.scores.reduce((a, b) => a + b, 0) / progress.scores.length;
    const { level, label } = this.scorer.classify(avgScore);

    await this.prisma.levelAssessment.create({
      data: {
        userId: progress.lecaUserId,
        assessedLevel: level,
        fluencyScore: avgScore,
      },
    });

    await this.prisma.lecaUser.update({
      where: { id: progress.lecaUserId },
      data: { englishLevel: level },
    });

    await this.redis.del(this.redisKey(id));

    this.logger.log(
      `Assessment ${id} completed: level=${level}, score=${Math.round(avgScore)}`,
    );

    return { level, levelLabel: label, score: Math.round(avgScore) };
  }
}
