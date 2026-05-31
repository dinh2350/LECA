import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AnswerAssessmentDto {
  @ApiProperty({
    description:
      'Plain-text transcript of the learner response (used for scoring)',
    required: false,
  })
  @IsOptional()
  @IsString()
  transcript?: string;
}
