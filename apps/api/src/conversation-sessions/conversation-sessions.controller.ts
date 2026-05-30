import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { ConversationSessionsService } from './conversation-sessions.service';
import { CreateSessionResponseDto } from './dto/create-session-response.dto';

@ApiTags('Conversation Sessions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'conversation-sessions', version: '1' })
export class ConversationSessionsController {
  constructor(private readonly service: ConversationSessionsService) {}

  /** Create a LiveKit room and start a conversation session. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CreateSessionResponseDto })
  create(
    @Req() req: Request & { user: JwtPayloadType },
  ): Promise<CreateSessionResponseDto> {
    return this.service.create(Number(req.user.id));
  }

  /** End a conversation session and close the LiveKit room. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Session ended' })
  @ApiNotFoundResponse({ description: 'Session not found' })
  async end(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.end(id);
  }
}
