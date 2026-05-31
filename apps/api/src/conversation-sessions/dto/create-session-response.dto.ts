import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionResponseDto {
  @ApiProperty({ description: 'UUID of the created conversation session' })
  sessionId: string;

  @ApiProperty({ description: 'LiveKit JWT for the learner participant' })
  livekitToken: string;

  @ApiProperty({ description: 'LiveKit server URL (ws:// or wss://)' })
  livekitUrl: string;
}
