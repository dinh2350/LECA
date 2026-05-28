import { User as PrismaUser, Role, Status, File, Prisma } from '@prisma/client';
import { User } from '../../../../domain/user';
import { FileType } from '../../../../../files/domain/file';

type UserWithRelations = PrismaUser & {
  photo: File | null;
  role: Role | null;
  status: Status | null;
};

export class UserMapper {
  static toDomain(raw: UserWithRelations): User {
    const domainEntity = new User();
    domainEntity.id = raw.id;
    domainEntity.email = raw.email;
    if (raw.password) {
      domainEntity.password = raw.password;
    }
    domainEntity.provider = raw.provider;
    domainEntity.socialId = raw.socialId ?? undefined;
    domainEntity.firstName = raw.firstName;
    domainEntity.lastName = raw.lastName;
    if (raw.photo) {
      const photo = new FileType();
      photo.id = raw.photo.id;
      photo.path = raw.photo.path;
      domainEntity.photo = photo;
    }
    domainEntity.role = raw.role ?? undefined;
    domainEntity.status = raw.status ?? undefined;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt ?? null;
    return domainEntity;
  }

  static toPersistence(domainEntity: User): Prisma.UserCreateInput {
    const data: Prisma.UserCreateInput = {
      email: domainEntity.email,
      password: domainEntity.password,
      provider: domainEntity.provider,
      socialId: domainEntity.socialId,
      firstName: domainEntity.firstName,
      lastName: domainEntity.lastName,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
      deletedAt: domainEntity.deletedAt,
    };

    if (domainEntity.role) {
      data.role = {
        connect: { id: Number(domainEntity.role.id) },
      };
    }

    if (domainEntity.photo !== undefined) {
      if (domainEntity.photo) {
        data.photo = {
          connect: { id: domainEntity.photo.id },
        };
      }
    }

    if (domainEntity.status) {
      data.status = {
        connect: { id: Number(domainEntity.status.id) },
      };
    }

    return data;
  }

  static toPersistenceForUpdate(
    domainEntity: Partial<User>,
  ): Prisma.UserUpdateInput {
    const data: Prisma.UserUpdateInput = {};

    if (domainEntity.email !== undefined) {
      data.email = domainEntity.email;
    }
    if (domainEntity.password !== undefined) {
      data.password = domainEntity.password;
    }
    if (domainEntity.provider !== undefined) {
      data.provider = domainEntity.provider;
    }
    if (domainEntity.socialId !== undefined) {
      data.socialId = domainEntity.socialId;
    }
    if (domainEntity.firstName !== undefined) {
      data.firstName = domainEntity.firstName;
    }
    if (domainEntity.lastName !== undefined) {
      data.lastName = domainEntity.lastName;
    }
    if (domainEntity.createdAt !== undefined) {
      data.createdAt = domainEntity.createdAt;
    }
    if (domainEntity.updatedAt !== undefined) {
      data.updatedAt = domainEntity.updatedAt;
    }
    if (domainEntity.deletedAt !== undefined) {
      data.deletedAt = domainEntity.deletedAt;
    }

    if (domainEntity.role !== undefined) {
      if (domainEntity.role) {
        data.role = {
          connect: { id: Number(domainEntity.role.id) },
        };
      } else {
        data.role = {
          disconnect: true,
        };
      }
    }

    if (domainEntity.photo !== undefined) {
      if (domainEntity.photo) {
        data.photo = {
          connect: { id: domainEntity.photo.id },
        };
      } else if (domainEntity.photo === null) {
        data.photo = {
          disconnect: true,
        };
      }
    }

    if (domainEntity.status !== undefined) {
      if (domainEntity.status) {
        data.status = {
          connect: { id: Number(domainEntity.status.id) },
        };
      } else {
        data.status = {
          disconnect: true,
        };
      }
    }

    return data;
  }
}
