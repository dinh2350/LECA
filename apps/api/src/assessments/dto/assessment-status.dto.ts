import { ApiProperty } from '@nestjs/swagger';

export class AssessmentStatusDto {
  @ApiProperty({ description: 'Whether the user has a completed assessment' })
  hasCompleted: boolean;

  @ApiProperty({
    description: 'The assessed level if completed',
    enum: ['BEG', 'INT', 'ADV'],
    required: false,
  })
  level?: 'A2' | 'B1' | 'C1';

  @ApiProperty({ description: 'Human-readable label', required: false })
  levelLabel?: string;
}
