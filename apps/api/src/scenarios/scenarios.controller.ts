import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ScenariosService } from './scenarios.service';
import { ListScenariosQueryDto } from './dto/list-scenarios-query.dto';
import {
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
}
