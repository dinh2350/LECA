import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { ScenariosService } from './scenarios.service';
import { ListScenariosQueryDto } from './dto/list-scenarios-query.dto';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { RateScenarioDto } from './dto/rate-scenario.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  CreateScenarioResponseDto,
  MyScenarioItemDto,
  PendingReviewResponseDto,
  ScenarioDetailDto,
  ScenarioListResponseDto,
} from './dto/scenarios.dto';

@ApiTags('Scenarios')
@Controller({ path: 'scenarios', version: '1' })
export class ScenariosController {
  constructor(private readonly service: ScenariosService) {}

  /** Browse published scenarios with optional filters and full-text search. */
  @Get()
  @ApiOkResponse({ type: ScenarioListResponseDto })
  list(
    @Query() query: ListScenariosQueryDto,
  ): Promise<ScenarioListResponseDto> {
    return this.service.list(query);
  }

  /** Admin: list scenarios awaiting review. Must be before /:id. */
  @Get('pending-review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PendingReviewResponseDto })
  listPendingReview(): Promise<PendingReviewResponseDto> {
    return this.service.listPendingReview();
  }

  /** Auth: list the caller's own scenarios (all statuses). Must be before /:id. */
  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOkResponse({ type: [MyScenarioItemDto] })
  listMine(
    @Req() req: Request & { user: JwtPayloadType },
  ): Promise<MyScenarioItemDto[]> {
    return this.service.listMyScenarios(Number(req.user.id));
  }

  /** Full scenario detail including key phrases. */
  @Get(':id')
  @ApiOkResponse({ type: ScenarioDetailDto })
  @ApiNotFoundResponse({ description: 'Scenario not found or not published' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScenarioDetailDto> {
    const scenario = await this.service.findOne(id);
    if (!scenario) throw new NotFoundException('Scenario not found');
    return scenario;
  }

  /** Auth: submit a new scenario for review. */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CreateScenarioResponseDto })
  createScenario(
    @Req() req: Request & { user: JwtPayloadType },
    @Body() dto: CreateScenarioDto,
  ): Promise<CreateScenarioResponseDto> {
    return this.service.createScenario(Number(req.user.id), dto);
  }

  /** Auth: rate a published scenario (1–5). Upserts the rating. */
  @Post(':id/ratings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ description: 'Rating recorded' })
  @ApiNotFoundResponse({ description: 'Scenario not found' })
  async rateScenario(
    @Req() req: Request & { user: JwtPayloadType },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateScenarioDto,
  ): Promise<void> {
    await this.service.rateScenario(Number(req.user.id), id, dto.rating);
  }

  /** Admin: approve or reject a scenario awaiting review. */
  @Post(':id/reviews')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ description: 'Review recorded' })
  @ApiNotFoundResponse({ description: 'Scenario not awaiting review' })
  async reviewScenario(
    @Req() req: Request & { user: JwtPayloadType },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto,
  ): Promise<void> {
    await this.service.reviewScenario(
      Number(req.user.id),
      id,
      dto.decision,
      dto.notes,
    );
  }
}
