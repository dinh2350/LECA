import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class TurnFeedbackDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  fluency!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  naturalness!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  vocabulary!: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  explanation!: string;
}

export class RecordTurnDto {
  @ApiProperty({ enum: ['learner', 'agent'] })
  @IsEnum(['learner', 'agent'])
  speaker!: 'learner' | 'agent';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  transcript!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  turnIndex!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMs?: number;

  @ApiPropertyOptional({ type: TurnFeedbackDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TurnFeedbackDto)
  feedback?: TurnFeedbackDto;
}

export class RecordTurnsDto {
  @ApiProperty({ type: [RecordTurnDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => RecordTurnDto)
  turns!: RecordTurnDto[];
}
