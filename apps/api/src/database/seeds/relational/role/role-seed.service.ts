import { Injectable } from '@nestjs/common';
import { RoleEnum } from '../../../../roles/roles.enum';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class RoleSeedService {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const countUser = await this.prisma.role.count({
      where: {
        id: RoleEnum.user,
      },
    });

    if (!countUser) {
      await this.prisma.role.create({
        data: {
          id: RoleEnum.user,
          name: 'User',
        },
      });
    }

    const countAdmin = await this.prisma.role.count({
      where: {
        id: RoleEnum.admin,
      },
    });

    if (!countAdmin) {
      await this.prisma.role.create({
        data: {
          id: RoleEnum.admin,
          name: 'Admin',
        },
      });
    }
  }
}
