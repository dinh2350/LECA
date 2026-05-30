# P1 · Conversation Turn Persistence + Post-Turn Feedback Implementation Plan

> **For agentic workers:** Execute with superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. One commit per task. Write the failing test first in every task.

**Goal:** Close the conversation learning loop. Today the agent talks but persists nothing. After this plan: every learner/agent turn is written to the `turns` table with structured `feedback` JSON, the API exposes `POST /conversation-sessions/:id/turns`, and the learner sees per-turn feedback live over the LiveKit data channel. This unlocks P2 (pronunciation), P3 (summary/dashboard) and P6 (vocabulary), which all read `turns`.

**FRs:** FR-CONV-04 (gentle correction surfaced as feedback), FR-CONV-08 (turn + transcript persisted), FR-CONV-11 (feedback non-blocking). Data flow: ARCHITECTURE §4.3.

**Architecture:** Three apps change. `apps/agent` generates feedback from the LLM and POSTs turns to the API after each exchange + publishes feedback on the LiveKit data channel. `apps/api` adds a turns endpoint guarded by a shared agent key. `apps/web` listens for feedback data messages and renders them. Shared zod contract in `packages/schemas`.

**Tech Stack:** NestJS + Prisma (`ConversationTurn` model → `turns` table, `feedback Json?`), `@livekit/agents` voice agent, OpenAI-compatible LLM (Ollama), `@livekit/components-react`, zod.

---

## File Map

| Action | Path | App |
|--------|------|-----|
| New | `packages/schemas/src/turn.schema.ts` | schemas |
| Modify | `packages/schemas/src/index.ts` | schemas |
| New | `apps/api/src/conversation-sessions/dto/record-turns.dto.ts` | api |
| New | `apps/api/src/conversation-sessions/guards/agent-api-key.guard.ts` | api |
| New | `apps/api/src/conversation-sessions/guards/agent-api-key.guard.spec.ts` | api |
| Modify | `apps/api/src/conversation-sessions/conversation-sessions.controller.ts` | api |
| Modify | `apps/api/src/conversation-sessions/conversation-sessions.service.ts` | api |
| Modify | `apps/api/src/conversation-sessions/conversation-sessions.service.spec.ts` | api |
| Modify | `apps/api/src/config/config.type.ts` + agent config registration | api |
| New | `apps/agent/src/feedback.ts` | agent |
| New | `apps/agent/src/feedback.spec.ts` | agent |
| New | `apps/agent/src/leca-api-client.ts` | agent |
| New | `apps/agent/src/leca-api-client.spec.ts` | agent |
| Modify | `apps/agent/src/agent.ts` | agent |
| Modify | `apps/agent/src/config.ts` | agent |
| Modify | `apps/web/src/app/[language]/conversation/page-content.tsx` | web |

---

## Task 1 — Shared turn/feedback zod contract

**Files:**
- Create `packages/schemas/src/turn.schema.ts`
- Modify `packages/schemas/src/index.ts`
- Test `packages/schemas/src/turn.schema.spec.ts`

- [ ] Write failing test `packages/schemas/src/turn.schema.spec.ts`:
```ts
import { recordTurnsSchema, turnFeedbackSchema } from './turn.schema';

describe('turn schemas', () => {
  it('accepts a valid feedback object', () => {
    const ok = turnFeedbackSchema.safeParse({
      fluency: 80,
      naturalness: 75,
      vocabulary: 60,
      explanation: 'Good rhythm. Try "I would like" instead of "I want".',
    });
    expect(ok.success).toBe(true);
  });

  it('rejects out-of-range scores', () => {
    expect(turnFeedbackSchema.safeParse({ fluency: 120, naturalness: 1, vocabulary: 1, explanation: 'x' }).success).toBe(false);
  });

  it('requires at least one turn with a non-empty transcript', () => {
    expect(recordTurnsSchema.safeParse({ turns: [] }).success).toBe(false);
    expect(
      recordTurnsSchema.safeParse({ turns: [{ speaker: 'learner', transcript: 'hi', turnIndex: 0 }] }).success,
    ).toBe(true);
  });
});
```
- [ ] Run `pnpm --filter @leca/schemas test` → expect FAIL (module missing).
- [ ] Create `packages/schemas/src/turn.schema.ts`:
```ts
import { z } from 'zod';

export const turnFeedbackSchema = z.object({
  fluency: z.number().int().min(0).max(100),
  naturalness: z.number().int().min(0).max(100),
  vocabulary: z.number().int().min(0).max(100),
  explanation: z.string().min(1).max(500),
});
export type TurnFeedback = z.infer<typeof turnFeedbackSchema>;

export const recordTurnSchema = z.object({
  speaker: z.enum(['learner', 'agent']),
  transcript: z.string().min(1),
  turnIndex: z.number().int().min(0),
  durationMs: z.number().int().min(0).optional(),
  feedback: turnFeedbackSchema.nullish(),
});
export type RecordTurnInput = z.infer<typeof recordTurnSchema>;

export const recordTurnsSchema = z.object({
  turns: z.array(recordTurnSchema).min(1).max(2),
});
export type RecordTurnsInput = z.infer<typeof recordTurnsSchema>;
```
- [ ] Add to `packages/schemas/src/index.ts`: `export * from './turn.schema';`
- [ ] Run test → expect PASS.
- [ ] Commit: `feat(schemas): add turn + feedback contract`

---

## Task 2 — Agent API-key guard for the turns endpoint

The agent is a trusted backend service, not a JWT user. It authenticates with a shared secret header `x-leca-agent-key`.

**Files:**
- Create `apps/api/src/conversation-sessions/guards/agent-api-key.guard.ts`
- Test `apps/api/src/conversation-sessions/guards/agent-api-key.guard.spec.ts`
- Modify config types to expose `agent.apiKey`.

- [ ] Add config: in the existing app config (mirror how `livekit.*` is registered), register `agent: { apiKey: process.env.LECA_AGENT_API_KEY }` and add `agent: { apiKey: string }` to `AllConfigType`.
- [ ] Write failing test `agent-api-key.guard.spec.ts`:
```ts
import { UnauthorizedException } from '@nestjs/common';
import { AgentApiKeyGuard } from './agent-api-key.guard';

const ctx = (key?: string) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ headers: key ? { 'x-leca-agent-key': key } : {} }) }) }) as any;

describe('AgentApiKeyGuard', () => {
  const config = { getOrThrow: () => 'secret' } as any;
  const guard = new AgentApiKeyGuard(config);

  it('allows a request with the correct key', () => {
    expect(guard.canActivate(ctx('secret'))).toBe(true);
  });
  it('rejects a missing key', () => {
    expect(() => guard.canActivate(ctx())).toThrow(UnauthorizedException);
  });
  it('rejects a wrong key', () => {
    expect(() => guard.canActivate(ctx('nope'))).toThrow(UnauthorizedException);
  });
});
```
- [ ] Run `pnpm --filter api test agent-api-key` → expect FAIL.
- [ ] Create `agent-api-key.guard.ts`:
```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';
import { AllConfigType } from '../../config/config.type';

@Injectable()
export class AgentApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AllConfigType>) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-leca-agent-key'];
    const expected = this.config.getOrThrow('agent.apiKey', { infer: true });
    if (typeof provided !== 'string') throw new UnauthorizedException('Missing agent key');
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid agent key');
    }
    return true;
  }
}
```
- [ ] Run test → expect PASS.
- [ ] Commit: `feat(api): add agent API-key guard`

---

## Task 3 — `recordTurns` service method

**Files:**
- Create `apps/api/src/conversation-sessions/dto/record-turns.dto.ts`
- Modify `conversation-sessions.service.ts`
- Modify `conversation-sessions.service.spec.ts`

- [ ] Create DTO `record-turns.dto.ts` (class-validator + swagger, mirrors zod):
```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsObject,
  IsOptional, IsString, Max, Min, MinLength, ValidateNested,
} from 'class-validator';

export class TurnFeedbackDto {
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsInt() @Min(0) @Max(100) fluency!: number;
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsInt() @Min(0) @Max(100) naturalness!: number;
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsInt() @Min(0) @Max(100) vocabulary!: number;
  @ApiProperty() @IsString() @MinLength(1) explanation!: string;
}

export class RecordTurnDto {
  @ApiProperty({ enum: ['learner', 'agent'] }) @IsEnum(['learner', 'agent']) speaker!: 'learner' | 'agent';
  @ApiProperty() @IsString() @MinLength(1) transcript!: string;
  @ApiProperty() @IsInt() @Min(0) turnIndex!: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) durationMs?: number;
  @ApiPropertyOptional({ type: TurnFeedbackDto }) @IsOptional() @IsObject() @ValidateNested() @Type(() => TurnFeedbackDto) feedback?: TurnFeedbackDto;
}

export class RecordTurnsDto {
  @ApiProperty({ type: [RecordTurnDto] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(2) @ValidateNested({ each: true }) @Type(() => RecordTurnDto)
  turns!: RecordTurnDto[];
}
```
- [ ] Add a failing test to `conversation-sessions.service.spec.ts`:
```ts
describe('recordTurns', () => {
  it('persists each turn with feedback and returns the count', async () => {
    prisma.conversationSession.findUnique.mockResolvedValue({ id: 's1', status: 'active' });
    prisma.conversationTurn.create.mockResolvedValue({});
    const result = await service.recordTurns('s1', {
      turns: [
        { speaker: 'learner', transcript: 'I want coffee', turnIndex: 0, feedback: { fluency: 70, naturalness: 65, vocabulary: 60, explanation: 'Try "I would like a coffee".' } },
        { speaker: 'agent', transcript: 'Sure! Here you go.', turnIndex: 1 },
      ],
    });
    expect(result).toEqual({ recorded: 2 });
    expect(prisma.conversationTurn.create).toHaveBeenCalledTimes(2);
    expect(prisma.conversationTurn.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sessionId: 's1', speaker: 'learner', turnIndex: 0, feedback: expect.any(Object) }) }),
    );
  });

  it('throws NotFound for an unknown session', async () => {
    prisma.conversationSession.findUnique.mockResolvedValue(null);
    await expect(service.recordTurns('nope', { turns: [{ speaker: 'agent', transcript: 'hi', turnIndex: 0 }] })).rejects.toThrow();
  });
});
```
> Ensure the spec's Prisma mock includes `conversationTurn: { create: jest.fn() }`.
- [ ] Run `pnpm --filter api test conversation-sessions.service` → expect FAIL.
- [ ] Implement in `conversation-sessions.service.ts`:
```ts
import { RecordTurnsDto } from './dto/record-turns.dto';
import { Prisma } from '@prisma/client';

async recordTurns(sessionId: string, dto: RecordTurnsDto): Promise<{ recorded: number }> {
  const session = await this.prisma.conversationSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

  for (const turn of dto.turns) {
    await this.prisma.conversationTurn.create({
      data: {
        sessionId,
        speaker: turn.speaker,
        transcript: turn.transcript,
        turnIndex: turn.turnIndex,
        durationMs: turn.durationMs ?? null,
        feedback: (turn.feedback as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }
  return { recorded: dto.turns.length };
}
```
- [ ] Run test → expect PASS.
- [ ] Commit: `feat(api): persist conversation turns with feedback`

---

## Task 4 — Expose `POST /conversation-sessions/:id/turns`

**Files:** Modify `conversation-sessions.controller.ts`.

- [ ] Add a controller e2e/unit assertion (extend controller spec if present, else add to service e2e). Minimum: add an endpoint that delegates to `service.recordTurns`.
- [ ] Implement endpoint (note: this route uses `AgentApiKeyGuard`, **not** the class-level JWT guard — apply the guard at method level and override):
```ts
import { RecordTurnsDto } from './dto/record-turns.dto';
import { AgentApiKeyGuard } from './guards/agent-api-key.guard';
import { ApiOkResponse, ApiSecurity } from '@nestjs/swagger';

/** Agent-only: persist the learner + agent turns of one exchange. */
@Post(':id/turns')
@UseGuards(AgentApiKeyGuard)
@ApiSecurity('agent-key')
@HttpCode(HttpStatus.OK)
@ApiOkResponse({ description: 'Turns recorded' })
recordTurns(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: RecordTurnsDto,
): Promise<{ recorded: number }> {
  return this.service.recordTurns(id, dto);
}
```
> Because the class is decorated `@UseGuards(AuthGuard('jwt'))`, method-level `@UseGuards(AgentApiKeyGuard)` **adds** a guard rather than replacing it. To allow agent-key-only auth, refactor: remove the class-level guard and apply `AuthGuard('jwt')` on `create`/`end` individually, leaving `recordTurns` on `AgentApiKeyGuard` only.
- [ ] Register `'agent-key'` in the Swagger `DocumentBuilder` (`.addApiKey({ type: 'apiKey', name: 'x-leca-agent-key', in: 'header' }, 'agent-key')`).
- [ ] Run `pnpm --filter api test conversation-sessions` and `pnpm --filter api build` → expect PASS.
- [ ] Commit: `feat(api): expose POST /conversation-sessions/:id/turns`

---

## Task 5 — Agent feedback generator (pure, testable)

**Files:**
- Create `apps/agent/src/feedback.ts`
- Test `apps/agent/src/feedback.spec.ts`

- [ ] Write failing test `feedback.spec.ts`:
```ts
import { parseFeedback, generateFeedback } from './feedback';

describe('parseFeedback', () => {
  it('parses fenced JSON', () => {
    const fb = parseFeedback('```json\n{"fluency":80,"naturalness":70,"vocabulary":60,"explanation":"Nice."}\n```');
    expect(fb).toEqual({ fluency: 80, naturalness: 70, vocabulary: 60, explanation: 'Nice.' });
  });
  it('throws on invalid JSON', () => {
    expect(() => parseFeedback('not json')).toThrow();
  });
});

describe('generateFeedback', () => {
  it('returns parsed feedback from the chat fn', async () => {
    const chat = jest.fn().mockResolvedValue('{"fluency":90,"naturalness":85,"vocabulary":80,"explanation":"Great."}');
    await expect(generateFeedback(chat, 'I goed to school')).resolves.toEqual(
      { fluency: 90, naturalness: 85, vocabulary: 80, explanation: 'Great.' },
    );
  });
  it('returns null when the model output is unusable (non-blocking)', async () => {
    const chat = jest.fn().mockResolvedValue('garbage');
    await expect(generateFeedback(chat, 'hello')).resolves.toBeNull();
  });
});
```
- [ ] Run `pnpm --filter agent test feedback` → expect FAIL.
- [ ] Create `feedback.ts`:
```ts
import { turnFeedbackSchema, type TurnFeedback } from '@leca/schemas';

export type ChatFn = (prompt: string) => Promise<string>;

export function buildFeedbackPrompt(userText: string): string {
  return [
    'You are an English tutor. Rate the learner utterance below.',
    'Respond with ONLY a compact JSON object, no prose, with integer keys',
    'fluency, naturalness, vocabulary (0-100) and a short "explanation" (<=2 sentences,',
    'mention one concrete improvement).',
    `Learner said: "${userText}"`,
  ].join(' ');
}

export function parseFeedback(raw: string): TurnFeedback {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in model output');
  const parsed = JSON.parse(body.slice(start, end + 1)) as unknown;
  return turnFeedbackSchema.parse(parsed);
}

export async function generateFeedback(chat: ChatFn, userText: string): Promise<TurnFeedback | null> {
  try {
    return parseFeedback(await chat(buildFeedbackPrompt(userText)));
  } catch {
    return null; // feedback is best-effort; never block the conversation (FR-CONV-11)
  }
}
```
- [ ] Run test → expect PASS.
- [ ] Commit: `feat(agent): add best-effort feedback generator`

---

## Task 6 — Agent → API turn client

**Files:**
- Create `apps/agent/src/leca-api-client.ts`
- Test `apps/agent/src/leca-api-client.spec.ts`
- Modify `apps/agent/src/config.ts` (add `apiUrl`, `agentApiKey`).

- [ ] Extend `config.ts`:
```ts
apiUrl: process.env.LECA_API_URL ?? 'http://localhost:3000/api',
agentApiKey: process.env.LECA_AGENT_API_KEY ?? 'devagentkey',
```
- [ ] Write failing test `leca-api-client.spec.ts`:
```ts
import { postTurns } from './leca-api-client';

describe('postTurns', () => {
  const turns = [{ speaker: 'learner' as const, transcript: 'hi', turnIndex: 0 }];

  it('POSTs to the turns endpoint with the agent key header', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    await postTurns(fetchMock as any, { apiUrl: 'http://api', agentApiKey: 'k' }, 's1', turns);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api/v1/conversation-sessions/s1/turns',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-leca-agent-key': 'k', 'content-type': 'application/json' }),
        body: JSON.stringify({ turns }),
      }),
    );
  });

  it('does not throw when the API errors (non-blocking)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(postTurns(fetchMock as any, { apiUrl: 'http://api', agentApiKey: 'k' }, 's1', turns)).resolves.toBeUndefined();
  });
});
```
- [ ] Run `pnpm --filter agent test leca-api-client` → expect FAIL.
- [ ] Create `leca-api-client.ts`:
```ts
import { log } from '@livekit/agents';
import type { RecordTurnInput } from '@leca/schemas';

export interface ApiClientConfig {
  apiUrl: string;
  agentApiKey: string;
}

export async function postTurns(
  fetchImpl: typeof fetch,
  cfg: ApiClientConfig,
  sessionId: string,
  turns: RecordTurnInput[],
): Promise<void> {
  try {
    const res = await fetchImpl(`${cfg.apiUrl}/v1/conversation-sessions/${sessionId}/turns`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-leca-agent-key': cfg.agentApiKey },
      body: JSON.stringify({ turns }),
    });
    if (!res.ok) log().warn({ sessionId, status: res.status }, 'postTurns failed');
  } catch (err) {
    log().warn({ sessionId, err: String(err) }, 'postTurns threw');
  }
}
```
- [ ] Run test → expect PASS.
- [ ] Commit: `feat(agent): add turn-reporting API client`

---

## Task 7 — Wire feedback + persistence into the agent

**Files:** Modify `apps/agent/src/agent.ts`.

- [ ] Inject dependencies through the constructor so the loop stays testable (add `chat: ChatFn` and `fetchImpl`/config). Replace the two log-only event handlers in `onEnter()` with the exchange tracker:
```ts
import { getJobContext, log, voice } from '@livekit/agents';
import type { RecordTurnInput, TurnFeedback } from '@leca/schemas';
import { generateFeedback, type ChatFn } from './feedback.js';
import { postTurns } from './leca-api-client.js';
import { config } from './config.js';

// inside the class, add fields:
private turnIndex = 0;
private pendingUser: { text: string; durationMs?: number } | null = null;

// in onEnter(), after obtaining `room`:
this.session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
  if (!ev.isFinal || !ev.transcript.trim()) return;
  this.pendingUser = { text: ev.transcript.trim() };
});

this.session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
  if (ev.item.role !== 'assistant' || ev.item.interrupted) return;
  const agentText = ev.item.textContent?.trim();
  const user = this.pendingUser;
  this.pendingUser = null;
  if (!agentText || !user) return;
  void this.persistExchange(room, user.text, agentText);
});
```
- [ ] Add the (best-effort, fire-and-forget) exchange method:
```ts
private async persistExchange(
  room: ReturnType<typeof getJobContext>['room'],
  userText: string,
  agentText: string,
): Promise<void> {
  const learnerIndex = this.turnIndex++;
  const agentIndex = this.turnIndex++;

  const feedback: TurnFeedback | null = await generateFeedback(this.chat, userText);

  if (feedback) {
    try {
      const payload = new TextEncoder().encode(JSON.stringify({ type: 'feedback', turnIndex: learnerIndex, feedback }));
      await room.localParticipant?.publishData(payload, { reliable: true });
    } catch (err) {
      log().warn({ err: String(err) }, 'publishData(feedback) failed');
    }
  }

  const turns: RecordTurnInput[] = [
    { speaker: 'learner', transcript: userText, turnIndex: learnerIndex, feedback: feedback ?? undefined },
    { speaker: 'agent', transcript: agentText, turnIndex: agentIndex },
  ];
  await postTurns(fetch, { apiUrl: config.apiUrl, agentApiKey: config.agentApiKey }, this.sessionId, turns);
}
```
- [ ] Add `chat: ChatFn` to `AgentOptions` and constructor; default it in `main.ts` to a thin OpenAI-compatible call against `config.llmBaseUrl` (add the `openai` package to `apps/agent`):
```ts
// main.ts
import OpenAI from 'openai';
const llmClient = new OpenAI({ baseURL: config.llmBaseUrl, apiKey: config.llmApiKey });
const chat: ChatFn = async (prompt) => {
  const r = await llmClient.chat.completions.create({
    model: config.llmModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });
  return r.choices[0]?.message?.content ?? '';
};
const agentOptions: AgentOptions = { sessionId: ..., scenarioId: ..., chat };
```
- [ ] Run `pnpm --filter agent build` and `pnpm --filter agent test` → expect PASS.
- [ ] Commit: `feat(agent): persist turns and publish live feedback`

---

## Task 8 — Web: render live feedback from the data channel

**Files:** Modify `apps/web/src/app/[language]/conversation/page-content.tsx`.

The page already has `useRoomContext`, a `FB_TOGGLE_KEY` overlay toggle, and `MessageBubble({ entry, showFeedback })`. Add a data-channel listener that maps `turnIndex → feedback` and surface it.

- [ ] Inside the room-scoped child component, subscribe to data messages:
```tsx
import { RoomEvent } from 'livekit-client';
import type { TurnFeedback } from '@leca/schemas';

const [feedbackByIndex, setFeedbackByIndex] = useState<Record<number, TurnFeedback>>({});
const room = useRoomContext();

useEffect(() => {
  const onData = (payload: Uint8Array) => {
    try {
      const msg = JSON.parse(new TextDecoder().decode(payload)) as { type?: string; turnIndex?: number; feedback?: TurnFeedback };
      if (msg.type === 'feedback' && typeof msg.turnIndex === 'number' && msg.feedback) {
        setFeedbackByIndex((prev) => ({ ...prev, [msg.turnIndex!]: msg.feedback! }));
      }
    } catch {
      /* ignore malformed frames */
    }
  };
  room.on(RoomEvent.DataReceived, onData);
  return () => {
    room.off(RoomEvent.DataReceived, onData);
  };
}, [room]);
```
- [ ] Pass the matching feedback into `MessageBubble` for learner entries and render it (respecting the existing `showFeedback` toggle) as a small card under the bubble: scores `fluency / naturalness / vocabulary` + `explanation`. Reuse the existing transcript ordering to map learner entries to even turn indices.
- [ ] Manual verify: run a session, speak one turn → a feedback card appears under your bubble; toggling the overlay hides/shows it; the conversation is never blocked while feedback is pending (FR-CONV-11).
- [ ] Commit: `feat(web): render live per-turn feedback`

---

## Definition of done
- `turns` rows exist after a session with correct `speaker`, `turnIndex`, `transcript`, and `feedback` JSON for learner turns.
- `POST /conversation-sessions/:id/turns` rejects requests without the agent key and accepts the agent.
- Learner sees per-turn feedback live; nothing blocks the audio loop.
- All new unit tests pass; `pnpm --filter api build` and `pnpm --filter agent build` succeed.
- Unblocks P2, P3, P6.
