import { Module } from '@nestjs/common';
import { ConversationSessionsController } from './conversation-sessions.controller';
import { ConversationSessionsService } from './conversation-sessions.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ConversationSessionsController],
  providers: [ConversationSessionsService],
})
export class ConversationSessionsModule {}
