# LiveKit Session + Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `POST /api/v1/conversation-sessions` to create a LiveKit room + DB row, and bootstrap a `leca-agent` service that joins the room and subscribes to audio tracks.

**Architecture:** The API (`leca-api`) uses `livekit-server-sdk` to create a LiveKit room and issue tokens. After creating the room, the API makes a fire-and-forget HTTP call to `leca-agent`. The agent uses `@livekit/rtc-node` to join the room as a participant and subscribes to audio tracks — logging each received chunk as a stub for the future AI pipeline.

**Tech Stack:** NestJS, `livekit-server-sdk`, `@livekit/rtc-node`, Prisma (PostgreSQL), Express (agent), Docker Compose.

**GitHub Issue:** [#6](https://github.com/dinh2350/LECA/issues/6)

---

## File Map

### API (`apps/api`) — modified/created
| Action | Path | Responsibility |
|--------|------|---------------|
| create | `src/livekit/livekit-config.type.ts` | TS type for LiveKit config |
| create | `src/livekit/livekit.config.ts` | `registerAs('livekit', ...)` config factory |
| create | `src/livekit/livekit.module.ts` | Global module providing `RoomServiceClient` token |
| create | `src/conversation-sessions/dto/create-session-response.dto.ts` | Response shape for POST |
| create | `src/conversation-sessions/conversation-sessions.service.ts` | DB + LiveKit + agent notify logic |
| create | `src/conversation-sessions/conversation-sessions.service.spec.ts` | Unit tests |
| create | `src/conversation-sessions/conversation-sessions.controller.ts` | POST + DELETE endpoints |
| create | `src/conversation-sessions/conversation-sessions.module.ts` | NestJS module |
| modify | `src/config/config.type.ts` | Add `livekit: LiveKitConfig` |
| modify | `src/app.module.ts` | Import LiveKitModule + ConversationSessionsModule |
| modify | `env-example-relational` | Add LIVEKIT_* + AGENT_URL vars |

### Agent (`apps/agent`) — all created
| Action | Path | Responsibility |
|--------|------|---------------|
| create | `package.json` | Dependencies + scripts |
| create | `tsconfig.json` | TS config |
| create | `src/main.ts` | Express server entrypoint |
| create | `src/agent.ts` | Room join + audio subscription |
| create | `.env.example` | Agent env vars template |
| create | `Dockerfile` | Multi-stage build |

### Infrastructure
| Action | Path | Responsibility |
|--------|------|---------------|
| modify | `docker-compose.yaml` | Add `agent` service; add LiveKit env to `api` |

---

## Task 1: Add LiveKit Config to API

**Files:**
- Create: `apps/api/src/livekit/livekit-config.type.ts`
- Create: `apps/api/src/livekit/livekit.config.ts`
- Create: `apps/api/src/livekit/livekit.module.ts`
- Modify: `apps/api/src/config/config.type.ts`
- Modify: `apps/api/env-example-relational`

- [ ] **Step 1.1: Install livekit-server-sdk in API**

```bash
cd apps/api && pnpm add livekit-server-sdk
```

Expected: `livekit-server-sdk` appears in `apps/api/package.json` dependencies.

- [ ] **Step 1.2: Create LiveKit config type**

Create `apps/api/src/livekit/livekit-config.type.ts`:

```typescript
export type LiveKitConfig = {
  apiKey: string;
  apiSecret: string;
  url: string;       // e.g. ws://livekit:7880
  agentUrl: string;  // e.g. http://agent:3001
};
```

- [ ] **Step 1.3: Create LiveKit config factory**

Create `apps/api/src/livekit/livekit.config.ts`:

```typescript
import { registerAs } from '@nestjs/config';
import { IsString, IsUrl, validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';

class LiveKitEnvironmentVariables {
  @IsString()
  LIVEKIT_API_KEY: string;

  @IsString()
  LIVEKIT_API_SECRET: string;

  @IsUrl({ protocols: ['ws', 'wss', 'http', 'https'], require_tld: false })
  LIVEKIT_URL: string;

  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  AGENT_URL: string;
}

export default registerAs('livekit', () => {
  const values = plainToClass(LiveKitEnvironmentVariables, process.env, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(values, { skipMissingProperties: false });
  if (errors.length) {
    throw new Error(`LiveKit config validation failed: ${errors.toString()}`);
  }

  return {
    apiKey: process.env.LIVEKIT_API_KEY as string,
    apiSecret: process.env.LIVEKIT_API_SECRET as string,
    url: process.env.LIVEKIT_URL as string,
    agentUrl: process.env.AGENT_URL as string,
  };
});
```

- [ ] **Step 1.4: Create LiveKit module**

The module provides `RoomServiceClient` as an injectable token so services don't import the SDK directly.

Create `apps/api/src/livekit/livekit.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoomServiceClient } from 'livekit-server-sdk';
import { AllConfigType } from '../config/config.type';

export const LIVEKIT_ROOM_SERVICE = 'LIVEKIT_ROOM_SERVICE';

@Global()
@Module({
  providers: [
    {
      provide: LIVEKIT_ROOM_SERVICE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => {
        return new RoomServiceClient(
          config.getOrThrow('livekit.url', { infer: true }),
          config.getOrThrow('livekit.apiKey', { infer: true }),
          config.getOrThrow('livekit.apiSecret', { infer: true }),
        );
      },
    },
  ],
  exports: [LIVEKIT_ROOM_SERVICE],
})
export class LiveKitModule {}
```

- [ ] **Step 1.5: Add LiveKit to AllConfigType**

Modify `apps/api/src/config/config.type.ts` — add the import and field:

```typescript
import { AppConfig } from './app-config.type';
import { AppleConfig } from '../auth-apple/config/apple-config.type';
import { AuthConfig } from '../auth/config/auth-config.type';
import { DatabaseConfig } from '../database/config/database-config.type';
import { FacebookConfig } from '../auth-facebook/config/facebook-config.type';
import { FileConfig } from '../files/config/file-config.type';
import { GoogleConfig } from '../auth-google/config/google-config.type';
import { MailConfig } from '../mail/config/mail-config.type';
import { RedisConfig } from '../redis/redis-config.type';
import { LiveKitConfig } from '../livekit/livekit-config.type';

export type AllConfigType = {
  app: AppConfig;
  apple: AppleConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
  facebook: FacebookConfig;
  file: FileConfig;
  google: GoogleConfig;
  mail: MailConfig;
  redis: RedisConfig;
  livekit: LiveKitConfig;
};
```

- [ ] **Step 1.6: Add LiveKit vars to env-example-relational**

Append to `apps/api/env-example-relational`:

```
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=ws://livekit:7880
AGENT_URL=http://agent:3001
```

- [ ] **Step 1.7: Commit**

```bash
git add apps/api/src/livekit/ apps/api/src/config/config.type.ts apps/api/env-example-relational apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add LiveKit config module"
```

---

## Task 2: Create ConversationSessions Module in API

**Files:**
- Create: `apps/api/src/conversation-sessions/dto/create-session-response.dto.ts`
- Create: `apps/api/src/conversation-sessions/conversation-sessions.service.ts`
- Create: `apps/api/src/conversation-sessions/conversation-sessions.service.spec.ts`
- Create: `apps/api/src/conversation-sessions/conversation-sessions.controller.ts`
- Create: `apps/api/src/conversation-sessions/conversation-sessions.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 2.1: Write the failing unit tests first**

Create `apps/api/src/conversation-sessions/conversation-sessions.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { ConversationSessionsService } from './conversation-sessions.service';
import { LIVEKIT_ROOM_SERVICE } from '../livekit/livekit.module';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';

const mockRoomServiceClient = {
  createRoom: jest.fn(),
  deleteRoom: jest.fn(),
};

const mockPrisma = {
  lecaUser: { findUnique: jest.fn(), create: jest.fn() },
  conversationSession: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
};

const mockUsersService = {
  findById: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    const map: Record<string, string> = {
      'livekit.apiKey': 'devkey',
      'livekit.apiSecret': 'devsecret',
      'livekit.url': 'ws://livekit:7880',
      'livekit.agentUrl': 'http://agent:3001',
    };
    return map[key] ?? '';
  }),
};

// Stub global fetch
global.fetch = jest.fn().mockResolvedValue({ ok: true });

describe('ConversationSessionsService', () => {
  let service: ConversationSessionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationSessionsService,
        { provide: LIVEKIT_ROOM_SERVICE, useValue: mockRoomServiceClient },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(ConversationSessionsService);
  });

  describe('create()', () => {
    it('throws NotFoundException when boilerplate user does not exist', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.create(42)).rejects.toThrow(NotFoundException);
    });

    it('returns sessionId, livekitToken, livekitUrl on success', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 42, email: 'a@b.com', firstName: 'A', lastName: 'B' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-1' });
      mockRoomServiceClient.createRoom.mockResolvedValue({ name: 'room-uuid-1', sid: 'sid-1' });
      mockPrisma.conversationSession.create.mockResolvedValue({
        id: 'session-uuid-1',
        livekitRoomId: 'room-uuid-1',
        status: 'active',
      });

      const result = await service.create(42);

      expect(result.sessionId).toBe('session-uuid-1');
      expect(typeof result.livekitToken).toBe('string');
      expect(result.livekitToken.length).toBeGreaterThan(0);
      expect(result.livekitUrl).toBe('ws://livekit:7880');
    });

    it('creates a LecaUser bridge record if one does not exist', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 42, email: 'new@user.com', firstName: 'N', lastName: 'U' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue(null); // no existing LecaUser
      mockPrisma.lecaUser.create.mockResolvedValue({ id: 'new-leca-uuid' });
      mockRoomServiceClient.createRoom.mockResolvedValue({ name: 'room-2', sid: 'sid-2' });
      mockPrisma.conversationSession.create.mockResolvedValue({
        id: 'session-2',
        livekitRoomId: 'room-2',
        status: 'active',
      });

      await service.create(42);

      expect(mockPrisma.lecaUser.create).toHaveBeenCalledWith({
        data: {
          email: 'new@user.com',
          displayName: 'N U',
        },
      });
    });
  });

  describe('end()', () => {
    it('throws NotFoundException when session does not exist', async () => {
      mockPrisma.conversationSession.findUnique.mockResolvedValue(null);

      await expect(service.end('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('marks session ended and calls deleteRoom', async () => {
      mockPrisma.conversationSession.findUnique.mockResolvedValue({
        id: 'session-1',
        livekitRoomId: 'room-1',
        status: 'active',
        startedAt: new Date(),
      });
      mockPrisma.conversationSession.update.mockResolvedValue({ id: 'session-1', status: 'ended' });
      mockRoomServiceClient.deleteRoom.mockResolvedValue(undefined);

      await service.end('session-1');

      expect(mockRoomServiceClient.deleteRoom).toHaveBeenCalledWith('room-1');
      expect(mockPrisma.conversationSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-1' },
          data: expect.objectContaining({ status: 'ended' }),
        }),
      );
    });
  });
});
```

- [ ] **Step 2.2: Run tests to confirm they fail**

```bash
cd apps/api && pnpm test -- --testPathPattern=conversation-sessions.service.spec --passWithNoTests
```

Expected: Tests fail with "Cannot find module './conversation-sessions.service'" or similar.

- [ ] **Step 2.3: Create the response DTO**

Create `apps/api/src/conversation-sessions/dto/create-session-response.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionResponseDto {
  @ApiProperty({ description: 'UUID of the created conversation session' })
  sessionId: string;

  @ApiProperty({ description: 'LiveKit JWT for the learner participant' })
  livekitToken: string;

  @ApiProperty({ description: 'LiveKit server URL (ws:// or wss://)' })
  livekitUrl: string;
}
```

- [ ] **Step 2.4: Implement ConversationSessionsService**

Create `apps/api/src/conversation-sessions/conversation-sessions.service.ts`:

```typescript
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AllConfigType } from '../config/config.type';
import { LIVEKIT_ROOM_SERVICE } from '../livekit/livekit.module';
import { CreateSessionResponseDto } from './dto/create-session-response.dto';

const LEARNER_TOKEN_TTL_SECONDS = 3600; // 1 hour

@Injectable()
export class ConversationSessionsService {
  private readonly logger = new Logger(ConversationSessionsService.name);

  constructor(
    @Inject(LIVEKIT_ROOM_SERVICE)
    private readonly roomService: RoomServiceClient,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService<AllConfigType>,
  ) {}

  async create(boilerplateUserId: number): Promise<CreateSessionResponseDto> {
    const lecaUserId = await this.resolveLecaUser(boilerplateUserId);

    const roomName = randomUUID();
    await this.roomService.createRoom({ name: roomName, emptyTimeout: 300 });

    const session = await this.prisma.conversationSession.create({
      data: {
        userId: lecaUserId,
        livekitRoomId: roomName,
        mode: 'free_talk',
        status: 'active',
      },
    });

    const learnerToken = await this.buildLearnerToken(
      roomName,
      lecaUserId,
    );

    // Fire-and-forget: notify agent to join the room
    this.notifyAgent(roomName, session.id).catch((err: unknown) => {
      this.logger.warn(
        `Agent notification failed for session ${session.id}: ${String(err)}`,
      );
    });

    return {
      sessionId: session.id,
      livekitToken: learnerToken,
      livekitUrl: this.config.getOrThrow('livekit.url', { infer: true }),
    };
  }

  async end(sessionId: string): Promise<void> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const durationSeconds = session.livekitRoomId
      ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
      : null;

    await this.prisma.conversationSession.update({
      where: { id: sessionId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        ...(durationSeconds !== null ? { durationSeconds } : {}),
      },
    });

    if (session.livekitRoomId) {
      try {
        await this.roomService.deleteRoom(session.livekitRoomId);
      } catch (err: unknown) {
        this.logger.warn(
          `Failed to delete LiveKit room ${session.livekitRoomId}: ${String(err)}`,
        );
      }
    }
  }

  // ── private helpers ────────────────────────────────────────────────────────

  /** Resolve boilerplate User ID → LecaUser UUID (auto-create bridge if absent). */
  private async resolveLecaUser(boilerplateUserId: number): Promise<string> {
    const user = await this.usersService.findById(boilerplateUserId);
    if (!user || !user.email) {
      throw new NotFoundException('User not found');
    }

    let lecaUser = await this.prisma.lecaUser.findUnique({
      where: { email: user.email },
    });

    if (!lecaUser) {
      lecaUser = await this.prisma.lecaUser.create({
        data: {
          email: user.email,
          displayName:
            [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            user.email,
        },
      });
    }

    return lecaUser.id;
  }

  private async buildLearnerToken(
    roomName: string,
    identity: string,
  ): Promise<string> {
    const apiKey = this.config.getOrThrow('livekit.apiKey', { infer: true });
    const apiSecret = this.config.getOrThrow('livekit.apiSecret', {
      infer: true,
    });

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: LEARNER_TOKEN_TTL_SECONDS,
    });
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canSubscribe: true,
      canPublish: true,
    });
    return token.toJwt();
  }

  private async notifyAgent(
    roomName: string,
    sessionId: string,
  ): Promise<void> {
    const apiKey = this.config.getOrThrow('livekit.apiKey', { infer: true });
    const apiSecret = this.config.getOrThrow('livekit.apiSecret', {
      infer: true,
    });
    const livekitUrl = this.config.getOrThrow('livekit.url', { infer: true });
    const agentUrl = this.config.getOrThrow('livekit.agentUrl', {
      infer: true,
    });

    const agentToken = new AccessToken(apiKey, apiSecret, {
      identity: `leca-agent-${sessionId}`,
      ttl: LEARNER_TOKEN_TTL_SECONDS,
    });
    agentToken.addGrant({
      roomJoin: true,
      room: roomName,
      canSubscribe: true,
      canPublish: true,
      hidden: true,
    });
    const agentJwt = await agentToken.toJwt();

    const res = await fetch(`${agentUrl}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        roomName,
        livekitUrl,
        token: agentJwt,
      }),
    });

    if (!res.ok) {
      throw new Error(`Agent responded ${res.status}`);
    }
  }
}
```

- [ ] **Step 2.5: Run tests again — all should pass**

```bash
cd apps/api && pnpm test -- --testPathPattern=conversation-sessions.service.spec
```

Expected: All tests pass. If `fetch` is not available in the test environment (Node < 18), add `global.fetch = jest.fn().mockResolvedValue({ ok: true })` to the test file (already included in Step 2.1).

- [ ] **Step 2.6: Create the controller**

Create `apps/api/src/conversation-sessions/conversation-sessions.controller.ts`:

```typescript
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { ConversationSessionsService } from './conversation-sessions.service';
import { CreateSessionResponseDto } from './dto/create-session-response.dto';

@ApiTags('Conversation Sessions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'conversation-sessions', version: '1' })
export class ConversationSessionsController {
  constructor(private readonly service: ConversationSessionsService) {}

  /** Create a LiveKit room and start a conversation session. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CreateSessionResponseDto })
  create(
    @Req() req: Request & { user: JwtPayloadType },
  ): Promise<CreateSessionResponseDto> {
    return this.service.create(Number(req.user.id));
  }

  /** End a conversation session and close the LiveKit room. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Session ended' })
  @ApiNotFoundResponse({ description: 'Session not found' })
  async end(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.service.end(id);
  }
}
```

- [ ] **Step 2.7: Create the module**

Create `apps/api/src/conversation-sessions/conversation-sessions.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConversationSessionsController } from './conversation-sessions.controller';
import { ConversationSessionsService } from './conversation-sessions.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ConversationSessionsController],
  providers: [ConversationSessionsService],
})
export class ConversationSessionsModule {}
```

- [ ] **Step 2.8: Register modules in AppModule**

Modify `apps/api/src/app.module.ts` — add these two imports in the `imports` array and at the top:

At the top (with other imports), add:
```typescript
import livekitConfig from './livekit/livekit.config';
import { LiveKitModule } from './livekit/livekit.module';
import { ConversationSessionsModule } from './conversation-sessions/conversation-sessions.module';
```

In `ConfigModule.forRoot({ load: [...] })`, add `livekitConfig` to the `load` array.

In the module `imports: [...]` array, add `LiveKitModule` and `ConversationSessionsModule`.

The relevant diff for app.module.ts is:
```diff
 import { ConversationsModule } from './conversations/conversations.module';
 import { AssessmentsModule } from './assessments/assessments.module';
 import { ScenariosModule } from './scenarios/scenarios.module';
+import livekitConfig from './livekit/livekit.config';
+import { LiveKitModule } from './livekit/livekit.module';
+import { ConversationSessionsModule } from './conversation-sessions/conversation-sessions.module';
```

```diff
       load: [
         databaseConfig,
         authConfig,
         appConfig,
         mailConfig,
         fileConfig,
         facebookConfig,
         googleConfig,
         appleConfig,
         redisConfig,
+        livekitConfig,
       ],
```

```diff
     ConversationsModule,
     AssessmentsModule,
     ScenariosModule,
+    LiveKitModule,
+    ConversationSessionsModule,
```

- [ ] **Step 2.9: Verify TypeScript compiles**

```bash
cd apps/api && pnpm run build 2>&1 | head -30
```

Expected: Build succeeds (exit 0). Fix any type errors before continuing.

- [ ] **Step 2.10: Commit**

```bash
git add apps/api/src/conversation-sessions/ apps/api/src/livekit/ apps/api/src/app.module.ts apps/api/src/config/config.type.ts
git commit -m "feat(api): POST /v1/conversation-sessions creates LiveKit room + DB row"
```

---

## Task 3: Create apps/agent Scaffold

**Files:**
- Create: `apps/agent/package.json`
- Create: `apps/agent/tsconfig.json`
- Create: `apps/agent/.env.example`

- [ ] **Step 3.1: Create package.json for agent**

Create `apps/agent/package.json`:

```json
{
  "name": "@n2base/agent",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "ts-node -r tsconfig-paths/register src/main.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/main.js",
    "lint": "eslint \"src/**/*.ts\""
  },
  "dependencies": {
    "@livekit/rtc-node": "^0.13.0",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "@n2base/tsconfig": "workspace:*",
    "@types/express": "^4.17.21",
    "@types/node": "^22.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.8.3"
  }
}
```

- [ ] **Step 3.2: Create tsconfig.json for agent**

Create `apps/agent/tsconfig.json`:

```json
{
  "extends": "@n2base/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "CommonJS",
    "target": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3.3: Create .env.example for agent**

Create `apps/agent/.env.example`:

```
NODE_ENV=development
PORT=3001
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
LIVEKIT_URL=ws://livekit:7880
```

- [ ] **Step 3.4: Install dependencies**

```bash
cd apps/agent && pnpm install
```

Expected: `node_modules/` created with `@livekit/rtc-node` and `express`.

- [ ] **Step 3.5: Commit scaffold**

```bash
git add apps/agent/package.json apps/agent/tsconfig.json apps/agent/.env.example pnpm-lock.yaml
git commit -m "chore(agent): scaffold apps/agent package"
```

---

## Task 4: Implement Agent Room Joining

**Files:**
- Create: `apps/agent/src/agent.ts`
- Create: `apps/agent/src/main.ts`

- [ ] **Step 4.1: Create agent.ts — room join + audio subscription**

Create `apps/agent/src/agent.ts`:

```typescript
import { Room, RoomEvent, TrackKind, AudioStream } from '@livekit/rtc-node';

export interface JoinOptions {
  sessionId: string;
  roomName: string;
  livekitUrl: string;
  token: string;
}

/**
 * Join a LiveKit room as the AI agent participant.
 * Subscribes to audio tracks and logs received chunks.
 * Returns after the room is connected — audio streaming runs in the background.
 */
export async function joinRoom(opts: JoinOptions): Promise<void> {
  const { sessionId, roomName, livekitUrl, token } = opts;
  const log = (msg: string) =>
    console.log(`[agent][${sessionId}][${roomName}] ${msg}`);

  const room = new Room();

  room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
    if (track.kind !== TrackKind.KIND_AUDIO) return;

    log(`Subscribed to audio track from ${participant.identity}`);

    void (async () => {
      const stream = new AudioStream(track);
      for await (const frame of stream) {
        log(
          `Audio chunk: ${frame.data.length} samples ` +
            `(${frame.sampleRate}Hz, ${frame.channels}ch) ` +
            `from ${participant.identity}`,
        );
      }
      log(`Audio stream closed for ${participant.identity}`);
    })();
  });

  room.on(RoomEvent.Disconnected, (reason) => {
    log(`Disconnected: ${String(reason)}`);
  });

  await room.connect(livekitUrl, token, { autoSubscribe: true });
  log('Connected to room');
}
```

- [ ] **Step 4.2: Create main.ts — Express HTTP server**

Create `apps/agent/src/main.ts`:

```typescript
import 'dotenv/config';
import express, { Request, Response } from 'express';
import { joinRoom, JoinOptions } from './agent';

const PORT = Number(process.env.PORT ?? 3001);
const app = express();
app.use(express.json());

/**
 * Called by leca-api when a new conversation session is created.
 * Kicks off room joining asynchronously (returns 202 immediately).
 */
app.post('/join', (req: Request, res: Response) => {
  const body = req.body as Partial<JoinOptions>;
  const { sessionId, roomName, livekitUrl, token } = body;

  if (!sessionId || !roomName || !livekitUrl || !token) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  console.log(`[agent] Joining room ${roomName} for session ${sessionId}`);

  // Fire-and-forget — we return 202 before the room is actually joined
  joinRoom({ sessionId, roomName, livekitUrl, token }).catch((err: unknown) => {
    console.error(`[agent] Failed to join room ${roomName}: ${String(err)}`);
  });

  res.status(202).json({ status: 'joining' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[agent] Listening on :${PORT}`);
});
```

- [ ] **Step 4.3: Verify TypeScript compiles**

```bash
cd apps/agent && pnpm run build 2>&1 | head -30
```

Expected: `dist/` directory created, exit 0. Fix any type errors before continuing.

- [ ] **Step 4.4: Commit**

```bash
git add apps/agent/src/
git commit -m "feat(agent): join LiveKit room and subscribe to audio track"
```

---

## Task 5: Dockerfile for Agent

**Files:**
- Create: `apps/agent/Dockerfile`

- [ ] **Step 5.1: Create Dockerfile**

Create `apps/agent/Dockerfile`:

```dockerfile
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/tsconfig/base.json packages/tsconfig/
COPY apps/agent/package.json apps/agent/
RUN pnpm install --frozen-lockfile --filter @n2base/agent...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/agent/tsconfig.json apps/agent/
COPY apps/agent/src/ apps/agent/src/
RUN pnpm --filter @n2base/agent run build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:22-slim AS runtime
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/tsconfig/base.json packages/tsconfig/
COPY apps/agent/package.json apps/agent/

# Install prod deps only
RUN pnpm install --frozen-lockfile --prod --filter @n2base/agent...

COPY --from=builder /app/apps/agent/dist/ apps/agent/dist/

WORKDIR /app/apps/agent
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

- [ ] **Step 5.2: Commit Dockerfile**

```bash
git add apps/agent/Dockerfile
git commit -m "chore(agent): add Dockerfile"
```

---

## Task 6: Docker Compose Updates

**Files:**
- Modify: `docker-compose.yaml`

- [ ] **Step 6.1: Add LiveKit env vars to the api service and add agent service**

Edit `docker-compose.yaml`. Add `environment` section to the `api` service and append the `agent` service. Also add `livekit` as a dependency of `agent`.

The `api` service block (after the `build` and `ports` keys) should become:

```yaml
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - ${APP_PORT}:${APP_PORT}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      livekit:
        condition: service_started
    environment:
      LIVEKIT_API_KEY: ${LIVEKIT_API_KEY}
      LIVEKIT_API_SECRET: ${LIVEKIT_API_SECRET}
      LIVEKIT_URL: ${LIVEKIT_URL:-ws://livekit:7880}
      AGENT_URL: ${AGENT_URL:-http://agent:3001}
```

Add the `agent` service block (before the `volumes:` section):

```yaml
  agent:
    build:
      context: .
      dockerfile: apps/agent/Dockerfile
    ports:
      - "3001:3001"
    depends_on:
      livekit:
        condition: service_started
    environment:
      PORT: 3001
      LIVEKIT_API_KEY: ${LIVEKIT_API_KEY}
      LIVEKIT_API_SECRET: ${LIVEKIT_API_SECRET}
      LIVEKIT_URL: ${LIVEKIT_URL:-ws://livekit:7880}
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    restart: unless-stopped
```

- [ ] **Step 6.2: Verify the docker-compose config parses correctly**

```bash
docker compose config --quiet 2>&1 | head -20
```

Expected: No error output (exit 0). If errors appear, fix yaml indentation.

- [ ] **Step 6.3: Commit**

```bash
git add docker-compose.yaml
git commit -m "feat(infra): add leca-agent service to docker-compose"
```

---

## Task 7: End-to-End Smoke Test

This is a manual verification step (no automated e2e tests in this issue).

- [ ] **Step 7.1: Copy env and start infrastructure**

```bash
cp apps/api/env-example-relational apps/api/.env
# Ensure LIVEKIT_API_KEY and LIVEKIT_API_SECRET are set in .env
docker compose up postgres redis livekit -d
```

- [ ] **Step 7.2: Run API migrations and start API**

```bash
cd apps/api
DATABASE_URL="postgresql://root:secret@localhost:5432/api" pnpm prisma migrate deploy
pnpm dev
```

Expected: API starts on port 3000, no LiveKit config validation errors.

- [ ] **Step 7.3: Start agent locally (separate terminal)**

```bash
cd apps/agent
PORT=3001 LIVEKIT_API_KEY=devkey LIVEKIT_API_SECRET=devsecret LIVEKIT_URL=ws://localhost:7880 pnpm dev
```

Expected: `[agent] Listening on :3001`

- [ ] **Step 7.4: Authenticate and call POST /v1/conversation-sessions**

First get a JWT (assumes a user exists in the DB from seed or prior testing):

```bash
JWT=$(curl -s -X POST http://localhost:3000/api/v1/auth/email/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"secret"}' | jq -r '.token')

curl -s -X POST http://localhost:3000/api/v1/conversation-sessions \
  -H "Authorization: Bearer $JWT" | jq .
```

Expected response:
```json
{
  "sessionId": "<uuid>",
  "livekitToken": "<jwt>",
  "livekitUrl": "ws://livekit:7880"
}
```

- [ ] **Step 7.5: Verify agent joined the room**

Agent terminal should show:
```
[agent] Joining room <uuid> for session <uuid>
[agent][<sessionId>][<roomName>] Connected to room
```

- [ ] **Step 7.6: Call DELETE /v1/conversation-sessions/:id**

```bash
SESSION_ID=<uuid from step 7.4>
curl -s -X DELETE "http://localhost:3000/api/v1/conversation-sessions/$SESSION_ID" \
  -H "Authorization: Bearer $JWT" -w "%{http_code}"
```

Expected: `204`

- [ ] **Step 7.7: Final commit + push**

```bash
git add -A
git commit -m "chore: verify issue #6 acceptance criteria"
git push origin HEAD
```

---

## Self-Review Checklist

### Spec Coverage

| Acceptance Criterion | Task covering it |
|---------------------|-----------------|
| `POST /api/conversation-sessions` returns valid `livekitToken` and `livekitUrl` | Task 2 (service + controller) |
| DB `conversation_sessions` row created with `status: active` | Task 2 (`prisma.conversationSession.create`) |
| `leca-agent` joins LiveKit room within 2s | Task 4 (fire-and-forget HTTP + room.connect) |
| Agent subscribes to learner audio track and emits log per chunk | Task 4 (`AudioStream` async iterator) |
| Agent started in `docker-compose.yaml` alongside `leca-api` | Task 6 |

### Known Gaps / Deferred

- No auth check that the session being deleted belongs to the requesting user (deferred — add in a subsequent issue once full auth/session scoping is designed)
- Agent crash recovery (if `@livekit/rtc-node` throws during `room.connect`, the agent logs and returns — room will be empty until next connect; reconnect logic deferred)
- `DELETE` response doesn't verify the caller owns the session (deferred to Issue #8 or similar)
