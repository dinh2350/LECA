import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ListScenariosQueryDto } from './dto/list-scenarios-query.dto';
import {
  ScenarioDetailDto,
  ScenarioListItemDto,
  ScenarioListResponseDto,
} from './dto/scenarios.dto';
import { Prisma } from '@prisma/client';

// Statuses visible on the public browse page
const VISIBLE_STATUSES = ['featured'];

type ScenarioWithAuthor = Prisma.ScenarioGetPayload<{
  include: { author: { select: { displayName: true } } };
}>;

@Injectable()
export class ScenariosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListScenariosQueryDto): Promise<ScenarioListResponseDto> {
    const { q, category, difficulty } = query;
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    if (q && q.trim()) {
      return this.listWithFts(q.trim(), {
        category,
        difficulty,
        page,
        limit,
        skip,
      });
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
      id: string;
      title: string;
      description: string | null;
      difficulty: string;
      situation_type: string;
      tags: string[];
      rating_avg: string | null;
      rating_count: number;
      use_count: number;
      author_name: string | null;
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
        id: r.id,
        title: r.title,
        description: r.description,
        difficulty: r.difficulty,
        situationType: r.situation_type,
        tags: Array.isArray(r.tags) ? r.tags : [],
        ratingAvg: r.rating_avg ? parseFloat(r.rating_avg) : null,
        ratingCount: Number(r.rating_count),
        useCount: Number(r.use_count),
        authorName: r.author_name,
      })),
      total,
      page,
      limit,
    };
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

  private toListItem = (s: ScenarioWithAuthor): ScenarioListItemDto => ({
    id: s.id,
    title: s.title,
    description: s.description,
    difficulty: s.difficulty,
    situationType: s.situationType,
    tags: s.tags,
    ratingAvg: s.ratingAvg ? Number(s.ratingAvg) : null,
    ratingCount: s.ratingCount,
    useCount: s.useCount,
    authorName: s.author?.displayName ?? null,
  });
}
