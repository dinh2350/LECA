import { ApiProperty } from '@nestjs/swagger';

export class GuestConversationResponseDto {
  @ApiProperty({ description: 'Short-lived guest JWT (24h)' })
  token: string;

  @ApiProperty({ description: 'Unix timestamp (ms) when the token expires' })
  expiresAt: number;
}
