import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { AssessmentsScorer } from './assessments.scorer';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService, AssessmentsScorer],
})
export class AssessmentsModule {}
