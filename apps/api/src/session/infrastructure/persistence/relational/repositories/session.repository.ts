import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { SessionRepository } from '../../session.repository';
import { Session } from '../../../../domain/session';
import { SessionMapper } from '../mappers/session.mapper';

@Injectable()
export class SessionRelationalRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: Session['id']): Promise<NullableType<Session>> {
    const entity = await this.prisma.session.findFirst({
      where: {
        id: Number(id),
      },
    });

    return entity ? SessionMapper.toDomain(entity) : null;
  }

  async create(data: Session): Promise<Session> {
    const persistenceModel = SessionMapper.toPersistence(data);
    const entity = await this.prisma.session.create({
      data: persistenceModel,
    });
    return SessionMapper.toDomain(entity);
  }

  async update(
    id: Session['id'],
    payload: Partial<
      Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Session | null> {
    const entity = await this.prisma.session.findFirst({
      where: { id: Number(id) },
    });

    if (!entity) {
      throw new Error('Session not found');
    }

    const updatedEntity = await this.prisma.session.update({
      where: { id: Number(id) },
      data: SessionMapper.toPersistenceForUpdate({
        ...SessionMapper.toDomain(entity),
        ...payload,
      } as Session),
    });

    return SessionMapper.toDomain(updatedEntity);
  }

  async updateByHash(
    conditions: { id: Session['id']; hash: Session['hash'] },
    payload: Partial<
      Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Session | null> {
    const result = await this.prisma.session.updateMany({
      where: { id: Number(conditions.id), hash: conditions.hash },
      data: { hash: payload.hash },
    });

    if (!result.count) {
      return null;
    }

    const entity = await this.prisma.session.findFirst({
      where: { id: Number(conditions.id) },
    });

    return entity ? SessionMapper.toDomain(entity) : null;
  }

  async deleteById(id: Session['id']): Promise<void> {
    await this.prisma.session.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });
  }

  async deleteByUserId(conditions: { userId: number }): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId: Number(conditions.userId) },
      data: { deletedAt: new Date() },
    });
  }

  async deleteByUserIdWithExclude(conditions: {
    userId: number;
    excludeSessionId: Session['id'];
  }): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId: Number(conditions.userId),
        id: { not: Number(conditions.excludeSessionId) },
      },
      data: { deletedAt: new Date() },
    });
  }
}
