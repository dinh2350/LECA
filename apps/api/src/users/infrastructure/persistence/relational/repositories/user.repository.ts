import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { User } from '../../../../domain/user';
import { UserRepository } from '../../user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersRelationalRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: User): Promise<User> {
    const record = await this.prisma.user.create({
      data: UserMapper.toPersistence(data),
      include: { photo: true, role: true, status: true },
    });
    return UserMapper.toDomain(record);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (filterOptions?.roles?.length) {
      where.roleId = { in: filterOptions.roles.map((r) => Number(r.id)) };
    }

    const orderBy: Prisma.UserOrderByWithRelationInput[] =
      sortOptions?.map((s) => ({ [s.orderBy]: s.order.toLowerCase() })) ?? [];

    const records = await this.prisma.user.findMany({
      where,
      orderBy,
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      include: { photo: true, role: true, status: true },
    });

    return records.map(UserMapper.toDomain);
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    const record = await this.prisma.user.findFirst({
      where: { id: Number(id), deletedAt: null },
      include: { photo: true, role: true, status: true },
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      where: { id: { in: ids.map(Number) }, deletedAt: null },
      include: { photo: true, role: true, status: true },
    });
    return records.map(UserMapper.toDomain);
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;
    const record = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { photo: true, role: true, status: true },
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    if (!socialId || !provider) return null;
    const record = await this.prisma.user.findFirst({
      where: { socialId, provider, deletedAt: null },
      include: { photo: true, role: true, status: true },
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async update(id: User['id'], payload: Partial<User>): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id: Number(id) },
      data: UserMapper.toPersistenceForUpdate(payload),
      include: { photo: true, role: true, status: true },
    });
    return UserMapper.toDomain(record);
  }

  async remove(id: User['id']): Promise<void> {
    await this.prisma.user.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });
  }
}
