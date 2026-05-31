# P8 — Safety, Moderation & Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add L1 language detection, content moderation, text-input fallback, 13+ age gate, GDPR data export/hard-delete, client-side ToS gate, and XSS sanitisation at the API ingestion layer.

**Architecture:** Agent-side filters intercept non-English input and profanity before persistence; the web conversation page wires the existing `TextFallback` stub to LiveKit DataChannel; the sign-up form gains a date-of-birth 13+ validator; the auth module gains a data-export endpoint and a cascade-delete that erases LECA data; a ToS modal gates authenticated pages client-side; `sanitize-html` strips HTML on scenario ingestion.

**Tech Stack:** `franc-min` (language detection, ESM), `openai` SDK moderation endpoint, LiveKit DataChannel, `zod` date validation, NestJS auth controller, Prisma cascade delete, `sanitize-html` (API), React state modal (web)

---

## File Map

| File | Action |
|------|--------|
| `apps/agent/src/agent.ts` | Modify: add language detection + moderation |
| `apps/agent/src/config.ts` | Modify: add `contentSafetyEnabled`, `openaiApiKey` |
| `apps/agent/package.json` | Modify: add `franc-min` |
| `apps/web/src/app/[language]/conversation/page-content.tsx` | Modify: wire `TextFallback` DataChannel send + local message state |
| `apps/web/src/app/[language]/sign-up/page-content.tsx` | Modify: add `dateOfBirth` field + 13+ Zod validation |
| `apps/web/src/services/i18n/locales/en/sign-up.json` | Modify: add `dateOfBirth` i18n keys |
| `apps/web/src/components/tos-gate/tos-gate.tsx` | Create: ToS modal that checks localStorage |
| `apps/web/src/app/[language]/layout.tsx` | Modify: render `<TosGate>` inside authenticated layout |
| `apps/api/src/auth/auth.controller.ts` | Modify: add `GET /me/export` |
| `apps/api/src/auth/auth.service.ts` | Modify: add `exportMyData()`, update `softDelete()` to cascade-delete LecaUser |
| `apps/api/src/scenarios/scenarios.service.ts` | Modify: sanitize text fields on `createScenario` |
| `apps/api/package.json` | Modify: add `sanitize-html`, `@types/sanitize-html` |

---

## Task 1: Agent — L1 Language Detection

**Files:**
- Modify: `apps/agent/package.json`
- Modify: `apps/agent/src/agent.ts`
- Test: `apps/agent/src/agent.spec.ts` (new file)

- [ ] **Step 1: Add `franc-min` to agent**

```bash
cd apps/agent && pnpm add franc-min
```

Expected: `franc-min` appears in `apps/agent/package.json` dependencies.

- [ ] **Step 2: Write the failing test**

Create `apps/agent/src/agent.spec.ts`:

```typescript
import { detectLanguage } from './agent.js';

describe('detectLanguage', () => {
  it('should return eng for English text', () => {
    expect(detectLanguage('Hello, how are you doing today?')).toBe('eng');
  });

  it('should return non-eng for Spanish text', () => {
    expect(detectLanguage('Hola, ¿cómo estás hoy?')).not.toBe('eng');
  });

  it('should return und for very short text', () => {
    expect(detectLanguage('hi')).toBe('und');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd apps/agent && pnpm test
```

Expected: FAIL — `detectLanguage` is not exported from `agent.js`.

- [ ] **Step 4: Add `detectLanguage` export and language-gate logic to `agent.ts`**

Replace the entire `apps/agent/src/agent.ts` with:

```typescript
import { getJobContext, log, voice } from '@livekit/agents';
import { franc } from 'franc-min';
import type { RecordTurnInput, TurnFeedback } from '@n2base/schemas';
import { generateFeedback, type ChatFn } from './feedback.js';
import { postTurns } from './leca-api-client.js';
import { config } from './config.js';

/** Returns franc 3-letter ISO 639-3 code, or 'und' for undetermined. */
export function detectLanguage(text: string): string {
  return franc(text, { minLength: 8 });
}

export interface AgentOptions {
  sessionId: string;
  scenarioId: string | null;
  chat: ChatFn;
}

export class LecaAgent extends voice.Agent {
  private readonly sessionId: string;
  private readonly scenarioId: string | null;
  private readonly chat: ChatFn;
  private turnIndex = 0;
  private pendingUser: { text: string } | null = null;
  private pendingModerationBlock = false;

  constructor({ sessionId, scenarioId, chat }: AgentOptions) {
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
    this.chat = chat;
  }

  override async onEnter(): Promise<void> {
    const logger = log();
    const ctx = getJobContext();
    const room = ctx.room;

    this.session.on(voice.AgentSessionEventTypes.UserInputTranscribed, async (ev) => {
      if (!ev.isFinal || !ev.transcript.trim()) return;
      const text = ev.transcript.trim();

      // L1 language detection
      const lang = detectLanguage(text);
      if (lang !== 'eng' && lang !== 'und') {
        logger.info({ lang, sessionId: this.sessionId }, 'L1 input detected — skipping scoring');
        void publishData(room, { type: 'l1_redirect', detectedLang: lang });
        this.pendingUser = { text }; // still record the turn, but without feedback
        this.pendingModerationBlock = true; // skip feedback generation
        return;
      }

      // Content moderation
      if (config.contentSafetyEnabled) {
        const flagged = await isContentFlagged(text, config.openaiApiKey);
        if (flagged) {
          logger.info({ sessionId: this.sessionId }, 'Content flagged — blocking turn');
          void publishData(room, { type: 'moderation_flagged' });
          this.pendingModerationBlock = true;
          this.pendingUser = null; // do NOT record flagged content
          return;
        }
      }

      this.pendingModerationBlock = false;
      this.pendingUser = { text };
    });

    this.session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      if (ev.item.role !== 'assistant' || ev.item.interrupted) return;
      const agentText = ev.item.textContent?.trim();
      const user = this.pendingUser;
      const blocked = this.pendingModerationBlock;
      this.pendingUser = null;
      this.pendingModerationBlock = false;
      if (!agentText || !user || blocked) return;
      void this.persistExchange(room, user.text, agentText);
    });

    // Text input fallback — receive user text via DataChannel
    room.on('dataReceived', async (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload)) as {
          type?: string;
          text?: string;
        };
        if (msg.type !== 'user-text' || !msg.text?.trim()) return;
        const userText = msg.text.trim();

        // Run same L1 + moderation checks
        const lang = detectLanguage(userText);
        if (lang !== 'eng' && lang !== 'und') {
          void publishData(room, { type: 'l1_redirect', detectedLang: lang });
          return;
        }
        if (config.contentSafetyEnabled) {
          const flagged = await isContentFlagged(userText, config.openaiApiKey);
          if (flagged) {
            void publishData(room, { type: 'moderation_flagged' });
            return;
          }
        }

        this.pendingUser = { text: userText };
        const response = await this.chat(
          `Continue as an English tutor. The learner typed: "${userText}". Respond naturally in 1-3 sentences.`,
        );
        if (response.trim()) {
          this.session.say(response.trim());
        }
      } catch {
        // ignore malformed messages
      }
    });

    logger.info({ sessionId: this.sessionId, scenarioId: this.scenarioId }, 'Session started');
    this.session.say("Hello! I'm LECA, your English practice partner. What would you like to talk about today?");
  }

  override async onExit(): Promise<void> {
    log().info({ sessionId: this.sessionId }, 'Session ended');
  }

  private async persistExchange(
    room: ReturnType<typeof getJobContext>['room'],
    userText: string,
    agentText: string,
  ): Promise<void> {
    const learnerIndex = this.turnIndex++;
    const agentIndex = this.turnIndex++;

    const feedback: TurnFeedback | null = await generateFeedback(this.chat, userText);

    if (feedback) {
      void publishData(room, { type: 'feedback', turnIndex: learnerIndex, feedback });
    }

    const turns: RecordTurnInput[] = [
      { speaker: 'learner', transcript: userText, turnIndex: learnerIndex, feedback: feedback ?? undefined },
      { speaker: 'agent', transcript: agentText, turnIndex: agentIndex },
    ];
    await postTurns(fetch, { apiUrl: config.apiUrl, agentApiKey: config.agentApiKey }, this.sessionId, turns);
  }
}

// ── Helpers ───────────────────────────────────────────────────

async function publishData(
  room: ReturnType<typeof getJobContext>['room'],
  data: unknown,
): Promise<void> {
  try {
    const payload = new TextEncoder().encode(JSON.stringify(data));
    await room.localParticipant?.publishData(payload, { reliable: true });
  } catch (err) {
    log().warn({ err: String(err) }, 'publishData failed');
  }
}

/**
 * Calls the OpenAI moderation endpoint if an API key is available,
 * otherwise falls back to a simple word list.
 */
async function isContentFlagged(text: string, openaiApiKey: string): Promise<boolean> {
  if (openaiApiKey) {
    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: openaiApiKey });
      const result = await client.moderations.create({ input: text });
      return result.results[0]?.flagged ?? false;
    } catch {
      // fallback to word list if API call fails
    }
  }
  // Simple offline profanity check — extend this list as needed
  const BLOCKED_WORDS = ['badword1', 'badword2'];
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w));
}
```

- [ ] **Step 5: Update `apps/agent/src/config.ts`**

```typescript
export const config = {
  livekitUrl: process.env.LIVEKIT_URL ?? 'ws://localhost:7880',
  livekitApiKey: process.env.LIVEKIT_API_KEY ?? 'devkey',
  livekitApiSecret: process.env.LIVEKIT_API_SECRET ?? 'devsecret',
  sttBaseUrl: process.env.STT_BASE_URL ?? 'http://localhost:8000/v1',
  ttsBaseUrl: process.env.TTS_BASE_URL ?? 'http://localhost:9001/v1',
  llmBaseUrl: process.env.LLM_BASE_URL ?? 'http://localhost:11434/v1',
  llmModel: process.env.LLM_MODEL ?? 'llama3.2:3b',
  llmApiKey: process.env.LLM_API_KEY ?? 'local',
  apiUrl: process.env.LECA_API_URL ?? 'http://localhost:3000/api',
  agentApiKey: process.env.LECA_AGENT_API_KEY ?? 'devagentkey',
  contentSafetyEnabled: process.env.LECA_CONTENT_SAFETY === 'true',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
};
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd apps/agent && pnpm test
```

Expected: 3 tests pass in `agent.spec.ts`.

- [ ] **Step 7: Commit**

```bash
git add apps/agent/src/agent.ts apps/agent/src/agent.spec.ts apps/agent/src/config.ts apps/agent/package.json pnpm-lock.yaml
git commit -m "feat(agent): add L1 language detection and content moderation filter"
```

---

## Task 2: Web — Wire Text-Input Fallback via DataChannel

The `TextFallback` component and `micDenied` state already exist in the conversation page but the submit handler is a stub. This task wires it to LiveKit's DataChannel and adds local message display for typed text.

**Files:**
- Modify: `apps/web/src/app/[language]/conversation/page-content.tsx`

- [ ] **Step 1: Identify the stub in the existing file**

Read `apps/web/src/app/[language]/conversation/page-content.tsx`.

The `TextFallback` component (lines ~257–294) has `handleSubmit` that clears the value but doesn't send. `VoiceRoomContent` renders `<TextFallback />` at line ~454 when `micDenied` is true, but passes no props.

- [ ] **Step 2: Update `TextFallback` to accept an `onSend` prop, and add local message state to `VoiceRoomContent`**

Replace the `TextFallback` component definition (lines 255–294) and the `VoiceRoomContent` function:

**Updated `TextFallback` component (replaces lines 255–294):**

```tsx
// ─── Text input fallback ───────────────────────────────────────

function TextFallback({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }

  return (
    <div className="px-5 pb-6 flex flex-col gap-2">
      <p className="font-mono text-[10px] text-amber-400/70 text-center">
        Microphone unavailable · Type your message
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your response…"
          autoFocus
          className={[
            'flex-1 bg-white/[0.05] border border-white/10 rounded-full',
            'px-4 py-2.5 text-sm text-white placeholder:text-white/30',
            'outline-none focus:border-amber-500/50 transition-colors',
          ].join(' ')}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="px-4 py-2.5 bg-amber-500 text-[#0C0907] text-sm font-bold rounded-full disabled:opacity-40 transition-opacity"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

**In `VoiceRoomContent`, add `localMessages` state and `handleTextSend`** — add these after `const [micDenied, setMicDenied] = useState(false);` (around line 326):

```tsx
const [localMessages, setLocalMessages] = useState<TranscriptEntry[]>([]);
```

Add `handleTextSend` callback after `handleFeedbackToggle` (around line 383):

```tsx
const handleTextSend = useCallback(
  (text: string) => {
    // Add locally so user sees their message immediately
    setLocalMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, text, isAgent: false, final: true },
    ]);
    // Publish to agent via DataChannel
    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({ type: 'user-text', text }),
      );
      room.localParticipant.publishData(payload, { reliable: true });
    } catch {
      // ignore if room is disconnecting
    }
  },
  [room],
);
```

Update the `entries` computation to merge local messages:

```tsx
// Replace:
// const entries: TranscriptEntry[] = transcriptions.map(...)

const liveEntries: TranscriptEntry[] = transcriptions.map((t) => ({
  id: t.id,
  text: t.text,
  isAgent: t.participant?.identity === 'leca-agent',
  final: t.final,
}));

// Merge local typed messages with live transcriptions (sort by id string for stable order)
const entries: TranscriptEntry[] = [...localMessages, ...liveEntries];
```

Update the `TextFallback` render to pass `onSend`:

```tsx
// Replace:
// <TextFallback />
// With:
<TextFallback onSend={handleTextSend} />
```

- [ ] **Step 3: Verify the page compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors related to the changed file.

- [ ] **Step 4: Lint and auto-fix**

```bash
cd apps/web && npx eslint --fix "src/app/[language]/conversation/page-content.tsx"
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\[language\]/conversation/page-content.tsx
git commit -m "feat(web): wire text-input fallback to LiveKit DataChannel"
```

---

## Task 3: Web — 13+ Age Gate on Sign-Up

**Files:**
- Modify: `apps/web/src/app/[language]/sign-up/page-content.tsx`
- Modify: `apps/web/src/services/i18n/locales/en/sign-up.json`
- Modify: `apps/web/src/services/i18n/locales/uk/sign-up.json`
- Modify: `apps/web/src/services/i18n/locales/vi/sign-up.json`

- [ ] **Step 1: Check the existing sign-up locale file**

```bash
cat apps/web/src/services/i18n/locales/en/sign-up.json
```

Note all existing keys so you can add next to them without breaking anything.

- [ ] **Step 2: Add i18n keys to all three locale files**

Add to the `"inputs"` section of each locale file:

**`apps/web/src/services/i18n/locales/en/sign-up.json`** — add inside `"inputs"`:
```json
"dateOfBirth": {
  "label": "Date of birth",
  "validation": {
    "required": "Date of birth is required",
    "tooYoung": "You must be at least 13 years old to use LECA"
  }
}
```

**`apps/web/src/services/i18n/locales/uk/sign-up.json`** — add inside `"inputs"`:
```json
"dateOfBirth": {
  "label": "Дата народження",
  "validation": {
    "required": "Дата народження обов'язкова",
    "tooYoung": "Вам має бути не менше 13 років"
  }
}
```

**`apps/web/src/services/i18n/locales/vi/sign-up.json`** — add inside `"inputs"`:
```json
"dateOfBirth": {
  "label": "Ngày sinh",
  "validation": {
    "required": "Ngày sinh là bắt buộc",
    "tooYoung": "Bạn phải ít nhất 13 tuổi để sử dụng LECA"
  }
}
```

- [ ] **Step 3: Update the sign-up validation schema**

In `apps/web/src/app/[language]/sign-up/page-content.tsx`, update `useValidationSchema()` to add `dateOfBirth`:

```typescript
const useValidationSchema = () => {
  const { t } = useTranslation('sign-up');
  return z.object({
    firstName: z
      .string()
      .min(1, t('sign-up:inputs.firstName.validation.required')),
    lastName: z
      .string()
      .min(1, t('sign-up:inputs.lastName.validation.required')),
    email: z.string().email(t('sign-up:inputs.email.validation.invalid')),
    password: z.string().min(6, t('sign-up:inputs.password.validation.min')),
    dateOfBirth: z
      .string()
      .min(1, t('sign-up:inputs.dateOfBirth.validation.required'))
      .refine((dob) => {
        const birth = new Date(dob);
        const now = new Date();
        const age = now.getFullYear() - birth.getFullYear()
          - (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
        return age >= 13;
      }, t('sign-up:inputs.dateOfBirth.validation.tooYoung')),
    policy: z
      .array(z.object({ id: z.string(), name: z.string() }))
      .min(1, t('sign-up:inputs.policy.validation.required')),
  });
};
```

- [ ] **Step 4: Add the `dateOfBirth` field to the form**

In the `Form` component, add `dateOfBirth: ''` to `defaultValues`, and add the input field between the `password` and `policy` fields:

In `defaultValues`:
```typescript
defaultValues: {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  dateOfBirth: '',
  policy: [],
},
```

After the password `<FormTextInput>` and before the policy checkbox, add:

```tsx
<FormTextInput<SignUpFormData>
  name="dateOfBirth"
  label={t('sign-up:inputs.dateOfBirth.label')}
  type="date"
  testId="date-of-birth"
/>
```

- [ ] **Step 5: Verify types compile**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Lint and fix**

```bash
cd apps/web && npx eslint --fix "src/app/[language]/sign-up/page-content.tsx"
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\[language\]/sign-up/page-content.tsx \
  apps/web/src/services/i18n/locales/en/sign-up.json \
  apps/web/src/services/i18n/locales/uk/sign-up.json \
  apps/web/src/services/i18n/locales/vi/sign-up.json
git commit -m "feat(web): add 13+ age gate to sign-up form"
```

---

## Task 4: API — GDPR Data Export

**Files:**
- Modify: `apps/api/src/auth/auth.controller.ts`
- Modify: `apps/api/src/auth/auth.service.ts`

The auth service injects `UsersService` and `PrismaService` is NOT currently injected. You need to inject `PrismaService` for the LECA data query.

- [ ] **Step 1: Write the failing test**

Add a new `describe('exportMyData')` block to `apps/api/src/auth/auth.service.spec.ts` (or create it if it doesn't exist). Find the test file first:

```bash
ls apps/api/src/auth/
```

Look for `auth.service.spec.ts`. If it doesn't exist, create `apps/api/src/auth/auth.service.spec.ts` with:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { SessionService } from '../session/session.service';

const mockPrisma = {
  lecaUser: {
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  conversationSession: { findMany: jest.fn() },
  scenarioRating: { findMany: jest.fn() },
  scenarioReview: { findMany: jest.fn() },
  levelAssessment: { findMany: jest.fn() },
};

const mockUsersService = { findById: jest.fn(), remove: jest.fn() };

describe('AuthService — GDPR', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { getOrThrow: jest.fn().mockReturnValue('1d') } },
        { provide: MailService, useValue: {} },
        { provide: SessionService, useValue: { deleteById: jest.fn() } },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('exportMyData', () => {
    it('should return null when lecaUser not found', async () => {
      mockUsersService.findById.mockResolvedValue({ email: 'x@test.com' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue(null);
      const result = await service.exportMyData(1);
      expect(result).toBeNull();
    });

    it('should return structured data when lecaUser found', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 1, email: 'x@test.com', firstName: 'X' });
      mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-1', email: 'x@test.com' });
      mockPrisma.conversationSession.findMany.mockResolvedValue([]);
      mockPrisma.scenarioRating.findMany.mockResolvedValue([]);
      mockPrisma.scenarioReview.findMany.mockResolvedValue([]);
      mockPrisma.levelAssessment.findMany.mockResolvedValue([]);
      const result = await service.exportMyData(1);
      expect(result).toMatchObject({ profile: expect.anything(), sessions: [] });
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd apps/api && npx jest src/auth/auth.service.spec.ts --no-coverage
```

Expected: FAIL — `exportMyData` is not a method on `AuthService`.

- [ ] **Step 3: Inject `PrismaService` into `AuthService` and add `exportMyData` method**

In `apps/api/src/auth/auth.service.ts`, add `PrismaService` to the constructor and add the `exportMyData` method:

Find the constructor (it takes `UsersService, SessionService, JwtService, MailService, ConfigService`). Add `PrismaService`:

```typescript
// Add to imports at top of auth.service.ts
import { PrismaService } from '../database/prisma.service';

// In constructor — add parameter:
constructor(
  private readonly usersService: UsersService,
  private readonly sessionService: SessionService,
  private readonly jwtService: JwtService,
  private readonly mailService: MailService,
  @Inject(forwardRef(() => ConfigService))
  private readonly configService: ConfigService<AllConfigType>,
  private readonly prisma: PrismaService,   // ← ADD THIS
) {}
```

Also add `PrismaService` to `AuthModule` imports. Find `apps/api/src/auth/auth.module.ts` and add `PrismaModule` to imports if not present.

Add `exportMyData` method to `AuthService` before `softDelete`:

```typescript
async exportMyData(boilerplateUserId: number): Promise<object | null> {
  const user = await this.usersService.findById(boilerplateUserId);
  if (!user?.email) return null;

  const lecaUser = await this.prisma.lecaUser.findUnique({
    where: { email: user.email },
  });
  if (!lecaUser) return null;

  const [sessions, ratings, reviews, assessments] = await Promise.all([
    this.prisma.conversationSession.findMany({
      where: { userId: lecaUser.id },
      include: { turns: true },
      orderBy: { startedAt: 'desc' },
    }),
    this.prisma.scenarioRating.findMany({ where: { userId: lecaUser.id } }),
    this.prisma.scenarioReview.findMany({ where: { reviewerId: lecaUser.id } }),
    this.prisma.levelAssessment.findMany({ where: { userId: lecaUser.id } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: lecaUser.id,
      email: lecaUser.email,
      displayName: lecaUser.displayName,
      nativeLanguage: lecaUser.nativeLanguage,
      englishLevel: lecaUser.englishLevel,
      createdAt: lecaUser.createdAt,
    },
    boilerplateProfile: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    sessions,
    scenarioRatings: ratings,
    scenarioReviews: reviews,
    levelAssessments: assessments,
  };
}
```

- [ ] **Step 4: Add `GET /me/export` to `auth.controller.ts`**

In `apps/api/src/auth/auth.controller.ts`, add after the `GET /me` route:

```typescript
@ApiBearerAuth()
@Get('me/export')
@UseGuards(AuthGuard('jwt'))
@HttpCode(HttpStatus.OK)
@ApiOkResponse({ description: 'User data export as JSON' })
public async exportMe(@Request() request, @Res() res: Response): Promise<void> {
  const data = await this.service.exportMyData(request.user.id);
  if (!data) {
    res.status(HttpStatus.NOT_FOUND).json({ message: 'No LECA profile found' });
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="leca-export.json"');
  res.send(JSON.stringify(data, null, 2));
}
```

Also add `Res` and `Response` imports:
```typescript
import { Res } from '@nestjs/common';
import type { Response } from 'express';
```

- [ ] **Step 5: Run tests**

```bash
cd apps/api && npx jest src/auth/auth.service.spec.ts --no-coverage
```

Expected: PASS — both tests pass.

- [ ] **Step 6: Lint and fix**

```bash
cd apps/api && npx eslint --fix "src/auth/auth.service.ts" "src/auth/auth.controller.ts"
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.service.spec.ts apps/api/src/auth/auth.controller.ts
git commit -m "feat(api): add GDPR data export endpoint GET /auth/me/export"
```

---

## Task 5: API — GDPR Hard Delete (Cascade LecaUser Data)

The existing `DELETE /auth/me` calls `softDelete()` which only soft-deletes the boilerplate `User` record. We need to also hard-delete the `LecaUser` and all related LECA data before that.

**Key finding from the Prisma schema:** All LecaUser relations (`ConversationSession`, `ConversationTurn`, `ScenarioRating`, `ScenarioReview`, `PronunciationScore`, `UserVocabulary`, `DailyUserStat`, `ClassEnrollment`, `Device`) have `onDelete: Cascade`. So `prisma.lecaUser.delete()` cascades automatically — no manual deletions needed.

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`

- [ ] **Step 1: Write the failing test**

Add to `apps/api/src/auth/auth.service.spec.ts` (the file from Task 4):

```typescript
describe('softDelete', () => {
  it('should hard-delete LecaUser before soft-deleting boilerplate user', async () => {
    const boilerplateUser = { id: 1, email: 'x@test.com' } as any;
    mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-1' });
    mockPrisma.lecaUser.delete.mockResolvedValue({});
    mockUsersService.remove.mockResolvedValue(undefined);

    await service.softDelete(boilerplateUser);

    expect(mockPrisma.lecaUser.delete).toHaveBeenCalledWith({ where: { id: 'leca-1' } });
    expect(mockUsersService.remove).toHaveBeenCalledWith(1);
  });

  it('should still soft-delete boilerplate user when no LecaUser exists', async () => {
    const boilerplateUser = { id: 1, email: 'ghost@test.com' } as any;
    mockPrisma.lecaUser.findUnique.mockResolvedValue(null);
    mockUsersService.remove.mockResolvedValue(undefined);

    await service.softDelete(boilerplateUser);

    expect(mockPrisma.lecaUser.delete).not.toHaveBeenCalled();
    expect(mockUsersService.remove).toHaveBeenCalledWith(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd apps/api && npx jest src/auth/auth.service.spec.ts --no-coverage -t "softDelete"
```

Expected: FAIL — `lecaUser.delete` is never called.

- [ ] **Step 3: Update `softDelete` in `auth.service.ts`**

Replace the existing `softDelete` method:

```typescript
async softDelete(user: User): Promise<void> {
  // Hard-delete LecaUser and all cascaded LECA data first
  if (user.email) {
    const lecaUser = await this.prisma.lecaUser.findUnique({
      where: { email: user.email },
    });
    if (lecaUser) {
      await this.prisma.lecaUser.delete({ where: { id: lecaUser.id } });
    }
  }
  // Soft-delete the boilerplate account
  await this.usersService.remove(user.id);
}
```

- [ ] **Step 4: Run tests**

```bash
cd apps/api && npx jest src/auth/auth.service.spec.ts --no-coverage
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.service.spec.ts
git commit -m "feat(api): cascade-delete LecaUser data on GDPR account deletion"
```

---

## Task 6: Web — Client-Side ToS Acceptance Gate

**Files:**
- Create: `apps/web/src/components/tos-gate/tos-gate.tsx`
- Modify: `apps/web/src/app/[language]/layout.tsx`

Find the layout file first:
```bash
ls apps/web/src/app/\[language\]/
```

The layout wraps all authenticated pages. We'll render a ToS modal there that shows once (keyed by version hash).

- [ ] **Step 1: Create `apps/web/src/components/tos-gate/tos-gate.tsx`**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const TOS_KEY = 'leca:tosAccepted:v1';

export function TosGate({ children }: { children: React.ReactNode }) {
  const [accepted, setAccepted] = useState(true); // optimistic until loaded

  useEffect(() => {
    setAccepted(!!localStorage.getItem(TOS_KEY));
  }, []);

  function handleAccept() {
    localStorage.setItem(TOS_KEY, 'true');
    setAccepted(true);
  }

  if (accepted) return <>{children}</>;

  return (
    <>
      {/* Blurred backdrop */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0C0907] p-8 flex flex-col gap-5">
          <div>
            <p className="text-xs font-mono tracking-widest text-amber-400/70 mb-2">
              {'// TERMS OF SERVICE'}
            </p>
            <h2 className="text-xl font-bold text-white mb-3">
              Before you continue
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              By using LECA you agree to our{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                Privacy Policy
              </a>
              . LECA is intended for users aged 13 and older.
            </p>
          </div>
          <Button
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            onClick={handleAccept}
          >
            I agree — Continue
          </Button>
        </div>
      </div>
      {children}
    </>
  );
}
```

- [ ] **Step 2: Find and update the language layout**

Read `apps/web/src/app/[language]/layout.tsx`. Add `<TosGate>` wrapping the children.

The layout will look something like:

```tsx
// Add import at top:
import { TosGate } from '@/components/tos-gate/tos-gate';

// Wrap children:
// Before: return <>{children}</>;
// After:
return <TosGate>{children}</TosGate>;
```

- [ ] **Step 3: Lint and fix**

```bash
cd apps/web && npx eslint --fix "src/components/tos-gate/tos-gate.tsx"
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/tos-gate/tos-gate.tsx apps/web/src/app/\[language\]/layout.tsx
git commit -m "feat(web): add client-side ToS acceptance gate"
```

---

## Task 7: API — XSS Sanitisation on Scenario Ingestion

React safely escapes all text nodes so there's no XSS risk in the current UI. This adds defense-in-depth at the API layer: strip HTML tags from scenario text fields when stored.

**Files:**
- Modify: `apps/api/package.json` (add `sanitize-html`, `@types/sanitize-html`)
- Modify: `apps/api/src/scenarios/scenarios.service.ts`
- Modify: `apps/api/src/scenarios/scenarios.service.spec.ts`

- [ ] **Step 1: Install `sanitize-html`**

```bash
cd apps/api && pnpm add sanitize-html && pnpm add -D @types/sanitize-html
```

- [ ] **Step 2: Write the failing test**

In `apps/api/src/scenarios/scenarios.service.spec.ts`, add a test inside `describe('createScenario')`:

```typescript
it('should strip HTML tags from text fields', async () => {
  mockUsersService.findById.mockResolvedValue({
    email: 'user@test.com',
    firstName: 'Test',
    lastName: 'User',
  });
  mockPrisma.lecaUser.findUnique.mockResolvedValue({ id: 'leca-uuid-123' });
  mockPrisma.scenario.create.mockResolvedValue({
    id: 'sc-uuid-1',
    title: 'Clean Title',
    status: 'in_review',
  });
  mockPrisma.scenarioPhrase.createMany.mockResolvedValue({ count: 1 });

  const dtoWithHtml = {
    ...dto,
    title: '<script>alert(1)</script>Clean Title',
    description: '<b>Bold</b> description',
    aiRole: '<em>Role</em>',
    context: '<p>Context</p>',
  };

  await service.createScenario(1, dtoWithHtml as any);

  expect(mockPrisma.scenario.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        title: 'Clean Title',
        description: 'Bold description',
        aiRole: 'Role',
        context: 'Context',
      }),
    }),
  );
});
```

- [ ] **Step 3: Run to verify it fails**

```bash
cd apps/api && npx jest src/scenarios/scenarios.service.spec.ts --no-coverage -t "should strip HTML"
```

Expected: FAIL — HTML is not stripped.

- [ ] **Step 4: Add sanitisation to `ScenariosService.createScenario()`**

In `apps/api/src/scenarios/scenarios.service.ts`, add at the top:

```typescript
import sanitizeHtml from 'sanitize-html';
```

Add a private helper:

```typescript
private strip(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}
```

Update `createScenario` to call `strip()` on text fields:

```typescript
const scenario = await this.prisma.scenario.create({
  data: {
    authorId: lecaUserId,
    title: this.strip(dto.title),
    description: dto.description ? this.strip(dto.description) : null,
    aiRole: this.strip(dto.aiRole),
    context: this.strip(dto.context),
    difficulty: dto.difficulty,
    situationType: dto.situationType,
    tags: dto.tags ?? [],
    status: 'in_review',
  },
});
```

- [ ] **Step 5: Run tests**

```bash
cd apps/api && npx jest src/scenarios/scenarios.service.spec.ts --no-coverage
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/scenarios/scenarios.service.ts apps/api/src/scenarios/scenarios.service.spec.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): strip HTML tags from scenario text fields on ingestion"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|-------------|------|
| FR-CONV-09: L1 redirect unscored | Task 1 (detectLanguage, skip feedback) |
| FR-CONV-10: Content moderation filter | Task 1 (isContentFlagged, pendingModerationBlock) |
| FR-CONV-12: Text fallback mic denied | Task 2 (wire TextFallback DataChannel) |
| FR-AUTH-04: 13+ age gate | Task 3 (dateOfBirth Zod refine) |
| NFR-COMP-01: GDPR export | Task 4 (GET /me/export) |
| NFR-COMP-01: GDPR delete | Task 5 (cascade LecaUser delete) |
| NFR-COMP-02: ToS acceptance | Task 6 (TosGate modal) |
| NFR-SEC-06: XSS sanitisation | Task 7 (sanitize-html on ingestion) |

All requirements covered.

### Notes

- **BLOCKED_WORDS list in agent.ts** (Task 1, Step 4): The placeholder list `['badword1', 'badword2']` must be replaced with a real profanity list before production. When `OPENAI_API_KEY` is set, the real moderation API is used instead.
- **`franc-min` minimum text length**: Set to 8 characters. Texts shorter than 8 chars return `'und'` and pass through — they're too short to reliably detect language.
- **`GET /me/export`** route (Task 4): Must be declared before any `/:id` route parameters, or it will be captured as an ID. Double-check route order in `auth.controller.ts`.
- **`prisma.lecaUser.delete` cascade** (Task 5): Relies on `onDelete: Cascade` in schema. Verify with `prisma db push --force-reset` in test env before shipping.
- **`TosGate` layout file** (Task 6): The exact wrapping location in `layout.tsx` depends on what's already in the file. If the layout doesn't render `children` directly, find the innermost wrapper that renders children and add `TosGate` there.
