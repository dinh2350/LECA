import { Status as PrismaStatus } from '@prisma/client';
import { Status } from '../../../../domain/status';

export class StatusMapper {
  static toDomain(raw: PrismaStatus): Status {
    const domainEntity = new Status();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name ?? undefined;
    return domainEntity;
  }
}
