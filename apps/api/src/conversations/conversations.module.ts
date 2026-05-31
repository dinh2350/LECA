import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { GuestLimitGuard } from './guards/guest-limit.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ConversationsController],
  providers: [ConversationsService, GuestLimitGuard],
})
export class ConversationsModule {}
