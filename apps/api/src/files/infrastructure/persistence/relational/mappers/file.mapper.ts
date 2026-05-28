import { File as PrismaFile, Prisma } from '@prisma/client';
import { FileType } from '../../../../domain/file';

export class FileMapper {
  static toDomain(raw: PrismaFile): FileType {
    const domainEntity = new FileType();
    domainEntity.id = raw.id;
    domainEntity.path = raw.path;
    domainEntity.name = raw.name;
    domainEntity.size = raw.size;
    domainEntity.mimeType = raw.mimeType;
    domainEntity.createdAt = raw.createdAt.toISOString();
    return domainEntity;
  }

  static toPersistence(domainEntity: FileType): Prisma.FileCreateInput {
    return {
      id: domainEntity.id,
      path: domainEntity.path,
      name: domainEntity.name ?? '',
      size: domainEntity.size ?? 0,
      mimeType: domainEntity.mimeType ?? '',
    };
  }
}
