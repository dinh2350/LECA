import { Module } from '@nestjs/common';
import { RolesRelationalRepository } from './repositories/role.repository';

@Module({
  providers: [RolesRelationalRepository],
  exports: [RolesRelationalRepository],
})
export class RelationalRolePersistenceModule {}
