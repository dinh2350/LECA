import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { GuestConversationResponseDto } from './dto/guest-conversation-response.dto';

const GUEST_JWT_EXPIRES_IN = '24h';
const GUEST_JWT_EXPIRES_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async createGuestSession(
    deviceId: string,
  ): Promise<GuestConversationResponseDto> {
    const expiresAt = Date.now() + GUEST_JWT_EXPIRES_MS;

    const token = await this.jwtService.signAsync(
      { sub: null, guest: true, deviceId },
      {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
        expiresIn: GUEST_JWT_EXPIRES_IN,
      },
    );

    return { token, expiresAt };
  }
}
