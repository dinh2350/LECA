import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import { FileRepository } from '../../file.repository';
import { FileMapper } from '../mappers/file.mapper';
import { FileType } from '../../../../domain/file';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class FileRelationalRepository implements FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: FileType): Promise<FileType> {
    const record = await this.prisma.file.create({
      data: FileMapper.toPersistence(data),
    });

    return FileMapper.toDomain(record);
  }

  async findById(id: FileType['id']): Promise<NullableType<FileType>> {
    const record = await this.prisma.file.findFirst({
      where: { id },
    });

    return record ? FileMapper.toDomain(record) : null;
  }

  async findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    const records = await this.prisma.file.findMany({
      where: { id: { in: ids } },
    });

    return records.map(FileMapper.toDomain);
  }

  async findAll(): Promise<FileType[]> {
    const records = await this.prisma.file.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map(FileMapper.toDomain);
  }

  async delete(id: FileType['id']): Promise<void> {
    await this.prisma.file.delete({ where: { id } });
  }
}
