import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Role } from '../../../../domain/role';
import { RoleMapper } from '../mappers/role.mapper';

@Injectable()
export class RolesRelationalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: Role['id']): Promise<NullableType<Role>> {
    const record = await this.prisma.role.findFirst({
      where: { id: Number(id) },
    });
    return record ? RoleMapper.toDomain(record) : null;
  }

  async findByIds(ids: Role['id'][]): Promise<Role[]> {
    const records = await this.prisma.role.findMany({
      where: { id: { in: ids.map(Number) } },
    });
    return records.map(RoleMapper.toDomain);
  }
}
