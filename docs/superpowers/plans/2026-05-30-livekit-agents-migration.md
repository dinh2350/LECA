# LiveKit Agents Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub HTTP-based agent with a real `@livekit/agents` voice pipeline (VAD → STT → LLM → TTS), switch backend dispatch to `AgentDispatchClient`, and wire up a LiveKit voice session UI in the web frontend.

**Architecture:** The agent process becomes a LiveKit worker (no Express server) registered as `'leca-agent'`. The backend creates a room, then dispatches a job to the worker via `AgentDispatchClient.createDispatch()`. The frontend connects via `<LiveKitRoom>` using the token returned from the existing `POST /v1/conversation-sessions` endpoint.

**Tech Stack:**
- Agent: `@livekit/agents@^1.2.4`, `@livekit/agents-plugin-openai@^1.2.4`, `@livekit/agents-plugin-silero@^1.2.4`, Vite (ESM build)
- Backend: `livekit-server-sdk@^2.15.4` `AgentDispatchClient` (already installed)
- Frontend: `livekit-client@^2.18.7`, `@livekit/components-react@^2.9.20`

**Key constant:** `agentName = 'leca-agent'` — must match in both backend dispatch call and agent `cli.runApp`.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/agent/package.json` | Modify | ESM, Vite build, new deps |
| `apps/agent/vite.config.ts` | Create | ESM Node bundle config |
| `apps/agent/tsconfig.json` | Modify | Switch to ESM modules |
| `apps/agent/src/config.ts` | Create | Env vars typed config |
| `apps/agent/src/agent.ts` | Overwrite | `voice.Agent` subclass |
| `apps/agent/src/main.ts` | Overwrite | `defineAgent` + `cli.runApp` |
| `apps/agent/.env.example` | Modify | Add new env vars |
| `apps/agent/Dockerfile` | Modify | Remove port, new CMD |
| `docker-compose.yaml` | Modify | Agent env + whisper image + remove agentUrl |
| `apps/api/src/livekit/livekit.module.ts` | Modify | Add `AgentDispatchClient` provider |
| `apps/api/src/livekit/livekit-config.type.ts` | Modify | Remove `agentUrl` field |
| `apps/api/src/livekit/livekit.config.ts` | Modify | Remove `agentUrl` |
| `apps/api/src/conversation-sessions/dto/create-session.dto.ts` | Create | Optional `scenarioId` body |
| `apps/api/src/conversation-sessions/conversation-sessions.controller.ts` | Modify | Accept body DTO |
| `apps/api/src/conversation-sessions/conversation-sessions.service.ts` | Modify | Inject dispatch client, replace `notifyAgent()` |
| `apps/web/package.json` | Modify | Add livekit client packages |
| `apps/web/src/services/api/services/conversation-sessions.ts` | Create | API service hooks |
| `apps/web/src/app/[language]/scenarios/[id]/page-content.tsx` | Modify | Add LiveKit voice session UI |

---

## Task 1: Agent — ESM/Vite Build Setup

**Files:**
- Modify: `apps/agent/package.json`
- Create: `apps/agent/vite.config.ts`
- Modify: `apps/agent/tsconfig.json`

- [ ] **Step 1: Update package.json**

Replace `apps/agent/package.json` entirely:

```json
{
  "name": "@n2base/agent",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "pnpm run build && node --env-file=../../.env dist/main.js dev",
    "start": "pnpm run build && node dist/main.js start"
  },
  "dependencies": {
    "@livekit/agents": "^1.2.4",
    "@livekit/agents-plugin-openai": "^1.2.4",
    "@livekit/agents-plugin-silero": "^1.2.4",
    "livekit-server-sdk": "^2.15.4"
  },
  "devDependencies": {
    "@n2base/tsconfig": "workspace:*",
    "@types/node": "^22.0.0",
    "typescript": "^5.8.3",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

Create `apps/agent/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node20',
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: [/^node:/, /^@livekit\//, /^livekit-server-sdk/, /^node_modules/],
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

- [ ] **Step 3: Update tsconfig.json**

Replace `apps/agent/tsconfig.json`:

```json
{
  "extends": "@n2base/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "target": "ES2022"
  },
  "include": ["src/**/*", "vite.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Install dependencies**

```bash
cd /Users/devinnguyen/Documents/project/LECA
pnpm install --filter @n2base/agent
```

Expected: no errors, `node_modules` for agent updated with `@livekit/agents`.

- [ ] **Step 5: Commit**

```bash
git add apps/agent/package.json apps/agent/vite.config.ts apps/agent/tsconfig.json
git commit -m "chore(agent): switch to ESM + vite build, replace @livekit/rtc-node with @livekit/agents"
```

---

## Task 2: Agent — Rewrite src Files

**Files:**
- Create: `apps/agent/src/config.ts`
- Overwrite: `apps/agent/src/agent.ts`
- Overwrite: `apps/agent/src/main.ts`
- Modify: `apps/agent/.env.example`

- [ ] **Step 1: Create src/config.ts**

Create `apps/agent/src/config.ts`:

```typescript
export const config = {
  livekitUrl: process.env.LIVEKIT_URL ?? 'ws://localhost:7880',
  livekitApiKey: process.env.LIVEKIT_API_KEY ?? 'devkey',
  livekitApiSecret: process.env.LIVEKIT_API_SECRET ?? 'devsecret',
  sttBaseUrl: process.env.STT_BASE_URL ?? 'http://localhost:8000/v1',
  ttsBaseUrl: process.env.TTS_BASE_URL ?? 'http://localhost:8880/v1',
  llmBaseUrl: process.env.LLM_BASE_URL ?? 'http://localhost:11434/v1',
  llmModel: process.env.LLM_MODEL ?? 'llama3:8b-instruct-q4_K_M',
  llmApiKey: process.env.LLM_API_KEY ?? 'local',
};
```

- [ ] **Step 2: Overwrite src/agent.ts**

Replace `apps/agent/src/agent.ts` entirely:

```typescript
import { getJobContext, log, voice } from '@livekit/agents';

export interface AgentOptions {
  sessionId: string;
  scenarioId: string | null;
}

export class LecaAgent extends voice.Agent {
  private readonly sessionId: string;
  private readonly scenarioId: string | null;

  constructor({ sessionId, scenarioId }: AgentOptions) {
    const instructions = [
      'You are LECA, a friendly English conversation tutor.',
      'Help the user practice their spoken English naturally.',
      'Gently correct grammar mistakes by incorporating the correct form in your reply.',
      'Keep responses concise — 1–3 sentences maximum.',
      scenarioId ? `The conversation scenario context ID is: ${scenarioId}.` : null,
    ]
      .filter(Boolean)
      .join(' ');

    super({ instructions });
    this.sessionId = sessionId;
    this.scenarioId = scenarioId;
  }

  override async onEnter(): Promise<void> {
    const logger = log();
    const ctx = getJobContext();
    const room = ctx.room;

    this.session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (!ev.isFinal || !ev.transcript.trim()) return;
      logger.info({ sessionId: this.sessionId, transcript: ev.transcript }, 'User said');
    });

    this.session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      if (ev.item.role !== 'assistant' || ev.item.interrupted) return;
      const text = ev.item.textContent;
      if (!text?.trim()) return;
      logger.info({ sessionId: this.sessionId, text }, 'Agent replied');
    });

    logger.info({ sessionId: this.sessionId, scenarioId: this.scenarioId }, 'Session started');
    this.session.say("Hello! I'm LECA, your English practice partner. What would you like to talk about today?");
  }

  override async onExit(): Promise<void> {
    log().info({ sessionId: this.sessionId }, 'Session ended');
  }
}
```

- [ ] **Step 3: Overwrite src/main.ts**

Replace `apps/agent/src/main.ts` entirely:

```typescript
import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  metrics,
  voice,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { fileURLToPath } from 'node:url';
import { LecaAgent, type AgentOptions } from './agent.js';
import { config } from './config.js';

export default defineAgent({
  // prewarm: runs once at process startup — loads Silero VAD model into RAM
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    await ctx.connect();

    const vad = ctx.proc.userData.vad as silero.VAD;

    const metadata = JSON.parse(ctx.job.metadata || '{}') as {
      sessionId?: string;
      scenarioId?: string | null;
    };

    const agentOptions: AgentOptions = {
      sessionId: metadata.sessionId ?? ctx.job.id,
      scenarioId: metadata.scenarioId ?? null,
    };

    const session = new voice.AgentSession({
      vad,
      stt: new openai.STT({
        model: 'whisper-1',
        baseURL: config.sttBaseUrl,
        apiKey: 'local',
      }),
      llm: new openai.LLM({
        model: config.llmModel,
        baseURL: config.llmBaseUrl,
        apiKey: config.llmApiKey,
      }),
      tts: new openai.TTS({
        model: 'kokoro',
        voice: 'af_heart' as Parameters<typeof openai.TTS>[0]['voice'],
        baseURL: config.ttsBaseUrl,
        apiKey: 'local',
      }),
    });

    session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
      metrics.logMetrics(ev.metrics);
    });

    await session.start({
      agent: new LecaAgent(agentOptions),
      room: ctx.room,
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'leca-agent',
  }),
);
```

- [ ] **Step 4: Update .env.example**

Replace `apps/agent/.env.example`:

```env
LIVEKIT_URL=ws://livekit:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret

# STT — faster-whisper-server (OpenAI-compatible)
STT_BASE_URL=http://whisper:8000/v1

# TTS — Kokoro FastAPI
TTS_BASE_URL=http://kokoro:8880/v1

# LLM — Ollama (OpenAI-compatible) or set to https://api.openai.com/v1
LLM_BASE_URL=http://ollama:11434/v1
LLM_MODEL=llama3:8b-instruct-q4_K_M
LLM_API_KEY=local
```

- [ ] **Step 5: Verify build compiles**

```bash
cd /Users/devinnguyen/Documents/project/LECA
pnpm --filter @n2base/agent run build
```

Expected: `dist/main.js` is created with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add apps/agent/src/ apps/agent/.env.example
git commit -m "feat(agent): rewrite as @livekit/agents voice worker (VAD+STT+LLM+TTS)"
```

---

## Task 3: Agent — Dockerfile & docker-compose Updates

**Files:**
- Modify: `apps/agent/Dockerfile`
- Modify: `docker-compose.yaml`

- [ ] **Step 1: Update Dockerfile**

Replace `apps/agent/Dockerfile` entirely:

```dockerfile
# Build context: repo root (.)
FROM node:22-slim AS base
RUN npm i -g pnpm@latest
WORKDIR /repo

# ── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig ./packages/tsconfig
COPY apps/agent/package.json ./apps/agent/package.json
RUN pnpm install --frozen-lockfile --filter @n2base/agent...

# ── builder ───────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/agent ./apps/agent
RUN pnpm --filter @n2base/agent run build

# ── runtime ───────────────────────────────────────────────────────────────────
FROM node:22-slim AS runtime
RUN npm i -g pnpm@latest
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig ./packages/tsconfig
COPY apps/agent/package.json ./apps/agent/package.json
RUN pnpm install --frozen-lockfile --filter @n2base/agent... --prod
COPY --from=builder /repo/apps/agent/dist ./apps/agent/dist
WORKDIR /repo/apps/agent
CMD ["node", "dist/main.js", "start"]
```

Key changes: removed `EXPOSE 3001`, changed CMD to `node dist/main.js start`.

- [ ] **Step 2: Update docker-compose.yaml — agent service**

In `docker-compose.yaml`, replace the `agent:` service block. Change:
```yaml
  agent:
    build:
      context: .
      dockerfile: apps/agent/Dockerfile
    ports:
      - 3001:3001
    environment:
      PORT: 3001
      LIVEKIT_API_KEY: ${LIVEKIT_API_KEY:-devkey}
      LIVEKIT_API_SECRET: ${LIVEKIT_API_SECRET:-devsecret}
      LIVEKIT_HOST: ws://livekit:7880
    depends_on:
      livekit:
        condition: service_started
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped
```

To:
```yaml
  agent:
    build:
      context: .
      dockerfile: apps/agent/Dockerfile
    environment:
      LIVEKIT_URL: ws://livekit:7880
      LIVEKIT_API_KEY: ${LIVEKIT_API_KEY:-devkey}
      LIVEKIT_API_SECRET: ${LIVEKIT_API_SECRET:-devsecret}
      STT_BASE_URL: http://whisper:8000/v1
      TTS_BASE_URL: http://kokoro:8880/v1
      LLM_BASE_URL: http://ollama:11434/v1
      LLM_MODEL: llama3:8b-instruct-q4_K_M
      LLM_API_KEY: local
    depends_on:
      livekit:
        condition: service_started
      ollama:
        condition: service_healthy
    restart: unless-stopped
```

- [ ] **Step 3: Update docker-compose.yaml — whisper service**

The current `onerahmet/openai-whisper-asr-webservice` image does not expose the OpenAI `/v1/audio/transcriptions` endpoint that `@livekit/agents-plugin-openai` STT requires. Switch to `fedirz/faster-whisper-server`.

Change the `whisper:` service:
```yaml
  whisper:
    image: onerahmet/openai-whisper-asr-webservice:latest
    ports:
      - 9000:9000
    environment:
      ASR_MODEL: base
      ASR_ENGINE: openai_whisper
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9000/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

To:
```yaml
  whisper:
    image: fedirz/faster-whisper-server:latest-cpu
    ports:
      - 8000:8000
    environment:
      WHISPER__MODEL: Systran/faster-whisper-small
    volumes:
      - whisper-models:/root/.cache/huggingface
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

Also add `whisper-models:` to the `volumes:` section at the bottom of the file.

- [ ] **Step 4: Update docker-compose.yaml — api service**

Remove `AGENT_URL: http://agent:3001` from the `api:` service environment since the backend will use `AgentDispatchClient` instead.

- [ ] **Step 5: Commit**

```bash
git add apps/agent/Dockerfile docker-compose.yaml
git commit -m "chore(agent): remove HTTP server, wire docker-compose to livekit worker pattern"
```

---

## Task 4: Backend API — AgentDispatchClient Replaces notifyAgent

**Files:**
- Modify: `apps/api/src/livekit/livekit.module.ts`
- Modify: `apps/api/src/livekit/livekit-config.type.ts`
- Modify: `apps/api/src/livekit/livekit.config.ts`
- Create: `apps/api/src/conversation-sessions/dto/create-session.dto.ts`
- Modify: `apps/api/src/conversation-sessions/conversation-sessions.controller.ts`
- Modify: `apps/api/src/conversation-sessions/conversation-sessions.service.ts`

- [ ] **Step 1: Update LiveKitConfig type**

Replace `apps/api/src/livekit/livekit-config.type.ts`:

```typescript
export type LiveKitConfig = {
  apiKey: string;
  apiSecret: string;
  url: string;
  agentName: string;
};
```

- [ ] **Step 2: Update livekit.config.ts**

Replace `apps/api/src/livekit/livekit.config.ts`:

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('livekit', () => ({
  apiKey: process.env.LIVEKIT_API_KEY ?? '',
  apiSecret: process.env.LIVEKIT_API_SECRET ?? '',
  url: process.env.LIVEKIT_HOST ?? 'ws://livekit:7880',
  agentName: process.env.LIVEKIT_AGENT_NAME ?? 'leca-agent',
}));
```

- [ ] **Step 3: Update livekit.module.ts**

Replace `apps/api/src/livekit/livekit.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { AllConfigType } from '../config/config.type';

export const LIVEKIT_ROOM_SERVICE = 'LIVEKIT_ROOM_SERVICE';
export const LIVEKIT_DISPATCH_CLIENT = 'LIVEKIT_DISPATCH_CLIENT';

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
    {
      provide: LIVEKIT_DISPATCH_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => {
        return new AgentDispatchClient(
          config.getOrThrow('livekit.url', { infer: true }),
          config.getOrThrow('livekit.apiKey', { infer: true }),
          config.getOrThrow('livekit.apiSecret', { infer: true }),
        );
      },
    },
  ],
  exports: [LIVEKIT_ROOM_SERVICE, LIVEKIT_DISPATCH_CLIENT],
})
export class LiveKitModule {}
```

- [ ] **Step 4: Create create-session.dto.ts**

Create `apps/api/src/conversation-sessions/dto/create-session.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @ApiPropertyOptional({ description: 'UUID of the scenario to practice' })
  @IsOptional()
  @IsString()
  @IsUUID()
  scenarioId?: string;
}
```

- [ ] **Step 5: Update conversation-sessions.controller.ts**

Replace `apps/api/src/conversation-sessions/conversation-sessions.controller.ts`:

```typescript
import {
  Body,
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
import { CreateSessionDto } from './dto/create-session.dto';
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
    @Body() dto: CreateSessionDto,
  ): Promise<CreateSessionResponseDto> {
    return this.service.create(Number(req.user.id), dto.scenarioId);
  }

  /** End a conversation session and close the LiveKit room. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Session ended' })
  @ApiNotFoundResponse({ description: 'Session not found' })
  async end(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.end(id);
  }
}
```

- [ ] **Step 6: Update conversation-sessions.service.ts**

Replace `apps/api/src/conversation-sessions/conversation-sessions.service.ts` entirely:

```typescript
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AllConfigType } from '../config/config.type';
import { LIVEKIT_DISPATCH_CLIENT, LIVEKIT_ROOM_SERVICE } from '../livekit/livekit.module';
import { CreateSessionResponseDto } from './dto/create-session-response.dto';

const LEARNER_TOKEN_TTL_SECONDS = 3600;

@Injectable()
export class ConversationSessionsService {
  private readonly logger = new Logger(ConversationSessionsService.name);

  constructor(
    @Inject(LIVEKIT_ROOM_SERVICE)
    private readonly roomService: RoomServiceClient,
    @Inject(LIVEKIT_DISPATCH_CLIENT)
    private readonly dispatchClient: AgentDispatchClient,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService<AllConfigType>,
  ) {}

  async create(
    boilerplateUserId: number,
    scenarioId?: string,
  ): Promise<CreateSessionResponseDto> {
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

    const learnerToken = await this.buildLearnerToken(roomName, lecaUserId);

    // Dispatch agent worker into room — fire and forget
    this.dispatchAgent(roomName, session.id, scenarioId).catch((err: unknown) => {
      this.logger.warn(
        `Agent dispatch failed for session ${session.id}: ${String(err)}`,
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

  // ── private helpers ──────────────────────────────────────────────────────────

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
    const apiSecret = this.config.getOrThrow('livekit.apiSecret', { infer: true });

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

  private async dispatchAgent(
    roomName: string,
    sessionId: string,
    scenarioId?: string,
  ): Promise<void> {
    const agentName = this.config.getOrThrow('livekit.agentName', { infer: true });
    await this.dispatchClient.createDispatch(roomName, agentName, {
      metadata: JSON.stringify({
        sessionId,
        scenarioId: scenarioId ?? null,
      }),
    });
    this.logger.log(`Agent dispatched to room ${roomName} for session ${sessionId}`);
  }
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /Users/devinnguyen/Documents/project/LECA/apps/api
pnpm run build 2>&1 | head -40
```

Expected: no errors related to the changed files.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/livekit/ apps/api/src/conversation-sessions/
git commit -m "feat(api): replace notifyAgent HTTP with AgentDispatchClient.createDispatch()"
```

---

## Task 5: Frontend — Install LiveKit Packages & API Service

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/services/api/services/conversation-sessions.ts`

- [ ] **Step 1: Add livekit packages to web package.json**

In `apps/web/package.json`, add to `"dependencies"`:

```json
"@livekit/components-react": "^2.9.20",
"livekit-client": "^2.18.7"
```

Then install:

```bash
cd /Users/devinnguyen/Documents/project/LECA
pnpm install --filter @n2base/web
```

Expected: packages installed, no peer dependency errors.

- [ ] **Step 2: Create conversation-sessions API service**

Create `apps/web/src/services/api/services/conversation-sessions.ts`:

```typescript
import { useCallback } from 'react';
import useFetch from '../use-fetch';
import { API_URL } from '../config';
import wrapperFetchJsonResponse from '../wrapper-fetch-json-response';
import { RequestConfigType } from './types/request-config';

// ─── Types ────────────────────────────────────────────────────

export type CreateSessionResponse = {
  sessionId: string;
  livekitToken: string;
  livekitUrl: string;
};

// ─── Create session ───────────────────────────────────────────

export function useCreateSessionService() {
  const fetch = useFetch();

  return useCallback(
    (scenarioId?: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/conversation-sessions`, {
        method: 'POST',
        body: JSON.stringify({ scenarioId }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CreateSessionResponse>);
    },
    [fetch],
  );
}

// ─── End session ─────────────────────────────────────────────

export function useEndSessionService() {
  const fetch = useFetch();

  return useCallback(
    (sessionId: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/conversation-sessions/${sessionId}`, {
        method: 'DELETE',
        ...requestConfig,
      });
    },
    [fetch],
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json apps/web/src/services/api/services/conversation-sessions.ts pnpm-lock.yaml
git commit -m "feat(web): add livekit client packages and conversation-sessions API service"
```

---

## Task 6: Frontend — Voice Session UI on Scenario Detail Page

**Files:**
- Modify: `apps/web/src/app/[language]/scenarios/[id]/page-content.tsx`

The scenario detail page currently shows scenario info and phrases. We add a voice session section at the bottom: a "Start Session" button that creates a session and renders the `<LiveKitRoom>` voice interface.

- [ ] **Step 1: Replace page-content.tsx**

Replace `apps/web/src/app/[language]/scenarios/[id]/page-content.tsx` entirely:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useTranscriptions,
  TrackToggle,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import useLanguage from '@/services/i18n/use-language';
import {
  useGetScenarioService,
  ScenarioDetail,
  ScenarioPhrase,
} from '@/services/api/services/scenarios';
import {
  useCreateSessionService,
  useEndSessionService,
  type CreateSessionResponse,
} from '@/services/api/services/conversation-sessions';
import { Button } from '@/components/ui/button';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';

// ─── Difficulty colours ────────────────────────────────────────

const DIFFICULTY_COLOUR: Record<string, string> = {
  A1: 'bg-green-500/20 text-green-400 border-green-500/30',
  A2: 'bg-green-500/20 text-green-400 border-green-500/30',
  B1: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  B2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  C1: 'bg-red-500/20 text-red-400 border-red-500/30',
  C2: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper-Intermediate',
  C1: 'Advanced',
  C2: 'Mastery',
};

const CATEGORY_ICON: Record<string, string> = {
  everyday: '🌍',
  work: '💼',
};

// ─── Phrase row ────────────────────────────────────────────────

function PhraseRow({ phrase }: { phrase: ScenarioPhrase }) {
  const diffClass = phrase.difficulty
    ? (DIFFICULTY_COLOUR[phrase.difficulty] ?? 'bg-white/10 text-white/60')
    : '';

  return (
    <div className="flex flex-col gap-1 border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-sm font-medium text-amber-300">
          &ldquo;{phrase.phrase}&rdquo;
        </span>
        {phrase.difficulty && (
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${diffClass}`}
          >
            {phrase.difficulty}
          </span>
        )}
      </div>
      <p className="text-sm text-white/50 italic leading-relaxed">
        e.g. &ldquo;{phrase.exampleSentence}&rdquo;
      </p>
    </div>
  );
}

// ─── Agent state indicator ─────────────────────────────────────

const STATE_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  initializing: 'Starting up…',
  idle: 'Ready',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
  disconnected: 'Disconnected',
};

const STATE_COLOUR: Record<string, string> = {
  listening: 'bg-amber-400',
  speaking: 'bg-green-400',
  thinking: 'bg-blue-400',
  idle: 'bg-white/30',
  connecting: 'bg-white/20',
  initializing: 'bg-white/20',
  disconnected: 'bg-red-400/50',
};

// ─── Voice room content (rendered inside <LiveKitRoom>) ────────

function VoiceRoomContent({ onEnd }: { onEnd: () => void }) {
  const { state } = useVoiceAssistant();
  const transcriptions = useTranscriptions();

  const dotColour = STATE_COLOUR[state] ?? 'bg-white/30';
  const stateLabel = STATE_LABEL[state] ?? state;

  // Show the last 4 transcript entries
  const recent = transcriptions.slice(-4);

  return (
    <div className="flex flex-col gap-4">
      {/* Agent state badge */}
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColour} transition-colors duration-300`} />
        <span className="text-sm text-white/60">{stateLabel}</span>
      </div>

      {/* Transcript */}
      {recent.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 min-h-[80px]">
          {recent.map((t) => (
            <p
              key={t.id}
              className={`text-sm leading-relaxed ${
                t.participant?.identity === 'leca-agent'
                  ? 'text-amber-300'
                  : 'text-white/80'
              } ${!t.final ? 'opacity-60 italic' : ''}`}
            >
              <span className="mr-1.5 text-white/30 text-xs">
                {t.participant?.identity === 'leca-agent' ? 'LECA' : 'You'}:
              </span>
              {t.text}
            </p>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <TrackToggle
          source={Track.Source.Microphone}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.10] transition-colors"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onEnd}
          className="rounded-full border-red-500/30 text-red-400 hover:border-red-400/60 hover:text-red-300"
        >
          End Session
        </Button>
      </div>
    </div>
  );
}

// ─── Page content ──────────────────────────────────────────────

export default function ScenarioDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const language = useLanguage();
  const getScenario = useGetScenarioService();
  const createSession = useCreateSessionService();
  const endSession = useEndSessionService();

  const id = typeof params.id === 'string' ? params.id : (params.id?.[0] ?? '');

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [session, setSession] = useState<CreateSessionResponse | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getScenario(id).then(({ status, data }) => {
      if (status === HTTP_CODES_ENUM.OK && data) {
        setScenario(data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStartSession() {
    setSessionLoading(true);
    try {
      const { status, data } = await createSession(id);
      if (status === HTTP_CODES_ENUM.CREATED && data) {
        setSession(data);
      }
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleEndSession() {
    if (!session) return;
    await endSession(session.sessionId).catch(() => {});
    setSession(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !scenario) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-white/50">
        <p className="text-4xl">📭</p>
        <p className="text-lg">Scenario not found.</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/${language}/scenarios`)}
        >
          Back to library
        </Button>
      </div>
    );
  }

  const diffClass =
    DIFFICULTY_COLOUR[scenario.difficulty] ?? 'bg-white/10 text-white/60';

  return (
    <div className="min-h-screen px-4 py-16 md:px-8 max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push(`/${language}/scenarios`)}
        className="mb-8 flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        ← Scenario library
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base">
              {CATEGORY_ICON[scenario.situationType] ?? '📝'}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${diffClass}`}
            >
              {scenario.difficulty} · {DIFFICULTY_LABEL[scenario.difficulty] ?? ''}
            </span>
            {scenario.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/40"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white leading-tight">
            {scenario.title}
          </h1>

          {/* Description */}
          {scenario.description && (
            <p className="text-white/60 leading-relaxed">{scenario.description}</p>
          )}

          {/* Context */}
          {scenario.context && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">
                Context
              </p>
              <p className="text-sm text-white/70 leading-relaxed">{scenario.context}</p>
            </div>
          )}

          {/* AI Role */}
          {scenario.aiRole && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
              <p className="text-xs font-semibold text-amber-400/60 uppercase tracking-widest mb-1">
                LECA&apos;s role
              </p>
              <p className="text-sm text-amber-200/80 leading-relaxed">{scenario.aiRole}</p>
            </div>
          )}

          {/* Phrases */}
          {scenario.phrases.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">
                Useful phrases
              </h2>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-4">
                {scenario.phrases.map((phrase) => (
                  <PhraseRow key={phrase.id} phrase={phrase} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar: Voice session ── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-4 sticky top-8">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-white">Practice this scenario</p>
              <p className="text-xs text-white/40">
                Speak with LECA, your AI English tutor.
              </p>
            </div>

            {session ? (
              <LiveKitRoom
                serverUrl={session.livekitUrl}
                token={session.livekitToken}
                connect={true}
                onDisconnected={handleEndSession}
                audio={true}
                video={false}
              >
                <RoomAudioRenderer />
                <VoiceRoomContent onEnd={handleEndSession} />
              </LiveKitRoom>
            ) : (
              <Button
                onClick={handleStartSession}
                disabled={sessionLoading}
                className="w-full rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors disabled:opacity-50"
              >
                {sessionLoading ? 'Starting…' : '🎙 Start Speaking'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/devinnguyen/Documents/project/LECA/apps/web
pnpm run build 2>&1 | tail -20
```

Expected: build succeeds or only shows pre-existing errors (none from the new files).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/ apps/web/src/services/
git commit -m "feat(web): add LiveKit voice session UI to scenario detail page"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|-------------|------|
| Agent uses `@livekit/agents` (VAD/STT/LLM/TTS) | Task 1 + 2 |
| Agent registered as named worker (`leca-agent`) | Task 2 |
| ESM build for agent | Task 1 |
| Backend uses `AgentDispatchClient.createDispatch()` | Task 4 |
| Remove `notifyAgent()` HTTP call | Task 4 |
| Remove `AGENT_URL` / `agentUrl` config | Task 3 + 4 |
| `scenarioId` passed in dispatch metadata | Task 4 |
| Whisper service switched to OpenAI-compatible image | Task 3 |
| Frontend `<LiveKitRoom>` with voice UI | Task 6 |
| Frontend API service for session create/end | Task 5 |
| `agentName` consistent everywhere | Tasks 2, 4 (`'leca-agent'`) |
| Type consistency across tasks | `AgentOptions`, `CreateSessionResponse`, `LiveKitConfig` all defined once |

### Constant Verification

- `agentName`: `'leca-agent'` — used in `src/main.ts` `cli.runApp` AND `conversation-sessions.service.ts` reads from `config.getOrThrow('livekit.agentName')` which defaults to `'leca-agent'`
- `LIVEKIT_DISPATCH_CLIENT`: defined and exported from `livekit.module.ts`, injected in service
- `CreateSessionResponse` type: defined in `conversation-sessions.ts`, used in `page-content.tsx`
- `useCreateSessionService` / `useEndSessionService`: defined in service, imported in page

### Notes for Execution

- The `vite.config.ts` externalizes all `node_modules` via regex — this keeps the bundle small and avoids bundling large native dependencies like `@livekit/agents`
- The whisper service image change (`onerahmet` → `fedirz`) will require pulling a new Docker image on first run — the `WHISPER__MODEL: Systran/faster-whisper-small` downloads on startup
- The `LIVEKIT_AGENT_NAME` env var on the API is optional (defaults to `'leca-agent'`), so no `.env` changes are required for existing deployments
- The `LiveKitRoom` `audio={true}` prop requests microphone permission immediately on mount — this is intentional for a voice-first flow
