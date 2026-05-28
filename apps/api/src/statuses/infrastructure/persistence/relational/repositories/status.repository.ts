import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Status } from '../../../../domain/status';
import { StatusMapper } from '../mappers/status.mapper';

@Injectable()
export class StatusesRelationalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: Status['id']): Promise<NullableType<Status>> {
    const record = await this.prisma.status.findFirst({
      where: { id: Number(id) },
    });
    return record ? StatusMapper.toDomain(record) : null;
  }

  async findByIds(ids: Status['id'][]): Promise<Status[]> {
    const records = await this.prisma.status.findMany({
      where: { id: { in: ids.map(Number) } },
    });
    return records.map(StatusMapper.toDomain);
  }
}
