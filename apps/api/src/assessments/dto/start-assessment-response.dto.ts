import { ApiProperty } from '@nestjs/swagger';

export class StartAssessmentResponseDto {
  @ApiProperty({ description: 'UUID of the in-progress assessment' })
  id: string;

  @ApiProperty({ description: 'Index of the current prompt (0-based)' })
  promptIndex: number;

  @ApiProperty({ description: 'Text the learner should respond to' })
  promptText: string;

  @ApiProperty({ description: 'Total number of prompts in the assessment' })
  totalPrompts: number;
}
