# LECA — Architecture Design Document

**Product**: LECA (Language & English Communication AI)  
**Document Type**: System Design — High-Level & Low-Level Architecture  
**Version**: 1.0  
**Status**: Draft  
**Date**: 2026-05-28  
**Based on**: BRD v0.6, SRS v1.0

---

## Table of Contents

1. [Architectural Decisions](#1-architectural-decisions)
2. [High-Level Architecture (HLD)](#2-high-level-architecture-hld)
3. [Component Breakdown](#3-component-breakdown)
4. [Low-Level Architecture (LLD)](#4-low-level-architecture-lld)
5. [Database Schema (ERD)](#5-database-schema-erd)
6. [API Contracts](#6-api-contracts)
7. [AI Pipeline Design](#7-ai-pipeline-design)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Tech Stack Selection](#9-tech-stack-selection)
10. [Non-Functional Considerations](#10-non-functional-considerations)

---

## 1. Architectural Decisions

### ADR-01 — Backend: NestJS (Node.js / TypeScript)

**Context**: Small founding team, OSS project, TypeScript already used on frontend (Next.js).

**Decision**: NestJS (Node.js) as the API backend. TypeScript end-to-end.

**Rationale**:
- TypeScript on both frontend and backend → one language for all contributors, lowest OSS onboarding barrier
- NestJS is opinionated and modular → enforces clear boundaries (Auth, Session, Scenario, Progress modules) without discipline overhead
- All AI services (Whisper, Ollama, Gemini) are reachable via HTTP REST — no Python runtime needed in the API server
- Wav2Vec2 runs via `onnxruntime-node` directly in NestJS process (Phase 0) or client-side WASM (Phase 1+)
- LiveKit token generation uses `livekit-server-sdk` npm package (full Node.js support)
- OpenAPI spec auto-generated via `@nestjs/swagger`

**Trade-offs accepted**: Wav2Vec2 inference in Node.js is slightly less ergonomic than Python HuggingFace, but `onnxruntime-node` is production-ready and well-maintained.

---

### ADR-02 — Frontend: Next.js 14+ PWA

**Context**: Mobile-first (Android 8+), PWA required, no native app for MVP, must run Kokoro-js and Wav2Vec2 WASM in-browser.

**Decision**: Next.js 14 (App Router) with `next-pwa` for PWA output.

**Rationale**:
- React/JSX is the most widely known frontend stack → lowest barrier for OSS contributors (Segment 4)
- App Router enables SSR + streaming for initial page load performance
- Huge ecosystem: shadcn/ui, Recharts, React Hook Form — less custom code
- Web Workers fully supported for WASM AI workloads (Kokoro-js, Wav2Vec2)
- Bundle size managed via code splitting, lazy imports, and dynamic components

---

### ADR-03 — AI Pipeline: Fixed Stack (Ollama cho LLM)

**Context**: LLM stack được giữ cố định — Ollama + LLaMA 3 8B Q4 chạy server-side cho tất cả phases.

**Decision**: Không cần phase-switching cho LLM. Một stack duy nhất: Whisper (STT) + Ollama (LLM) + Kokoro (TTS) + Wav2Vec2 (Pronunciation background job). Tất cả là Docker HTTP services, NestJS gọi qua REST.

---

### ADR-04 — Real-time Audio: LiveKit (self-hosted)

**Context**: LECA needs real-time voice streaming between browser and AI pipeline. Options: raw WebSocket or LiveKit.

**Decision**: LiveKit self-hosted (open-source, Apache 2.0) as the audio transport and AI agent orchestration layer.

**Rationale**:
- WebRTC (LiveKit) vs raw WebSocket: Opus codec (3–4× smaller than raw PCM), built-in echo cancellation, jitter buffer, packet loss recovery — critical for Android users on mobile data in Vietnam/Indonesia
- `livekit-server-sdk` npm package handles token generation and room management natively in Node.js
- AI pipeline (STT → LLM → TTS) wired manually in NestJS via HTTP calls to Whisper Docker + Ollama + Kokoro — full control, no Python dependency
- Built-in VAD (Voice Activity Detection) handles push-to-talk logic server-side
- Self-hosted LiveKit server runs in Docker alongside other services — no LiveKit Cloud dependency, no usage fees
- LiveKit Cloud free tier (1,000 min/month) is insufficient for Phase 1 (500 DAU × 10 min = 5,000 min/day), so self-hosting is required anyway

**Trade-offs accepted**: +1 service trong Docker Compose; Ollama cần đủ RAM cho model (8GB+ cho LLaMA 3 8B Q4).

---

### ADR-05 — Database: PostgreSQL + Redis

**Decision**: PostgreSQL for all persistent data; Redis for sessions, rate-limiting, scenario cache.

**Rationale**: Relational model fits structured learner/session/progress data. PostgreSQL full-text search covers scenario search (< 1,000 scenarios in Phase 0–1, no Elasticsearch needed). Redis handles rate-limiting (NFR-SEC-05) and caches frequently-read scenarios (NFR-REL-04).

---

## 2. High-Level Architecture (HLD)

> **Two separate services:**
> - `leca-api` (NestJS) — REST API, JWT + token generation, DB, BullMQ. Does NOT touch audio.
> - `leca-agent` (Node.js / TypeScript) — joins LiveKit room as a participant, subscribes to browser audio track, runs STT→LLM→TTS pipeline, publishes TTS audio back.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (PWA — Next.js 14)                   │
│                                                                       │
│  ┌───────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  Conversation UI  │  │  Scenario Browser │  │  Progress         │  │
│  │  (push-to-talk)   │  │  + Vocab Panel    │  │  Dashboard        │  │
│  └─────────┬─────────┘  └────────┬──────────┘  └────────┬──────────┘  │
│            │ LiveKit              │ REST API             │ REST API    │
│            │ Browser SDK         │                      │             │
└────────────┼─────────────────────┼──────────────────────┼─────────────┘
             │ WebRTC (Opus)        │                      │
             │                     ▼                      ▼
             │         ┌───────────────────────────────────────────────┐
             │         │         leca-api (NestJS — TypeScript)         │
             │         │  auth │ assessment │ vocabulary │ scenario     │
             │         │  progress │ admin │ BullMQ jobs                │
             │         └───────────────────────────────────────────────┘
             │                     │ livekit-server-sdk (room + token)
             ▼                     │
┌─────────────────────────────────────────────────────────────────────┐
│                   LiveKit Server (self-hosted)                        │
│         WebRTC media server — Opus, VAD, echo cancel, jitter buffer  │
│                                                                       │
│   ┌──────────────────────┐      ┌────────────────────────────────┐   │
│   │  Browser Participant  │◄────►│  Agent Participant              │   │
│   │  (learner audio out) │      │  (leca-agent service)           │   │
│   │  (TTS audio in)      │      │  join room, subscribe audio,    │   │
│   └──────────────────────┘      │  publish TTS track              │   │
│                                  └─────────────┬──────────────────┘   │
└──────────────────────────────────────────────┼─────────────────────┘
                                                │ HTTP REST
┌───────────────────────────────────────────────▼─────────────────────┐
│                     AI Services (Docker)                               │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Whisper Docker   │  │  Ollama           │  │  Kokoro Docker   │   │
│  │  STT (port 9000)  │  │  LLaMA 3 8B Q4   │  │  TTS (port 9001) │   │
│  └───────────────────┘  └──────────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                   │
│  ┌──────────────────────────────┐  ┌─────────────────────────────────┐ │
│  │  PostgreSQL                   │  │  Redis                           │ │
│  │  users, sessions, turns       │  │  JWT sessions, rate limit,      │ │
│  │  pronunciation_scores         │  │  scenario cache, BullMQ         │ │
│  │  scenarios, user_vocabulary   │  │                                 │ │
│  │  level_assessments, classes   │  │                                 │ │
│  └──────────────────────────────┘  └─────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow — Conversation Turn

```
1. Browser → POST /api/sessions (leca-api)
   NestJS: create DB session + LiveKit room
   NestJS: generate livekitToken for browser, dispatch leca-agent into room
   Returns: { sessionId, livekitToken, livekitUrl }

2. Browser joins room via LiveKit Browser SDK (livekitToken)
   leca-agent joins same room (agent token, internal)
   → Both are participants in the same LiveKit room

3. Learner presses push-to-talk
   → Browser publishes Opus audio track

4. [leca-agent] receives audio track (WebRTC subscription)
   → buffers audio until VAD detects speech end
   → POST Whisper Docker HTTP → transcript            (~0.3s)
   → POST Ollama HTTP → response + feedback JSON      (~1.5s)
   → POST Kokoro Docker HTTP → TTS audio              (~0.3s)
   → publishes TTS audio track to room
   → sends LiveKit data message: { type: 'feedback', ... }

5. Browser
   → plays TTS audio track (AI response)
   → receives data message → renders feedback overlay

6. [leca-agent] → POST /api/sessions/{id}/turns (leca-api)
   NestJS: persists turn; enqueues BullMQ jobs:
   → pronunciation job: Wav2Vec2 → phoneme scores → DB
                        → LiveKit data msg → browser UI (1–2s later)
   → vocabulary job:    gap detection → upsert user_vocabulary

Total E2E (audio in → audio out): ~2.1s P50, < 3s P95 ✓
```

---

## 3. Component Breakdown

### 3.1 Frontend Modules

| Module | Responsibility | Key Dependencies |
|--------|---------------|-----------------|
| `app/conversation` | Push-to-talk UI, LiveKit room join, feedback overlay, pronunciation highlights | LiveKit Browser SDK |
| `app/scenarios` | Browse, search, filter, select scenarios; display vocab panel | REST API, shadcn/ui |
| `app/progress` | Learner session history, pronunciation trend charts, weak areas | REST API, Recharts |
| `app/educator` | Class roster, per-student metrics, export trigger | REST API |
| `app/admin` | Account management, class codes, system health (self-host) | REST API |

### 3.2 Backend Modules

| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| `auth` | Registration, login, JWT issue/refresh, guest sessions, LiveKit token generation | `auth.module.ts`, `auth.service.ts`, `auth.controller.ts` |
| `assessment` | Initial spoken level assessment (2-min conversation), sets `users.level`; minimal pair drill triggers (FR-AUTH-03, FR-PRON-04) | `assessment.module.ts`, `assessment.service.ts`, `assessment.controller.ts` |
| `conversation` | LiveKit room lifecycle, STT→LLM→TTS pipeline orchestration, session CRUD; per-turn feedback (fluency, naturalness, vocabulary, explanation) | `conversation.module.ts`, `conversation.service.ts` |
| `pronunciation` | BullMQ background job, Wav2Vec2 via onnxruntime-node, phoneme scoring, trend computation | `pronunciation.module.ts`, `pronunciation.processor.ts`, `pronunciation.service.ts` |
| `vocabulary` | Scenario phrase sets (Everyday/Work), post-session gap detection (phrases used vs missed), per-user vocabulary bank | `vocabulary.module.ts`, `vocabulary.service.ts`, `vocabulary.processor.ts` |
| `scenario` | CRUD, PostgreSQL FTS search, rating, review queue | `scenario.module.ts`, `scenario.service.ts`, `scenario.controller.ts` |
| `progress` | Session history aggregation; pronunciation + fluency + naturalness trend; weak-area linking to practice scenarios; educator flagging | `progress.module.ts`, `progress.service.ts` |
| `admin` | Account management, class management, health checks | `admin.module.ts`, `admin.controller.ts` |

> **Listening comprehension** không phải module riêng — nó là luồng chính của `conversation`: AI phát TTS audio qua LiveKit, browser **không hiển thị transcript real-time** (no text crutch), buộc learner phải nghe. Speech pace được Ollama calibrate theo `users.level`. Đây là UX policy, không phải backend module.

---

## 4. Low-Level Architecture (LLD)

### 4.1 AI Pipeline — leca-agent (TypeScript / Node.js)

The agent is a **standalone Node.js / TypeScript process** (`packages/agent/`) that uses `livekit-client` npm to join rooms as a participant — same as the browser SDK but running server-side.

```typescript
// agent/src/index.ts — entry point, listens for room dispatch from leca-api
import { Room, RoomEvent, RemoteTrackPublication, Track } from 'livekit-client';

async function runAgent(roomName: string, livekitUrl: string, agentToken: string) {
  const room = new Room();
  await room.connect(livekitUrl, agentToken);

  room.on(RoomEvent.TrackSubscribed, async (track, publication, participant) => {
    if (track.kind !== Track.Kind.Audio) return;

    // Buffer audio until VAD signals speech end
    const audioBuffer = await bufferSpeech(track);  // VAD via livekit built-in
    await handleTurn(room, audioBuffer);
  });
}

async function handleTurn(room: Room, audioBuffer: Buffer): Promise<void> {
  const http = axios.create();

  // 1. STT — Whisper Docker
  const { data: { text: transcript } } = await http.post(
    `${process.env.WHISPER_URL}/inference`,
    { audio: audioBuffer.toString('base64') },
  );

  // 2. LLM — Ollama
  const ollama = new Ollama({ host: process.env.OLLAMA_URL });
  const { message } = await ollama.chat({
    model: 'llama3:8b-instruct-q4_K_M',
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      ...conversationHistory,
      { role: 'user', content: transcript },
    ],
  });
  const { response, feedback } = parseResponse(message.content);

  // 3. TTS — Kokoro Docker → publish audio track to room
  const { data: ttsAudio } = await http.post(
    `${process.env.KOKORO_URL}/synthesize`,
    { text: response },
    { responseType: 'arraybuffer' },
  );
  await publishAudioTrack(room, ttsAudio);       // livekit-client publish

  // 4. Send feedback as LiveKit data message → browser UI
  await room.localParticipant.publishData(
    new TextEncoder().encode(JSON.stringify({ type: 'feedback', ...feedback })),
  );

  // 5. Persist turn via leca-api REST (agent is not connected to DB directly)
  await http.post(`${process.env.API_URL}/api/sessions/${sessionId}/turns`, {
    transcript, aiResponse: response, feedback,
    audioBuffer: audioBuffer.toString('base64'),   // for BullMQ pronunciation job
  });
}
```

**Key design:** `leca-agent` has **no direct DB access** — it calls `leca-api` REST endpoints to persist data. DB writes + BullMQ jobs are always owned by `leca-api`.

### 4.2 Conversation Module (NestJS API) — Session + Token Management

NestJS `ConversationService` handles **session lifecycle only** — no audio processing.

```typescript
// conversation.service.ts
@Injectable()
export class ConversationService {
  private livekit = new RoomServiceClient(
    process.env.LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
  );

  async createSession(userId: string, scenarioId?: string): Promise<SessionResponse> {
    const session = await this.db.sessions.create({ userId, scenarioId });
    const roomName = `session-${session.id}`;

    // 1. Create LiveKit room
    await this.livekit.createRoom({ name: roomName, emptyTimeout: 300 });

    // 2. Generate browser token
    const browserToken = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity: userId });
    browserToken.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    // 3. Dispatch agent into room (agent generates its own token and connects)
    await this.http.axiosRef.post(`${process.env.AGENT_URL}/dispatch`, { roomName, sessionId: session.id });

    return { sessionId: session.id, livekitToken: browserToken.toJwt(), livekitUrl: process.env.LIVEKIT_URL };
  }

  // Called by leca-agent via REST after each conversation turn
  async persistTurn(sessionId: string, dto: CreateTurnDto): Promise<void> {
    const turn = await this.db.turns.create({
      sessionId, transcript: dto.transcript, aiResponse: dto.aiResponse, feedback: dto.feedback,
    });
    // Enqueue background jobs
    await this.pronunciationQueue.add('analyze', { turnId: turn.id, audioBuffer: dto.audioBuffer, transcript: dto.transcript });
    await this.vocabularyQueue.add('gap-detect', { sessionId, userId: dto.userId, scenarioId: dto.scenarioId });
  }
}
```

### 4.3 Pronunciation Service — BullMQ Background Job

```typescript
// pronunciation.service.ts
@Injectable()
export class PronunciationService {
  private ortSession: ort.InferenceSession;

  async onModuleInit() {
    this.ortSession = await ort.InferenceSession.create('./models/wav2vec2-base.onnx');
  }

  async getWeakAreas(userId: string, lastN = 10): Promise<WeakArea[]> {
    return this.db.$queryRaw`
      SELECT phoneme, AVG(score) as avg_score
      FROM pronunciation_scores
      WHERE user_id = ${userId}
      GROUP BY phoneme
      ORDER BY avg_score ASC
      LIMIT 3
    `;
  }
}
```

Pronunciation chạy **hoàn toàn server-side** dưới dạng background job — không cần gửi gì từ browser, không cần WASM.

### 4.4 Scenario Module — Schema & Search

```typescript
// scenario.service.ts
@Injectable()
export class ScenarioService {
  async search(query: string, filters: ScenarioFilters): Promise<Scenario[]> {
    // PostgreSQL full-text search — index: gin(to_tsvector('english', title || ' ' || content->>'context'))
    return this.db.$queryRaw`
      SELECT * FROM scenarios
      WHERE status = 'approved'
        AND to_tsvector('english', title || ' ' || content->>'context') @@ plainto_tsquery(${query})
        AND (${filters.difficulty}::text IS NULL OR difficulty = ${filters.difficulty})
      ORDER BY rating_sum / NULLIF(rating_count, 0) DESC
      LIMIT 20
    `;
  }
}

// scenario.dto.ts — mirrors FR-SCEN-03 schema exactly
export class ScenarioDto {
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  context: string;
  aiRole: string;
  openingLine: string;
  vocabulary: VocabEntryDto[];   // { phrase, example, situationType: 'everyday' | 'work' }
  tags: string[];
  authorGithub: string;
  version: string;               // semver
}
```

### 4.5 Auth Module — JWT + Guest Sessions

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  async register(email: string, password: string) {
    const hash = await bcrypt.hash(password, 12);   // cost factor 12 (NFR-SEC-02)
    return this.db.users.create({ email, passwordHash: hash });
  }

  async login(email: string, password: string) {
    const user = await this.db.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException();
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role, level: user.level }, { expiresIn: '15m' });
    const refreshToken = randomBytes(32).toString('hex');
    await this.redis.set(`refresh:${refreshToken}`, user.id, 'EX', 60 * 60 * 24 * 30);
    return { accessToken, refreshToken };
  }

  generateLivekitToken(roomName: string, userId: string): string {
    const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity: userId });
    token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    return token.toJwt();
  }
}
```

### 4.6 Progress Module — Aggregation Logic

```typescript
// progress.service.ts
async computeWeakAreas(userId: string, lastN = 10): Promise<WeakArea[]> {
  // 1. Fetch pronunciation_scores for last N sessions
  // 2. Group by phoneme_category (/th/, /r/, /v/ etc.)
  // 3. Compute mean score per category
  // 4. Return bottom 3 with score < 70, linked to practice scenarios
  return this.db.$queryRaw`
    SELECT ps.phoneme, AVG(ps.score) as avg_score
    FROM pronunciation_scores ps
    JOIN sessions s ON ps.session_id = s.id
    WHERE ps.user_id = ${userId}
    AND s.started_at > NOW() - INTERVAL '${lastN} sessions'
    GROUP BY ps.phoneme
    HAVING AVG(ps.score) < 70
    ORDER BY avg_score ASC
    LIMIT 3
  `;
}

async flagDecliningStudents(classId: string): Promise<StudentFlag[]> {
  // For each student: compute score delta over last 5 sessions
  // Flag if delta < -10 points (FR-DASH-07)
}
```

### 4.7 Vocabulary Module — Post-Session Gap Detection (BRD 8.6)

```typescript
// vocabulary.processor.ts — BullMQ job triggered after session.complete
@Processor('vocabulary')
export class VocabularyProcessor {
  @Process('gap-detect')
  async detectGap(job: Job<{ sessionId: string; userId: string; scenarioId: string }>) {
    const { sessionId, userId, scenarioId } = job.data;

    // 1. Load scenario vocabulary list
    const scenario = await this.db.scenarios.findUnique({ where: { id: scenarioId } });
    const phraseList: VocabEntry[] = scenario.content.vocabulary; // [{phrase, example, situationType}]

    // 2. Aggregate all turn transcripts for this session
    const turns = await this.db.turns.findMany({ where: { sessionId }, select: { transcript: true } });
    const combinedTranscript = turns.map(t => t.transcript).join(' ').toLowerCase();

    // 3. For each phrase: encountered (appeared in AI responses) vs used (learner said it)
    const results = phraseList.map(entry => {
      const phrase = entry.phrase.toLowerCase();
      const usedByLearner = turns.some(t => t.transcript.toLowerCase().includes(phrase));
      const encounteredInSession = combinedTranscript.includes(phrase);
      return { phrase, situationType: entry.situationType, usedByLearner, encounteredInSession };
    });

    // 4. Upsert into user_vocabulary bank
    for (const r of results) {
      await this.db.userVocabulary.upsert({
        where: { userId_scenarioId_phrase: { userId, scenarioId, phrase: r.phrase } },
        update: {
          status: r.usedByLearner ? 'used' : r.encounteredInSession ? 'encountered' : undefined,
          encounter_count: r.encounteredInSession ? { increment: 1 } : undefined,
          use_count: r.usedByLearner ? { increment: 1 } : undefined,
          last_seen_at: new Date(),
        },
        create: {
          userId, scenarioId,
          phrase: r.phrase,
          situation_type: r.situationType,
          status: r.usedByLearner ? 'used' : r.encounteredInSession ? 'encountered' : 'new',
          encounter_count: r.encounteredInSession ? 1 : 0,
          use_count: r.usedByLearner ? 1 : 0,
          last_seen_at: new Date(),
        },
      });
    }
  }
}

// vocabulary.service.ts
@Injectable()
export class VocabularyService {
  async getGapReport(userId: string, sessionId: string) {
    const session = await this.db.sessions.findUnique({ where: { id: sessionId }, include: { scenario: true } });
    const bank = await this.db.userVocabulary.findMany({
      where: { userId, scenarioId: session.scenarioId },
    });
    return {
      used: bank.filter(v => v.status === 'used' || v.status === 'mastered'),
      missed: bank.filter(v => v.status === 'new' || v.status === 'encountered'),
      masteryRate: Math.round(bank.filter(v => v.use_count >= 3).length / bank.length * 100),
    };
  }
}
```

**Trigger**: `VocabularyProcessor` is enqueued from `ConversationService` when `POST /api/sessions/{id}/complete` is called — same BullMQ infrastructure as pronunciation jobs.

**Status progression**: `new` → `encountered` (AI used it) → `used` (learner used it) → `mastered` (used ≥ 3 sessions).

---

## 5. Database Schema (ERD)

```sql
-- Users & Auth
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,               -- bcrypt cost 12
    role        TEXT NOT NULL DEFAULT 'learner', -- learner | educator | admin
    level       TEXT NOT NULL DEFAULT 'beginner', -- beginner | intermediate | advanced
    accent_profile JSONB,                      -- accent calibration data (FR-PRON-05)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ                    -- soft delete for GDPR
);

-- Scenarios
CREATE TABLE scenarios (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    difficulty  TEXT NOT NULL,
    content     JSONB NOT NULL,                -- {context, ai_role, opening_line, vocabulary}
    tags        TEXT[] NOT NULL DEFAULT '{}',
    author_id   UUID REFERENCES users(id),
    version     TEXT NOT NULL DEFAULT '1.0.0',
    status      TEXT NOT NULL DEFAULT 'pending', -- pending | approved | flagged
    rating_sum  INTEGER NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX scenarios_fts_idx ON scenarios
    USING gin(to_tsvector('english', title || ' ' || (content->>'context')));
CREATE INDEX scenarios_status_idx ON scenarios(status);

-- Conversation Sessions
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),  -- NULL for guest
    scenario_id     UUID REFERENCES scenarios(id), -- NULL for Free Talk
    mode            TEXT NOT NULL,              -- free_talk | scenario
    status          TEXT NOT NULL DEFAULT 'active', -- active | completed | abandoned
    speaking_time_s INTEGER NOT NULL DEFAULT 0,
    turn_count      INTEGER NOT NULL DEFAULT 0,
    aggregate_score INTEGER,                    -- 0–100, computed on completion
    summary         JSONB,                      -- {top_improvements, weak_phonemes}
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at        TIMESTAMPTZ
);
CREATE INDEX sessions_user_idx ON sessions(user_id, started_at DESC);

-- Conversation Turns
CREATE TABLE turns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id),
    turn_number     INTEGER NOT NULL,
    transcript      TEXT NOT NULL,
    ai_response     TEXT NOT NULL,
    feedback        JSONB NOT NULL,             -- {fluency, naturalness, vocabulary, explanation}
    speaking_time_s INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX turns_session_idx ON turns(session_id, turn_number);

-- Pronunciation Scores
CREATE TABLE pronunciation_scores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turn_id     UUID NOT NULL REFERENCES turns(id),
    session_id  UUID NOT NULL REFERENCES sessions(id),
    user_id     UUID REFERENCES users(id),
    word        TEXT NOT NULL,
    phoneme     TEXT NOT NULL,                  -- IPA symbol
    score       INTEGER NOT NULL,               -- 0–100
    deviation   TEXT NOT NULL,                  -- correct | close | incorrect
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pron_user_session_idx ON pronunciation_scores(user_id, session_id);
CREATE INDEX pron_phoneme_idx ON pronunciation_scores(user_id, phoneme);

-- Classes (Educator)
CREATE TABLE classes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    educator_id     UUID NOT NULL REFERENCES users(id),
    name            TEXT NOT NULL,
    code            CHAR(6) NOT NULL UNIQUE,    -- cryptographically random (FR-SEC-07)
    code_expires_at TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX classes_code_idx ON classes(code);

-- Class Enrollments
CREATE TABLE class_enrollments (
    class_id    UUID NOT NULL REFERENCES classes(id),
    learner_id  UUID NOT NULL REFERENCES users(id),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (class_id, learner_id)
);

-- Level Assessments (FR-AUTH-03)
CREATE TABLE level_assessments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    session_id      UUID REFERENCES sessions(id),   -- the assessment conversation session
    assessed_level  TEXT NOT NULL,                   -- beginner | intermediate | advanced
    fluency_score   INTEGER NOT NULL,                -- 0–100
    vocab_score     INTEGER NOT NULL,                -- 0–100
    pron_score      INTEGER NOT NULL,                -- 0–100
    assessed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Vocabulary Bank (BRD 8.6 — per-user phrase tracking)
CREATE TABLE user_vocabulary (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    scenario_id     UUID NOT NULL REFERENCES scenarios(id),
    phrase          TEXT NOT NULL,
    situation_type  TEXT NOT NULL,                   -- everyday | work
    status          TEXT NOT NULL DEFAULT 'new',     -- new | encountered | used | mastered
    encounter_count INTEGER NOT NULL DEFAULT 0,
    use_count       INTEGER NOT NULL DEFAULT 0,
    last_seen_at    TIMESTAMPTZ,
    mastered_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX user_vocab_user_idx ON user_vocabulary(user_id, status);
CREATE INDEX user_vocab_scenario_idx ON user_vocabulary(user_id, scenario_id);

-- Scenario Ratings
CREATE TABLE scenario_ratings (
    scenario_id UUID NOT NULL REFERENCES scenarios(id),
    user_id     UUID NOT NULL REFERENCES users(id),
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    rated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (scenario_id, user_id)
);
```

**ERD Summary:**

```
users ────────────┬──── sessions ──── turns ──── pronunciation_scores
                  │         │
                  ├──── classes ──── class_enrollments ──► users
                  │
                  └──── scenarios ──── scenario_ratings ──► users
```

---

## 6. API Contracts

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Email + password registration |
| POST | `/api/auth/login` | None | Returns access_token + sets refresh_token cookie |
| POST | `/api/auth/refresh` | Cookie | Returns new access_token |
| POST | `/api/auth/logout` | Bearer | Invalidates refresh_token |
| DELETE | `/api/auth/account` | Bearer | GDPR account + data deletion |

### Conversation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/sessions` | Bearer/Guest | Create session + LiveKit room, returns `{session_id, livekit_token, livekit_url}` |
| GET | `/api/sessions/{id}` | Bearer | Get session details and summary |
| POST | `/api/sessions/{id}/complete` | Bearer | End session, trigger summary computation |

### Scenarios

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/scenarios` | None | List with `?q=`, `?category=`, `?difficulty=`, `?situation=` |
| GET | `/api/scenarios/{id}` | None | Full scenario with vocabulary |
| POST | `/api/scenarios` | Bearer | Submit new scenario (enters review queue) |
| POST | `/api/scenarios/{id}/rate` | Bearer | Rate 1–5 stars |
| PATCH | `/api/scenarios/{id}/flag` | Admin | Flag for pedagogical review |

### Progress

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/progress/sessions` | Bearer | Session history (paginated) |
| GET | `/api/progress/pronunciation-trend` | Bearer | Rolling score over last 30 sessions |
| GET | `/api/progress/weak-areas` | Bearer | Top 3 weak phoneme categories |
| GET | `/api/progress/report` | Bearer | Shareable report URL (expires 30 days) |

### Vocabulary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/vocabulary/bank` | Bearer | Per-user vocabulary bank with status (new/encountered/used/mastered) |
| GET | `/api/vocabulary/bank?situation=everyday\|work` | Bearer | Filter by situation type |
| GET | `/api/vocabulary/gap-report/{sessionId}` | Bearer | Post-session report: which phrases from scenario vocab were used vs missed |
| POST | `/api/vocabulary/practice` | Bearer | Trigger minimal pair drill or sentence fill-in for specific phrases |

### Assessment

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/assessment/start` | Bearer | Create 2-min assessment conversation session (FR-AUTH-03) |
| POST | `/api/assessment/{id}/complete` | Bearer | End assessment, compute level, update `users.level` |
| GET | `/api/assessment/history` | Bearer | Past assessments and level progression |

### Educator

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/classes` | Educator | Create class, generates 6-char code |
| GET | `/api/classes/{id}/roster` | Educator | Per-student progress metrics |
| GET | `/api/classes/{id}/export` | Educator | CSV/PDF export |
| POST | `/api/classes/join` | Bearer | Learner joins via class code |

---

## 7. AI Pipeline Design

```
[Browser] Opus audio (WebRTC)
     ↓
[LiveKit Server] route to NestJS
     ↓
[NestJS ConversationService]
     ├─ Whisper Docker HTTP  → transcript              (~0.3s)
     ├─ Ollama LLaMA 3 8B Q4 → response + feedback    (~1.5s)
     ├─ Kokoro Docker HTTP   → TTS audio → LiveKit     (~0.3s)
     └─ BullMQ job           → Wav2Vec2 background     (async, ~0.5s)
                                    ↓
                             pronunciation_scores DB
                                    ↓
                             LiveKit data message → browser UI

Total E2E (audio in → audio out): ~2.1s P50, < 3s P95 ✓
Pronunciation feedback: hiện sau ~1–2s (acceptable UX)
```

**Ollama system prompt:**
```
You are an English language tutor. Learner level: {level}.
Respond naturally in English (max 4 sentences).
Then output exactly this JSON on a new line:
{"fluency":"...","naturalness":"...","vocabulary":"...","explanation":"..."}
Do not over-correct accent. Goal is intelligibility, not native-speaker mimicry.
```

---

## 8. Deployment Architecture

### Phase 0 — Single Machine

```
Mac Mini M4 8GB
├── Docker: leca-web   (Next.js, port 3000)
├── Docker: leca-api   (NestJS, port 8000)
├── Docker: leca-agent (Node.js AI agent, port 8001 internal)
├── Docker: livekit    (LiveKit server, port 7880 WebRTC / 7881 TURN)
├── Docker: whisper    (whisper.cpp HTTP server, port 9000)
├── Docker: kokoro     (Kokoro TTS HTTP server, port 9001)
├── Docker: postgres   (port 5432)
├── Docker: redis      (port 6379)
├── Ollama (native macOS, port 11434) — outside Docker for Metal GPU access
└── cloudflared tunnel → leca.devinnguyen.io (or similar)
```

### Phase 1 — Cloud VPS (Weeks 7–16)

```
VPS (4 vCPU / 8GB RAM, ~$30/month — cần RAM cho Ollama)
├── Docker: leca-api (NestJS)
├── Docker: leca-web (Next.js)
├── Docker: livekit  (LiveKit server)
├── Docker: whisper  (whisper.cpp HTTP server)
├── Docker: kokoro   (Kokoro TTS HTTP server)
├── Docker: ollama   (LLaMA 3 8B Q4 — ~5GB RAM)
├── Docker: postgres
├── Docker: redis
└── Nginx reverse proxy + TLS termination
```

### Self-Host (Institutional)

```yaml
# docker-compose.yml
services:
  web:
    image: ghcr.io/leca-ai/leca-web:latest
    ports: ["3000:3000"]

  api:
    image: ghcr.io/leca-ai/leca-api:latest
    ports: ["8000:8000"]
    environment:
      - LIVEKIT_URL=ws://livekit:7880
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
      - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
      - AGENT_URL=http://agent:8001
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379

  agent:
    image: ghcr.io/leca-ai/leca-agent:latest
    ports: ["8001:8001"]                          # internal only: receives dispatch from leca-api
    environment:
      - LIVEKIT_URL=ws://livekit:7880
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
      - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
      - WHISPER_URL=http://whisper:9000
      - KOKORO_URL=http://kokoro:9001
      - OLLAMA_URL=http://ollama:11434
      - API_URL=http://api:8000

  whisper:
    image: ghcr.io/ggerganov/whisper.cpp:server
    command: --model /models/ggml-small.bin --port 9000
    volumes: ["./models:/models"]

  kokoro:
    image: ghcr.io/leca-ai/kokoro-server:latest
    ports: ["9001:9001"]

  livekit:
    image: livekit/livekit-server:latest
    ports:
      - "7880:7880"   # WebSocket / HTTP
      - "7881:7881"   # TURN/TLS
      - "50000-50020:50000-50020/udp"  # WebRTC UDP range
    volumes: ["./livekit.yaml:/etc/livekit.yaml"]
    command: --config /etc/livekit.yaml

  postgres:
    image: postgres:16
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine

  ollama:
    image: ollama/ollama
    volumes: ["ollama_models:/root/.ollama"]
```

---

## 9. Tech Stack Selection

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14 (App Router) + next-pwa | React/JSX ecosystem → lowest barrier cho OSS contributors; SSR + code splitting |
| **Backend API** | NestJS (Node.js / TypeScript) | TypeScript end-to-end; modular; OpenAPI via @nestjs/swagger |
| **AI Agent** | leca-agent (Node.js / TypeScript, `livekit-client`) | Joins LiveKit rooms as participant, subscribes audio, runs STT→LLM→TTS, no DB access |
| **Real-time Audio** | LiveKit (self-hosted, Apache 2.0) | WebRTC: Opus codec, echo cancel, VAD, jitter buffer |
| **LiveKit SDK (API)** | livekit-server-sdk (npm) | Token generation, room management — used by leca-api |
| **LiveKit SDK (Agent)** | livekit-client (npm) | Participant join + subscribe/publish tracks — used by leca-agent |
| **Job Queue** | BullMQ + Redis | Pronunciation + vocabulary background jobs |
| **ORM** | Prisma | TypeScript-first, type-safe DB queries, migration tooling |
| **Database** | PostgreSQL 16 | Relational model, built-in FTS, JSONB |
| **Cache / Sessions** | Redis 7 | Rate limiting, session store, scenario cache, BullMQ |
| **Container** | Docker Compose | Self-hosting; single `docker compose up` (FR-SELF-01) |
| **STT** | whisper.cpp (Docker HTTP server) | Self-hosted, fast trên CPU, HTTP API |
| **LLM** | Ollama + LLaMA 3 8B Q4_K_M | On-device, REST API, `ollama` npm package, $0 cost |
| **TTS** | Kokoro (Docker HTTP server) | Self-hosted, natural voice, HTTP API |
| **Pronunciation** | Wav2Vec2 via onnxruntime-node (BullMQ job in leca-api) | Server-side, background, không block real-time pipeline |
| **Auth** | @nestjs/jwt + bcrypt | Stateless API, refresh tokens in Redis |
| **Validation** | class-validator + sanitize-html | DTO validation; XSS sanitization |
| **Reverse Proxy** | Nginx | TLS termination, WebSocket proxying |
| **Tunnel (Phase 0)** | Cloudflare Tunnel | Free, không cần static IP |
| **CI/CD** | GitHub Actions | OSS standard, free cho public repos |

---

## 10. Non-Functional Considerations

### Performance Budget

| Bottleneck | Target | Ghi chú |
|-----------|--------|---------|
| STT (Whisper Docker) | ~0.3s | whisper-small model |
| LLM (Ollama LLaMA 3 8B Q4) | ~1.5s | ~35 tok/s trên Mac Mini M4 Metal |
| TTS (Kokoro Docker) | ~0.3s | first chunk |
| **Total E2E (audio in → audio out)** | **< 3s P95** ✓ | |
| Pronunciation (BullMQ background) | ~0.5s | async, không block pipeline |

### Scaling

- Phase 0: Mac Mini M4, 1–2 concurrent sessions
- Phase 1: VPS với Ollama — bottleneck là LLM inference (~1 concurrent/CPU thread). Scale bằng cách thêm VPS + load balancer khi cần.
- Phase 2+: Nếu cần scale lớn hơn, migrate LLM sang GPU server hoặc managed API (Groq, Together AI).

- Phase 2+ eliminates server-side AI cost entirely: server handles only auth + DB persistence.

### Security Implementation

- TLS 1.3 enforced at Nginx (NFR-SEC-01)
- bcrypt cost 12 for passwords via `bcrypt` npm package (NFR-SEC-02)
- Rate limiting: `@nestjs/throttler` → Redis counter per `userId` or `deviceId` (NFR-SEC-05)
- XSS sanitization: scenario content sanitized with `sanitize-html` before storage and on render (NFR-SEC-06)
- Class codes: `crypto.randomBytes(4).toString('base64url').slice(0,6)` → cryptographically random (NFR-SEC-07)
- Self-host admin port: internal Docker network only, not exposed in `docker-compose.yml` by default (NFR-SEC-08)

### GDPR Compliance

- `DELETE /api/auth/account` → soft-delete user row, cascade delete sessions/turns/pronunciation_scores (NFR-COMP-01)
- Data export: `GET /api/auth/account/export` → ZIP of all user data as JSON
- Audio not persisted beyond session in Phase 0/1 (NFR-SEC-03)

---

*Next deliverables in SDLC Phase 3 (System Design): ERD diagram (visual), API OpenAPI spec, UI wireframe finalization.*
