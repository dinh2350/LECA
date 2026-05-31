import { ApiProperty } from '@nestjs/swagger';

export class CompleteAssessmentResponseDto {
  @ApiProperty({
    description: 'Assessed level',
    enum: ['BEG', 'INT', 'ADV'],
  })
  level: 'A2' | 'B1' | 'C1';

  @ApiProperty({ description: 'Human-readable label' })
  levelLabel: string;

  @ApiProperty({ description: 'Aggregate score 0-100' })
  score: number;
}
