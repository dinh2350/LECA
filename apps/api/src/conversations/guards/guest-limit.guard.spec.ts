import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import {
  GuestLimitGuard,
  GUEST_LIMIT_REDIS_KEY,
  DEVICE_COOKIE,
} from './guest-limit.guard';
import Redis from 'ioredis';

function makeContext(
  overrides: {
    cookies?: Record<string, string>;
    user?: { id: number } | null;
    setHeader?: jest.Mock;
  } = {},
): ExecutionContext {
  const req: any = {
    cookies: overrides.cookies ?? {},
    user: overrides.user ?? undefined,
    res: {
      setHeader: overrides.setHeader ?? jest.fn(),
      cookie: jest.fn(),
    },
  };
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => req.res }),
  } as unknown as ExecutionContext;
}

describe('GuestLimitGuard', () => {
  let guard: GuestLimitGuard;
  let redis: jest.Mocked<Redis>;

  beforeEach(() => {
    redis = {
      incr: jest.fn(),
      expire: jest.fn(),
    } as unknown as jest.Mocked<Redis>;
    guard = new GuestLimitGuard(redis);
  });

  it('should pass on first call (count = 1) and set device cookie', async () => {
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);
    const ctx = makeContext();
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(redis.expire).toHaveBeenCalled();
  });

  it('should pass on third call (count = 3)', async () => {
    redis.incr.mockResolvedValue(3);
    redis.expire.mockResolvedValue(1);
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
  });

  it('should throw ForbiddenException on fourth call (count = 4)', async () => {
    redis.incr.mockResolvedValue(4);
    await expect(guard.canActivate(makeContext())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should short-circuit for authenticated (non-guest) users without touching Redis', async () => {
    const ctx = makeContext({ user: { id: 42 } as any });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('should generate UUID and set Set-Cookie when no device-id cookie present', async () => {
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);
    const setCookie = jest.fn();
    const ctx = makeContext({ setHeader: setCookie });
    await guard.canActivate(ctx);
    const req = ctx.switchToHttp().getRequest();
    expect(req.res.cookie).toHaveBeenCalledWith(
      DEVICE_COOKIE,
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('should use existing device-id cookie when present', async () => {
    redis.incr.mockResolvedValue(2);
    redis.expire.mockResolvedValue(1);
    const deviceId = 'existing-uuid-1234';
    const ctx = makeContext({ cookies: { [DEVICE_COOKIE]: deviceId } });
    await guard.canActivate(ctx);
    expect(redis.incr).toHaveBeenCalledWith(
      `${GUEST_LIMIT_REDIS_KEY}${deviceId}`,
    );
  });
});
