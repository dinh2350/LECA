import { Role as PrismaRole } from '@prisma/client';
import { Role } from '../../../../domain/role';

export class RoleMapper {
  static toDomain(raw: PrismaRole): Role {
    const domainEntity = new Role();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name ?? undefined;
    return domainEntity;
  }
}
