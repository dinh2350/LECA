import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConversationsService } from './conversations.service';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed-token') },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    service = module.get(ConversationsService);
    jwtService = module.get(JwtService);
  });

  it('should return a token and expiresAt within 24h + 1s', async () => {
    const before = Date.now();
    const result = await service.createGuestSession('device-abc');
    const after = Date.now();

    expect(result.token).toBe('signed-token');
    expect(result.expiresAt).toBeGreaterThanOrEqual(before + 24 * 3600 * 1000);
    expect(result.expiresAt).toBeLessThanOrEqual(
      after + 24 * 3600 * 1000 + 1000,
    );
  });

  it('should sign JWT with guest: true and deviceId in payload', async () => {
    await service.createGuestSession('device-xyz');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: null, guest: true, deviceId: 'device-xyz' },
      expect.objectContaining({ expiresIn: '24h' }),
    );
  });
});
