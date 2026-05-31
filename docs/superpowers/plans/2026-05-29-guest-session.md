# Guest Session (Issue #3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow unauthenticated users to start up to 3 conversation sessions without registering, tracked by a server-issued HttpOnly device cookie with counts stored in Redis.

**Architecture:** New `ConversationsModule` owns `POST /api/v1/conversations`. A shared `RedisModule` provides an ioredis client. `GuestLimitGuard` enforces the 3-session cap using `INCR` on a per-device Redis key. Frontend `GuestSessionProvider` stores the returned guest JWT in React state and renders `GuestLimitModal` on a 403 response.

**Tech Stack:** NestJS (guards, passport, jwt), ioredis, Jest + `@nestjs/testing` (API), Next.js + React (frontend), Playwright (e2e acceptance check)

**Spec:** `docs/superpowers/specs/2026-05-29-guest-session-design.md`

---

## File Map

### Create (API)
- `apps/api/src/redis/redis.constants.ts` — `REDIS_CLIENT` injection token
- `apps/api/src/redis/redis.module.ts` — global module, provides ioredis via token
- `apps/api/src/conversations/dto/guest-conversation-response.dto.ts` — `{ token, expiresAt }`
- `apps/api/src/conversations/guards/guest-limit.guard.ts` — device cookie + Redis INCR cap
- `apps/api/src/conversations/conversations.service.ts` — signs guest JWT
- `apps/api/src/conversations/conversations.controller.ts` — `POST /v1/conversations`
- `apps/api/src/conversations/conversations.module.ts` — wires module
- `apps/api/src/auth/strategies/optional-jwt.strategy.ts` — passes when no token present
- `apps/api/test/conversations.e2e-spec.ts` — e2e test for guest limit flow
- `apps/api/src/conversations/guards/guest-limit.guard.spec.ts` — unit test

### Modify (API)
- `apps/api/src/app.module.ts` — import `RedisModule`, `ConversationsModule`
- `apps/api/src/auth/auth.module.ts` — register `OptionalJwtStrategy`
- `apps/api/env-example-relational` — add `REDIS_URL`

### Create (Web)
- `apps/web/src/services/guest-session/guest-session-context.ts`
- `apps/web/src/services/guest-session/use-guest-session.ts`
- `apps/web/src/services/guest-session/guest-session-provider.tsx`
- `apps/web/src/components/guest-limit-modal.tsx`

### Modify (Web)
- `apps/web/src/app/[language]/layout.tsx` — wrap with `GuestSessionProvider`
- `apps/web/src/components/landing/hero.tsx` — wire "Start practicing" button to `useGuestSession`

---

## Task 1: RedisModule

**Files:**
- Create: `apps/api/src/redis/redis.constants.ts`
- Create: `apps/api/src/redis/redis.module.ts`

- [ ] **Step 1: Install ioredis**

```bash
cd apps/api && pnpm add ioredis && pnpm add -D @types/ioredis
```

Expected: `ioredis` added to `apps/api/package.json` dependencies.

- [ ] **Step 2: Create injection token constant**

Create `apps/api/src/redis/redis.constants.ts`:

```ts
export const REDIS_CLIENT = 'REDIS_CLIENT';
```

- [ ] **Step 3: Create RedisModule**

Create `apps/api/src/redis/redis.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
        return new Redis(url);
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
```

- [ ] **Step 4: Add REDIS_URL to env example**

In `apps/api/env-example-relational`, add at the end:

```
REDIS_URL=redis://localhost:6379
```

- [ ] **Step 5: Register RedisModule in AppModule**

In `apps/api/src/app.module.ts`, add the import:

```ts
// Add to imports at top of file:
import { RedisModule } from './redis/redis.module';

// Add RedisModule to the imports array in @Module:
// (place before UsersModule)
RedisModule,
```

- [ ] **Step 6: Commit**

```bash
cd /path/to/LECA
git add apps/api/src/redis/ apps/api/src/app.module.ts apps/api/env-example-relational apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add global RedisModule with ioredis"
```

---

## Task 2: OptionalJwtStrategy

**Files:**
- Create: `apps/api/src/auth/strategies/optional-jwt.strategy.ts`
- Modify: `apps/api/src/auth/auth.module.ts`

- [ ] **Step 1: Create OptionalJwtStrategy**

Create `apps/api/src/auth/strategies/optional-jwt.strategy.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { JwtPayloadType } from './types/jwt-payload.type';

@Injectable()
export class OptionalJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-optional',
) {
  constructor(configService: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('auth.secret', { infer: true }),
      ignoreExpiration: false,
    });
  }

  // Returns null instead of throwing when token is absent — passport handles
  // the absent-token case itself when the strategy is invoked as optional.
  public validate(payload: JwtPayloadType): JwtPayloadType | null {
    if (!payload?.id) return null;
    return payload;
  }
}
```

- [ ] **Step 2: Register in AuthModule**

In `apps/api/src/auth/auth.module.ts`:

```ts
// Add import:
import { OptionalJwtStrategy } from './strategies/optional-jwt.strategy';

// Add to providers array:
providers: [AuthService, JwtStrategy, JwtRefreshStrategy, AnonymousStrategy, OptionalJwtStrategy],
```

- [ ] **Step 3: Verify it compiles**

```bash
cd apps/api && pnpm run build 2>&1 | tail -20
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/auth/strategies/optional-jwt.strategy.ts apps/api/src/auth/auth.module.ts
git commit -m "feat(auth): add OptionalJwtStrategy (jwt-optional) that passes on missing token"
```

---

## Task 3: GuestLimitGuard (with tests)

**Files:**
- Create: `apps/api/src/conversations/guards/guest-limit.guard.spec.ts`
- Create: `apps/api/src/conversations/guards/guest-limit.guard.ts`

- [ ] **Step 1: Write the failing unit tests**

Create `apps/api/src/conversations/guards/guest-limit.guard.spec.ts`:

```ts
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GuestLimitGuard, GUEST_LIMIT_REDIS_KEY, DEVICE_COOKIE } from './guest-limit.guard';
import Redis from 'ioredis';

function makeContext(overrides: {
  cookies?: Record<string, string>;
  user?: { id: number } | null;
  setHeader?: jest.Mock;
} = {}): ExecutionContext {
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

  it('passes on first call (count = 1) and sets device cookie', async () => {
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);
    const ctx = makeContext();
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(redis.expire).toHaveBeenCalled();
  });

  it('passes on third call (count = 3)', async () => {
    redis.incr.mockResolvedValue(3);
    redis.expire.mockResolvedValue(1);
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
  });

  it('throws ForbiddenException on fourth call (count = 4)', async () => {
    redis.incr.mockResolvedValue(4);
    await expect(guard.canActivate(makeContext())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('short-circuits for authenticated (non-guest) users without touching Redis', async () => {
    const ctx = makeContext({ user: { id: 42 } as any });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('generates UUID and sets Set-Cookie when no device-id cookie present', async () => {
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

  it('uses existing device-id cookie when present', async () => {
    redis.incr.mockResolvedValue(2);
    redis.expire.mockResolvedValue(1);
    const deviceId = 'existing-uuid-1234';
    const ctx = makeContext({ cookies: { [DEVICE_COOKIE]: deviceId } });
    await guard.canActivate(ctx);
    expect(redis.incr).toHaveBeenCalledWith(`${GUEST_LIMIT_REDIS_KEY}${deviceId}`);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/api && pnpm test -- --testPathPattern="guest-limit.guard.spec" --passWithNoTests 2>&1 | tail -30
```

Expected: FAIL — `Cannot find module './guest-limit.guard'`

- [ ] **Step 3: Implement GuestLimitGuard**

Create `apps/api/src/conversations/guards/guest-limit.guard.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd apps/api && pnpm test -- --testPathPattern="guest-limit.guard.spec" 2>&1 | tail -20
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/conversations/guards/
git commit -m "feat(conversations): add GuestLimitGuard with Redis INCR cap and device cookie"
```

---

## Task 4: ConversationsService (with tests)

**Files:**
- Create: `apps/api/src/conversations/conversations.service.ts`
- Create: `apps/api/src/conversations/dto/guest-conversation-response.dto.ts`

- [ ] **Step 1: Create response DTO**

Create `apps/api/src/conversations/dto/guest-conversation-response.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';

export class GuestConversationResponseDto {
  @ApiProperty({ description: 'Short-lived guest JWT (24h)' })
  token: string;

  @ApiProperty({ description: 'Unix timestamp (ms) when the token expires' })
  expiresAt: number;
}
```

- [ ] **Step 2: Create ConversationsService**

Create `apps/api/src/conversations/conversations.service.ts`:

```ts
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
```

- [ ] **Step 3: Write unit test for ConversationsService**

Create `apps/api/src/conversations/conversations.service.spec.ts`:

```ts
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

  it('returns a token and expiresAt within 24h + 1s', async () => {
    const before = Date.now();
    const result = await service.createGuestSession('device-abc');
    const after = Date.now();

    expect(result.token).toBe('signed-token');
    expect(result.expiresAt).toBeGreaterThanOrEqual(before + 24 * 3600 * 1000);
    expect(result.expiresAt).toBeLessThanOrEqual(
      after + 24 * 3600 * 1000 + 1000,
    );
  });

  it('signs JWT with guest: true and deviceId in payload', async () => {
    await service.createGuestSession('device-xyz');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: null, guest: true, deviceId: 'device-xyz' },
      expect.objectContaining({ expiresIn: '24h' }),
    );
  });
});
```

- [ ] **Step 4: Run tests**

```bash
cd apps/api && pnpm test -- --testPathPattern="conversations.service.spec" 2>&1 | tail -20
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/conversations/
git commit -m "feat(conversations): add ConversationsService.createGuestSession"
```

---

## Task 5: ConversationsController + Module

**Files:**
- Create: `apps/api/src/conversations/conversations.controller.ts`
- Create: `apps/api/src/conversations/conversations.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create ConversationsController**

Create `apps/api/src/conversations/conversations.controller.ts`:

```ts
import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ConversationsService } from './conversations.service';
import { GuestLimitGuard } from './guards/guest-limit.guard';
import { GuestConversationResponseDto } from './dto/guest-conversation-response.dto';
import { DEVICE_COOKIE } from './guards/guest-limit.guard';

@ApiTags('Conversations')
@Controller({
  path: 'conversations',
  version: '1',
})
export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-optional'), GuestLimitGuard)
  @ApiOkResponse({ type: GuestConversationResponseDto })
  async createSession(
    @Req() req: Request & { user?: any; cookies: Record<string, string> },
  ): Promise<GuestConversationResponseDto> {
    const deviceId = req.cookies[DEVICE_COOKIE] ?? 'unknown';
    return this.service.createGuestSession(deviceId);
  }
}
```

- [ ] **Step 2: Create ConversationsModule**

Create `apps/api/src/conversations/conversations.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { GuestLimitGuard } from './guards/guest-limit.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ConversationsController],
  providers: [ConversationsService, GuestLimitGuard],
})
export class ConversationsModule {}
```

- [ ] **Step 3: Register ConversationsModule in AppModule**

In `apps/api/src/app.module.ts`, add:

```ts
// Add to imports at top:
import { ConversationsModule } from './conversations/conversations.module';

// Add to the imports array in @Module (after SessionModule):
ConversationsModule,
```

- [ ] **Step 4: Build to verify no compile errors**

```bash
cd apps/api && pnpm run build 2>&1 | tail -20
```

Expected: successful build, no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/conversations/conversations.controller.ts apps/api/src/conversations/conversations.module.ts apps/api/src/app.module.ts
git commit -m "feat(conversations): wire ConversationsController and ConversationsModule"
```

---

## Task 6: E2E test for guest limit flow

**Files:**
- Create: `apps/api/test/conversations.e2e-spec.ts`

- [ ] **Step 1: Write e2e test**

Create `apps/api/test/conversations.e2e-spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../src/redis/redis.constants';
import * as cookieParser from 'cookie-parser';

describe('Conversations — Guest Session Limit (e2e)', () => {
  let app: INestApplication;
  let redis: Redis;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    app.enableVersioning();
    await app.init();

    redis = app.get(REDIS_CLIENT);
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows 3 guest sessions and blocks the 4th', async () => {
    let deviceCookie: string | undefined;

    for (let i = 1; i <= 3; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/conversations')
        .set('Cookie', deviceCookie ? [deviceCookie] : [])
        .expect(HttpStatus.OK);

      expect(res.body.token).toBeDefined();
      expect(res.body.expiresAt).toBeGreaterThan(Date.now());

      // Capture device cookie from first response
      if (i === 1) {
        deviceCookie = res.headers['set-cookie']
          ?.find((c: string) => c.startsWith('device-id='))
          ?.split(';')[0];
        expect(deviceCookie).toBeDefined();
      }
    }

    // 4th attempt must be blocked
    const blocked = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Cookie', deviceCookie ? [deviceCookie] : [])
      .expect(403);

    expect(blocked.body.code).toBe('GUEST_LIMIT_REACHED');
  });
});

// Import HttpStatus at the top of the file — add this import:
// import { HttpStatus } from '@nestjs/common';
```

> Note: Add `import { HttpStatus } from '@nestjs/common';` at the top of the file alongside the other imports.

- [ ] **Step 2: Install cookie-parser (needed for e2e)**

```bash
cd apps/api && pnpm add cookie-parser && pnpm add -D @types/cookie-parser
```

- [ ] **Step 3: Run e2e test (requires Redis running)**

```bash
cd apps/api && pnpm test:e2e -- --testPathPattern="conversations.e2e" 2>&1 | tail -30
```

Expected: 1 test PASS (requires Docker Redis to be running via `docker compose up redis -d`).

- [ ] **Step 4: Commit**

```bash
git add apps/api/test/conversations.e2e-spec.ts apps/api/package.json pnpm-lock.yaml
git commit -m "test(conversations): e2e test for guest session limit flow"
```

---

## Task 7: Frontend — GuestSessionProvider

**Files:**
- Create: `apps/web/src/services/guest-session/guest-session-context.ts`
- Create: `apps/web/src/services/guest-session/use-guest-session.ts`
- Create: `apps/web/src/services/guest-session/guest-session-provider.tsx`

- [ ] **Step 1: Create context**

Create `apps/web/src/services/guest-session/guest-session-context.ts`:

```ts
'use client';

import { createContext } from 'react';

export type GuestSessionState = {
  token: string | null;
  limitReached: boolean;
  isLoading: boolean;
  startGuestSession: () => Promise<void>;
};

export const GuestSessionContext = createContext<GuestSessionState>({
  token: null,
  limitReached: false,
  isLoading: false,
  startGuestSession: async () => {},
});
```

- [ ] **Step 2: Create hook**

Create `apps/web/src/services/guest-session/use-guest-session.ts`:

```ts
'use client';

import { useContext } from 'react';
import { GuestSessionContext } from './guest-session-context';

export function useGuestSession() {
  return useContext(GuestSessionContext);
}
```

- [ ] **Step 3: Create provider**

Create `apps/web/src/services/guest-session/guest-session-provider.tsx`:

```tsx
'use client';

import {
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { GuestSessionContext } from './guest-session-context';

const CONVERSATIONS_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? '') + '/v1/conversations';

export default function GuestSessionProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startGuestSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(CONVERSATIONS_URL, {
        method: 'POST',
        credentials: 'include', // sends the device-id cookie
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 403) {
        const body = await res.json();
        if (body?.code === 'GUEST_LIMIT_REACHED') {
          setLimitReached(true);
          return;
        }
      }

      if (!res.ok) throw new Error('Failed to start guest session');

      const data = await res.json();
      setToken(data.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ token, limitReached, isLoading, startGuestSession }),
    [token, limitReached, isLoading, startGuestSession],
  );

  return (
    <GuestSessionContext.Provider value={value}>
      {children}
    </GuestSessionContext.Provider>
  );
}
```

- [ ] **Step 4: Wrap layout with GuestSessionProvider**

In `apps/web/src/app/[language]/layout.tsx`, add:

```tsx
// Add import near other provider imports:
import GuestSessionProvider from '@/services/guest-session/guest-session-provider';

// Wrap children inside AuthProvider (place just inside AuthProvider):
<AuthProvider>
  <GuestSessionProvider>
    <GoogleAuthProvider>
      ...
    </GoogleAuthProvider>
  </GuestSessionProvider>
</AuthProvider>
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/services/guest-session/ apps/web/src/app/
git commit -m "feat(web): add GuestSessionProvider and useGuestSession hook"
```

---

## Task 8: Frontend — GuestLimitModal + Hero wiring

**Files:**
- Create: `apps/web/src/components/guest-limit-modal.tsx`
- Modify: `apps/web/src/components/landing/hero.tsx`

- [ ] **Step 1: Create GuestLimitModal**

Create `apps/web/src/components/guest-limit-modal.tsx`:

```tsx
'use client';

import Link from '@/components/link';
import useLanguage from '@/services/i18n/use-language';

type Props = {
  open: boolean;
};

export default function GuestLimitModal({ open }: Props) {
  const language = useLanguage();

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-limit-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: 'var(--s0)',
          border: '1px solid var(--border-m)',
          borderRadius: 'var(--r-xl)',
          padding: '40px',
          maxWidth: '420px',
          width: '90%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ fontSize: '40px' }}>🎙️</div>
        <h2
          id="guest-limit-title"
          style={{
            fontFamily: 'var(--fd)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--cream)',
          }}
        >
          You&apos;ve used your 3 free sessions
        </h2>
        <p
          style={{
            fontFamily: 'var(--fb)',
            fontSize: '15px',
            color: 'var(--cream-m)',
            lineHeight: 1.6,
          }}
        >
          Create a free account to continue practicing — unlimited sessions,
          progress tracking, and pronunciation history.
        </p>
        <Link
          href={`/${language}/sign-up`}
          style={{
            display: 'block',
            background: 'var(--amber)',
            color: '#000',
            fontFamily: 'var(--fd)',
            fontWeight: 700,
            fontSize: '15px',
            padding: '14px 28px',
            borderRadius: '999px',
            textDecoration: 'none',
          }}
        >
          Create free account
        </Link>
        <Link
          href={`/${language}/sign-in`}
          style={{
            fontFamily: 'var(--fb)',
            fontSize: '13px',
            color: 'var(--cream-m)',
            textDecoration: 'underline',
          }}
        >
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire hero button to useGuestSession**

In `apps/web/src/components/landing/hero.tsx`, replace the static `<Link href="/sign-up">` button with a button that calls `startGuestSession`:

```tsx
// Add imports at the top (after 'use client'):
import { useGuestSession } from '@/services/guest-session/use-guest-session';
import GuestLimitModal from '@/components/guest-limit-modal';
import useAuth from '@/services/auth/use-auth';
import useLanguage from '@/services/i18n/use-language';

// Inside the component, before the return:
export default function HeroSection() {
  const { user } = useAuth();
  const { startGuestSession, limitReached, isLoading } = useGuestSession();
  const language = useLanguage();

  // ... existing JSX ...
```

Replace the existing button block:

```tsx
// REMOVE this:
<div className="hero-actions">
  <Link href="/sign-up" className="btn-primary">
    🎙 Start practicing free
  </Link>
  <a
    href="https://github.com/brocoders/nestjs-boilerplate"
    className="btn-secondary"
    target="_blank"
    rel="noopener noreferrer"
  >
    ★ GitHub
  </a>
</div>

// REPLACE with:
<div className="hero-actions">
  {user ? (
    <Link href={`/${language}/dashboard`} className="btn-primary">
      🎙 Continue practicing
    </Link>
  ) : (
    <button
      className="btn-primary"
      onClick={startGuestSession}
      disabled={isLoading}
    >
      {isLoading ? 'Starting…' : '🎙 Start practicing free'}
    </button>
  )}
  <a
    href="https://github.com/brocoders/nestjs-boilerplate"
    className="btn-secondary"
    target="_blank"
    rel="noopener noreferrer"
  >
    ★ GitHub
  </a>
</div>

{/* Add GuestLimitModal at end of section, before closing </section> */}
<GuestLimitModal open={limitReached} />
```

- [ ] **Step 3: Build frontend to verify no TypeScript errors**

```bash
cd apps/web && pnpm run build 2>&1 | tail -30
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/guest-limit-modal.tsx apps/web/src/components/landing/hero.tsx
git commit -m "feat(web): wire hero Start Practicing button to guest session; add GuestLimitModal"
```

---

## Task 9: Acceptance verification

- [ ] **Step 1: Start all services**

```bash
cd /path/to/LECA && docker compose up postgres redis -d
cd apps/api && pnpm start:dev &
cd apps/web && pnpm dev &
```

- [ ] **Step 2: Run all API unit tests**

```bash
cd apps/api && pnpm test -- --testPathPattern="conversations" 2>&1 | tail -20
```

Expected: all guard + service tests pass.

- [ ] **Step 3: Run e2e test**

```bash
cd apps/api && pnpm test:e2e -- --testPathPattern="conversations.e2e" 2>&1 | tail -20
```

Expected: guest limit flow passes (3 OK, 4th is 403).

- [ ] **Step 4: Manual acceptance check**

Open `http://localhost:3000` in a browser (private window to clear cookies).

1. Click "Start practicing free" → network tab shows `POST /api/v1/conversations` → 200 OK with `token`.
2. Repeat 2 more times → all 200.
3. 4th click → 403, `GuestLimitModal` appears with "Create free account" button.
4. Open browser dev tools → Application → Cookies → `device-id` cookie is `HttpOnly`.
5. Sign in with a test account → "Start practicing free" is replaced by "Continue practicing" → no modal ever shown.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: guest session access with 3-session Redis limit (Issue #3)"
```
