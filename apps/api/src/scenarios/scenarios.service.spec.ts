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

    it('should resolve LecaUser and creates scenario with status in_review', async () => {
      mockUsersService.findById.mockResolvedValue({
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
      });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-123' });
      mockPrisma.scenario.create.mockResolvedValue({
        id: 'sc-uuid-1',
        title: dto.title,
        status: 'in_review',
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

    it('should create LecaUser when one does not exist yet', async () => {
      mockUsersService.findById.mockResolvedValue({
        email: 'new@test.com',
        firstName: 'New',
        lastName: null,
      });
      mockPrisma.lecaUser.findUnique.mockResolvedValue(null);
      mockPrisma.lecaUser.create.mockResolvedValue({ id: 'leca-new-uuid' });
      mockPrisma.scenario.create.mockResolvedValue({
        id: 'sc-2',
        title: dto.title,
        status: 'in_review',
      });
      mockPrisma.scenarioPhrase.createMany.mockResolvedValue({ count: 1 });

      await service.createScenario(2, dto);

      expect(mockPrisma.lecaUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'new@test.com' }),
        }),
      );
    });

    it('should throw NotFoundException when boilerplate user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(service.createScenario(999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── listMyScenarios ───────────────────────────────────────────────────────

  describe('listMyScenarios', () => {
    it('should return scenarios for the authenticated user regardless of status', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'user@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-123' });
      mockPrisma.scenario.findMany.mockResolvedValue([
        {
          id: 'sc-1',
          title: 'Draft',
          status: 'in_review',
          difficulty: 'A1',
          situationType: 'everyday',
          ratingAvg: null,
          ratingCount: 0,
          createdAt: new Date(),
        },
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
    it('should return only in_review scenarios', async () => {
      mockPrisma.scenario.findMany.mockResolvedValue([
        {
          id: 'sc-1',
          title: 'Pending',
          description: null,
          difficulty: 'B1',
          situationType: 'everyday',
          tags: [],
          ratingAvg: null,
          ratingCount: 0,
          useCount: 0,
          author: { displayName: 'Author' },
        },
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
    it('should upsert rating and recalculates ratingAvg in a transaction', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'user@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-123' });
      mockPrisma.scenario.findFirst.mockResolvedValue({
        id: 'sc-1',
        status: 'featured',
      });
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<void>) => fn(mockPrisma),
      );
      mockPrisma.scenarioRating.upsert.mockResolvedValue({});
      mockPrisma.scenarioRating.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 2 },
      });
      mockPrisma.scenario.update.mockResolvedValue({});

      await service.rateScenario(1, 'sc-1', 5);

      expect(mockPrisma.scenarioRating.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            scenarioId_userId: { scenarioId: 'sc-1', userId: 'leca-uuid-123' },
          },
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

    it('should throw NotFoundException when scenario not found or not featured', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'user@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-123' });
      mockPrisma.scenario.findFirst.mockResolvedValue(null);

      await expect(service.rateScenario(1, 'no-such-id', 3)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── reviewScenario ────────────────────────────────────────────────────────

  describe('reviewScenario', () => {
    it('should set status to featured when approved', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'admin@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({
        id: 'admin-leca-uuid',
      });
      mockPrisma.scenario.findFirst.mockResolvedValue({
        id: 'sc-1',
        status: 'in_review',
      });
      mockPrisma.scenarioReview.create.mockResolvedValue({});
      mockPrisma.scenario.update.mockResolvedValue({});

      await service.reviewScenario(1, 'sc-1', 'approved', undefined);

      expect(mockPrisma.scenario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sc-1' },
          data: { status: 'featured' },
        }),
      );
    });

    it('should set status to rejected when rejected', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'admin@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({
        id: 'admin-leca-uuid',
      });
      mockPrisma.scenario.findFirst.mockResolvedValue({
        id: 'sc-1',
        status: 'in_review',
      });
      mockPrisma.scenarioReview.create.mockResolvedValue({});
      mockPrisma.scenario.update.mockResolvedValue({});

      await service.reviewScenario(1, 'sc-1', 'rejected', 'Needs improvement');

      expect(mockPrisma.scenario.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'rejected' } }),
      );
      expect(mockPrisma.scenarioReview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ notes: 'Needs improvement' }),
        }),
      );
    });

    it('should throw NotFoundException when scenario not found or not in_review', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'admin@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({
        id: 'admin-leca-uuid',
      });
      mockPrisma.scenario.findFirst.mockResolvedValue(null);

      await expect(
        service.reviewScenario(1, 'no-such', 'approved', undefined),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
