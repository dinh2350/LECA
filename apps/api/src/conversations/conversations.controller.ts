import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ConversationsService } from './conversations.service';
import { GuestLimitGuard } from './guards/guest-limit.guard';
import { GuestConversationResponseDto } from './dto/guest-conversation-response.dto';
import { DEVICE_COOKIE } from './guards/guest-limit.guard';

@ApiTags('Conversations')
@Controller({
  path: 'conversations',
  version: '1',
})
export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-optional'), GuestLimitGuard)
  @ApiOkResponse({ type: GuestConversationResponseDto })
  async createSession(
    @Req() req: Request & { user?: any; cookies: Record<string, string> },
  ): Promise<GuestConversationResponseDto> {
    const deviceId = req.cookies[DEVICE_COOKIE] ?? 'unknown';
    return this.service.createGuestSession(deviceId);
  }
}
