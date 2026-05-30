# Level Assessment (Issue #4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trigger a 2-minute spoken level assessment after a user's first authenticated login, classify them as Beginner / Intermediate / Advanced, and store the result in `level_assessments`, seeding the AI tutor's adaptive difficulty.

**Architecture:** A new `assessments` NestJS module handles five hardcoded prompts; in-progress state is kept in Redis and written to `level_assessments` only on completion. The frontend detects missing assessments via a status endpoint and gates entry to the main app behind `/onboarding/assessment`. Audio is accepted as multipart/form-data and stored via the existing files infra; transcript text is scored by Ollama (LLM prompt) with a numeric fallback.

**Tech Stack:** NestJS + Prisma (PostgreSQL) + Redis (ioredis) + Next.js 15 (App Router) + React Query + MediaRecorder API + Ollama HTTP (scoring)

---

## File Map

### New files — API

| Path | Responsibility |
|------|---------------|
| `apps/api/src/assessments/assessments.module.ts` | Module wiring |
| `apps/api/src/assessments/assessments.controller.ts` | HTTP endpoints |
| `apps/api/src/assessments/assessments.service.ts` | Business logic |
| `apps/api/src/assessments/assessments.prompts.ts` | 5 hardcoded prompts constant |
| `apps/api/src/assessments/assessments.scorer.ts` | LLM / heuristic scoring |
| `apps/api/src/assessments/dto/start-assessment-response.dto.ts` | POST /assessments response |
| `apps/api/src/assessments/dto/answer-assessment.dto.ts` | POST /assessments/:id/answer request |
| `apps/api/src/assessments/dto/answer-assessment-response.dto.ts` | per-turn response |
| `apps/api/src/assessments/dto/complete-assessment-response.dto.ts` | POST /assessments/:id/complete response |
| `apps/api/src/assessments/dto/assessment-status.dto.ts` | GET /assessments/status response |

### Modified files — API

| Path | Change |
|------|--------|
| `apps/api/src/app.module.ts` | Import `AssessmentsModule` |
| `apps/api/src/auth/strategies/types/jwt-payload.type.ts` | *(read-only reference)* |

### New files — Web

| Path | Responsibility |
|------|---------------|
| `apps/web/src/app/[language]/onboarding/assessment/page.tsx` | Route entry |
| `apps/web/src/app/[language]/onboarding/assessment/page-content.tsx` | Assessment UI (5 prompts, audio recording, result) |
| `apps/web/src/services/api/services/assessments.ts` | API hooks (React Query) |
| `apps/web/src/hooks/use-assessment-gate.ts` | Redirect hook — checks status, pushes to assessment if needed |

### Modified files — Web

| Path | Change |
|------|--------|
| `apps/web/src/app/[language]/page.tsx` | Add `<AssessmentGate />` wrapper |

---

## Task 1: Assessment Prompts Constant

**Files:**
- Create: `apps/api/src/assessments/assessments.prompts.ts`

- [ ] **Step 1: Create the prompts file**

```typescript
export interface AssessmentPrompt {
  index: number;
  text: string;
  aiFollowUp: string; // AI's response after learner answers, to keep dialogue natural
}

export const ASSESSMENT_PROMPTS: AssessmentPrompt[] = [
  {
    index: 0,
    text: "Please introduce yourself. Tell me your name and what you do for work.",
    aiFollowUp: "Nice to meet you! That sounds interesting.",
  },
  {
    index: 1,
    text: "Describe your daily routine at work. What tasks do you usually do each day?",
    aiFollowUp: "It sounds like you have a busy day!",
  },
  {
    index: 2,
    text: "Tell me about a challenge you faced at work recently and how you handled it.",
    aiFollowUp: "That must have been difficult. How did you feel about the outcome?",
  },
  {
    index: 3,
    text: "If you could improve one aspect of how English is taught in your country, what would it be and why?",
    aiFollowUp: "That's a thoughtful perspective.",
  },
  {
    index: 4,
    text: "Describe a complex decision you made recently. What factors did you weigh, and what was the result?",
    aiFollowUp: "Thank you for sharing that — it takes real reflection to analyse decisions like that.",
  },
];

export const TOTAL_PROMPTS = ASSESSMENT_PROMPTS.length; // 5
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/assessments/assessments.prompts.ts
git commit -m "feat(assessments): add 5 hardcoded assessment prompts"
```

---

## Task 2: DTOs

**Files:**
- Create: `apps/api/src/assessments/dto/` (5 files)

- [ ] **Step 1: Create `start-assessment-response.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class StartAssessmentResponseDto {
  @ApiProperty({ description: 'UUID of the in-progress assessment' })
  id: string;

  @ApiProperty({ description: 'Index of the current prompt (0-based)' })
  promptIndex: number;

  @ApiProperty({ description: 'Text the learner should respond to' })
  promptText: string;

  @ApiProperty({ description: 'Total number of prompts in the assessment' })
  totalPrompts: number;
}
```

- [ ] **Step 2: Create `answer-assessment.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AnswerAssessmentDto {
  @ApiProperty({
    description: 'Plain-text transcript of the learner response (used for scoring)',
    required: false,
  })
  @IsOptional()
  @IsString()
  transcript?: string;
}
```

- [ ] **Step 3: Create `answer-assessment-response.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class AnswerAssessmentResponseDto {
  @ApiProperty({ description: 'Whether all prompts are done' })
  isComplete: boolean;

  @ApiProperty({ description: 'AI follow-up text for the current turn', required: false })
  aiFollowUp?: string;

  @ApiProperty({ description: 'Index of the NEXT prompt (null when complete)', required: false })
  nextPromptIndex?: number;

  @ApiProperty({ description: 'Text of the NEXT prompt (null when complete)', required: false })
  nextPromptText?: string;
}
```

- [ ] **Step 4: Create `complete-assessment-response.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CompleteAssessmentResponseDto {
  @ApiProperty({
    description: 'Assessed level',
    enum: ['BEG', 'INT', 'ADV'],
  })
  level: 'BEG' | 'INT' | 'ADV';

  @ApiProperty({ description: 'Human-readable label' })
  levelLabel: string; // 'Beginner' | 'Intermediate' | 'Advanced'

  @ApiProperty({ description: 'Aggregate score 0-100' })
  score: number;
}
```

- [ ] **Step 5: Create `assessment-status.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class AssessmentStatusDto {
  @ApiProperty({ description: 'Whether the user has a completed assessment' })
  hasCompleted: boolean;

  @ApiProperty({
    description: 'The assessed level if completed',
    enum: ['BEG', 'INT', 'ADV'],
    required: false,
  })
  level?: 'BEG' | 'INT' | 'ADV';

  @ApiProperty({ description: 'Human-readable label', required: false })
  levelLabel?: string;
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/assessments/dto/
git commit -m "feat(assessments): add assessment DTOs"
```

---

## Task 3: Scorer

**Files:**
- Create: `apps/api/src/assessments/assessments.scorer.ts`

- [ ] **Step 1: Create scorer with Ollama integration and heuristic fallback**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class AssessmentsScorer {
  private readonly logger = new Logger(AssessmentsScorer.name);
  private readonly ollamaUrl: string;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    // Falls back to localhost:11434 (default Ollama port) if not configured
    this.ollamaUrl =
      this.configService.get('app.ollamaUrl', { infer: true }) ??
      'http://localhost:11434';
  }

  /**
   * Score a learner's transcript for a given prompt index.
   * Returns a score 0–100.
   * Falls back to a heuristic if Ollama is unavailable.
   */
  async score(promptIndex: number, transcript: string): Promise<number> {
    if (!transcript || transcript.trim().length === 0) {
      return 30; // Minimal score for no response
    }

    try {
      const score = await this.scoreviaOllama(promptIndex, transcript);
      return score;
    } catch (err) {
      this.logger.warn(
        `Ollama unavailable, using heuristic fallback: ${(err as Error).message}`,
      );
      return this.heuristicScore(transcript);
    }
  }

  private async scoreviaOllama(
    promptIndex: number,
    transcript: string,
  ): Promise<number> {
    const prompt = `You are an English language assessor. Score the following learner response to an assessment prompt on a scale of 0 to 100, where 0 is completely unintelligible and 100 is native-level fluency. Consider grammar, vocabulary, clarity, and completeness. Respond with ONLY a number between 0 and 100.

Prompt difficulty: ${promptIndex < 2 ? 'Beginner' : promptIndex < 4 ? 'Intermediate' : 'Advanced'}
Learner response: "${transcript}"
Score:`;

    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = (await response.json()) as { response: string };
    const match = data.response.match(/\d+/);
    if (!match) throw new Error('Could not parse Ollama score');

    const score = Math.min(100, Math.max(0, parseInt(match[0], 10)));
    return score;
  }

  /**
   * Simple heuristic: word count + avg word length as a proxy for complexity.
   * Intentionally rough — only used when Ollama is down.
   */
  private heuristicScore(transcript: string): number {
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const avgLen =
      wordCount > 0
        ? words.reduce((sum, w) => sum + w.length, 0) / wordCount
        : 0;

    const lengthScore = Math.min(60, wordCount * 2); // up to 60 pts for length
    const complexityScore = Math.min(40, Math.round(avgLen * 5)); // up to 40 pts
    return Math.min(100, lengthScore + complexityScore);
  }

  /** Map average score to Beginner / Intermediate / Advanced */
  classify(avgScore: number): { level: 'BEG' | 'INT' | 'ADV'; label: string } {
    if (avgScore < 40) return { level: 'BEG', label: 'Beginner' };
    if (avgScore < 70) return { level: 'INT', label: 'Intermediate' };
    return { level: 'ADV', label: 'Advanced' };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/assessments/assessments.scorer.ts
git commit -m "feat(assessments): add scorer with Ollama + heuristic fallback"
```

---

## Task 4: Assessments Service

**Files:**
- Create: `apps/api/src/assessments/assessments.service.ts`

The service bridges the boilerplate `User` (from JWT) to `LecaUser` via email lookup.
Redis key pattern: `assessment:progress:{assessmentId}` (TTL: 7200 s = 2 h).

- [ ] **Step 1: Create the service**

```typescript
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
import {
  ASSESSMENT_PROMPTS,
  TOTAL_PROMPTS,
} from './assessments.prompts';
import { StartAssessmentResponseDto } from './dto/start-assessment-response.dto';
import { AnswerAssessmentResponseDto } from './dto/answer-assessment-response.dto';
import { CompleteAssessmentResponseDto } from './dto/complete-assessment-response.dto';
import { AssessmentStatusDto } from './dto/assessment-status.dto';

const REDIS_TTL_SECONDS = 7200; // 2 hours
const REDIS_PREFIX = 'assessment:progress:';

interface AssessmentProgress {
  id: string;
  lecaUserId: string;
  scores: number[]; // one score per answered prompt
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

  /** Resolve boilerplate User → LecaUser (find or create). */
  private async resolveLecaUser(boilerplateUserId: number | string): Promise<string> {
    const user = await this.usersService.findById(Number(boilerplateUserId));
    if (!user || !user.email) {
      throw new NotFoundException('User not found');
    }

    let lecaUser = await this.prisma.lecaUser.findUnique({
      where: { email: user.email },
    });

    if (!lecaUser) {
      // Auto-create a minimal LecaUser record (bridging until #2 lands)
      lecaUser = await this.prisma.lecaUser.create({
        data: {
          email: user.email,
          displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
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
    if (!raw) throw new NotFoundException('Assessment session not found or expired');
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

  async getStatus(boilerplateUserId: number | string): Promise<AssessmentStatusDto> {
    const lecaUserId = await this.resolveLecaUser(boilerplateUserId);

    const assessment = await this.prisma.levelAssessment.findFirst({
      where: { userId: lecaUserId },
      orderBy: { assessedAt: 'desc' },
    });

    if (!assessment) {
      return { hasCompleted: false };
    }

    const level = assessment.assessedLevel as 'BEG' | 'INT' | 'ADV';
    const labelMap = { BEG: 'Beginner', INT: 'Intermediate', ADV: 'Advanced' };
    return {
      hasCompleted: true,
      level,
      levelLabel: labelMap[level] ?? level,
    };
  }

  async start(boilerplateUserId: number | string): Promise<StartAssessmentResponseDto> {
    const lecaUserId = await this.resolveLecaUser(boilerplateUserId);

    // Prevent duplicate in-progress sessions (optional guard)
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

    // Update LecaUser.englishLevel
    await this.prisma.lecaUser.update({
      where: { id: progress.lecaUserId },
      data: { englishLevel: level },
    });

    await this.redis.del(this.redisKey(id));

    return { level, levelLabel: label, score: Math.round(avgScore) };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/assessments/assessments.service.ts
git commit -m "feat(assessments): add assessments service with Redis state + level classification"
```

---

## Task 5: Assessments Controller

**Files:**
- Create: `apps/api/src/assessments/assessments.controller.ts`

Audio is accepted as multipart (optional). The transcript field is extracted from the form body.

- [ ] **Step 1: Create the controller**

```typescript
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { AssessmentsService } from './assessments.service';
import { AnswerAssessmentDto } from './dto/answer-assessment.dto';
import { AnswerAssessmentResponseDto } from './dto/answer-assessment-response.dto';
import { AssessmentStatusDto } from './dto/assessment-status.dto';
import { CompleteAssessmentResponseDto } from './dto/complete-assessment-response.dto';
import { StartAssessmentResponseDto } from './dto/start-assessment-response.dto';

@ApiTags('Assessments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'assessments', version: '1' })
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  /** Check whether this user has a completed assessment. */
  @Get('status')
  @ApiOkResponse({ type: AssessmentStatusDto })
  getStatus(
    @Req() req: Request & { user: JwtPayloadType },
  ): Promise<AssessmentStatusDto> {
    return this.service.getStatus(req.user.id);
  }

  /** Start a new assessment session. Returns first prompt. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ type: StartAssessmentResponseDto })
  start(
    @Req() req: Request & { user: JwtPayloadType },
  ): Promise<StartAssessmentResponseDto> {
    return this.service.start(req.user.id);
  }

  /**
   * Submit an answer for the current prompt.
   * Accepts multipart/form-data with optional audio file + optional transcript text.
   */
  @Post(':id/answer')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOkResponse({ type: AnswerAssessmentResponseDto })
  @UseInterceptors(FileInterceptor('audio'))
  answer(
    @Param('id') id: string,
    @Body() body: AnswerAssessmentDto,
    @UploadedFile() _audio?: Express.Multer.File, // stored for future transcription
  ): Promise<AnswerAssessmentResponseDto> {
    return this.service.answer(id, body.transcript);
  }

  /** Finalise assessment, compute level, persist to DB. */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CompleteAssessmentResponseDto })
  complete(@Param('id') id: string): Promise<CompleteAssessmentResponseDto> {
    return this.service.complete(id);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/assessments/assessments.controller.ts
git commit -m "feat(assessments): add assessments controller"
```

---

## Task 6: Assessments Module + Register in App

**Files:**
- Create: `apps/api/src/assessments/assessments.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create `assessments.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { AssessmentsScorer } from './assessments.scorer';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, AssessmentsScorer],
})
export class AssessmentsModule {}
```

- [ ] **Step 2: Register in `app.module.ts`**

Find the imports array near `ConversationsModule`:

```typescript
// Before
import { ConversationsModule } from './conversations/conversations.module';

// Add after:
import { AssessmentsModule } from './assessments/assessments.module';
```

And add `AssessmentsModule` to the `imports` array in `@Module`:

```typescript
// In @Module imports array, add:
AssessmentsModule,
```

- [ ] **Step 3: Verify the app compiles**

```bash
cd apps/api && pnpm build 2>&1 | tail -20
```

Expected: no TypeScript errors. If Multer types are missing:
```bash
pnpm add -D @types/multer
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/assessments/assessments.module.ts apps/api/src/app.module.ts
git commit -m "feat(assessments): register AssessmentsModule in AppModule"
```

---

## Task 7: UsersService — expose `findById`

The `AssessmentsService` needs `usersService.findById`. Check if it exists:

- [ ] **Step 1: Check if `findById` exists in UsersService**

```bash
grep -n "findById" apps/api/src/users/users.service.ts
```

- [ ] **Step 2: If missing, add it**

Open `apps/api/src/users/users.service.ts` and find the `findByEmail` method. Add `findById` directly after it:

```typescript
async findById(id: User['id']): Promise<NullableType<User>> {
  return this.usersRepository.findById(id);
}
```

Then verify `UserRepository` (and its Prisma implementation) exposes `findById`. Check:

```bash
grep -n "findById" apps/api/src/users/infrastructure/persistence/user.repository.ts 2>/dev/null || \
grep -rn "findById" apps/api/src/users/
```

If the repository implementation is missing `findById`, open the Prisma implementation file and add:

```typescript
async findById(id: User['id']): Promise<NullableType<User>> {
  const entity = await this.userRepository.findOne({ where: { id: Number(id) } });
  return entity ? UserMapper.toDomain(entity) : null;
}
```

*(The exact implementation depends on which persistence adapter is active. Use the pattern matching `findByEmail`.)*

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/users/
git commit -m "feat(users): expose findById on UsersService"
```

---

## Task 8: End-to-End API smoke test (manual)

No automated test is included here for the AI scoring path because it requires a live Ollama instance. A unit test for the classifier is included below.

- [ ] **Step 1: Write unit test for scorer.classify()**

Create `apps/api/src/assessments/assessments.scorer.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AssessmentsScorer } from './assessments.scorer';

describe('AssessmentsScorer.classify', () => {
  let scorer: AssessmentsScorer;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AssessmentsScorer,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();
    scorer = module.get(AssessmentsScorer);
  });

  it('classifies score < 40 as Beginner', () => {
    expect(scorer.classify(0).level).toBe('BEG');
    expect(scorer.classify(39).level).toBe('BEG');
  });

  it('classifies score 40–69 as Intermediate', () => {
    expect(scorer.classify(40).level).toBe('INT');
    expect(scorer.classify(69).level).toBe('INT');
  });

  it('classifies score >= 70 as Advanced', () => {
    expect(scorer.classify(70).level).toBe('ADV');
    expect(scorer.classify(100).level).toBe('ADV');
  });
});
```

- [ ] **Step 2: Run the test**

```bash
cd apps/api && pnpm test -- --testPathPattern=assessments.scorer.spec
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/assessments/assessments.scorer.spec.ts
git commit -m "test(assessments): scorer classify unit tests"
```

---

## Task 9: Frontend — API Service

**Files:**
- Create: `apps/web/src/services/api/services/assessments.ts`

- [ ] **Step 1: Create the assessments API hooks**

```typescript
import { useCallback } from 'react';
import useFetch from '../use-fetch';
import { API_URL } from '../config';
import wrapperFetchJsonResponse from '../wrapper-fetch-json-response';
import { RequestConfigType } from './types/request-config';

export type AssessmentStatus = {
  hasCompleted: boolean;
  level?: 'BEG' | 'INT' | 'ADV';
  levelLabel?: string;
};

export type StartAssessmentResponse = {
  id: string;
  promptIndex: number;
  promptText: string;
  totalPrompts: number;
};

export type AnswerAssessmentResponse = {
  isComplete: boolean;
  aiFollowUp?: string;
  nextPromptIndex?: number;
  nextPromptText?: string;
};

export type CompleteAssessmentResponse = {
  level: 'BEG' | 'INT' | 'ADV';
  levelLabel: string;
  score: number;
};

export function useGetAssessmentStatusService() {
  const fetchBase = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/assessments/status`, {
        method: 'GET',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AssessmentStatus>);
    },
    [fetchBase],
  );
}

export function useStartAssessmentService() {
  const fetchBase = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetchBase(`${API_URL}/v1/assessments`, {
        method: 'POST',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<StartAssessmentResponse>);
    },
    [fetchBase],
  );
}

export function useAnswerAssessmentService() {
  const fetchBase = useFetch();

  return useCallback(
    (id: string, data: { transcript?: string; audio?: Blob }) => {
      const formData = new FormData();
      if (data.transcript) formData.append('transcript', data.transcript);
      if (data.audio) formData.append('audio', data.audio, 'answer.webm');

      return fetchBase(`${API_URL}/v1/assessments/${id}/answer`, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type — browser sets multipart boundary automatically
      }).then(wrapperFetchJsonResponse<AnswerAssessmentResponse>);
    },
    [fetchBase],
  );
}

export function useCompleteAssessmentService() {
  const fetchBase = useFetch();

  return useCallback(
    (id: string) => {
      return fetchBase(`${API_URL}/v1/assessments/${id}/complete`, {
        method: 'POST',
      }).then(wrapperFetchJsonResponse<CompleteAssessmentResponse>);
    },
    [fetchBase],
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/services/api/services/assessments.ts
git commit -m "feat(web/assessments): add assessment API service hooks"
```

---

## Task 10: Frontend — Assessment Gate Hook

**Files:**
- Create: `apps/web/src/hooks/use-assessment-gate.ts`

- [ ] **Step 1: Create the hook**

The hook checks the assessment status once per session (cached in `sessionStorage`) and redirects to the assessment page if the user hasn't completed one.

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/services/auth/use-auth';
import { useGetAssessmentStatusService } from '@/services/api/services/assessments';
import useLanguage from '@/services/i18n/use-language';

const SESSION_KEY = 'leca:assessment:checked';

/**
 * Call this hook in any page that authenticated users visit first (e.g. home).
 * It silently checks assessment status and redirects if needed.
 * The check is cached per browser session to avoid repeated API calls.
 */
export function useAssessmentGate() {
  const { user, isLoaded } = useAuth();
  const router = useRouter();
  const language = useLanguage();
  const fetchStatus = useGetAssessmentStatusService();
  const checking = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (checking.current) return;

    checking.current = true;

    fetchStatus()
      .then(({ data, status }) => {
        sessionStorage.setItem(SESSION_KEY, '1');
        if (status === 200 && data && !data.hasCompleted) {
          router.replace(`/${language}/onboarding/assessment`);
        }
      })
      .catch(() => {
        // Silently fail — don't block the user if status check fails
        sessionStorage.setItem(SESSION_KEY, '1');
      })
      .finally(() => {
        checking.current = false;
      });
  }, [user, isLoaded, fetchStatus, router, language]);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/hooks/use-assessment-gate.ts
git commit -m "feat(web): add useAssessmentGate hook for first-login redirect"
```

---

## Task 11: Frontend — Assessment Page Content

**Files:**
- Create: `apps/web/src/app/[language]/onboarding/assessment/page-content.tsx`

The UI has 5 states: `idle → recording → submitted → (repeat 5×) → result`. Audio is recorded via `MediaRecorder`; a text fallback is shown if mic is denied.

- [ ] **Step 1: Create the page content component**

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import {
  useStartAssessmentService,
  useAnswerAssessmentService,
  useCompleteAssessmentService,
  CompleteAssessmentResponse,
} from '@/services/api/services/assessments';
import useLanguage from '@/services/i18n/use-language';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Phase =
  | 'starting'
  | 'prompt'
  | 'recording'
  | 'submitting'
  | 'result'
  | 'error';

function AssessmentPageContent() {
  const language = useLanguage();
  const router = useRouter();

  const startAssessment = useStartAssessmentService();
  const answerAssessment = useAnswerAssessmentService();
  const completeAssessment = useCompleteAssessmentService();

  const [phase, setPhase] = useState<Phase>('starting');
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptText, setPromptText] = useState('');
  const [totalPrompts, setTotalPrompts] = useState(5);
  const [aiFollowUp, setAiFollowUp] = useState('');
  const [result, setResult] = useState<CompleteAssessmentResponse | null>(null);
  const [fallbackText, setFallbackText] = useState('');
  const [micDenied, setMicDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Start the assessment on mount
  useEffect(() => {
    startAssessment()
      .then(({ data, status }) => {
        if (status === 201 && data) {
          setAssessmentId(data.id);
          setPromptIndex(data.promptIndex);
          setPromptText(data.promptText);
          setTotalPrompts(data.totalPrompts);
          setPhase('prompt');
        } else if (status === 400) {
          // Already completed — go home
          router.replace(`/${language}`);
        } else {
          setErrorMessage('Failed to start assessment. Please try again.');
          setPhase('error');
        }
      })
      .catch(() => {
        setErrorMessage('Network error. Please check your connection.');
        setPhase('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(async () => {
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setPhase('recording');
    } catch {
      setMicDenied(true);
      // Show text fallback
      setPhase('recording');
    }
  }, []);

  const stopAndSubmit = useCallback(async () => {
    if (!assessmentId) return;
    setPhase('submitting');

    let audioBlob: Blob | undefined;
    if (mediaRecorderRef.current && !micDenied) {
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => resolve();
        mediaRecorderRef.current!.stop();
        mediaRecorderRef.current!.stream.getTracks().forEach((t) => t.stop());
      });
      audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    }

    const transcript = micDenied ? fallbackText : undefined;

    try {
      const { data: answerData, status: answerStatus } = await answerAssessment(
        assessmentId,
        { transcript, audio: audioBlob },
      );

      if (answerStatus !== 200 || !answerData) {
        throw new Error('Unexpected response');
      }

      setAiFollowUp(answerData.aiFollowUp ?? '');

      if (answerData.isComplete) {
        // Finalize
        const { data: finalData, status: finalStatus } = await completeAssessment(assessmentId);
        if (finalStatus === 200 && finalData) {
          setResult(finalData);
          // Mark assessment as done in session cache
          sessionStorage.setItem('leca:assessment:checked', '1');
          setPhase('result');
        } else {
          throw new Error('Failed to finalize assessment');
        }
      } else {
        setPromptIndex(answerData.nextPromptIndex!);
        setPromptText(answerData.nextPromptText!);
        setFallbackText('');
        setPhase('prompt');
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setPhase('error');
    }
  }, [assessmentId, answerAssessment, completeAssessment, micDenied, fallbackText]);

  // ─── Render ───────────────────────────────────────────────────

  if (phase === 'starting') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Preparing your assessment…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{errorMessage}</p>
        <Button onClick={() => router.replace(`/${language}`)}>Go to home</Button>
      </div>
    );
  }

  if (phase === 'result' && result) {
    const levelDescription: Record<string, string> = {
      BEG: 'You\'re at the Beginner level. We\'ll start with foundational English practice to build your confidence.',
      INT: 'You\'re at the Intermediate level. We\'ll focus on fluency, vocabulary, and complex conversations.',
      ADV: 'You\'re at the Advanced level. We\'ll challenge you with nuanced topics and professional English.',
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="text-3xl font-bold">Your English Level</h1>
        <div className="rounded-2xl border px-12 py-6">
          <p className="text-5xl font-extrabold">{result.levelLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">Score: {result.score}/100</p>
        </div>
        <p className="max-w-sm text-muted-foreground">
          {levelDescription[result.level]}
        </p>
        <Button size="lg" onClick={() => router.replace(`/${language}`)}>
          Start learning
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      {/* Progress */}
      <div className="w-full max-w-md">
        <p className="mb-2 text-sm text-muted-foreground">
          Question {promptIndex + 1} of {totalPrompts}
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((promptIndex + 1) / totalPrompts) * 100}%` }}
          />
        </div>
      </div>

      {/* AI follow-up from previous turn */}
      {aiFollowUp && (
        <div className="w-full max-w-md rounded-xl border bg-muted/40 px-4 py-3 text-sm italic text-muted-foreground">
          LECA: {aiFollowUp}
        </div>
      )}

      {/* Current prompt */}
      <div className="w-full max-w-md rounded-2xl border bg-card px-6 py-5 shadow-sm">
        <p className="text-lg font-medium leading-relaxed">{promptText}</p>
      </div>

      {/* Mic denied fallback */}
      {micDenied && phase === 'recording' && (
        <div className="w-full max-w-md">
          <p className="mb-2 text-sm text-destructive">
            Microphone access denied. Please type your answer below.
          </p>
          <Textarea
            rows={4}
            placeholder="Type your answer here…"
            value={fallbackText}
            onChange={(e) => setFallbackText(e.target.value)}
            className="resize-none"
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {phase === 'prompt' && (
          <Button size="lg" onClick={startRecording}>
            🎙 Start Speaking
          </Button>
        )}

        {phase === 'recording' && (
          <Button
            size="lg"
            variant="destructive"
            onClick={stopAndSubmit}
            disabled={micDenied && !fallbackText.trim()}
          >
            {micDenied ? 'Submit Answer' : '⏹ Stop & Submit'}
          </Button>
        )}

        {phase === 'submitting' && (
          <Button size="lg" disabled>
            Processing…
          </Button>
        )}
      </div>

      {/* Disclaimer: skipping not allowed */}
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        You must complete all {totalPrompts} questions to continue.
        Closing this page will require you to start over.
      </p>
    </div>
  );
}

export default withPageRequiredAuth(AssessmentPageContent);
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/[language]/onboarding/assessment/page-content.tsx
git commit -m "feat(web/assessment): add assessment page UI with audio recording and text fallback"
```

---

## Task 12: Frontend — Assessment Page Route

**Files:**
- Create: `apps/web/src/app/[language]/onboarding/assessment/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import AssessmentPageContent from './page-content';

export default function AssessmentPage() {
  return <AssessmentPageContent />;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/[language]/onboarding/assessment/page.tsx
git commit -m "feat(web/assessment): add /onboarding/assessment route"
```

---

## Task 13: Frontend — Wire Gate into Home Page

**Files:**
- Modify: `apps/web/src/app/[language]/page.tsx` (or whichever file is the home/dashboard landing)

- [ ] **Step 1: Read the current home page**

```bash
cat apps/web/src/app/[language]/page.tsx
```

- [ ] **Step 2: Add `useAssessmentGate` to the home page component**

In the page component (or page-content component if it exists), import and call the hook:

```tsx
import { useAssessmentGate } from '@/hooks/use-assessment-gate';

// Inside the component:
useAssessmentGate();
```

If the home page is a Server Component (`async function`), create a `apps/web/src/app/[language]/home-client.tsx` wrapper:

```tsx
'use client';
import { useAssessmentGate } from '@/hooks/use-assessment-gate';
import { PropsWithChildren } from 'react';

export function AssessmentGate({ children }: PropsWithChildren) {
  useAssessmentGate();
  return <>{children}</>;
}
```

Then wrap the home page body in `<AssessmentGate>`.

- [ ] **Step 3: Verify the page compiles**

```bash
cd apps/web && pnpm build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/[language]/
git commit -m "feat(web): trigger assessment gate on home page"
```

---

## Task 14: Verify acceptance criteria

- [ ] **Assessment shown automatically on first authenticated session**

  1. Register a new user, log in
  2. Observe: browser redirects to `/onboarding/assessment`
  3. Log out, log in again → no redirect (sessionStorage cached, assessment done)

- [ ] **5 prompts served sequentially**

  Work through all 5 prompts. After each submission, the next prompt appears.

- [ ] **Level stored in `level_assessments` with timestamp**

  ```bash
  # Connect to your Postgres instance and run:
  SELECT assessed_level, fluency_score, assessed_at FROM level_assessments ORDER BY assessed_at DESC LIMIT 1;
  ```

  Expected: a row with `assessed_level` = 'BEG', 'INT', or 'ADV' and a current timestamp.

- [ ] **Level visible in user profile**

  ```bash
  SELECT english_level FROM users WHERE email = 'your@email.com';
  ```

  Expected: matches the `level_assessments` row.

- [ ] **Skipping not allowed**

  Close the assessment tab mid-way. Re-open the app → assessment page appears again (session storage cleared on close). A new assessment session is started.

- [ ] **Guest users not shown assessment**

  Use guest mode → no redirect to assessment (hook checks `user !== null`).

---

## Notes

- **Blocked by #2**: If `LecaUser` records don't exist yet (because the auth integration in #2 isn't done), the service auto-creates a minimal `LecaUser` from the boilerplate `User` email. This is intentional — remove the auto-create block once #2 lands.
- **Audio transcription**: Audio blobs are accepted and stored but not transcribed in Phase 0. Scoring uses only the text `transcript` field (or the heuristic if empty). Connect Whisper in the Phase 0/1 transition.
- **Ollama model name**: The scorer uses `model: 'llama3'`. Change to `'llama3:8b-instruct-q4_K_M'` or whatever tag your local Ollama pull uses.
- **ollamaUrl config**: Add `OLLAMA_URL=http://localhost:11434` to `apps/api/.env` and expose it via the config service if needed.
