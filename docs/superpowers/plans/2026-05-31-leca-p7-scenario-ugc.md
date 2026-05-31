# Scenario Library UGC (P7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add UGC to the scenario library — authenticated users submit scenarios for review, rate published scenarios, and admins approve/reject submissions via a review queue; expand the seed library to 20 scenarios across ≥6 categories.

**Architecture:** Extend the existing `ScenariosModule` (`apps/api/src/scenarios/`) with write endpoints (create, rate, review) following the JWT + RolesGuard + `resolveLecaUser` pattern from `ConversationSessionsModule`. Public GET endpoints remain unchanged. Web adds a submission form at `/scenarios/submit`, an interactive rating widget on the detail page, and an admin review queue page. All new API methods are unit-tested with mocked Prisma.

**Tech Stack:** NestJS 11 · Prisma 6 (ScenarioRating upsert, $transaction) · class-validator/class-transformer · JWT + RolesGuard (RoleEnum.admin = 1) · Next.js 16 · React 19 · shadcn/ui (Button, Input)

---

## File map

**API — create:**
- `apps/api/src/scenarios/dto/create-scenario.dto.ts`
- `apps/api/src/scenarios/dto/rate-scenario.dto.ts`
- `apps/api/src/scenarios/dto/create-review.dto.ts`
- `apps/api/src/scenarios/scenarios.service.spec.ts`

**API — modify:**
- `apps/api/src/scenarios/dto/scenarios.dto.ts` (add 3 response DTOs)
- `apps/api/src/scenarios/scenarios.module.ts` (add UsersModule import)
- `apps/api/src/scenarios/scenarios.service.ts` (add 5 methods + inject UsersService)
- `apps/api/src/scenarios/scenarios.controller.ts` (add 5 endpoints, maintain ordering)
- `apps/api/prisma/seed.ts` (expand to 20 scenarios)

**Web — create:**
- `apps/web/src/app/[language]/scenarios/submit/page.tsx`
- `apps/web/src/app/[language]/scenarios/submit/page-content.tsx`
- `apps/web/src/app/[language]/admin-panel/scenarios/page.tsx`
- `apps/web/src/app/[language]/admin-panel/scenarios/page-content.tsx`

**Web — modify:**
- `apps/web/src/services/api/services/scenarios.ts` (add 5 hooks + types)
- `apps/web/src/app/[language]/scenarios/page-content.tsx` (add submit link)
- `apps/web/src/app/[language]/scenarios/[id]/page-content.tsx` (add rating widget)
- `apps/web/src/app/[language]/admin-panel/layout.tsx` (add nav item)
- `apps/web/src/services/i18n/locales/en/common.json` (add scenarios key)
- `apps/web/src/services/i18n/locales/uk/common.json` (add scenarios key)
- `apps/web/src/services/i18n/locales/vi/common.json` (add scenarios key)

---

## Status-flow reference

| Status | Created by | Visible to |
|--------|-----------|-----------|
| `in_review` | POST /scenarios | Author (GET /mine) · Admin (GET /pending-review) |
| `featured` | Admin approves | Everyone (public GET /scenarios) |
| `rejected` | Admin rejects | Author only (GET /mine) |

---

### Task 1: API — DTOs + response DTOs

**Files:**
- Create: `apps/api/src/scenarios/dto/create-scenario.dto.ts`
- Create: `apps/api/src/scenarios/dto/rate-scenario.dto.ts`
- Create: `apps/api/src/scenarios/dto/create-review.dto.ts`
- Modify: `apps/api/src/scenarios/dto/scenarios.dto.ts`

- [ ] **Step 1: Create CreateScenarioDto**

Create `apps/api/src/scenarios/dto/create-scenario.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScenarioPhraseDto {
  @ApiProperty({ description: 'Key phrase (e.g. "I would like to order")' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  phrase: string;

  @ApiProperty({ description: 'Example sentence using the phrase' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  exampleSentence: string;

  @ApiPropertyOptional({ enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] })
  @IsOptional()
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  difficulty?: string;
}

export class CreateScenarioDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'AI persona description' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  aiRole: string;

  @ApiProperty({ description: 'System context/instructions for the AI' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  context: string;

  @ApiProperty({ enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] })
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  difficulty: string;

  @ApiProperty({ enum: ['everyday', 'work'] })
  @IsIn(['everyday', 'work'])
  situationType: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @ApiProperty({ type: [CreateScenarioPhraseDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateScenarioPhraseDto)
  phrases: CreateScenarioPhraseDto[];
}
```

- [ ] **Step 2: Create RateScenarioDto**

Create `apps/api/src/scenarios/dto/rate-scenario.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class RateScenarioDto {
  @ApiProperty({ description: 'Rating 1–5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
```

- [ ] **Step 3: Create CreateReviewDto**

Create `apps/api/src/scenarios/dto/create-review.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
```

- [ ] **Step 4: Add response DTOs to scenarios.dto.ts**

Open `apps/api/src/scenarios/dto/scenarios.dto.ts` and append after `ScenarioListResponseDto`:

```typescript
export class CreateScenarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  title: string;
}

export class MyScenarioItemDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() status: string;
  @ApiProperty() difficulty: string;
  @ApiProperty() situationType: string;
  @ApiPropertyOptional() ratingAvg?: number | null;
  @ApiProperty() ratingCount: number;
  @ApiProperty() createdAt: Date;
}

export class PendingReviewResponseDto {
  @ApiProperty({ type: [ScenarioListItemDto] })
  data: ScenarioListItemDto[];

  @ApiProperty()
  total: number;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/scenarios/dto/
git commit -m "feat(scenarios): add CreateScenario, RateScenario, CreateReview DTOs + response types"
```

---

### Task 2: API — ScenariosService new methods + unit tests

**Files:**
- Create: `apps/api/src/scenarios/scenarios.service.spec.ts`
- Modify: `apps/api/src/scenarios/scenarios.module.ts`
- Modify: `apps/api/src/scenarios/scenarios.service.ts`

- [ ] **Step 1: Update ScenariosModule to import UsersModule**

Replace `apps/api/src/scenarios/scenarios.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ScenariosController } from './scenarios.controller';
import { ScenariosService } from './scenarios.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ScenariosController],
  providers: [ScenariosService],
})
export class ScenariosModule {}
```

- [ ] **Step 2: Create the unit test file**

Create `apps/api/src/scenarios/scenarios.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';

const mockPrisma = {
  scenario: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  scenarioPhrase: { createMany: jest.fn() },
  scenarioRating: { upsert: jest.fn(), aggregate: jest.fn() },
  scenarioReview: { create: jest.fn() },
  lecaUser: { findUnique: jest.fn(), create: jest.fn() },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
};

const mockUsersService = {
  findById: jest.fn(),
};

describe('ScenariosService', () => {
  let service: ScenariosService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScenariosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();
    service = module.get<ScenariosService>(ScenariosService);
  });

  // ── createScenario ────────────────────────────────────────────────────────

  describe('createScenario', () => {
    const dto: CreateScenarioDto = {
      title: 'Test Scenario',
      aiRole: 'A test AI',
      context: 'Context for testing the feature',
      difficulty: 'B1',
      situationType: 'everyday',
      phrases: [{ phrase: 'Test phrase', exampleSentence: 'This is a test.' }],
    };

    it('resolves LecaUser and creates scenario with status in_review', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'user@test.com', firstName: 'Test', lastName: 'User' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-123' });
      mockPrisma.scenario.create.mockResolvedValue({
        id: 'sc-uuid-1', title: dto.title, status: 'in_review',
      });
      mockPrisma.scenarioPhrase.createMany.mockResolvedValue({ count: 1 });

      const result = await service.createScenario(1, dto);

      expect(mockPrisma.scenario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            authorId: 'leca-uuid-123',
            title: 'Test Scenario',
            status: 'in_review',
          }),
        }),
      );
      expect(result.status).toBe('in_review');
    });

    it('creates LecaUser when one does not exist yet', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'new@test.com', firstName: 'New', lastName: null });
      mockPrisma.lecaUser.findUnique.mockResolvedValue(null);
      mockPrisma.lecaUser.create.mockResolvedValue({ id: 'leca-new-uuid' });
      mockPrisma.scenario.create.mockResolvedValue({ id: 'sc-2', title: dto.title, status: 'in_review' });
      mockPrisma.scenarioPhrase.createMany.mockResolvedValue({ count: 1 });

      await service.createScenario(2, dto);

      expect(mockPrisma.lecaUser.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'new@test.com' }) }),
      );
    });

    it('throws NotFoundException when boilerplate user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(service.createScenario(999, dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ── listMyScenarios ───────────────────────────────────────────────────────

  describe('listMyScenarios', () => {
    it('returns scenarios for the authenticated user regardless of status', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'user@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-123' });
      mockPrisma.scenario.findMany.mockResolvedValue([
        { id: 'sc-1', title: 'Draft', status: 'in_review', difficulty: 'A1',
          situationType: 'everyday', ratingAvg: null, ratingCount: 0, createdAt: new Date() },
      ]);

      const result = await service.listMyScenarios(1);

      expect(mockPrisma.scenario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { authorId: 'leca-uuid-123' } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  // ── listPendingReview ─────────────────────────────────────────────────────

  describe('listPendingReview', () => {
    it('returns only in_review scenarios', async () => {
      mockPrisma.scenario.findMany.mockResolvedValue([
        { id: 'sc-1', title: 'Pending', description: null, difficulty: 'B1',
          situationType: 'everyday', tags: [], ratingAvg: null, ratingCount: 0,
          useCount: 0, author: { displayName: 'Author' } },
      ]);
      mockPrisma.scenario.count.mockResolvedValue(1);

      const result = await service.listPendingReview();

      expect(mockPrisma.scenario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'in_review' } }),
      );
      expect(result.total).toBe(1);
    });
  });

  // ── rateScenario ──────────────────────────────────────────────────────────

  describe('rateScenario', () => {
    it('upserts rating and recalculates ratingAvg in a transaction', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'user@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-123' });
      mockPrisma.scenario.findFirst.mockResolvedValue({ id: 'sc-1', status: 'featured' });
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<void>) => fn(mockPrisma),
      );
      mockPrisma.scenarioRating.upsert.mockResolvedValue({});
      mockPrisma.scenarioRating.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 }, _count: { rating: 2 },
      });
      mockPrisma.scenario.update.mockResolvedValue({});

      await service.rateScenario(1, 'sc-1', 5);

      expect(mockPrisma.scenarioRating.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scenarioId_userId: { scenarioId: 'sc-1', userId: 'leca-uuid-123' } },
          create: expect.objectContaining({ rating: 5 }),
          update: expect.objectContaining({ rating: 5 }),
        }),
      );
      expect(mockPrisma.scenario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ratingAvg: 4.5, ratingCount: 2 }),
        }),
      );
    });

    it('throws NotFoundException when scenario not found or not featured', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'user@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-123' });
      mockPrisma.scenario.findFirst.mockResolvedValue(null);

      await expect(service.rateScenario(1, 'no-such-id', 3)).rejects.toThrow(NotFoundException);
    });
  });

  // ── reviewScenario ────────────────────────────────────────────────────────

  describe('reviewScenario', () => {
    it('sets status to featured when approved', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'admin@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'admin-leca-uuid' });
      mockPrisma.scenario.findFirst.mockResolvedValue({ id: 'sc-1', status: 'in_review' });
      mockPrisma.scenarioReview.create.mockResolvedValue({});
      mockPrisma.scenario.update.mockResolvedValue({});

      await service.reviewScenario(1, 'sc-1', 'approved', undefined);

      expect(mockPrisma.scenario.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'sc-1' }, data: { status: 'featured' } }),
      );
    });

    it('sets status to rejected when rejected', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'admin@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'admin-leca-uuid' });
      mockPrisma.scenario.findFirst.mockResolvedValue({ id: 'sc-1', status: 'in_review' });
      mockPrisma.scenarioReview.create.mockResolvedValue({});
      mockPrisma.scenario.update.mockResolvedValue({});

      await service.reviewScenario(1, 'sc-1', 'rejected', 'Needs improvement');

      expect(mockPrisma.scenario.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'rejected' } }),
      );
      expect(mockPrisma.scenarioReview.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ notes: 'Needs improvement' }) }),
      );
    });

    it('throws NotFoundException when scenario not found or not in_review', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'admin@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'admin-leca-uuid' });
      mockPrisma.scenario.findFirst.mockResolvedValue(null);

      await expect(service.reviewScenario(1, 'no-such', 'approved', undefined))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 3: Run tests — verify they all FAIL (methods don't exist yet)**

```bash
cd apps/api && npx jest scenarios.service.spec.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL with `TypeError: service.createScenario is not a function` (or similar).

- [ ] **Step 4: Implement the 5 new methods in ScenariosService**

Replace the entire `apps/api/src/scenarios/scenarios.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { ListScenariosQueryDto } from './dto/list-scenarios-query.dto';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import {
  CreateScenarioResponseDto,
  MyScenarioItemDto,
  PendingReviewResponseDto,
  ScenarioDetailDto,
  ScenarioListItemDto,
  ScenarioListResponseDto,
} from './dto/scenarios.dto';
import { Prisma } from '@prisma/client';

const VISIBLE_STATUSES = ['featured'];

type ScenarioWithAuthor = Prisma.ScenarioGetPayload<{
  include: { author: { select: { displayName: true } } };
}>;

@Injectable()
export class ScenariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  // ── Public read ───────────────────────────────────────────────────────────

  async list(query: ListScenariosQueryDto): Promise<ScenarioListResponseDto> {
    const { q, category, difficulty } = query;
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    if (q && q.trim()) {
      return this.listWithFts(q.trim(), { category, difficulty, page, limit, skip });
    }

    const where: Prisma.ScenarioWhereInput = {
      status: { in: VISIBLE_STATUSES },
      ...(category ? { situationType: category } : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const [scenarios, total] = await Promise.all([
      this.prisma.scenario.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ ratingAvg: 'desc' }, { useCount: 'desc' }],
        include: { author: { select: { displayName: true } } },
      }),
      this.prisma.scenario.count({ where }),
    ]);

    return { data: scenarios.map(this.toListItem), total, page, limit };
  }

  async findOne(id: string): Promise<ScenarioDetailDto | null> {
    const scenario = await this.prisma.scenario.findFirst({
      where: { id, status: { in: VISIBLE_STATUSES } },
      include: {
        author: { select: { displayName: true } },
        scenarioPhrases: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!scenario) return null;

    return {
      id: scenario.id,
      title: scenario.title,
      description: scenario.description,
      difficulty: scenario.difficulty,
      situationType: scenario.situationType,
      tags: scenario.tags,
      ratingAvg: scenario.ratingAvg ? Number(scenario.ratingAvg) : null,
      ratingCount: scenario.ratingCount,
      useCount: scenario.useCount,
      authorName: scenario.author?.displayName ?? null,
      aiRole: scenario.aiRole,
      context: scenario.context,
      openingLine: null,
      phrases: scenario.scenarioPhrases.map((p) => ({
        id: p.id,
        phrase: p.phrase,
        exampleSentence: p.exampleSentence,
        audioUrl: p.audioUrl,
        difficulty: p.difficulty,
        displayOrder: p.displayOrder,
      })),
    };
  }

  // ── Auth: create + list own ───────────────────────────────────────────────

  async createScenario(
    boilerplateUserId: number,
    dto: CreateScenarioDto,
  ): Promise<CreateScenarioResponseDto> {
    const lecaUserId = await this.resolveLecaUser(boilerplateUserId);

    const scenario = await this.prisma.scenario.create({
      data: {
        authorId: lecaUserId,
        title: dto.title,
        description: dto.description ?? null,
        aiRole: dto.aiRole,
        context: dto.context,
        difficulty: dto.difficulty,
        situationType: dto.situationType,
        tags: dto.tags ?? [],
        status: 'in_review',
      },
    });

    if (dto.phrases.length > 0) {
      await this.prisma.scenarioPhrase.createMany({
        data: dto.phrases.map((p, i) => ({
          scenarioId: scenario.id,
          phrase: p.phrase,
          exampleSentence: p.exampleSentence,
          difficulty: p.difficulty ?? null,
          displayOrder: i,
        })),
      });
    }

    return { id: scenario.id, status: scenario.status, title: scenario.title };
  }

  async listMyScenarios(boilerplateUserId: number): Promise<MyScenarioItemDto[]> {
    const lecaUserId = await this.resolveLecaUser(boilerplateUserId);
    return this.prisma.scenario.findMany({
      where: { authorId: lecaUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        difficulty: true,
        situationType: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
      },
    }) as Promise<MyScenarioItemDto[]>;
  }

  // ── Auth: rate ────────────────────────────────────────────────────────────

  async rateScenario(
    boilerplateUserId: number,
    scenarioId: string,
    rating: number,
  ): Promise<void> {
    const lecaUserId = await this.resolveLecaUser(boilerplateUserId);

    const scenario = await this.prisma.scenario.findFirst({
      where: { id: scenarioId, status: { in: VISIBLE_STATUSES } },
    });
    if (!scenario) throw new NotFoundException('Scenario not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.scenarioRating.upsert({
        where: { scenarioId_userId: { scenarioId, userId: lecaUserId } },
        create: { scenarioId, userId: lecaUserId, rating },
        update: { rating },
      });

      const agg = await tx.scenarioRating.aggregate({
        where: { scenarioId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.scenario.update({
        where: { id: scenarioId },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          ratingCount: agg._count.rating,
        },
      });
    });
  }

  // ── Admin: review queue + decision ────────────────────────────────────────

  async listPendingReview(): Promise<PendingReviewResponseDto> {
    const [scenarios, total] = await Promise.all([
      this.prisma.scenario.findMany({
        where: { status: 'in_review' },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { displayName: true } } },
      }),
      this.prisma.scenario.count({ where: { status: 'in_review' } }),
    ]);
    return { data: scenarios.map(this.toListItem), total };
  }

  async reviewScenario(
    boilerplateUserId: number,
    scenarioId: string,
    decision: 'approved' | 'rejected',
    notes: string | undefined,
  ): Promise<void> {
    const lecaUserId = await this.resolveLecaUser(boilerplateUserId);

    const scenario = await this.prisma.scenario.findFirst({
      where: { id: scenarioId, status: 'in_review' },
    });
    if (!scenario) throw new NotFoundException('Scenario not found or not awaiting review');

    await this.prisma.scenarioReview.create({
      data: {
        scenarioId,
        reviewerId: lecaUserId,
        decision,
        notes: notes ?? null,
      },
    });

    await this.prisma.scenario.update({
      where: { id: scenarioId },
      data: { status: decision === 'approved' ? 'featured' : 'rejected' },
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async resolveLecaUser(boilerplateUserId: number): Promise<string> {
    const user = await this.usersService.findById(boilerplateUserId);
    if (!user || !user.email) throw new NotFoundException('User not found');

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

  private toListItem = (s: ScenarioWithAuthor): ScenarioListItemDto => ({
    id: s.id,
    title: s.title,
    description: s.description,
    difficulty: s.difficulty,
    situationType: s.situationType,
    tags: Array.isArray(s.tags) ? s.tags : [],
    ratingAvg: s.ratingAvg ? Number(s.ratingAvg) : null,
    ratingCount: s.ratingCount,
    useCount: s.useCount,
    authorName: s.author?.displayName ?? null,
  });

  private async listWithFts(
    q: string,
    opts: {
      category?: string;
      difficulty?: string;
      page: number;
      limit: number;
      skip: number;
    },
  ): Promise<ScenarioListResponseDto> {
    const { category, difficulty, page, limit, skip } = opts;

    const categoryFilter = category
      ? Prisma.sql`AND s.situation_type = ${category}`
      : Prisma.empty;
    const difficultyFilter = difficulty
      ? Prisma.sql`AND s.difficulty = ${difficulty}`
      : Prisma.empty;

    type RawRow = {
      id: string; title: string; description: string | null;
      difficulty: string; situation_type: string; tags: string[];
      rating_avg: string | null; rating_count: number;
      use_count: number; author_name: string | null;
    };

    const [rows, countResult] = await Promise.all([
      this.prisma.$queryRaw<RawRow[]>(Prisma.sql`
        SELECT s.id, s.title, s.description, s.difficulty, s.situation_type,
               s.tags, s.rating_avg, s.rating_count, s.use_count,
               u.display_name AS author_name
        FROM   scenarios s
        LEFT JOIN users u ON u.id = s.author_id
        WHERE  to_tsvector('english', s.title || ' ' || COALESCE(s.description, ''))
                 @@ plainto_tsquery('english', ${q})
          AND  s.status = ANY(${VISIBLE_STATUSES}::text[])
          ${categoryFilter}
          ${difficultyFilter}
        ORDER BY ts_rank(
                   to_tsvector('english', s.title || ' ' || COALESCE(s.description, '')),
                   plainto_tsquery('english', ${q})
                 ) DESC,
                 s.rating_avg DESC NULLS LAST
        OFFSET ${skip} LIMIT ${limit}
      `),
      this.prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
        SELECT COUNT(*) AS count
        FROM   scenarios s
        WHERE  to_tsvector('english', s.title || ' ' || COALESCE(s.description, ''))
                 @@ plainto_tsquery('english', ${q})
          AND  s.status = ANY(${VISIBLE_STATUSES}::text[])
          ${categoryFilter}
          ${difficultyFilter}
      `),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return {
      data: rows.map((r) => ({
        id: r.id, title: r.title, description: r.description,
        difficulty: r.difficulty, situationType: r.situation_type,
        tags: Array.isArray(r.tags) ? r.tags : [],
        ratingAvg: r.rating_avg ? parseFloat(r.rating_avg) : null,
        ratingCount: Number(r.rating_count), useCount: Number(r.use_count),
        authorName: r.author_name,
      })),
      total, page, limit,
    };
  }
}
```

- [ ] **Step 5: Run tests — verify all PASS**

```bash
cd apps/api && npx jest scenarios.service.spec.ts --no-coverage 2>&1 | tail -20
```

Expected: all 9 tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/scenarios/scenarios.module.ts \
        apps/api/src/scenarios/scenarios.service.ts \
        apps/api/src/scenarios/scenarios.service.spec.ts
git commit -m "feat(scenarios): implement create/rate/review service methods + unit tests"
```

---

### Task 3: API — ScenariosController endpoints

**Files:**
- Modify: `apps/api/src/scenarios/scenarios.controller.ts`

> **Important:** Static routes (`/mine`, `/pending-review`) MUST be declared BEFORE the parametric `/:id` route to prevent NestJS matching them as UUIDs.

- [ ] **Step 1: Replace the controller**

Replace `apps/api/src/scenarios/scenarios.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { ScenariosService } from './scenarios.service';
import { ListScenariosQueryDto } from './dto/list-scenarios-query.dto';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { RateScenarioDto } from './dto/rate-scenario.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  CreateScenarioResponseDto,
  MyScenarioItemDto,
  PendingReviewResponseDto,
  ScenarioDetailDto,
  ScenarioListResponseDto,
} from './dto/scenarios.dto';

@ApiTags('Scenarios')
@Controller({ path: 'scenarios', version: '1' })
export class ScenariosController {
  constructor(private readonly service: ScenariosService) {}

  /** Browse published scenarios with optional filters and full-text search. */
  @Get()
  @ApiOkResponse({ type: ScenarioListResponseDto })
  list(@Query() query: ListScenariosQueryDto): Promise<ScenarioListResponseDto> {
    return this.service.list(query);
  }

  /** Admin: list scenarios awaiting review. Must be before /:id. */
  @Get('pending-review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PendingReviewResponseDto })
  listPendingReview(): Promise<PendingReviewResponseDto> {
    return this.service.listPendingReview();
  }

  /** Auth: list the caller's own scenarios (all statuses). Must be before /:id. */
  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOkResponse({ type: [MyScenarioItemDto] })
  listMine(
    @Req() req: Request & { user: JwtPayloadType },
  ): Promise<MyScenarioItemDto[]> {
    return this.service.listMyScenarios(Number(req.user.id));
  }

  /** Full scenario detail including key phrases. */
  @Get(':id')
  @ApiOkResponse({ type: ScenarioDetailDto })
  @ApiNotFoundResponse({ description: 'Scenario not found or not published' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScenarioDetailDto> {
    const scenario = await this.service.findOne(id);
    if (!scenario) throw new NotFoundException('Scenario not found');
    return scenario;
  }

  /** Auth: submit a new scenario for review. */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CreateScenarioResponseDto })
  createScenario(
    @Req() req: Request & { user: JwtPayloadType },
    @Body() dto: CreateScenarioDto,
  ): Promise<CreateScenarioResponseDto> {
    return this.service.createScenario(Number(req.user.id), dto);
  }

  /** Auth: rate a published scenario (1–5). Upserts the rating. */
  @Post(':id/ratings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ description: 'Rating recorded' })
  @ApiNotFoundResponse({ description: 'Scenario not found' })
  async rateScenario(
    @Req() req: Request & { user: JwtPayloadType },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateScenarioDto,
  ): Promise<void> {
    await this.service.rateScenario(Number(req.user.id), id, dto.rating);
  }

  /** Admin: approve or reject a scenario awaiting review. */
  @Post(':id/reviews')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ description: 'Review recorded' })
  @ApiNotFoundResponse({ description: 'Scenario not awaiting review' })
  async reviewScenario(
    @Req() req: Request & { user: JwtPayloadType },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto,
  ): Promise<void> {
    await this.service.reviewScenario(Number(req.user.id), id, dto.decision, dto.notes);
  }
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
cd apps/api && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 3: Re-run service tests to confirm nothing regressed**

```bash
cd apps/api && npx jest scenarios.service.spec.ts --no-coverage 2>&1 | tail -10
```

Expected: all PASS

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/scenarios/scenarios.controller.ts
git commit -m "feat(scenarios): wire POST /scenarios, /ratings, /reviews + GET /mine, /pending-review"
```

---

### Task 4: Expand seed to 20 scenarios

**Files:**
- Modify: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Append 10 new scenarios to the SCENARIOS array**

In `apps/api/prisma/seed.ts`, add the following entries to the end of the `SCENARIOS` array (before the closing `]`):

```typescript
  // ── Education ────────────────────────────────────────────────────────────
  {
    title: 'University Enrollment',
    description: 'Navigate the enrollment process at a university admissions office',
    aiRole: 'A university admissions officer',
    context:
      'You are an admissions officer. A prospective student is inquiring about enrollment, required documents, deadlines, and available programmes. Answer clearly and guide them step by step.',
    difficulty: 'B1',
    situationType: 'education',
    tags: ['university', 'academic', 'enrollment'],
    phrases: [
      { phrase: "I'm interested in applying for", exampleSentence: "I'm interested in applying for the Computer Science programme.", difficulty: 'B1' },
      { phrase: 'What documents do I need to submit?', exampleSentence: 'What documents do I need to submit with my application?', difficulty: 'B1' },
      { phrase: 'What is the application deadline?', exampleSentence: 'What is the application deadline for the autumn intake?', difficulty: 'A2' },
      { phrase: 'Are there any scholarships available?', exampleSentence: 'Are there any scholarships available for international students?', difficulty: 'B1' },
      { phrase: 'Could you send me more information about', exampleSentence: 'Could you send me more information about the tuition fees?', difficulty: 'B1' },
    ],
  },
  {
    title: 'Academic Supervision Meeting',
    description: 'Discuss your research progress with your thesis supervisor',
    aiRole: 'A supportive but demanding university thesis supervisor',
    context:
      'You are a thesis supervisor having a monthly check-in with your postgraduate student. Ask about research progress, literature review, methodology decisions, and next milestones. Give constructive feedback.',
    difficulty: 'C1',
    situationType: 'education',
    tags: ['research', 'academic', 'postgraduate'],
    phrases: [
      { phrase: 'My research is currently focused on', exampleSentence: 'My research is currently focused on natural language processing for low-resource languages.', difficulty: 'C1' },
      { phrase: 'I have been reviewing the literature on', exampleSentence: 'I have been reviewing the literature on transformer architectures.', difficulty: 'C1' },
      { phrase: 'One challenge I am encountering is', exampleSentence: 'One challenge I am encountering is the limited availability of annotated data.', difficulty: 'B2' },
      { phrase: 'I would like your advice on', exampleSentence: 'I would like your advice on choosing between quantitative and qualitative methods.', difficulty: 'B2' },
      { phrase: 'My next milestone is to', exampleSentence: 'My next milestone is to complete the data collection by the end of next month.', difficulty: 'B1' },
    ],
  },
  // ── Technology ───────────────────────────────────────────────────────────
  {
    title: 'Tech Support Call',
    description: 'Report a technical issue and follow troubleshooting instructions',
    aiRole: 'A patient technical support agent for a software company',
    context:
      "You are a tech support agent. A customer is calling about an issue (app won't open, can't log in, data won't sync). Ask diagnostic questions, guide them through steps, and escalate if needed.",
    difficulty: 'A2',
    situationType: 'technology',
    tags: ['IT', 'support', 'troubleshooting'],
    phrases: [
      { phrase: 'My app is not working', exampleSentence: 'My app is not working — it crashes every time I open it.', difficulty: 'A2' },
      { phrase: 'I have already tried', exampleSentence: 'I have already tried restarting the device.', difficulty: 'A2' },
      { phrase: 'Can you walk me through', exampleSentence: 'Can you walk me through the steps to reset my password?', difficulty: 'B1' },
      { phrase: "The error message says", exampleSentence: "The error message says 'Connection timed out'.", difficulty: 'A2' },
      { phrase: 'How long will it take to fix?', exampleSentence: 'How long will it take to fix this issue?', difficulty: 'A2' },
    ],
  },
  {
    title: 'Software Demo Presentation',
    description: 'Present a software product to a potential enterprise client',
    aiRole: 'A sceptical but open-minded potential enterprise client',
    context:
      'You are an enterprise client attending a 30-minute software demo. Ask detailed questions about features, security, integration, pricing, and support. Challenge vague answers.',
    difficulty: 'B2',
    situationType: 'technology',
    tags: ['sales', 'SaaS', 'presentations', 'business'],
    phrases: [
      { phrase: 'Let me walk you through the key features', exampleSentence: 'Let me walk you through the key features of our platform.', difficulty: 'B2' },
      { phrase: 'How does this integrate with', exampleSentence: 'How does this integrate with our existing CRM system?', difficulty: 'B2' },
      { phrase: 'What are your security certifications?', exampleSentence: 'What are your security certifications — do you have SOC 2?', difficulty: 'C1' },
      { phrase: 'Could you give us a ballpark figure for', exampleSentence: 'Could you give us a ballpark figure for the annual licence cost?', difficulty: 'B2' },
      { phrase: 'What does the onboarding process look like?', exampleSentence: 'What does the onboarding process look like for a team of 50 users?', difficulty: 'B1' },
    ],
  },
  // ── Social ───────────────────────────────────────────────────────────────
  {
    title: 'Dinner Party Invitation',
    description: 'Invite a colleague to a dinner party and discuss arrangements',
    aiRole: 'A friendly colleague who would love to attend',
    context:
      'You are a colleague of the learner. They are inviting you to a dinner party. Ask about the date, time, dress code, what to bring, dietary requirements, and how to get there.',
    difficulty: 'A2',
    situationType: 'social',
    tags: ['social', 'invitations', 'daily-life'],
    phrases: [
      { phrase: 'I was wondering if you would like to come to', exampleSentence: 'I was wondering if you would like to come to a small dinner party at my place.', difficulty: 'B1' },
      { phrase: "It's going to be on", exampleSentence: "It's going to be on Saturday the 15th at 7 pm.", difficulty: 'A2' },
      { phrase: 'Feel free to bring', exampleSentence: 'Feel free to bring a bottle of wine if you like.', difficulty: 'A2' },
      { phrase: 'Do you have any dietary requirements?', exampleSentence: 'Do you have any dietary requirements I should know about?', difficulty: 'B1' },
      { phrase: 'I really look forward to seeing you', exampleSentence: 'I really look forward to seeing you there!', difficulty: 'A2' },
    ],
  },
  // ── Travel ───────────────────────────────────────────────────────────────
  {
    title: 'Airport Check-In',
    description: 'Check in for a flight, handle baggage, and get boarding information',
    aiRole: 'An airline check-in agent at an international airport',
    context:
      'You are a check-in agent. Verify the passenger booking, ask about baggage, assign their seat, explain luggage limits, and advise on gate and boarding time.',
    difficulty: 'A2',
    situationType: 'travel',
    tags: ['travel', 'airport', 'flying'],
    phrases: [
      { phrase: "I'm checking in for flight", exampleSentence: "I'm checking in for flight VN123 to London.", difficulty: 'A1' },
      { phrase: 'Could I have a window seat?', exampleSentence: 'Could I have a window seat, please?', difficulty: 'A1' },
      { phrase: 'How many bags can I check in?', exampleSentence: 'How many bags can I check in without extra charge?', difficulty: 'A2' },
      { phrase: 'What time does boarding start?', exampleSentence: 'What time does boarding start and which gate is it?', difficulty: 'A2' },
      { phrase: 'I have a connecting flight to', exampleSentence: 'I have a connecting flight to Paris — will my bag be transferred automatically?', difficulty: 'B1' },
    ],
  },
  {
    title: 'Visa Application Interview',
    description: 'Practise answering a visa consular officer at an embassy',
    aiRole: 'A visa consular officer at an embassy',
    context:
      'You are a consular officer conducting a short visa interview. Ask about the purpose of the visit, duration, accommodation, financial means, ties to the home country, and travel history.',
    difficulty: 'B2',
    situationType: 'travel',
    tags: ['visa', 'travel', 'official'],
    phrases: [
      { phrase: 'The purpose of my visit is to', exampleSentence: 'The purpose of my visit is to attend an academic conference in London.', difficulty: 'B1' },
      { phrase: 'I plan to stay for', exampleSentence: 'I plan to stay for two weeks.', difficulty: 'A2' },
      { phrase: 'I have strong ties to my home country because', exampleSentence: 'I have strong ties to my home country because I own a business there.', difficulty: 'B2' },
      { phrase: 'I have sufficient funds to cover my expenses', exampleSentence: 'I have sufficient funds to cover my expenses — I can provide bank statements.', difficulty: 'B2' },
      { phrase: 'This is my first visit to', exampleSentence: 'This is my first visit to the United Kingdom.', difficulty: 'A2' },
    ],
  },
  // ── Banking ───────────────────────────────────────────────────────────────
  {
    title: 'Opening a Bank Account',
    description: 'Open a personal bank account and understand available services',
    aiRole: 'A bank customer service representative',
    context:
      'You are a bank representative. A new customer wants to open a current account. Explain account types, required documents, fees, online banking features, and debit card setup.',
    difficulty: 'B1',
    situationType: 'banking',
    tags: ['finance', 'banking', 'daily-life'],
    phrases: [
      { phrase: "I'd like to open a bank account", exampleSentence: "I'd like to open a current account, please.", difficulty: 'A2' },
      { phrase: 'What documents do I need?', exampleSentence: 'What documents do I need to bring?', difficulty: 'A2' },
      { phrase: 'Are there any monthly fees?', exampleSentence: 'Are there any monthly fees for this account?', difficulty: 'B1' },
      { phrase: 'How does the online banking work?', exampleSentence: 'How does the online banking work — can I transfer money internationally?', difficulty: 'B1' },
      { phrase: 'How long does it take to get a debit card?', exampleSentence: 'How long does it take to receive a debit card after opening the account?', difficulty: 'A2' },
    ],
  },
  // ── Entertainment ────────────────────────────────────────────────────────
  {
    title: 'Cinema Ticket Booking',
    description: 'Book cinema tickets and choose seats at the box office',
    aiRole: 'A cinema box-office attendant',
    context:
      'You are a cinema attendant. Help the customer choose a film, select a showing time, pick seats, and pay. Offer any promotions or loyalty programmes.',
    difficulty: 'A1',
    situationType: 'entertainment',
    tags: ['leisure', 'cinema', 'daily-life'],
    phrases: [
      { phrase: 'Two tickets for', exampleSentence: 'Two tickets for the 7 pm showing of Interstellar, please.', difficulty: 'A1' },
      { phrase: 'Are there any seats in the middle?', exampleSentence: 'Are there any seats available in the middle of the cinema?', difficulty: 'A1' },
      { phrase: "What's on this weekend?", exampleSentence: "What's on this weekend — any new releases?", difficulty: 'A1' },
      { phrase: 'Do you have a student discount?', exampleSentence: 'Do you have a student discount?', difficulty: 'A2' },
      { phrase: 'What time does it finish?', exampleSentence: 'What time does the film finish?', difficulty: 'A1' },
    ],
  },
```

- [ ] **Step 2: Verify the seed compiles**

```bash
cd apps/api && npx tsc --noEmit 2>&1 | grep -i seed | head -10
```

Expected: no errors

- [ ] **Step 3: Run the seed and verify 20 scenarios**

```bash
cd apps/api && npx prisma db seed 2>&1 | grep -E "Scenario:|Seeding"
```

Expected: output shows 20 lines with scenario titles (10 "already exists, skipped" + 10 newly created).

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat(seed): expand to 20 scenarios across 6+ categories with 5 phrases each"
```

---

### Task 5: Web — API service hooks

**Files:**
- Modify: `apps/web/src/services/api/services/scenarios.ts`

- [ ] **Step 1: Append new types and hooks to scenarios.ts**

Open `apps/web/src/services/api/services/scenarios.ts` and append at the end of the file:

```typescript
// ─── Submission ───────────────────────────────────────────────

export type CreateScenarioPhrasePayload = {
  phrase: string;
  exampleSentence: string;
  difficulty?: string;
};

export type CreateScenarioPayload = {
  title: string;
  description?: string;
  aiRole: string;
  context: string;
  difficulty: string;
  situationType: string;
  tags?: string[];
  phrases: CreateScenarioPhrasePayload[];
};

export type CreateScenarioResponse = {
  id: string;
  status: string;
  title: string;
};

export type MyScenarioItem = {
  id: string;
  title: string;
  status: string;
  difficulty: string;
  situationType: string;
  ratingAvg?: number | null;
  ratingCount: number;
  createdAt: string;
};

export function useCreateScenarioService() {
  const fetch = useFetch();

  return useCallback(
    (payload: CreateScenarioPayload, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/scenarios`, {
        method: 'POST',
        body: JSON.stringify(payload),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CreateScenarioResponse>);
    },
    [fetch],
  );
}

// ─── My scenarios ─────────────────────────────────────────────

export function useListMyScenariosService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/scenarios/mine`, {
        method: 'GET',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<MyScenarioItem[]>);
    },
    [fetch],
  );
}

// ─── Rate scenario ────────────────────────────────────────────

export function useRateScenarioService() {
  const fetch = useFetch();

  return useCallback(
    (scenarioId: string, rating: number, requestConfig?: RequestConfigType) => {
      return fetch(
        `${API_URL}/v1/scenarios/${encodeURIComponent(scenarioId)}/ratings`,
        {
          method: 'POST',
          body: JSON.stringify({ rating }),
          ...requestConfig,
        },
      );
    },
    [fetch],
  );
}

// ─── Admin: pending review ────────────────────────────────────

export function useListPendingReviewService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/scenarios/pending-review`, {
        method: 'GET',
        ...requestConfig,
      }).then(
        wrapperFetchJsonResponse<{ data: ScenarioListItem[]; total: number }>,
      );
    },
    [fetch],
  );
}

// ─── Admin: review scenario ───────────────────────────────────

export function useReviewScenarioService() {
  const fetch = useFetch();

  return useCallback(
    (
      scenarioId: string,
      decision: 'approved' | 'rejected',
      notes?: string,
      requestConfig?: RequestConfigType,
    ) => {
      return fetch(
        `${API_URL}/v1/scenarios/${encodeURIComponent(scenarioId)}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({ decision, notes }),
          ...requestConfig,
        },
      );
    },
    [fetch],
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/api/services/scenarios.ts
git commit -m "feat(web/scenarios): add create, rate, review, pending-review service hooks"
```

---

### Task 6: Web — Scenario submission form

**Files:**
- Create: `apps/web/src/app/[language]/scenarios/submit/page.tsx`
- Create: `apps/web/src/app/[language]/scenarios/submit/page-content.tsx`
- Modify: `apps/web/src/app/[language]/scenarios/page-content.tsx`

- [ ] **Step 1: Create the server entry page**

Create `apps/web/src/app/[language]/scenarios/submit/page.tsx`:

```typescript
import { Metadata } from 'next';
import ScenarioSubmitPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Submit Scenario — LECA',
};

export default function ScenarioSubmitPage() {
  return <ScenarioSubmitPageContent />;
}
```

- [ ] **Step 2: Create the submission form page-content**

Create `apps/web/src/app/[language]/scenarios/submit/page-content.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import {
  useCreateScenarioService,
  CreateScenarioPhrasePayload,
} from '@/services/api/services/scenarios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';

const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

type PhraseField = { phrase: string; exampleSentence: string; difficulty: string };

const emptyPhrase = (): PhraseField => ({
  phrase: '',
  exampleSentence: '',
  difficulty: '',
});

export default function ScenarioSubmitPageContent() {
  const router = useRouter();
  const language = useLanguage();
  const createScenario = useCreateScenarioService();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiRole, setAiRole] = useState('');
  const [context, setContext] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [situationType, setSituationType] = useState('');
  const [phrases, setPhrases] = useState<PhraseField[]>([emptyPhrase()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const addPhrase = () => setPhrases((p) => [...p, emptyPhrase()]);
  const removePhrase = (i: number) =>
    setPhrases((p) => p.filter((_, idx) => idx !== i));
  const updatePhrase = (i: number, field: keyof PhraseField, value: string) =>
    setPhrases((p) =>
      p.map((ph, idx) => (idx === i ? { ...ph, [field]: value } : ph)),
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validPhrases = phrases.filter(
      (p) => p.phrase.trim() && p.exampleSentence.trim(),
    );
    if (validPhrases.length === 0) {
      setError('Please add at least one complete phrase with an example sentence.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateScenarioPhrasePayload[] = validPhrases.map((p) => ({
        phrase: p.phrase.trim(),
        exampleSentence: p.exampleSentence.trim(),
        ...(p.difficulty ? { difficulty: p.difficulty } : {}),
      }));

      const res = await createScenario({
        title: title.trim(),
        description: description.trim() || undefined,
        aiRole: aiRole.trim(),
        context: context.trim(),
        difficulty,
        situationType,
        phrases: payload,
      });

      if (res.status === HTTP_CODES_ENUM.CREATED) {
        setSuccess(true);
      } else {
        setError('Submission failed. Please check your inputs and try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setTitle('');
    setDescription('');
    setAiRole('');
    setContext('');
    setDifficulty('');
    setSituationType('');
    setPhrases([emptyPhrase()]);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center flex flex-col gap-6">
          <p className="text-5xl">✅</p>
          <h1 className="text-2xl font-bold text-white">Scenario submitted!</h1>
          <p className="text-white/60">
            Your scenario is now under review. We&apos;ll publish it once a
            maintainer approves it.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push(`/${language}/scenarios`)}
            >
              Browse scenarios
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-400 text-black"
              onClick={resetForm}
            >
              Submit another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-16 md:px-8 max-w-3xl mx-auto">
      <button
        onClick={() => router.push(`/${language}/scenarios`)}
        className="mb-8 flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        ← Scenario library
      </button>

      <div className="mb-8">
        <p className="text-xs font-mono tracking-widest text-amber-400/70 mb-3">
          {'// SUBMIT SCENARIO'}
        </p>
        <h1 className="text-3xl font-bold text-white">
          Contribute to the library
        </h1>
        <p className="text-white/50 mt-2">
          Your scenario will be reviewed before being published. Include at
          least one key phrase.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ordering at a restaurant"
            required
            minLength={5}
            maxLength={255}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what learners will practise"
            maxLength={1000}
            rows={2}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* CEFR level + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">
              CEFR Level *
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              required
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="" disabled>
                Select level
              </option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} className="bg-neutral-900">
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">
              Category *
            </label>
            <select
              value={situationType}
              onChange={(e) => setSituationType(e.target.value)}
              required
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="" disabled>
                Select category
              </option>
              <option value="everyday" className="bg-neutral-900">
                🌍 Everyday
              </option>
              <option value="work" className="bg-neutral-900">
                💼 Work
              </option>
            </select>
          </div>
        </div>

        {/* AI Role */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">
            AI Role *
          </label>
          <Input
            value={aiRole}
            onChange={(e) => setAiRole(e.target.value)}
            placeholder="e.g. A friendly barista at a busy café"
            required
            minLength={5}
            maxLength={500}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        {/* Context */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">
            Context / AI instructions *
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Instructions for the AI — the situation it's in, how it should behave, what it should ask."
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Key Phrases */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/70">
              Key Phrases *
            </label>
            <button
              type="button"
              onClick={addPhrase}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              + Add phrase
            </button>
          </div>

          {phrases.map((ph, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/30">
                  PHRASE {i + 1}
                </span>
                {phrases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhrase(i)}
                    className="text-xs text-red-400/60 hover:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
              <Input
                value={ph.phrase}
                onChange={(e) => updatePhrase(i, 'phrase', e.target.value)}
                placeholder="Key phrase (e.g. 'I would like to order')"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <Input
                value={ph.exampleSentence}
                onChange={(e) =>
                  updatePhrase(i, 'exampleSentence', e.target.value)
                }
                placeholder="Example sentence using the phrase"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <select
                value={ph.difficulty}
                onChange={(e) =>
                  updatePhrase(i, 'difficulty', e.target.value)
                }
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 focus:outline-none"
              >
                <option value="" className="bg-neutral-900">
                  Difficulty (optional)
                </option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d} className="bg-neutral-900">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-400 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={
            submitting ||
            !title ||
            !aiRole ||
            !context ||
            !difficulty ||
            !situationType
          }
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Add "Submit a scenario" link to the scenarios list page**

In `apps/web/src/app/[language]/scenarios/page-content.tsx`, find this block (around line 199):

```typescript
        <p className="text-white/60 text-lg max-w-xl">
          {total} scenarios covering everyday and professional English contexts.
          Pick one and start practising.
        </p>
```

Add the following immediately after the closing `</p>`:

```typescript
        <div className="mt-4">
          <Link
            href="/scenarios/submit"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            + Submit a scenario
          </Link>
        </div>
```

(`Link` is already imported at the top of that file.)

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/[language]/scenarios/submit/ \
        apps/web/src/app/[language]/scenarios/page-content.tsx
git commit -m "feat(web/scenarios): add scenario submission form at /scenarios/submit"
```

---

### Task 7: Web — Interactive star rating on scenario detail

**Files:**
- Modify: `apps/web/src/app/[language]/scenarios/[id]/page-content.tsx`

- [ ] **Step 1: Add useRateScenarioService import**

In `apps/web/src/app/[language]/scenarios/[id]/page-content.tsx`, find the existing imports section:

```typescript
import {
  useGetScenarioService,
  ScenarioDetail,
  ScenarioPhrase,
} from '@/services/api/services/scenarios';
```

Replace with:

```typescript
import {
  useGetScenarioService,
  useRateScenarioService,
  ScenarioDetail,
  ScenarioPhrase,
} from '@/services/api/services/scenarios';
```

- [ ] **Step 2: Add rating state inside the component**

In `ScenarioDetailPageContent`, find the existing state declarations:

```typescript
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
```

Add after those lines:

```typescript
  const rateScenario = useRateScenarioService();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [localRatingAvg, setLocalRatingAvg] = useState<number | null>(null);
  const [localRatingCount, setLocalRatingCount] = useState(0);
```

- [ ] **Step 3: Sync local rating state from loaded scenario**

Find the existing `useEffect`:

```typescript
  useEffect(() => {
    if (!id) return;
    getScenario(id).then(({ status, data }) => {
      if (status === HTTP_CODES_ENUM.OK && data) {
        setScenario(data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
```

Replace with:

```typescript
  useEffect(() => {
    if (!id) return;
    getScenario(id).then(({ status, data }) => {
      if (status === HTTP_CODES_ENUM.OK && data) {
        setScenario(data);
        setLocalRatingAvg(data.ratingAvg ?? null);
        setLocalRatingCount(data.ratingCount);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4: Add handleRate function**

Add this function inside `ScenarioDetailPageContent`, just before the `if (loading)` block:

```typescript
  const handleRate = async (star: number) => {
    if (!scenario) return;
    setUserRating(star);
    try {
      await rateScenario(scenario.id, star);
      setRatingSubmitted(true);
      const newCount = localRatingCount + (ratingSubmitted ? 0 : 1);
      const newAvg = localRatingAvg !== null
        ? (localRatingAvg * localRatingCount + star) / newCount
        : star;
      setLocalRatingAvg(Math.round(newAvg * 10) / 10);
      setLocalRatingCount(newCount);
    } catch {
      // silent — user may not be authenticated
    }
  };
```

- [ ] **Step 5: Replace static rating display with interactive version**

Find this block in the JSX:

```typescript
          {/* Rating + author */}
          <div className="flex items-center gap-4 text-sm text-white/40">
            {scenario.ratingAvg !== null &&
              scenario.ratingAvg !== undefined && (
                <span>
                  ★ {scenario.ratingAvg.toFixed(1)} ({scenario.ratingCount}{' '}
                  ratings)
                </span>
              )}
            {scenario.useCount > 0 && (
              <span>{scenario.useCount.toLocaleString()} sessions</span>
            )}
            {scenario.authorName && <span>by {scenario.authorName}</span>}
          </div>
```

Replace with:

```typescript
          {/* Rating + author */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 text-sm text-white/40">
              {localRatingAvg !== null && localRatingAvg !== undefined && (
                <span>
                  ★ {localRatingAvg.toFixed(1)} ({localRatingCount} ratings)
                </span>
              )}
              {scenario.useCount > 0 && (
                <span>{scenario.useCount.toLocaleString()} sessions</span>
              )}
              {scenario.authorName && <span>by {scenario.authorName}</span>}
            </div>

            {/* Interactive star rating */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">Rate this scenario:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(star)}
                    className={`text-lg transition-colors ${
                      star <= (hoverRating || userRating)
                        ? 'text-amber-400'
                        : 'text-white/20 hover:text-amber-400/60'
                    }`}
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {ratingSubmitted && (
                <span className="text-xs text-green-400">Rated!</span>
              )}
            </div>
          </div>
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/[language]/scenarios/[id]/page-content.tsx
git commit -m "feat(web/scenarios): add interactive star rating widget to scenario detail page"
```

---

### Task 8: Web — Admin review queue

**Files:**
- Create: `apps/web/src/app/[language]/admin-panel/scenarios/page.tsx`
- Create: `apps/web/src/app/[language]/admin-panel/scenarios/page-content.tsx`
- Modify: `apps/web/src/app/[language]/admin-panel/layout.tsx`
- Modify: `apps/web/src/services/i18n/locales/en/common.json`
- Modify: `apps/web/src/services/i18n/locales/uk/common.json`
- Modify: `apps/web/src/services/i18n/locales/vi/common.json`

- [ ] **Step 1: Create the server entry page**

Create `apps/web/src/app/[language]/admin-panel/scenarios/page.tsx`:

```typescript
import { Metadata } from 'next';
import AdminScenariosPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Scenario Review — Admin — LECA',
};

export default function AdminScenariosPage() {
  return <AdminScenariosPageContent />;
}
```

- [ ] **Step 2: Create the review queue page-content**

Create `apps/web/src/app/[language]/admin-panel/scenarios/page-content.tsx`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  useListPendingReviewService,
  useReviewScenarioService,
  ScenarioListItem,
} from '@/services/api/services/scenarios';
import { Button } from '@/components/ui/button';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { RoleEnum } from '@/services/api/types/role';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';

type ReviewState = {
  scenarioId: string;
  decision: 'approved' | 'rejected';
  notes: string;
};

function AdminScenariosContent() {
  const listPending = useListPendingReviewService();
  const reviewScenario = useReviewScenarioService();

  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<ReviewState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPending();
      if (res.status === HTTP_CODES_ENUM.OK && res.data) {
        setScenarios(res.data.data);
        setTotal(res.data.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [listPending]);

  useEffect(() => {
    loadPending();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startReview = (scenarioId: string, decision: 'approved' | 'rejected') =>
    setReviewing({ scenarioId, decision, notes: '' });

  const submitReview = async () => {
    if (!reviewing) return;
    setSubmitting(true);
    try {
      await reviewScenario(reviewing.scenarioId, reviewing.decision, reviewing.notes || undefined);
      setSuccessMsg(
        reviewing.decision === 'approved'
          ? 'Scenario approved and published!'
          : 'Scenario rejected.',
      );
      setReviewing(null);
      await loadPending();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          Scenario Review Queue
        </h1>
        <p className="text-white/50 text-sm">
          {total} scenario{total !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {successMsg}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
        </div>
      )}

      {!loading && scenarios.length === 0 && (
        <div className="text-center py-20 text-white/40">
          <p className="text-4xl mb-4">✅</p>
          <p>No scenarios awaiting review.</p>
        </div>
      )}

      {!loading && scenarios.length > 0 && (
        <div className="flex flex-col gap-4">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{s.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      {s.difficulty}
                    </span>
                    <span>{s.situationType}</span>
                    {s.authorName && <span>by {s.authorName}</span>}
                  </div>
                  {s.description && (
                    <p className="text-sm text-white/50 line-clamp-2 mt-1">
                      {s.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20"
                    onClick={() => startReview(s.id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                    onClick={() => startReview(s.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </div>

              {reviewing?.scenarioId === s.id && (
                <div className="border-t border-white/10 pt-3 flex flex-col gap-3">
                  <p className="text-xs text-white/50">
                    {reviewing.decision === 'approved'
                      ? 'Optional note for the author:'
                      : 'Reason for rejection (optional):'}
                  </p>
                  <textarea
                    value={reviewing.notes}
                    onChange={(e) =>
                      setReviewing({ ...reviewing, notes: e.target.value })
                    }
                    placeholder="Add a note for the author…"
                    rows={2}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={submitting}
                      onClick={submitReview}
                      className={
                        reviewing.decision === 'approved'
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }
                    >
                      {submitting ? 'Submitting…' : `Confirm ${reviewing.decision}`}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReviewing(null)}
                      className="text-white/40"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(AdminScenariosContent, {
  roles: [RoleEnum.ADMIN],
});
```

- [ ] **Step 3: Add "scenarios" key to i18n files**

In `apps/web/src/services/i18n/locales/en/common.json`, add `"scenarios": "Scenario Review"` inside the `"navigation"` object:

Find:
```json
    "email": "Email",
    "logout": "Logout"
```

Replace with:
```json
    "email": "Email",
    "scenarios": "Scenario Review",
    "logout": "Logout"
```

In `apps/web/src/services/i18n/locales/uk/common.json`, add the same key (use English as fallback):
Find:
```json
    "email":
```
Add `"scenarios": "Scenario Review",` before it (or after `"email"` line, following the same pattern).

In `apps/web/src/services/i18n/locales/vi/common.json`, add:
`"scenarios": "Duyệt kịch bản",`

- [ ] **Step 4: Add Scenario Review nav item to admin panel layout**

In `apps/web/src/app/[language]/admin-panel/layout.tsx`:

Add `BookOpen` to the lucide-react import:

```typescript
import { BookOpen, FolderOpen, LayoutDashboard, Mail, Users } from 'lucide-react';
```

Add to the `NAV_ITEMS` array (after the email entry):

```typescript
  {
    href: '/admin-panel/scenarios',
    labelKey: 'common:navigation.scenarios' as const,
    icon: BookOpen,
    exact: false,
  },
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/[language]/admin-panel/scenarios/ \
        apps/web/src/app/[language]/admin-panel/layout.tsx \
        apps/web/src/services/i18n/locales/en/common.json \
        apps/web/src/services/i18n/locales/uk/common.json \
        apps/web/src/services/i18n/locales/vi/common.json
git commit -m "feat(web/admin): add scenario review queue at /admin-panel/scenarios"
```

---

## Acceptance verification

Run these checks after all tasks complete:

```bash
# 1. All API unit tests pass
cd apps/api && npx jest scenarios.service.spec.ts --no-coverage

# 2. Full API build succeeds
cd apps/api && npx tsc --noEmit

# 3. Full Web build succeeds
cd apps/web && npx tsc --noEmit

# 4. Seed shows 20 scenarios
cd apps/api && npx prisma db seed 2>&1 | grep "Scenario:" | wc -l
# Expected: 20

# 5. Swagger shows new endpoints
# Start API: cd apps/api && npm run start:dev
# Open: http://localhost:3000/api/docs — should show POST /scenarios, GET /pending-review etc.
```

**Acceptance criteria met when:**
- [ ] Authenticated user can POST /scenarios → receives `{id, status: "in_review", title}`
- [ ] Submitted scenario NOT visible on public GET /scenarios (only `featured` shown)
- [ ] Author can see own submitted scenario via GET /scenarios/mine
- [ ] Admin can see pending scenario via GET /scenarios/pending-review
- [ ] Admin POST /scenarios/:id/reviews with `decision: "approved"` → scenario appears on public list
- [ ] Admin POST /scenarios/:id/reviews with `decision: "rejected"` → scenario removed from review queue
- [ ] Authenticated user can POST /scenarios/:id/ratings → `ratingAvg` updates on subsequent GET
- [ ] `prisma db seed` creates 20 scenarios across ≥6 situation types
- [ ] `/scenarios/submit` form validates inputs and shows success state
- [ ] Scenario detail page shows interactive star rating (stars highlight on hover, submit on click)
- [ ] `/admin-panel/scenarios` shows pending scenarios with Approve/Reject buttons (admin only)
