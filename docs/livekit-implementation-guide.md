# LiveKit Implementation Guide

> Complete guide to integrating LiveKit for a Voice AI app: Server, Backend API, Agent, and Frontend React.
> Extracted from the AI4Eng project (NestJS + TypeScript Agent + React).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [LiveKit Server — Docker](#2-livekit-server--docker)
3. [Backend API — Token & Agent Dispatch (NestJS)](#3-backend-api--token--agent-dispatch-nestjs)
4. [Agent — Node.js Worker](#4-agent--nodejs-worker)
5. [Frontend — React](#5-frontend--react)
6. [Data Channel: Agent → Browser](#6-data-channel-agent--browser)
7. [Environment Variables](#7-environment-variables)
8. [Complete End-to-End Flow](#8-complete-end-to-end-flow)

---

## 1. Architecture Overview

```
User (Browser)
    │  POST /session  (scenarioId)
    ▼
Backend API (NestJS)
    ├── Create AccessToken  (livekit-server-sdk)
    ├── Create DB session
    ├── Dispatch agent into room  (AgentDispatchClient)
    └── Return { token, url, roomName, sessionId }
    │
    ▼
LiveKit Server  (WebRTC media relay)
    │
    ├── Agent Worker connects  (defineAgent / cli.runApp)
    │       ├── VAD (Silero)
    │       ├── STT (Whisper / faster-whisper)
    │       ├── LLM (OpenAI / GitHub Models)
    │       └── TTS (Kokoro / OpenAI)
    │
    └── Browser connects  (LiveKitRoom component)
            ├── RoomAudioRenderer    — play agent audio
            ├── useVoiceAssistant    — state + audioTrack of agent
            ├── useTranscriptions   — real-time transcript
            ├── useChat             — chat message
            └── useDataChannel      — custom payload (corrections, pronunciation)
```

**Packages:**

| Layer    | Package                         | Version |
| -------- | ------------------------------- | ------- |
| Server   | `livekit/livekit-server` Docker | latest  |
| Backend  | `livekit-server-sdk`            | ^2.7.0  |
| Agent    | `@livekit/agents`               | ^1.2.4  |
| Agent    | `@livekit/agents-plugin-openai` | ^1.2.4  |
| Agent    | `@livekit/agents-plugin-silero` | ^1.2.4  |
| Frontend | `livekit-client`                | ^2.18.7 |
| Frontend | `@livekit/components-react`     | ^2.9.20 |

---

## 2. LiveKit Server — Docker

### Dev mode (hardcoded key/secret)

```yaml
# docker-compose.yml
services:
  livekit:
    image: livekit/livekit-server:latest
    command: --dev --bind 0.0.0.0
    # --dev mode: API key = devkey, secret = secret
    ports:
      - '7880:7880' # WebSocket / HTTP
      - '7881:7881' # WebRTC TCP
      - '7882:7882/udp' # WebRTC UDP
```

### Production (config file)

```yaml
# livekit.yaml
port: 7880
rtc:
  tcp_port: 7881
  udp_port: 7882
keys:
  your_api_key: your_api_secret
```

```yaml
services:
  livekit:
    image: livekit/livekit-server:latest
    command: --config /config/livekit.yaml
    volumes:
      - ./livekit.yaml:/config/livekit.yaml
    ports:
      - '7880:7880'
      - '7881:7881'
      - '7882:7882/udp'
```

> **Note:** `--dev` mode is suitable for local development. Production requires a config file or LiveKit Cloud.

---

## 3. Backend API — Token & Agent Dispatch (NestJS)

### 3.1 Installation

```bash
pnpm add livekit-server-sdk
```

### 3.2 Environment Variables

```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

### 3.3 Module

```typescript
// livekit.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LivekitController } from './livekit.controller';
import { LivekitService } from './livekit.service';

@Module({
  imports: [ConfigModule],
  controllers: [LivekitController],
  providers: [LivekitService],
})
export class LivekitModule {}
```

### 3.4 DTO

```typescript
// dto/create-session.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  scenarioId!: string;
}
```

### 3.5 Controller

```typescript
// livekit.controller.ts
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { LivekitService } from './livekit.service';

@Controller('session')
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard) // allow guests too
  async createSession(@Body() dto: CreateSessionDto, @Request() req: { user?: { id: string } }) {
    const identity = req.user?.id ?? `guest-${randomUUID()}`;
    return this.livekitService.createSession(identity, dto.scenarioId, req.user?.id);
  }
}
```

### 3.6 Service — create token + dispatch agent

```typescript
// livekit.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk';
import { randomUUID } from 'node:crypto';

export interface LiveKitSession {
  token: string;
  url: string;
  roomName: string;
  sessionId: string;
}

@Injectable()
export class LivekitService {
  private readonly url: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.url = this.configService.getOrThrow<string>('LIVEKIT_URL');
    this.apiKey = this.configService.getOrThrow<string>('LIVEKIT_API_KEY');
    this.apiSecret = this.configService.getOrThrow<string>('LIVEKIT_API_SECRET');
  }

  async createSession(
    identity: string,
    scenarioId: string,
    userId?: string,
  ): Promise<LiveKitSession> {
    const roomName = `session-${randomUUID()}`;

    // 1. Create JWT access token for user
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity,
      ttl: '1h',
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true, // user publishes mic
      canSubscribe: true, // user listens to agent
    });
    const token = await at.toJwt();

    // 2. Save session to DB (project-specific)
    const sessionId = randomUUID(); // or from DB

    // 3. Dispatch agent worker into room
    //    Agent worker must be running and registered with agentName
    const dispatchClient = new AgentDispatchClient(this.url, this.apiKey, this.apiSecret);
    await dispatchClient.createDispatch(roomName, 'my-agent-name', {
      metadata: JSON.stringify({
        sessionId,
        scenarioId,
        userId: userId ?? null,
        // any data to pass to agent
      }),
    });

    return { token, url: this.url, roomName, sessionId };
  }
}
```

**Flow Explanation:**

1. Create `AccessToken` with `identity` (user ID or guest UUID).
2. Assign `roomGrant` — allows room join, mic publish, audio subscribe.
3. Use `AgentDispatchClient.createDispatch()` to request LiveKit server to start an agent worker in that room. Agent worker must be running (`dev` or `start`) with matching `agentName`.

---

## 4. Agent — Node.js Worker

Agent is a separate Node.js process that connects to the LiveKit server as a "worker". When `createDispatch` is called, the server sends a job to the worker.

### 4.1 Installation

```bash
pnpm add @livekit/agents @livekit/agents-plugin-openai @livekit/agents-plugin-silero livekit-server-sdk
```

### 4.2 Project Structure

```
apps/agent/
  src/
    main.ts        # defineAgent + cli.runApp
    agent.ts       # class extends voice.Agent
    config.ts      # env vars
```

### 4.3 Config

```typescript
// config.ts
import 'dotenv/config';

export const config = {
  livekitUrl: process.env.LIVEKIT_URL ?? 'ws://localhost:7880',
  livekitApiKey: process.env.LIVEKIT_API_KEY ?? 'devkey',
  livekitApiSecret: process.env.LIVEKIT_API_SECRET ?? 'secret',
  sttBaseURL: process.env.LOCAL_STT_URL ?? 'http://localhost:8000/v1',
  ttsBaseURL: process.env.LOCAL_TTS_URL ?? 'http://localhost:8880/v1',
  llmBaseURL: 'https://models.inference.ai.azure.com',
  githubToken: process.env.GITHUB_TOKEN as string,
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
};
```

### 4.4 main.ts — entry point

```typescript
// main.ts
import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  log,
  metrics,
  voice,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { fileURLToPath } from 'node:url';
import { MyAgent } from './agent.js';
import { config } from './config.js';

export default defineAgent({
  // prewarm: runs once at process startup — loads heavy models into RAM
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    // Connect to room first — ensures WebRTC is established
    await ctx.connect();

    const logger = log();
    const vad = ctx.proc.userData.vad as silero.VAD;

    // Parse metadata from createDispatch()
    const metadata = JSON.parse(ctx.job.metadata || '{}') as {
      sessionId?: string;
      scenarioId?: string;
      userId?: string | null;
    };

    const session = new voice.AgentSession({
      vad,
      stt: new openai.STT({
        model: 'whisper-1',
        baseURL: config.sttBaseURL, // self-hosted or OpenAI
        apiKey: 'local',
      }),
      llm: new openai.LLM({
        model: 'gpt-4o-mini',
        baseURL: config.llmBaseURL,
        apiKey: config.githubToken,
      }),
      tts: new openai.TTS({
        model: 'kokoro', // self-hosted Kokoro or 'tts-1' OpenAI
        voice: 'af_heart' as any,
        baseURL: config.ttsBaseURL,
        apiKey: 'local',
      }),
    });

    // Collect metrics when session ends
    session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
      metrics.logMetrics(ev.metrics);
    });

    await session.start({
      agent: new MyAgent({
        sessionId: metadata.sessionId ?? '',
        scenarioId: metadata.scenarioId ?? 'default',
        userId: metadata.userId ?? null,
      }),
      room: ctx.room,
    });
  },
});

// Register with LiveKit server as 'my-agent-name'
// Must match the name passed to createDispatch()
cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'my-agent-name',
  }),
);
```

### 4.5 agent.ts — processing logic

```typescript
// agent.ts
import { getJobContext, log, voice } from '@livekit/agents';

interface AgentOptions {
  sessionId: string;
  scenarioId: string;
  userId: string | null;
}

export class MyAgent extends voice.Agent {
  private readonly sessionId: string;
  private readonly userId: string | null;

  constructor({ sessionId, scenarioId, userId }: AgentOptions) {
    super({ instructions: `You are a helpful assistant for scenario: ${scenarioId}.` });
    this.sessionId = sessionId;
    this.userId = userId;
  }

  override async onEnter() {
    const logger = log();
    const ctx = getJobContext();
    const room = ctx.room;

    // Listen when user finishes speaking (final transcript)
    this.session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (!ev.isFinal || !ev.transcript.trim()) return;
      const transcript = ev.transcript.trim();
      logger.info({ transcript }, 'User said');
      // Additional processing: save to DB, grammar check, ...
    });

    // Listen when agent finishes responding
    this.session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      if (ev.item.role !== 'assistant' || ev.item.interrupted) return;
      const text = ev.item.textContent;
      if (!text?.trim()) return;
      logger.info({ text }, 'Agent replied');
      // Additional processing: save to DB, ...
    });

    // Opening greeting
    this.session.say('Hello! How can I help you today?');
  }

  override async onExit() {
    const logger = log();
    logger.info({ sessionId: this.sessionId }, 'Session ended');
    // Cleanup: save summary, update DB, ...
  }
}
```

### 4.6 Send data channel from Agent → Browser

```typescript
// Inside onEnter() or event handler
async function publishToRoom(
  room: { localParticipant?: { publishData: Function } },
  topic: string,
  payload: object,
) {
  if (!room.localParticipant) return;
  const data = Buffer.from(JSON.stringify(payload));
  await room.localParticipant.publishData(data, { reliable: true, topic });
}

// Example: send corrections after grammar check
await publishToRoom(room, 'correction', {
  type: 'correction',
  transcriptText: transcript,
  corrections: [
    { original: 'I goed', corrected: 'I went', explanation: 'Past tense of go is went' },
  ],
});
```

### 4.7 Run agent

```bash
# Dev (auto-rebuild + hot reload)
pnpm run dev
# => pnpm run build && node --env-file=../../.env dist/main.js dev

# Production
pnpm run build
node dist/main.js start
```

### 4.8 Self-generated token (for debugging)

```typescript
// scripts/gen-token.mjs
import { AccessToken } from 'livekit-server-sdk';

const at = new AccessToken('devkey', 'secret', {
  identity: 'test-user',
  ttl: '2h',
});
at.addGrant({ roomJoin: true, room: 'test-room', canPublish: true, canSubscribe: true });
console.log(await at.toJwt());
```

---

## 5. Frontend — React

### 5.1 Installation

```bash
pnpm add livekit-client @livekit/components-react
```

### 5.2 Basic Flow

1. Call backend API `POST /session` → receive `{ token, url, roomName, sessionId }`
2. Render `<LiveKitRoom>` with `token` and `serverUrl`
3. Inside `<LiveKitRoom>`, use hooks: `useVoiceAssistant`, `useTranscriptions`, `useChat`, `useDataChannel`

### 5.3 Complete page component

```tsx
// SpeakPage.tsx
import { useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  TrackToggle,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

interface LiveKitSession {
  token: string;
  url: string;
  roomName: string;
  sessionId: string;
}

// ─── Room Content ───────────────────────────────────
function RoomContent({ onDisconnect }: { onDisconnect: () => void }) {
  // state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'disconnected'
  const { audioTrack, state } = useVoiceAssistant();

  return (
    <div>
      <p>Agent state: {state}</p>

      {/* Microphone toggle */}
      <TrackToggle source={Track.Source.Microphone} />

      <button onClick={onDisconnect}>End Session</button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────
export function SpeakPage() {
  const [session, setSession] = useState<LiveKitSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  async function startSession() {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: 'free-talk' }),
      });
      const data = await res.json();
      setSession(data.data); // depends on response shape
    } finally {
      setIsConnecting(false);
    }
  }

  if (session) {
    return (
      <LiveKitRoom
        serverUrl={session.url}
        token={session.token}
        connect={true}
        onDisconnected={() => setSession(null)}
      >
        {/* Render agent audio — required */}
        <RoomAudioRenderer />

        <RoomContent onDisconnect={() => setSession(null)} />
      </LiveKitRoom>
    );
  }

  return (
    <div>
      <button onClick={startSession} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Start Session'}
      </button>
    </div>
  );
}
```

### 5.4 Important hooks

#### `useVoiceAssistant` — agent state

```tsx
import { useVoiceAssistant } from '@livekit/components-react';

function AgentStatus() {
  const { audioTrack, state } = useVoiceAssistant();
  // state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'disconnected' | 'pre-connect-buffering'
  return <div>Agent: {state}</div>;
}
```

#### `useTranscriptions` — real-time transcript

```tsx
import { useTranscriptions } from '@livekit/components-react';

function TranscriptPanel() {
  const transcriptions = useTranscriptions();
  return (
    <ul>
      {transcriptions.map((t) => (
        <li key={t.id}>
          [{t.participant?.identity}]: {t.text} {t.final ? '✓' : '...'}
        </li>
      ))}
    </ul>
  );
}
```

#### `useChat` — chat messages

```tsx
import { useChat } from '@livekit/components-react';

function ChatBox() {
  const { chatMessages, send } = useChat();

  return (
    <div>
      {chatMessages.map((msg) => (
        <div key={msg.id}>
          {msg.from?.identity}: {msg.message}
        </div>
      ))}
      <button onClick={() => send('Hello agent!')}>Send</button>
    </div>
  );
}
```

#### `useDataChannel` — receive custom payload from agent

```tsx
import { useDataChannel } from '@livekit/components-react';

function CorrectionPanel() {
  const [corrections, setCorrections] = useState([]);

  // Receive data channel with topic 'correction'
  useDataChannel('correction', (msg) => {
    const payload = JSON.parse(new TextDecoder().decode(msg.payload));
    setCorrections(payload.corrections);
  });

  return (
    <ul>
      {corrections.map((c, i) => (
        <li key={i}>
          {c.original} → {c.corrected}
        </li>
      ))}
    </ul>
  );
}
```

#### `useLocalParticipant` & `useRemoteParticipants`

```tsx
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';

function ParticipantInfo() {
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  return (
    <div>
      <p>Me: {localParticipant.identity}</p>
      <p>Others: {remoteParticipants.map((p) => p.identity).join(', ')}</p>
    </div>
  );
}
```

#### `useTrackVolume` — audio track volume (for visualizer)

```tsx
import { useTrackVolume } from '@livekit/components-react';

function VolumeBar({ audioTrack }) {
  const volume = useTrackVolume(audioTrack, {
    fftSize: 512,
    smoothingTimeConstant: 0.55,
  });
  // volume: number from 0.0 → 1.0

  return <div style={{ width: `${volume * 100}%`, height: 8, background: 'cyan' }} />;
}
```

### 5.5 Audio Visualizer by AgentState

```tsx
import { useVoiceAssistant } from '@livekit/components-react';
import { useTrackVolume } from '@livekit/components-react';

function AgentVisualizer() {
  const { audioTrack, state } = useVoiceAssistant();
  const volume = useTrackVolume(audioTrack, { fftSize: 512 });

  // State-based animation config
  const config = {
    idle: { scale: 0.2, opacity: 0.4 },
    listening: { scale: 0.4, opacity: 0.8 },
    thinking: { scale: 0.3, opacity: 0.6 },
    speaking: { scale: 0.5 + volume * 0.5, opacity: 1.0 },
  }[state] ?? { scale: 0.2, opacity: 0.4 };

  return (
    <div
      style={{
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'cyan',
        transform: `scale(${config.scale})`,
        opacity: config.opacity,
        transition: 'all 0.3s ease',
      }}
    />
  );
}
```

---

## 6. Data Channel: Agent → Browser

Used to send non-audio data from agent to frontend (corrections, pronunciation scores, etc).

### Agent side (sending)

```typescript
// In agent.ts → onEnter()
const room = getJobContext().room;

async function send(topic: string, payload: object) {
  if (!room.localParticipant) return;
  const data = Buffer.from(JSON.stringify(payload));
  await room.localParticipant.publishData(data, { reliable: true, topic });
}

// Send after user speaks
await send('pronunciation', {
  type: 'pronunciation',
  transcriptText: transcript,
  overallScore: 85,
  wordScores: [
    { word: 'hello', score: 0.9 },
    { word: 'world', score: 0.7 },
  ],
});
```

### Frontend side (receiving)

```tsx
// Inside component within <LiveKitRoom>
import { useDataChannel } from '@livekit/components-react';

function PronunciationFeedback() {
  const [data, setData] = useState(null);

  useDataChannel('pronunciation', (msg) => {
    const payload = JSON.parse(new TextDecoder().decode(msg.payload));
    setData(payload);
  });

  if (!data) return null;
  return (
    <div>
      <p>Overall: {data.overallScore}/100</p>
      {data.wordScores.map((w) => (
        <span key={w.word} style={{ color: w.score > 0.8 ? 'green' : 'red' }}>
          {w.word} ({Math.round(w.score * 100)}%)
        </span>
      ))}
    </div>
  );
}
```

---

## 7. Environment Variables

### Backend API

```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

### Agent Worker

```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# STT (faster-whisper or OpenAI)
LOCAL_STT_URL=http://localhost:8000/v1

# TTS (Kokoro or OpenAI)
LOCAL_TTS_URL=http://localhost:8880/v1

# LLM
GITHUB_TOKEN=ghp_xxxx   # if using GitHub Models

# Backend API URL (for agent to call back and save to DB)
API_URL=http://localhost:3000
```

### Frontend

```env
# Vite
VITE_API_URL=http://localhost:3000
```

> Frontend **does not need** `LIVEKIT_API_KEY` or `LIVEKIT_API_SECRET`. Token is provided by backend.

---

## 8. Complete End-to-End Flow

```
1. User clicks "Start Session"
   └─ Frontend: POST /api/session { scenarioId }

2. Backend (NestJS):
   ├─ Validate user (JWT optional)
   ├─ Create roomName = `session-${uuid}`
   ├─ AccessToken.addGrant({ roomJoin, canPublish, canSubscribe })
   ├─ Save session to DB
   ├─ AgentDispatchClient.createDispatch(roomName, 'agent-name', { metadata })
   └─ Return { token, url, roomName, sessionId }

3. Frontend receives response:
   └─ Render <LiveKitRoom serverUrl={url} token={token} connect={true}>

4. LiveKit Server:
   ├─ Authenticate token (verify JWT with API secret)
   ├─ Allow user to join room
   └─ Send dispatch job to agent worker

5. Agent Worker (Node.js process):
   ├─ Receive job from LiveKit server
   ├─ ctx.connect() → connect to room
   ├─ AgentSession.start({ agent: new MyAgent(metadata), room })
   ├─ Silero VAD listens to audio
   ├─ When user speaks: STT transcribe → LLM generate → TTS speak
   └─ Publish data channel (corrections, pronunciation) to browser

6. Frontend receives:
   ├─ RoomAudioRenderer → play agent audio
   ├─ useVoiceAssistant → update UI state
   ├─ useTranscriptions → display subtitles
   └─ useDataChannel → display corrections, pronunciation
```

---

## Real-World Notes

### Self-hosted vs LiveKit Cloud

| Feature                            | Self-hosted          | LiveKit Cloud   |
| ---------------------------------- | -------------------- | --------------- |
| Turn detection (MultilingualModel) | ❌ (use VAD instead) | ✅              |
| SFU media server                   | ✅                   | ✅              |
| Agent dispatch                     | ✅                   | ✅              |
| Cost                               | Infrastructure only  | Metered billing |

### Turn detection with self-hosted

```typescript
// Do not use MultilingualModel with self-hosted (requires /settings endpoint)
// Use VAD-based endpointing instead — leave turnDetection empty
const session = new voice.AgentSession({
  vad, // Silero VAD
  stt,
  llm,
  tts,
  // NO: turnDetection: new openai.realtime.MultilingualModel()
});
```

### STT self-hosted: faster-whisper

```yaml
# docker-compose.yml
stt:
  image: fedirz/faster-whisper-server:latest-cpu
  ports:
    - '8000:8000'
  environment:
    WHISPER__MODEL: Systran/faster-whisper-small
  volumes:
    - whisper_models:/root/.cache/huggingface
```

### TTS self-hosted: Kokoro-FastAPI

```yaml
tts:
  image: ghcr.io/remsky/kokoro-fastapi-cpu:latest
  ports:
    - '8880:8880'
```

```typescript
// Use in agent
tts: new openai.TTS({
  model: 'kokoro',
  voice: 'af_heart' as any, // cast because TTSVoices is typed for OpenAI voices
  baseURL: 'http://localhost:8880/v1',
  apiKey: 'local',
}),
```

### Agent build (ESM)

```json
// package.json
{
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "pnpm run build && node --env-file=../../.env dist/main.js dev",
    "start": "node dist/main.js start"
  }
}
```

```typescript
// vite.config.ts — build for Node ESM
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node20',
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: 'main',
    },
    rollupOptions: {
      external: [/node_modules/],
    },
  },
});
```
