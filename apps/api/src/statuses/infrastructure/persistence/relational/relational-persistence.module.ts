import { Module } from '@nestjs/common';
import { StatusesRelationalRepository } from './repositories/status.repository';

@Module({
  providers: [StatusesRelationalRepository],
  exports: [StatusesRelationalRepository],
})
export class RelationalStatusPersistenceModule {}
