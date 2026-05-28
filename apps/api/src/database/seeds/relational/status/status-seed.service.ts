import { Injectable } from '@nestjs/common';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class StatusSeedService {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const countActive = await this.prisma.status.count({
      where: { id: StatusEnum.active },
    });
    if (!countActive) {
      await this.prisma.status.create({
        data: { id: StatusEnum.active },
      });
    }

    const countInactive = await this.prisma.status.count({
      where: { id: StatusEnum.inactive },
    });
    if (!countInactive) {
      await this.prisma.status.create({
        data: { id: StatusEnum.inactive },
      });
    }
  }
}
