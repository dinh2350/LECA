import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { randomUUID } from 'crypto';

export const DEVICE_COOKIE = 'device-id';
export const GUEST_LIMIT_REDIS_KEY = 'guest:limit:';
export const GUEST_SESSION_MAX = 3;
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

@Injectable()
export class GuestLimitGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();
    const res = context.switchToHttp().getResponse<Response>();

    // Authenticated users bypass the limit
    if (req.user && !req.user.guest) {
      return true;
    }

    // Resolve or create device ID
    let deviceId: string = req.cookies?.[DEVICE_COOKIE];
    if (!deviceId) {
      deviceId = randomUUID();
      res.cookie(DEVICE_COOKIE, deviceId, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: COOKIE_MAX_AGE_SECONDS,
      });
    }

    const key = `${GUEST_LIMIT_REDIS_KEY}${deviceId}`;

    let count: number;
    try {
      count = await this.redis.incr(key);
      if (count === 1) {
        // First visit — set TTL
        await this.redis.expire(key, COOKIE_MAX_AGE_SECONDS);
      }
    } catch {
      throw new ServiceUnavailableException({ code: 'SERVICE_UNAVAILABLE' });
    }

    if (count > GUEST_SESSION_MAX) {
      throw new ForbiddenException({
        code: 'GUEST_LIMIT_REACHED',
        message:
          'Guest session limit reached. Please create an account to continue.',
      });
    }

    return true;
  }
}
