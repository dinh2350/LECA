import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class UserSeedService {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const countAdmin = await this.prisma.user.count({
      where: {
        roleId: RoleEnum.admin,
      },
    });

    if (!countAdmin) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);

      await this.prisma.user.create({
        data: {
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@example.com',
          password,
          role: {
            connect: {
              id: RoleEnum.admin,
            },
          },
          status: {
            connect: {
              id: StatusEnum.active,
            },
          },
        },
      });
    }

    const countUser = await this.prisma.user.count({
      where: {
        roleId: RoleEnum.user,
      },
    });

    if (!countUser) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);

      await this.prisma.user.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password,
          role: {
            connect: {
              id: RoleEnum.user,
            },
          },
          status: {
            connect: {
              id: StatusEnum.active,
            },
          },
        },
      });
    }
  }
}
