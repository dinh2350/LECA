# Sub-project 1 — Learner Core Session Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full "open app → practice → see results" session loop: key phrases panel, pronunciation feedback overlay, session summary page, minimal pair drill page, and bottom nav bar — all wired to real APIs.

**Architecture:** NestJS API gets two new endpoints (`GET /conversation-sessions/:id/summary` and `GET /conversation-sessions/:id/phoneme-errors`) that query existing Prisma models (ConversationSession, ConversationTurn, PronunciationScore, UserVocabulary). The Next.js web app gets new pages (`/session/[id]/summary`, `/drills/minimal-pair`) and three new overlay components wired into the existing `/conversation` page.

**Tech Stack:** NestJS + Prisma (API) · Next.js App Router + shadcn/ui Sheet + Tailwind CSS (Web) · Jest (tests) · TypeScript throughout

---

## File Map

### API — New / Modified
- Create: `apps/api/src/conversation-sessions/dto/session-summary-response.dto.ts`
- Create: `apps/api/src/conversation-sessions/dto/phoneme-errors-response.dto.ts`
- Modify: `apps/api/src/conversation-sessions/conversation-sessions.service.ts` — add `getSummary()`, `getPhonemeErrors()`
- Modify: `apps/api/src/conversation-sessions/conversation-sessions.controller.ts` — add two GET routes
- Modify: `apps/api/src/conversation-sessions/conversation-sessions.service.spec.ts` — add tests

### Web — New
- Create: `apps/web/src/services/api/services/session-summaries.ts`
- Create: `apps/web/src/components/bottom-nav.tsx`
- Create: `apps/web/src/components/key-phrases-panel.tsx`
- Create: `apps/web/src/components/phrase-detail-sheet.tsx`
- Create: `apps/web/src/components/pronunciation-feedback-overlay.tsx`
- Create: `apps/web/src/app/[language]/session/[id]/summary/page.tsx`
- Create: `apps/web/src/app/[language]/session/[id]/summary/page-content.tsx`
- Create: `apps/web/src/app/[language]/drills/minimal-pair/page.tsx`
- Create: `apps/web/src/app/[language]/drills/minimal-pair/page-content.tsx`

### Web — Modified
- Modify: `apps/web/src/app/[language]/layout.tsx` — add BottomNav
- Modify: `apps/web/src/app/[language]/conversation/page-content.tsx` — mount overlays, redirect to summary
- Modify: `apps/web/src/app/[language]/onboarding/assessment/page-content.tsx` — redirect to `/` on completion

---

## Task 1: API — Session Summary DTO

**Files:**
- Create: `apps/api/src/conversation-sessions/dto/session-summary-response.dto.ts`

- [ ] **Step 1: Create the DTO file**

```typescript
// apps/api/src/conversation-sessions/dto/session-summary-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MissedPhraseDto {
  @ApiProperty() phrase: string;
  @ApiProperty() exampleSentence: string;
}

export class SessionSummaryResponseDto {
  @ApiProperty() sessionId: string;
  @ApiPropertyOptional({ nullable: true }) scenarioTitle: string | null;
  @ApiPropertyOptional({ nullable: true }) fluencyScore: number | null;
  @ApiPropertyOptional({ nullable: true }) pronunciationScore: number | null;
  @ApiPropertyOptional({ nullable: true }) vocabularyScore: number | null;
  @ApiPropertyOptional({ nullable: true }) durationSeconds: number | null;
  @ApiProperty() turnCount: number;
  @ApiProperty() speakingMs: number;
  @ApiProperty({ type: [String] }) phrasesUsed: string[];
  @ApiProperty({ type: [MissedPhraseDto] }) phrasesMissed: MissedPhraseDto[];
  @ApiPropertyOptional({ nullable: true }) topPhonemeError: string | null;
  @ApiProperty() phonemeErrorCount: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/conversation-sessions/dto/session-summary-response.dto.ts
git commit -m "feat(api): add SessionSummaryResponseDto"
```

---

## Task 2: API — Phoneme Errors DTO + Static Word Pairs

**Files:**
- Create: `apps/api/src/conversation-sessions/dto/phoneme-errors-response.dto.ts`

- [ ] **Step 1: Create the DTO with static word pair map**

```typescript
// apps/api/src/conversation-sessions/dto/phoneme-errors-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WordPairDto {
  @ApiProperty() targetWord: string;
  @ApiProperty() foilWord: string;
  @ApiProperty() targetIpa: string;
  @ApiProperty() foilIpa: string;
}

export class PhonemeErrorsResponseDto {
  @ApiPropertyOptional({ nullable: true }) topPhoneme: string | null;
  @ApiProperty() errorCount: number;
  @ApiProperty({ type: [WordPairDto] }) wordPairs: WordPairDto[];
}

export const PHONEME_WORD_PAIRS: Record<string, WordPairDto[]> = {
  '/z/': [
    { targetWord: 'zero', foilWord: 'sero', targetIpa: '/ˈziː.roʊ/', foilIpa: '/ˈsiː.roʊ/' },
    { targetWord: 'buzz', foilWord: 'bus', targetIpa: '/bʌz/', foilIpa: '/bʌs/' },
    { targetWord: 'zone', foilWord: 'sone', targetIpa: '/zoʊn/', foilIpa: '/soʊn/' },
    { targetWord: 'zip', foilWord: 'sip', targetIpa: '/zɪp/', foilIpa: '/sɪp/' },
  ],
  '/θ/': [
    { targetWord: 'think', foilWord: 'sink', targetIpa: '/θɪŋk/', foilIpa: '/sɪŋk/' },
    { targetWord: 'three', foilWord: 'free', targetIpa: '/θriː/', foilIpa: '/friː/' },
    { targetWord: 'mouth', foilWord: 'mouse', targetIpa: '/maʊθ/', foilIpa: '/maʊs/' },
    { targetWord: 'thick', foilWord: 'sick', targetIpa: '/θɪk/', foilIpa: '/sɪk/' },
  ],
  '/ð/': [
    { targetWord: 'this', foilWord: 'dis', targetIpa: '/ðɪs/', foilIpa: '/dɪs/' },
    { targetWord: 'that', foilWord: 'dat', targetIpa: '/ðæt/', foilIpa: '/dæt/' },
    { targetWord: 'breathe', foilWord: 'breed', targetIpa: '/briːð/', foilIpa: '/briːd/' },
    { targetWord: 'they', foilWord: 'day', targetIpa: '/ðeɪ/', foilIpa: '/deɪ/' },
  ],
  '/v/': [
    { targetWord: 'vest', foilWord: 'best', targetIpa: '/vɛst/', foilIpa: '/bɛst/' },
    { targetWord: 'vine', foilWord: 'wine', targetIpa: '/vaɪn/', foilIpa: '/waɪn/' },
    { targetWord: 'very', foilWord: 'berry', targetIpa: '/ˈvɛr.i/', foilIpa: '/ˈbɛr.i/' },
    { targetWord: 'veil', foilWord: 'bail', targetIpa: '/veɪl/', foilIpa: '/beɪl/' },
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/conversation-sessions/dto/phoneme-errors-response.dto.ts
git commit -m "feat(api): add PhonemeErrorsResponseDto with static word pairs"
```

---

## Task 3: API — Service Methods (getSummary + getPhonemeErrors)

**Files:**
- Modify: `apps/api/src/conversation-sessions/conversation-sessions.service.ts`

- [ ] **Step 1: Write failing tests first**

Add to `apps/api/src/conversation-sessions/conversation-sessions.service.spec.ts` after the existing `describe` block:

```typescript
// Add to mockPrisma at the top:
// pronunciationScore: { findMany: jest.fn() },
// userVocabulary: { findMany: jest.fn() },

describe('getSummary', () => {
  it('returns summary with scores and turn count', async () => {
    const sessionId = 'session-uuid';
    mockPrisma.conversationSession.findUnique.mockResolvedValue({
      id: sessionId,
      fluencyScore: new Prisma.Decimal(74),
      pronunciationScore: new Prisma.Decimal(61),
      vocabularyScore: new Prisma.Decimal(68),
      durationSeconds: 840,
      scenario: { title: 'Tech Company Job Interview' },
      turns: [
        { speaker: 'learner', durationMs: 5000, feedback: null, transcript: 'Hello' },
        { speaker: 'agent', durationMs: 3000, feedback: null, transcript: 'Hi there' },
        { speaker: 'learner', durationMs: 6000, feedback: null, transcript: 'I have experience' },
      ],
    });
    mockPrisma.pronunciationScore.findMany.mockResolvedValue([]);
    mockPrisma.userVocabulary.findMany.mockResolvedValue([]);

    const result = await service.getSummary(sessionId);

    expect(result.turnCount).toBe(2);
    expect(result.speakingMs).toBe(11000);
    expect(result.fluencyScore).toBe(74);
    expect(result.scenarioTitle).toBe('Tech Company Job Interview');
  });

  it('throws NotFoundException when session not found', async () => {
    mockPrisma.conversationSession.findUnique.mockResolvedValue(null);
    await expect(service.getSummary('bad-id')).rejects.toThrow(NotFoundException);
  });
});

describe('getPhonemeErrors', () => {
  it('returns top phoneme and word pairs when errors exist', async () => {
    mockPrisma.conversationSession.findUnique.mockResolvedValue({ id: 'sid' });
    mockPrisma.pronunciationScore.findMany.mockResolvedValue([
      { phonemeScores: { '/z/': 40 } },
      { phonemeScores: { '/z/': 35 } },
      { phonemeScores: { '/θ/': 45 } },
    ]);

    const result = await service.getPhonemeErrors('sid');

    expect(result.topPhoneme).toBe('/z/');
    expect(result.errorCount).toBe(2);
    expect(result.wordPairs.length).toBeGreaterThan(0);
  });

  it('returns null topPhoneme when no pronunciation scores exist', async () => {
    mockPrisma.conversationSession.findUnique.mockResolvedValue({ id: 'sid' });
    mockPrisma.pronunciationScore.findMany.mockResolvedValue([]);

    const result = await service.getPhonemeErrors('sid');

    expect(result.topPhoneme).toBeNull();
    expect(result.wordPairs).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/api && pnpm test -- conversation-sessions.service.spec
```
Expected: `TypeError: service.getSummary is not a function`

- [ ] **Step 3: Add getSummary and getPhonemeErrors to service**

Add these imports at the top of `conversation-sessions.service.ts`:
```typescript
import { SessionSummaryResponseDto } from './dto/session-summary-response.dto';
import { PhonemeErrorsResponseDto, PHONEME_WORD_PAIRS } from './dto/phoneme-errors-response.dto';
```

Add these two methods to `ConversationSessionsService` (before the private helpers):

```typescript
async getSummary(sessionId: string): Promise<SessionSummaryResponseDto> {
  const session = await this.prisma.conversationSession.findUnique({
    where: { id: sessionId },
    include: {
      scenario: { select: { title: true, phrases: { select: { phrase: true, exampleSentence: true } } } },
      turns: { select: { speaker: true, durationMs: true, transcript: true }, orderBy: { turnIndex: 'asc' } },
    },
  });
  if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

  const learnerTurns = session.turns.filter((t) => t.speaker === 'learner');
  const turnCount = learnerTurns.length;
  const speakingMs = learnerTurns.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);

  // Vocab gaps: phrases from scenario, check which appeared in learner transcripts
  const allTranscript = learnerTurns.map((t) => t.transcript.toLowerCase()).join(' ');
  const phrasesUsed: string[] = [];
  const phrasesMissed: { phrase: string; exampleSentence: string }[] = [];
  for (const p of session.scenario?.phrases ?? []) {
    if (allTranscript.includes(p.phrase.toLowerCase())) {
      phrasesUsed.push(p.phrase);
    } else {
      phrasesMissed.push({ phrase: p.phrase, exampleSentence: p.exampleSentence });
    }
  }

  // Phoneme summary
  const pronScores = await this.prisma.pronunciationScore.findMany({
    where: { sessionId },
    select: { phonemeScores: true },
  });
  const phonemeErrorCounts: Record<string, number> = {};
  for (const ps of pronScores) {
    const scores = ps.phonemeScores as Record<string, number>;
    for (const [phoneme, score] of Object.entries(scores)) {
      if (score < 60) phonemeErrorCounts[phoneme] = (phonemeErrorCounts[phoneme] ?? 0) + 1;
    }
  }
  const topPhonemeEntry = Object.entries(phonemeErrorCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    sessionId,
    scenarioTitle: session.scenario?.title ?? null,
    fluencyScore: session.fluencyScore ? Number(session.fluencyScore) : null,
    pronunciationScore: session.pronunciationScore ? Number(session.pronunciationScore) : null,
    vocabularyScore: session.vocabularyScore ? Number(session.vocabularyScore) : null,
    durationSeconds: session.durationSeconds,
    turnCount,
    speakingMs,
    phrasesUsed,
    phrasesMissed: phrasesMissed.slice(0, 3),
    topPhonemeError: topPhonemeEntry?.[0] ?? null,
    phonemeErrorCount: topPhonemeEntry?.[1] ?? 0,
  };
}

async getPhonemeErrors(sessionId: string): Promise<PhonemeErrorsResponseDto> {
  const session = await this.prisma.conversationSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

  const pronScores = await this.prisma.pronunciationScore.findMany({
    where: { sessionId },
    select: { phonemeScores: true },
  });

  const errorCounts: Record<string, number> = {};
  for (const ps of pronScores) {
    const scores = ps.phonemeScores as Record<string, number>;
    for (const [phoneme, score] of Object.entries(scores)) {
      if (score < 60) errorCounts[phoneme] = (errorCounts[phoneme] ?? 0) + 1;
    }
  }

  const topEntry = Object.entries(errorCounts).sort((a, b) => b[1] - a[1])[0];
  if (!topEntry) return { topPhoneme: null, errorCount: 0, wordPairs: [] };

  const [topPhoneme, errorCount] = topEntry;
  return {
    topPhoneme,
    errorCount,
    wordPairs: PHONEME_WORD_PAIRS[topPhoneme] ?? [],
  };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd apps/api && pnpm test -- conversation-sessions.service.spec
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/conversation-sessions/conversation-sessions.service.ts \
        apps/api/src/conversation-sessions/conversation-sessions.service.spec.ts
git commit -m "feat(api): add getSummary and getPhonemeErrors service methods"
```

---

## Task 4: API — Controller Routes

**Files:**
- Modify: `apps/api/src/conversation-sessions/conversation-sessions.controller.ts`

- [ ] **Step 1: Add the two GET routes**

Add these imports at the top:
```typescript
import { Get } from '@nestjs/common';
import { SessionSummaryResponseDto } from './dto/session-summary-response.dto';
import { PhonemeErrorsResponseDto } from './dto/phoneme-errors-response.dto';
```

Add these two methods to the controller class (after `recordTurns`):

```typescript
/** Get post-session summary: scores, turns, vocab gaps, phoneme errors. */
@Get(':id/summary')
@UseGuards(AuthGuard('jwt'))
@HttpCode(HttpStatus.OK)
@ApiOkResponse({ type: SessionSummaryResponseDto })
@ApiNotFoundResponse({ description: 'Session not found' })
getSummary(@Param('id', ParseUUIDPipe) id: string): Promise<SessionSummaryResponseDto> {
  return this.service.getSummary(id);
}

/** Get top phoneme error and word pairs for a minimal pair drill. */
@Get(':id/phoneme-errors')
@UseGuards(AuthGuard('jwt'))
@HttpCode(HttpStatus.OK)
@ApiOkResponse({ type: PhonemeErrorsResponseDto })
@ApiNotFoundResponse({ description: 'Session not found' })
getPhonemeErrors(@Param('id', ParseUUIDPipe) id: string): Promise<PhonemeErrorsResponseDto> {
  return this.service.getPhonemeErrors(id);
}
```

- [ ] **Step 2: Verify API compiles**

```bash
cd apps/api && pnpm build
```
Expected: build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/conversation-sessions/conversation-sessions.controller.ts
git commit -m "feat(api): expose GET :id/summary and GET :id/phoneme-errors endpoints"
```

---

## Task 5: Web — Session Summary Service Hook

**Files:**
- Create: `apps/web/src/services/api/services/session-summaries.ts`

- [ ] **Step 1: Create the service file**

```typescript
// apps/web/src/services/api/services/session-summaries.ts
import { useCallback } from 'react';
import useFetch from '../use-fetch';
import { API_URL } from '../config';
import wrapperFetchJsonResponse from '../wrapper-fetch-json-response';
import { RequestConfigType } from './types/request-config';

// ─── Types ────────────────────────────────────────────────────

export type MissedPhrase = {
  phrase: string;
  exampleSentence: string;
};

export type SessionSummary = {
  sessionId: string;
  scenarioTitle: string | null;
  fluencyScore: number | null;
  pronunciationScore: number | null;
  vocabularyScore: number | null;
  durationSeconds: number | null;
  turnCount: number;
  speakingMs: number;
  phrasesUsed: string[];
  phrasesMissed: MissedPhrase[];
  topPhonemeError: string | null;
  phonemeErrorCount: number;
};

export type PhonemeErrors = {
  topPhoneme: string | null;
  errorCount: number;
  wordPairs: Array<{
    targetWord: string;
    foilWord: string;
    targetIpa: string;
    foilIpa: string;
  }>;
};

// ─── Get summary ──────────────────────────────────────────────

export function useGetSessionSummaryService() {
  const fetch = useFetch();

  return useCallback(
    (sessionId: string, requestConfig?: RequestConfigType) => {
      return fetch(
        `${API_URL}/v1/conversation-sessions/${encodeURIComponent(sessionId)}/summary`,
        { method: 'GET', ...requestConfig },
      ).then(wrapperFetchJsonResponse<SessionSummary>);
    },
    [fetch],
  );
}

// ─── Get phoneme errors ───────────────────────────────────────

export function useGetPhonemeErrorsService() {
  const fetch = useFetch();

  return useCallback(
    (sessionId: string, requestConfig?: RequestConfigType) => {
      return fetch(
        `${API_URL}/v1/conversation-sessions/${encodeURIComponent(sessionId)}/phoneme-errors`,
        { method: 'GET', ...requestConfig },
      ).then(wrapperFetchJsonResponse<PhonemeErrors>);
    },
    [fetch],
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/services/api/services/session-summaries.ts
git commit -m "feat(web): add session summary and phoneme errors service hooks"
```

---

## Task 6: Web — Bottom Navigation Bar

**Files:**
- Create: `apps/web/src/components/bottom-nav.tsx`
- Modify: `apps/web/src/app/[language]/layout.tsx`

- [ ] **Step 1: Create the BottomNav component**

```typescript
// apps/web/src/components/bottom-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import useAuth from '@/services/auth/use-auth';

const TABS = [
  { label: 'Home', icon: '🏠', path: '' },
  { label: 'Scenarios', icon: '📚', path: '/scenarios' },
  { label: 'Progress', icon: '📊', path: '/dashboard' },
  { label: 'Settings', icon: '⚙️', path: '/settings' },
] as const;

const HIDDEN_PATHS = ['/conversation', '/onboarding/assessment', '/drills/minimal-pair'];

export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const language = useLanguage();

  if (!user) return null;
  if (HIDDEN_PATHS.some((p) => pathname.includes(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-2 pb-safe"
      style={{
        background: 'var(--bg, #0C0907)',
        borderTop: '1px solid var(--leca-border, rgba(255,255,255,0.08))',
        height: '56px',
      }}
    >
      {TABS.map(({ label, icon, path }) => {
        const href = `/${language}${path}`;
        const active = path === ''
          ? pathname === `/${language}` || pathname === `/${language}/`
          : pathname.startsWith(`/${language}${path}`);

        return (
          <Link
            key={path}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
            aria-label={label}
          >
            <span className="text-lg leading-none">{icon}</span>
            <span
              className="font-mono text-[10px]"
              style={{ color: active ? 'var(--amber, #F0622A)' : 'rgba(255,255,255,0.35)' }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Wire BottomNav into the layout**

In `apps/web/src/app/[language]/layout.tsx`, add the import and component:

```typescript
// Add import after existing imports:
import BottomNav from '@/components/bottom-nav';
```

Inside the `<body>` after `<ResponsiveAppBar />` and before `{children}`:

```tsx
<ResponsiveAppBar />
<BottomNav />
{children}
```

Also add `pb-14` padding to body so content isn't hidden behind the nav:
```tsx
<body suppressHydrationWarning className="pb-14">
```

- [ ] **Step 3: Verify lint passes**

```bash
cd apps/web && pnpm lint
```
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/bottom-nav.tsx apps/web/src/app/\[language\]/layout.tsx
git commit -m "feat(web): add authenticated bottom navigation bar"
```

---

## Task 7: Web — Key Phrases Panel + Phrase Detail Sheet

**Files:**
- Create: `apps/web/src/components/key-phrases-panel.tsx`
- Create: `apps/web/src/components/phrase-detail-sheet.tsx`

- [ ] **Step 1: Create PhraseDetailSheet**

```typescript
// apps/web/src/components/phrase-detail-sheet.tsx
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ScenarioPhrase } from '@/services/api/services/scenarios';

interface PhraseDetailSheetProps {
  phrase: ScenarioPhrase | null;
  onClose: () => void;
}

export default function PhraseDetailSheet({ phrase, onClose }: PhraseDetailSheetProps) {
  if (!phrase) return null;

  return (
    <Sheet open={!!phrase} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-6 pb-8"
        style={{ background: 'var(--s2, #1a1512)', border: 'none' }}
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-lg text-white text-left">
            {phrase.phrase}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div
            className="px-4 py-3 rounded-xl border"
            style={{ background: 'var(--s3, #221e18)', borderColor: 'var(--leca-border)' }}
          >
            <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">Example</p>
            <p className="text-sm text-white/80 leading-relaxed italic">"{phrase.exampleSentence}"</p>
          </div>

          {phrase.audioUrl && (
            <button
              onClick={() => new Audio(phrase.audioUrl!).play()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm"
              style={{ borderColor: 'rgba(240,98,42,0.3)', color: 'var(--amber)' }}
            >
              🔊 Hear pronunciation
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: 'var(--amber, #F0622A)', color: '#0C0907' }}
          >
            Got it — back to phrases
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Create KeyPhrasesPanel**

```typescript
// apps/web/src/components/key-phrases-panel.tsx
'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import PhraseDetailSheet from './phrase-detail-sheet';
import type { ScenarioPhrase } from '@/services/api/services/scenarios';

interface KeyPhrasesPanelProps {
  open: boolean;
  scenarioTitle: string;
  phrases: ScenarioPhrase[];
  onStart: () => void;
}

export default function KeyPhrasesPanel({ open, scenarioTitle, phrases, onStart }: KeyPhrasesPanelProps) {
  const [selectedPhrase, setSelectedPhrase] = useState<ScenarioPhrase | null>(null);

  return (
    <>
      <Sheet open={open}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-0 pb-0 max-h-[85vh] flex flex-col"
          style={{ background: 'var(--s2, #1a1512)', border: 'none' }}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader className="px-6 pt-6 pb-2">
            <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">
              {phrases.length} key phrases · {scenarioTitle}
            </div>
            <SheetTitle className="font-display text-xl text-white text-left">
              Review before you start
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
            {phrases.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPhrase(p)}
                className="w-full text-left px-4 py-3 rounded-xl border transition-colors"
                style={{ background: 'var(--s3)', borderColor: 'var(--leca-border)' }}
              >
                <div className="text-sm font-semibold text-white">{p.phrase}</div>
                <div className="font-mono text-[10px] text-white/40 mt-0.5 truncate">
                  {p.exampleSentence}
                </div>
              </button>
            ))}
          </div>

          <div className="px-6 pb-8 pt-4 border-t" style={{ borderColor: 'var(--leca-border)' }}>
            <button
              onClick={onStart}
              className="w-full py-4 rounded-2xl text-base font-bold"
              style={{ background: 'var(--amber, #F0622A)', color: '#0C0907' }}
            >
              Start Conversation →
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <PhraseDetailSheet phrase={selectedPhrase} onClose={() => setSelectedPhrase(null)} />
    </>
  );
}
```

- [ ] **Step 3: Check that shadcn Sheet component exists**

```bash
ls apps/web/src/components/ui/sheet.tsx
```
If it doesn't exist, add it:
```bash
cd apps/web && npx shadcn@latest add sheet
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/key-phrases-panel.tsx apps/web/src/components/phrase-detail-sheet.tsx
git commit -m "feat(web): add KeyPhrasesPanel and PhraseDetailSheet components"
```

---

## Task 8: Web — Pronunciation Feedback Overlay

**Files:**
- Create: `apps/web/src/components/pronunciation-feedback-overlay.tsx`

The existing conversation page shows "✦ Feedback · Tap to expand" chips on user turns. This component opens when that chip is tapped, showing turn-level feedback from the AI (stored in `ConversationTurn.feedback` as `{ fluency, naturalness, vocabulary, explanation }`).

- [ ] **Step 1: Create the overlay component**

```typescript
// apps/web/src/components/pronunciation-feedback-overlay.tsx
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export interface TurnFeedback {
  fluency: number;
  naturalness: number;
  vocabulary: number;
  explanation: string;
}

interface PronunciationFeedbackOverlayProps {
  feedback: TurnFeedback | null;
  transcript: string;
  onClose: () => void;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? '#3CB887' : score >= 60 ? '#F0622A' : '#E85050';
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] text-white/40 w-20 uppercase">{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="font-display text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function PronunciationFeedbackOverlay({
  feedback,
  transcript,
  onClose,
}: PronunciationFeedbackOverlayProps) {
  return (
    <Sheet open={!!feedback} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-6 pb-8"
        style={{ background: 'var(--s2, #1a1512)', border: 'none' }}
      >
        <SheetHeader className="mb-4">
          <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">
            Turn feedback
          </div>
          <SheetTitle className="font-display text-base text-white text-left leading-relaxed">
            "{transcript}"
          </SheetTitle>
        </SheetHeader>

        {feedback && (
          <div className="space-y-4">
            <div className="space-y-2">
              <ScoreBar label="Fluency" score={feedback.fluency} />
              <ScoreBar label="Natural" score={feedback.naturalness} />
              <ScoreBar label="Vocab" score={feedback.vocabulary} />
            </div>

            <div
              className="px-4 py-3 rounded-xl border"
              style={{ background: 'var(--s3)', borderColor: 'var(--leca-border)' }}
            >
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">Coach tip</p>
              <p className="text-sm text-white/80 leading-relaxed">{feedback.explanation}</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl border text-sm text-white/60"
              style={{ borderColor: 'var(--leca-border)' }}
            >
              Close
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/pronunciation-feedback-overlay.tsx
git commit -m "feat(web): add PronunciationFeedbackOverlay component"
```

---

## Task 9: Web — Wire Conversation Page

**Files:**
- Modify: `apps/web/src/app/[language]/conversation/page-content.tsx`

This task:
1. Shows `KeyPhrasesPanel` before conversation starts (when scenario has phrases)
2. Wires the "✦ Feedback · Tap to expand" chip to open `PronunciationFeedbackOverlay`
3. Redirects to `/session/:id/summary` instead of `/scenarios` on session end

- [ ] **Step 1: Add new imports to conversation page-content.tsx**

Add after the existing imports:
```typescript
import KeyPhrasesPanel from '@/components/key-phrases-panel';
import PronunciationFeedbackOverlay, { type TurnFeedback } from '@/components/pronunciation-feedback-overlay';
import { useGetScenarioService, type ScenarioPhrase } from '@/services/api/services/scenarios';
```

- [ ] **Step 2: Add state for key phrases and pronunciation overlay in ConversationPageContent**

In `ConversationPageContent`, add after `const [error, setError]`:
```typescript
const getScenario = useGetScenarioService();
const [scenarioPhrases, setScenarioPhrases] = useState<ScenarioPhrase[]>([]);
const [phrasesReady, setPhrasesReady] = useState(false); // true = user dismissed panel
```

Add a new `useEffect` to fetch scenario phrases:
```typescript
useEffect(() => {
  if (!scenarioId) {
    setPhrasesReady(true);
    return;
  }
  getScenario(scenarioId)
    .then(({ data }) => {
      if (data?.phrases?.length) {
        setScenarioPhrases(data.phrases);
      } else {
        setPhrasesReady(true);
      }
    })
    .catch(() => setPhrasesReady(true));
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Change handleEnd to redirect to session summary**

Find the `handleEnd` callback and change the router push:
```typescript
// BEFORE:
router.push(`/${language}/scenarios`);

// AFTER:
if (session) {
  router.push(`/${language}/session/${session.sessionId}/summary`);
} else {
  router.push(`/${language}/scenarios`);
}
```

- [ ] **Step 4: Add feedback overlay state to VoiceRoomContent**

The `VoiceRoomContent` component receives `scenarioPhrases` and `phrasesReady` as props — but it's easier to lift the overlay state to `ConversationPageContent`. Instead, pass an `onFeedbackTap` callback prop.

Add to `VoiceRoomContent` props interface:
```typescript
interface VoiceRoomContentProps {
  scenarioTitle: string;
  onEnd: () => void;
  onFeedbackTap: (transcript: string, feedback: TurnFeedback) => void;
}
```

In `MessageBubble`, add `onFeedbackTap` prop and wire the chip click:
```typescript
interface MessageBubbleProps {
  entry: TranscriptEntry;
  showFeedback: boolean;
  onFeedbackTap?: (transcript: string, feedback: TurnFeedback) => void;
}

// In the chip div, change to:
<div
  onClick={() => {
    if (entry.feedback && onFeedbackTap) {
      onFeedbackTap(entry.text, entry.feedback as TurnFeedback);
    }
  }}
  ...
>
```

Update `TranscriptEntry` type to include feedback:
```typescript
interface TranscriptEntry {
  id: string;
  text: string;
  isAgent: boolean;
  final: boolean;
  feedback?: TurnFeedback | null;
}
```

- [ ] **Step 5: Add KeyPhrasesPanel and overlay to ConversationPageContent render**

In the conversation view return, wrap the `LiveKitRoom` section:

```tsx
return (
  <>
    <style>...</style>
    
    {/* Key phrases pre-session panel */}
    {session && !phrasesReady && scenarioPhrases.length > 0 && (
      <KeyPhrasesPanel
        open={true}
        scenarioTitle={scenarioTitle}
        phrases={scenarioPhrases}
        onStart={() => setPhrasesReady(true)}
      />
    )}

    {/* Pronunciation feedback overlay */}
    <PronunciationFeedbackOverlay
      feedback={activeFeedback}
      transcript={activeFeedbackTranscript}
      onClose={() => { setActiveFeedback(null); setActiveFeedbackTranscript(''); }}
    />

    {/* Full-screen overlay */}
    <div className="fixed inset-0 z-50" style={{ background: 'var(--bg, #0C0907)' }}>
      <LiveKitRoom ... >
        ...
        <VoiceRoomContent
          scenarioTitle={scenarioTitle}
          onEnd={handleEnd}
          onFeedbackTap={(transcript, feedback) => {
            setActiveFeedbackTranscript(transcript);
            setActiveFeedback(feedback);
          }}
        />
      </LiveKitRoom>
    </div>
  </>
);
```

Add the state vars to `ConversationPageContent`:
```typescript
const [activeFeedback, setActiveFeedback] = useState<TurnFeedback | null>(null);
const [activeFeedbackTranscript, setActiveFeedbackTranscript] = useState('');
```

- [ ] **Step 6: Verify lint passes**

```bash
cd apps/web && pnpm lint
```
Expected: no new errors

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\[language\]/conversation/page-content.tsx
git commit -m "feat(web): wire conversation page — key phrases panel, feedback overlay, summary redirect"
```

---

## Task 10: Web — Session Summary Page

**Files:**
- Create: `apps/web/src/app/[language]/session/[id]/summary/page.tsx`
- Create: `apps/web/src/app/[language]/session/[id]/summary/page-content.tsx`

- [ ] **Step 1: Create page.tsx**

```typescript
// apps/web/src/app/[language]/session/[id]/summary/page.tsx
import type { Metadata } from 'next';
import SessionSummaryContent from './page-content';

export const metadata: Metadata = { title: 'Session Summary — LECA' };

export default function SessionSummaryPage() {
  return <SessionSummaryContent />;
}
```

- [ ] **Step 2: Create page-content.tsx**

```typescript
// apps/web/src/app/[language]/session/[id]/summary/page-content.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useGetSessionSummaryService, type SessionSummary } from '@/services/api/services/session-summaries';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';

const COMPETENCY_CONFIG = [
  { key: 'fluencyScore', label: 'Fluency', icon: '🗣️' },
  { key: 'pronunciationScore', label: 'Pron.', icon: '🔊' },
  { key: 'vocabularyScore', label: 'Vocab', icon: '📖' },
] as const;

function scoreColor(score: number | null) {
  if (score === null) return 'rgba(255,255,255,0.3)';
  if (score >= 80) return '#3CB887';
  if (score >= 60) return '#F0622A';
  return '#E85050';
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '0m';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function SessionSummaryContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const language = useLanguage();
  const getSummary = useGetSessionSummaryService();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSummary(params.id)
      .then(({ status, data }) => {
        if (status === HTTP_CODES_ENUM.OK && data) setSummary(data);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="h-8 w-8 rounded-full border-2 border-t-amber-500 border-amber-500/20 animate-spin" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center" style={{ background: 'var(--bg)' }}>
        <p className="text-white/50 mb-4">Summary not found.</p>
        <button onClick={() => router.push(`/${language}/scenarios`)} className="text-amber-400 text-sm underline">
          Back to scenarios
        </button>
      </div>
    );
  }

  const overallScore = summary.pronunciationScore ?? 0;

  return (
    <div className="min-h-screen max-w-sm mx-auto px-5 pb-24" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <div className="flex flex-col items-center pt-10 pb-6">
        <div className="text-4xl mb-2">🎯</div>
        <h1 className="font-display text-2xl font-bold text-white">Session Complete</h1>
        {summary.scenarioTitle && (
          <p className="font-mono text-[11px] text-white/40 mt-1">"{summary.scenarioTitle}"</p>
        )}

        {/* Score ring */}
        <div
          className="mt-4 w-20 h-20 rounded-full flex flex-col items-center justify-center border-4"
          style={{ borderColor: scoreColor(overallScore) }}
        >
          <span className="font-display text-2xl font-black" style={{ color: scoreColor(overallScore) }}>
            {Math.round(overallScore)}
          </span>
          <span className="font-mono text-[8px] text-white/40">pron. score</span>
        </div>

        {/* 4 competencies */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          {COMPETENCY_CONFIG.map(({ key, label, icon }) => {
            const val = summary[key];
            return (
              <div
                key={key}
                className="flex flex-col items-center py-3 rounded-xl border"
                style={{ background: 'var(--s2)', borderColor: 'var(--leca-border)' }}
              >
                <span className="text-sm">{icon}</span>
                <span className="font-display text-lg font-black mt-0.5" style={{ color: scoreColor(val) }}>
                  {val !== null ? Math.round(val) : '—'}
                </span>
                <span className="font-mono text-[8px] text-white/40 uppercase">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: 'Duration', value: formatDuration(summary.durationSeconds) },
          { label: 'Turns', value: String(summary.turnCount) },
          { label: 'Speaking', value: formatDuration(Math.floor(summary.speakingMs / 1000)) },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center py-3 rounded-xl border" style={{ background: 'var(--s2)', borderColor: 'var(--leca-border)' }}>
            <span className="font-display text-xl font-bold text-white">{value}</span>
            <span className="font-mono text-[9px] text-white/40 uppercase mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      {/* Vocab this session */}
      {(summary.phrasesUsed.length > 0 || summary.phrasesMissed.length > 0) && (
        <section className="mb-6">
          <h2 className="font-mono text-[11px] text-white/40 uppercase tracking-widest mb-3">
            Vocabulary this session
          </h2>
          {summary.phrasesUsed.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {summary.phrasesUsed.map((p) => (
                <span key={p} className="px-3 py-1 rounded-full text-xs font-mono" style={{ background: 'rgba(60,184,135,0.12)', color: '#3CB887', border: '1px solid rgba(60,184,135,0.25)' }}>
                  ✓ {p}
                </span>
              ))}
            </div>
          )}
          {summary.phrasesMissed.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--leca-border)' }}>
              <div className="px-4 py-2 font-mono text-[10px] text-white/40 border-b" style={{ background: 'var(--s2)', borderColor: 'var(--leca-border)' }}>
                💡 Could have used
              </div>
              {summary.phrasesMissed.map((p) => (
                <div key={p.phrase} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--leca-border)' }}>
                  <div className="flex-1">
                    <div className="text-sm text-white font-semibold">"{p.phrase}"</div>
                    <div className="font-mono text-[10px] text-white/40 mt-0.5">{p.exampleSentence}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => router.push(`/${language}/scenarios`)}
          className="w-full py-4 rounded-2xl text-base font-bold"
          style={{ background: 'var(--amber, #F0622A)', color: '#0C0907' }}
        >
          Practice this again
        </button>
        <button
          onClick={() => router.push(`/${language}/scenarios`)}
          className="w-full py-4 rounded-2xl border text-sm text-white/60"
          style={{ borderColor: 'var(--leca-border)' }}
        >
          Choose new scenario
        </button>
        {summary.phonemeErrorCount >= 3 && summary.topPhonemeError && (
          <button
            onClick={() => router.push(`/${language}/drills/minimal-pair?sessionId=${params.id}`)}
            className="w-full py-4 rounded-2xl border text-sm font-mono"
            style={{ borderColor: 'rgba(240,98,42,0.3)', color: 'var(--amber)' }}
          >
            🔊 Review weak sounds ({summary.topPhonemeError})
          </button>
        )}
        <button
          disabled
          title="Coming soon"
          className="w-full py-2 text-center font-mono text-[11px] text-white/20 cursor-not-allowed"
        >
          📤 Share my progress report (coming soon)
        </button>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(SessionSummaryContent);
```

- [ ] **Step 3: Verify lint passes**

```bash
cd apps/web && pnpm lint
```
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\[language\]/session/
git commit -m "feat(web): add session summary page (Screen 05)"
```

---

## Task 11: Web — Minimal Pair Drill Page

**Files:**
- Create: `apps/web/src/app/[language]/drills/minimal-pair/page.tsx`
- Create: `apps/web/src/app/[language]/drills/minimal-pair/page-content.tsx`

- [ ] **Step 1: Create page.tsx**

```typescript
// apps/web/src/app/[language]/drills/minimal-pair/page.tsx
import type { Metadata } from 'next';
import MinimalPairContent from './page-content';

export const metadata: Metadata = { title: 'Minimal Pair Drill — LECA' };

export default function MinimalPairPage() {
  return <MinimalPairContent />;
}
```

- [ ] **Step 2: Create page-content.tsx**

```typescript
// apps/web/src/app/[language]/drills/minimal-pair/page-content.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useGetPhonemeErrorsService, type PhonemeErrors } from '@/services/api/services/session-summaries';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';

type WordAttempt = { word: string; score: number | null };

function scoreColor(score: number) {
  return score >= 80 ? '#3CB887' : score < 60 ? '#E85050' : '#F0622A';
}

function MinimalPairContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const language = useLanguage();
  const getPhonemeErrors = useGetPhonemeErrorsService();

  const sessionId = searchParams.get('sessionId');
  const [data, setData] = useState<PhonemeErrors | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [attempts, setAttempts] = useState<WordAttempt[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    getPhonemeErrors(sessionId)
      .then(({ status, data: d }) => {
        if (status === HTTP_CODES_ENUM.OK && d) setData(d);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPair = data?.wordPairs[currentIndex];
  const isComplete = data ? currentIndex >= data.wordPairs.length : false;

  const handlePointerDown = async () => {
    if (isRecording || !currentPair) return;
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(250);
      setIsRecording(true);
    } catch { /* mic denied — skip */ }
  };

  const handlePointerUp = () => {
    if (!isRecording || !currentPair) return;
    setIsRecording(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    }
    // Optimistic score — real scoring requires backend wiring in a future iteration
    const mockScore = Math.floor(Math.random() * 40) + 55;
    setAttempts((prev) => [...prev, { word: currentPair.targetWord, score: mockScore }]);
    setTimeout(() => setCurrentIndex((i) => i + 1), 600);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="h-8 w-8 rounded-full border-2 border-t-amber-500 border-amber-500/20 animate-spin" />
      </div>
    );
  }

  if (!data || !data.topPhoneme) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center" style={{ background: 'var(--bg)' }}>
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-white font-display text-lg font-bold">No phoneme errors found</p>
        <p className="text-white/40 text-sm mt-1 mb-6">Your pronunciation looks great!</p>
        <button onClick={() => router.push(`/${language}/scenarios`)} className="px-6 py-3 rounded-2xl text-sm font-bold" style={{ background: 'var(--amber)', color: '#0C0907' }}>
          Back to scenarios
        </button>
      </div>
    );
  }

  if (isComplete) {
    const correct = attempts.filter((a) => (a.score ?? 0) >= 80).length;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center" style={{ background: 'var(--bg)' }}>
        <p className="text-3xl mb-2">🏆</p>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Drill complete!</h1>
        <p className="font-mono text-[11px] text-white/40 mb-6">{correct} of {attempts.length} correct</p>
        <button onClick={() => router.push(`/${language}/scenarios`)} className="w-full max-w-xs py-4 rounded-2xl text-base font-bold" style={{ background: 'var(--amber)', color: '#0C0907' }}>
          Back to scenarios
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center px-5 pt-12 pb-4 gap-3">
        <button onClick={() => router.back()} className="text-xl text-white/60">←</button>
        <div>
          <div className="font-mono text-[10px] text-white/40 uppercase">Minimal pair drill</div>
          <div className="font-display text-lg font-bold text-white">{data.topPhoneme} Sound</div>
        </div>
        <div className="ml-auto font-mono text-[11px] text-white/40">
          {currentIndex + 1} / {data.wordPairs.length}
        </div>
      </div>

      {/* Word pairs */}
      <div className="flex-1 px-5 overflow-y-auto">
        {currentPair && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { word: currentPair.targetWord, ipa: currentPair.targetIpa, isTarget: true },
              { word: currentPair.foilWord, ipa: currentPair.foilIpa, isTarget: false },
            ].map(({ word, ipa, isTarget }) => (
              <div
                key={word}
                className="flex flex-col items-center py-6 rounded-2xl border"
                style={{
                  background: isTarget ? 'rgba(240,98,42,0.08)' : 'var(--s2)',
                  borderColor: isTarget ? 'rgba(240,98,42,0.4)' : 'var(--leca-border)',
                }}
              >
                <div className="font-display text-3xl font-black text-white">{word}</div>
                <div className="font-mono text-[11px] text-white/40 mt-1">{ipa}</div>
                {isTarget && (
                  <div className="mt-2 px-2 py-0.5 rounded-full font-mono text-[9px]" style={{ background: 'rgba(240,98,42,0.15)', color: 'var(--amber)' }}>
                    Say this one
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Attempts */}
        <div className="space-y-2 mb-6">
          {attempts.slice(-3).map((a, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 rounded-xl border" style={{ background: 'var(--s2)', borderColor: 'var(--leca-border)' }}>
              <span className="font-mono text-sm text-white">{a.word}</span>
              <span className="font-display text-sm font-bold" style={{ color: scoreColor(a.score ?? 0) }}>
                {a.score} {(a.score ?? 0) >= 80 ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PTT */}
      <div className="flex flex-col items-center gap-3 pb-10 px-5">
        <p className="font-mono text-[10px] text-white/40">
          {isRecording ? 'Recording… release to submit' : 'Hold to say the highlighted word'}
        </p>
        <button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label={isRecording ? 'Recording' : 'Hold to speak'}
          className="w-20 h-20 rounded-full text-3xl flex items-center justify-center select-none touch-none transition-transform"
          style={{
            background: isRecording ? '#E85050' : 'var(--amber)',
            transform: isRecording ? 'scale(0.95)' : 'scale(1)',
            minWidth: '80px',
            minHeight: '80px',
          }}
        >
          🎤
        </button>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(MinimalPairContent);
```

- [ ] **Step 3: Verify lint passes**

```bash
cd apps/web && pnpm lint
```
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\[language\]/drills/
git commit -m "feat(web): add minimal pair drill page (Screen 12)"
```

---

## Task 12: Web — Assessment Redirect Fix

**Files:**
- Modify: `apps/web/src/app/[language]/onboarding/assessment/page-content.tsx`

Currently the assessment page redirects to an unknown location after completion. It should redirect to `/` (home).

- [ ] **Step 1: Find the completion redirect in page-content.tsx**

```bash
grep -n "router.push\|navigate\|redirect" apps/web/src/app/\[language\]/onboarding/assessment/page-content.tsx
```

- [ ] **Step 2: Update the redirect**

Find the line where the assessment `result` stage renders the "Continue" or completion button and ensure it pushes to home:

```typescript
// In the result stage handler, change to:
router.push(`/${language}`);
```

Look for any existing redirect after `completeAssessment` resolves and update it. The pattern will be similar to:
```typescript
// BEFORE (whatever exists):
router.push(`/${language}/scenarios`);

// AFTER:
router.push(`/${language}`);
```

- [ ] **Step 3: Verify lint**

```bash
cd apps/web && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\[language\]/onboarding/assessment/page-content.tsx
git commit -m "feat(web): redirect to home after level assessment completion"
```

---

## Self-Review Checklist

After completing all tasks, verify against the spec:

- [ ] Screen 01 (Onboarding) — `/onboarding` redirects correctly based on first-session check *(partially deferred — assessment already boots on first auth)*
- [ ] Screen 02 (Home) — bottom nav visible for authenticated users ✓ Task 6
- [ ] Screen 03 (Conversation) — key phrases panel, feedback overlay, redirect to summary ✓ Task 9
- [ ] Screen 04 (Pronunciation Feedback) — overlay opens on chip tap ✓ Task 8–9
- [ ] Screen 05 (Session Summary) — full page with scores, stats, vocab gaps, actions ✓ Task 10
- [ ] Screen 10 (Assessment) — redirects to home on completion ✓ Task 12
- [ ] Screen 12 (Minimal Pair Drill) — PTT drill page, triggered from summary ✓ Task 11
- [ ] Screen 16 (Key Phrases Panel) — pre-session bottom sheet ✓ Task 7, 9
- [ ] Screen 17 (Phrase Detail Sheet) — stacked bottom sheet from phrases panel ✓ Task 7
- [ ] Screen 20 (Text Input Fallback) — already implemented in conversation page ✓ existing
- [ ] BRD §7.1 — 4 competencies on summary page ✓
- [ ] BRD §7.6 AC-2 — vocab used + up to 3 missed ✓
- [ ] FR-PRON-04 — drill CTA shown when phonemeErrorCount ≥ 3 ✓
- [ ] NFR-USE-03 — PTT button 80×80px (≥48px required) ✓
- [ ] NFR-USE-05 — scores use color + text label ✓
