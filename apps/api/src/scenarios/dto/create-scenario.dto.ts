import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScenarioPhraseDto {
  @ApiProperty({ description: 'Key phrase (e.g. "I would like to order")' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  phrase: string;

  @ApiProperty({ description: 'Example sentence using the phrase' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  exampleSentence: string;

  @ApiPropertyOptional({ enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] })
  @IsOptional()
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  difficulty?: string;
}

export class CreateScenarioDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'AI persona description' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  aiRole: string;

  @ApiProperty({ description: 'System context/instructions for the AI' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  context: string;

  @ApiProperty({ enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] })
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  difficulty: string;

  @ApiProperty({ enum: ['everyday', 'work'] })
  @IsIn(['everyday', 'work'])
  situationType: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @ApiProperty({ type: [CreateScenarioPhraseDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateScenarioPhraseDto)
  phrases: CreateScenarioPhraseDto[];
}
