import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @ApiPropertyOptional({ description: 'UUID of the scenario to practice' })
  @IsOptional()
  @IsString()
  @IsUUID()
  scenarioId?: string;
}
