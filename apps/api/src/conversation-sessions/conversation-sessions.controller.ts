import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { ConversationSessionsService } from './conversation-sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateSessionResponseDto } from './dto/create-session-response.dto';
import { RecordTurnsDto } from './dto/record-turns.dto';
import { SessionSummaryResponseDto } from './dto/session-summary-response.dto';
import { PhonemeErrorsResponseDto } from './dto/phoneme-errors-response.dto';
import { AgentApiKeyGuard } from './guards/agent-api-key.guard';

@ApiTags('Conversation Sessions')
@ApiBearerAuth()
@Controller({ path: 'conversation-sessions', version: '1' })
export class ConversationSessionsController {
  constructor(private readonly service: ConversationSessionsService) {}

  /** Create a LiveKit room and start a conversation session. */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CreateSessionResponseDto })
  create(
    @Req() req: Request & { user: JwtPayloadType },
    @Body() dto: CreateSessionDto,
  ): Promise<CreateSessionResponseDto> {
    return this.service.create(Number(req.user.id), dto.scenarioId);
  }

  /** End a conversation session and close the LiveKit room. */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Session ended' })
  @ApiNotFoundResponse({ description: 'Session not found' })
  async end(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.end(id);
  }

  /** Agent-only: persist the learner + agent turns of one exchange. */
  @Post(':id/turns')
  @UseGuards(AgentApiKeyGuard)
  @ApiSecurity('agent-key')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Turns recorded' })
  recordTurns(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordTurnsDto,
  ): Promise<{ recorded: number }> {
    return this.service.recordTurns(id, dto);
  }

  /** Get post-session summary: scores, turns, vocab gaps, phoneme errors. */
  @Get(':id/summary')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SessionSummaryResponseDto })
  @ApiNotFoundResponse({ description: 'Session not found' })
  getSummary(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SessionSummaryResponseDto> {
    return this.service.getSummary(id);
  }

  /** Get top phoneme error and word pairs for a minimal pair drill. */
  @Get(':id/phoneme-errors')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PhonemeErrorsResponseDto })
  @ApiNotFoundResponse({ description: 'Session not found' })
  getPhonemeErrors(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PhonemeErrorsResponseDto> {
    return this.service.getPhonemeErrors(id);
  }
}
