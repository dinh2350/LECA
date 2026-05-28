import { Session as PrismaSession, Prisma } from '@prisma/client';
import { Session } from '../../../../domain/session';

export class SessionMapper {
  static toDomain(raw: PrismaSession): Session {
    const domainEntity = new Session();
    domainEntity.id = raw.id;
    domainEntity.userId = raw.userId;
    domainEntity.hash = raw.hash;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt ?? null;
    return domainEntity;
  }

  static toPersistence(
    domainEntity: Session,
  ): Prisma.SessionUncheckedCreateInput {
    return {
      userId: Number(domainEntity.userId),
      hash: domainEntity.hash,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
      deletedAt: domainEntity.deletedAt,
    };
  }

  static toPersistenceForUpdate(
    domainEntity: Partial<Session>,
  ): Prisma.SessionUpdateInput {
    const data: Prisma.SessionUpdateInput = {};
    if (domainEntity.userId !== undefined) data.userId = domainEntity.userId;
    if (domainEntity.hash !== undefined) data.hash = domainEntity.hash;
    if (domainEntity.createdAt !== undefined)
      data.createdAt = domainEntity.createdAt;
    if (domainEntity.updatedAt !== undefined)
      data.updatedAt = domainEntity.updatedAt;
    if (domainEntity.deletedAt !== undefined)
      data.deletedAt = domainEntity.deletedAt;
    return data;
  }
}
