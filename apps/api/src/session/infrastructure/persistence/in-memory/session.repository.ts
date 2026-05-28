import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../utils/types/nullable.type';
import { Session } from '../../../domain/session';
import { SessionRepository } from '../session.repository';

@Injectable()
export class InMemorySessionRepository implements SessionRepository {
  private readonly store = new Map<string, Session>();
  private nextId = 1;

  findById(id: Session['id']): Promise<NullableType<Session>> {
    return Promise.resolve(this.store.get(String(id)) ?? null);
  }

  create(
    data: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Session> {
    const now = new Date();
    const session: Session = {
      ...data,
      id: this.nextId++,
      createdAt: now,
      updatedAt: now,
      deletedAt: now,
    };
    this.store.set(String(session.id), session);
    return Promise.resolve(session);
  }

  update(
    id: Session['id'],
    payload: Partial<
      Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Session | null> {
    const existing = this.store.get(String(id));
    if (!existing) return Promise.resolve(null);
    const updated = { ...existing, ...payload, updatedAt: new Date() };
    this.store.set(String(id), updated);
    return Promise.resolve(updated);
  }

  updateByHash(
    conditions: { id: Session['id']; hash: Session['hash'] },
    payload: Partial<
      Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Session | null> {
    const existing = this.store.get(String(conditions.id));
    if (!existing || existing.hash !== conditions.hash)
      return Promise.resolve(null);
    const updated = { ...existing, ...payload, updatedAt: new Date() };
    this.store.set(String(conditions.id), updated);
    return Promise.resolve(updated);
  }

  deleteById(id: Session['id']): Promise<void> {
    this.store.delete(String(id));
    return Promise.resolve();
  }

  deleteByUserId({ userId }: { userId: number }): Promise<void> {
    for (const [key, session] of this.store) {
      if (String(session.userId) === String(userId)) {
        this.store.delete(key);
      }
    }
    return Promise.resolve();
  }

  deleteByUserIdWithExclude({
    userId,
    excludeSessionId,
  }: {
    userId: number;
    excludeSessionId: Session['id'];
  }): Promise<void> {
    for (const [key, session] of this.store) {
      if (
        String(session.userId) === String(userId) &&
        String(session.id) !== String(excludeSessionId)
      ) {
        this.store.delete(key);
      }
    }
    return Promise.resolve();
  }
}
