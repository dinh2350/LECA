import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { AssessmentsService } from './assessments.service';
import { AnswerAssessmentDto } from './dto/answer-assessment.dto';
import { AnswerAssessmentResponseDto } from './dto/answer-assessment-response.dto';
import { AssessmentStatusDto } from './dto/assessment-status.dto';
import { CompleteAssessmentResponseDto } from './dto/complete-assessment-response.dto';
import { StartAssessmentResponseDto } from './dto/start-assessment-response.dto';

@ApiTags('Assessments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'assessments', version: '1' })
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  /** Check whether this user has a completed assessment. */
  @Get('status')
  @ApiOkResponse({ type: AssessmentStatusDto })
  getStatus(
    @Req() req: Request & { user: JwtPayloadType },
  ): Promise<AssessmentStatusDto> {
    return this.service.getStatus(req.user.id);
  }

  /** Start a new assessment session. Returns first prompt. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: StartAssessmentResponseDto })
  start(
    @Req() req: Request & { user: JwtPayloadType },
  ): Promise<StartAssessmentResponseDto> {
    return this.service.start(req.user.id);
  }

  /**
   * Submit an answer for the current prompt.
   * Accepts multipart/form-data with optional audio file + optional transcript text.
   */
  @Post(':id/answer')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOkResponse({ type: AnswerAssessmentResponseDto })
  @UseInterceptors(FileInterceptor('audio'))
  answer(
    @Param('id') id: string,
    @Body() body: AnswerAssessmentDto,
  ): Promise<AnswerAssessmentResponseDto> {
    return this.service.answer(id, body.transcript);
  }

  /** Finalise assessment, compute level, persist to DB. */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CompleteAssessmentResponseDto })
  complete(@Param('id') id: string): Promise<CompleteAssessmentResponseDto> {
    return this.service.complete(id);
  }
}
