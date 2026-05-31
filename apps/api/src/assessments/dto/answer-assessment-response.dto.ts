import { ApiProperty } from '@nestjs/swagger';

export class AnswerAssessmentResponseDto {
  @ApiProperty({ description: 'Whether all prompts are done' })
  isComplete: boolean;

  @ApiProperty({
    description: 'AI follow-up text for the current turn',
    required: false,
  })
  aiFollowUp?: string;

  @ApiProperty({
    description: 'Index of the NEXT prompt (null when complete)',
    required: false,
  })
  nextPromptIndex?: number;

  @ApiProperty({
    description: 'Text of the NEXT prompt (null when complete)',
    required: false,
  })
  nextPromptText?: string;
}
