import { Injectable } from '@nestjs/common';
import { DeepPartial } from '../../../../utils/types/deep-partial.type';
import { NullableType } from '../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../utils/types/pagination-options';
import { User } from '../../../domain/user';
import { FilterUserDto, SortUserDto } from '../../../dto/query-user.dto';
import { UserRepository } from '../user.repository';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly store = new Map<string, User>();
  private nextId = 1;

  create(
    data: Omit<User, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<User> {
    const now = new Date();
    const user = {
      ...data,
      id: this.nextId++,
      createdAt: now,
      updatedAt: now,
      deletedAt: now,
    } as unknown as User;
    this.store.set(String(user.id), user);
    return Promise.resolve(user);
  }

  findManyWithPagination({
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    const all = Array.from(this.store.values());
    const start = (paginationOptions.page - 1) * paginationOptions.limit;
    return Promise.resolve(all.slice(start, start + paginationOptions.limit));
  }

  findById(id: User['id']): Promise<NullableType<User>> {
    return Promise.resolve(this.store.get(String(id)) ?? null);
  }

  findByIds(ids: User['id'][]): Promise<User[]> {
    return Promise.resolve(
      ids.map((id) => this.store.get(String(id))).filter(Boolean) as User[],
    );
  }

  findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return Promise.resolve(null);
    return Promise.resolve(
      Array.from(this.store.values()).find((u) => u.email === email) ?? null,
    );
  }

  findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    return Promise.resolve(
      Array.from(this.store.values()).find(
        (u) => u.socialId === socialId && u.provider === provider,
      ) ?? null,
    );
  }

  update(id: User['id'], payload: DeepPartial<User>): Promise<User | null> {
    const existing = this.store.get(String(id));
    if (!existing) return Promise.resolve(null);
    const updated = {
      ...existing,
      ...(payload as Partial<User>),
      updatedAt: new Date(),
    };
    this.store.set(String(id), updated);
    return Promise.resolve(updated);
  }

  remove(id: User['id']): Promise<void> {
    this.store.delete(String(id));
    return Promise.resolve();
  }
}
