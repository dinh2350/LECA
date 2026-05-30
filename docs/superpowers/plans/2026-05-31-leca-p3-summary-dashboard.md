# P3 · Session Summary + Learner Dashboard Implementation Plan

> **For agentic workers:** Execute with superpowers:subagent-driven-development or superpowers:executing-plans. One commit per task. Write the failing test first. **Depends on P1** (turns + feedback) and **P2** (pronunciation scores) for full data; the summary screen degrades gracefully if pronunciation data is absent.

**Goal:** Turn raw turns + scores into something a learner sees. After this plan: ending a session shows a summary screen (scores, top-3 things to work on, transcript), and a learner dashboard shows session history, a pronunciation trend chart, and weak-area detection. Also covers FR-CONV-12 (text fallback when mic unavailable) on the conversation entry.

**FRs:** FR-CONV-08 (session summary), FR-DASH-01 (history), FR-DASH-02 (pronunciation trend), FR-DASH-03 (weak-area detection), FR-CONV-12 (text fallback). Data model: `conversation_sessions` score columns, `daily_user_stats`.

**Architecture:** When a session ends, the API aggregates its turns + pronunciation rows into the session’s `fluencyScore`, `pronunciationScore`, `vocabularyScore`, `wordsPerMinute`, `correctionRate`, `totalWords`. A `ProgressModule` exposes session history, a single-session summary, and a learner progress feed (trend + weak areas). The web adds a summary route and a dashboard route. Aggregation is a pure function so it is fully unit-tested.

**Tech Stack:** NestJS + Prisma, Next.js App Router (`[language]/...`), Recharts, React Query, zod.

---

## File Map

| Action | Path | App |
|--------|------|-----|
| New | `apps/api/src/conversation-sessions/session-aggregation.ts` | api |
| New | `apps/api/src/conversation-sessions/session-aggregation.spec.ts` | api |
| Modify | `apps/api/src/conversation-sessions/conversation-sessions.service.ts` | api |
| New | `apps/api/src/progress/progress.module.ts` | api |
| New | `apps/api/src/progress/progress.controller.ts` | api |
| New | `apps/api/src/progress/progress.service.ts` | api |
| New | `apps/api/src/progress/progress.service.spec.ts` | api |
| Modify | `apps/api/src/app.module.ts` | api |
| New | `apps/web/src/services/api/services/progress.ts` | web |
| New | `apps/web/src/app/[language]/conversation/summary/[id]/page.tsx` | web |
| New | `apps/web/src/app/[language]/conversation/summary/[id]/page-content.tsx` | web |
| New | `apps/web/src/app/[language]/dashboard/page.tsx` | web |
| New | `apps/web/src/app/[language]/dashboard/page-content.tsx` | web |
| New | `apps/web/src/components/dashboard/pronunciation-trend-chart.tsx` | web |
| Modify | `apps/web/src/app/[language]/conversation/page-content.tsx` | web |

---

## Task 1 — Pure session-aggregation function

**Files:** `session-aggregation.ts`, `session-aggregation.spec.ts`.

- [ ] Failing test:
```ts
import { aggregateSession } from './session-aggregation';

it('computes scores, WPM, correction rate, and weak areas from turns', () => {
  const result = aggregateSession({
    durationSeconds: 120,
    turns: [
      { speaker: 'learner', transcript: 'i want a coffee please', feedback: { fluency: 70, naturalness: 60, vocabulary: 65, explanation: 'Try "I would like".' } },
      { speaker: 'agent', transcript: 'Sure!', feedback: null },
      { speaker: 'learner', transcript: 'thank you very much', feedback: { fluency: 90, naturalness: 85, vocabulary: 80, explanation: 'Great.' } },
    ],
    pronunciation: [{ word: 'coffee', overallScore: 45, phonemeScores: [{ phoneme: 'AO', score: 40 }] }],
  });
  expect(result.totalWords).toBe(8);            // 5 + 3 learner words
  expect(result.fluencyScore).toBe(80);          // (70+90)/2
  expect(result.vocabularyScore).toBe(72.5);     // (65+80)/2
  expect(result.pronunciationScore).toBe(45);    // avg of word scores
  expect(result.wordsPerMinute).toBe(4);         // 8 words / (120/60)
  expect(result.weakAreas[0].label).toContain('AO'); // weakest phoneme surfaced
});
```
- [ ] Implement `aggregateSession(input): SessionAggregate` as a pure reducer: average learner-turn feedback dimensions; average pronunciation word scores; `WPM = totalLearnerWords / (durationSeconds/60)`; `correctionRate = learnerTurnsWithCorrection / learnerTurns`; `weakAreas` = lowest pronunciation phonemes + lowest feedback dimension, top 3.
- [ ] Run → PASS. Commit `feat(api): pure session aggregation`.

---

## Task 2 — Aggregate on session end

**Files:** Modify `conversation-sessions.service.ts` + its spec.

- [ ] Failing test extends `conversation-sessions.service.spec.ts`: ending a session loads its turns + pronunciation rows, calls `aggregateSession`, and writes the computed scores onto the session update.
- [ ] In `end()`, before/with the status update, load turns + pronunciation rows and persist the aggregate:
```ts
const [turns, pronunciation] = await Promise.all([
  this.prisma.conversationTurn.findMany({ where: { sessionId }, orderBy: { turnIndex: 'asc' } }),
  this.prisma.pronunciationScore.findMany({ where: { sessionId } }),
]);
const agg = aggregateSession({ durationSeconds, turns, pronunciation });
// merge agg.{fluencyScore,pronunciationScore,vocabularyScore,wordsPerMinute,correctionRate,totalWords} into the update data
```
- [ ] Run tests + build → PASS. Commit `feat(api): persist session scores on end`.

---

## Task 3 — ProgressModule: summary + history + progress feed

**Files:** `progress.module.ts`, `progress.controller.ts`, `progress.service.ts`, spec; register in `app.module.ts`.

- [ ] Failing tests for `ProgressService`:
  - `getSessionSummary(userId, sessionId)` returns scores, weak areas (recomputed from stored turns), and the transcript; throws if not the owner.
  - `getHistory(userId, { page, limit })` returns recent ended sessions newest-first with scores (uses `idx_sessions_user_time`).
  - `getProgress(userId)` returns the pronunciation trend (delegate to P2’s trend query/service) + aggregate weak areas across the last N sessions (FR-DASH-03).
- [ ] Implement the service against Prisma; reuse `PronunciationService.getPhonemeTrend` (import P2 service or move the query into a shared helper).
- [ ] Controller (JWT-guarded, resolves Leca user id):
  - `GET /me/sessions` (history, paginated)
  - `GET /me/sessions/:id/summary`
  - `GET /me/progress`
- [ ] Run tests + build → PASS. Commit `feat(api): progress summary, history, and feed`.

---

## Task 4 — Web progress hooks

**Files:** `apps/web/src/services/api/services/progress.ts`.

- [ ] React Query hooks mirroring existing service files: `useSessionSummaryService(id)`, `useSessionHistoryService(params)`, `useProgressService()`. Typed responses shared from `packages/schemas` where practical.
- [ ] Commit `feat(web): progress API hooks`.

---

## Task 5 — Session summary screen (FR-CONV-08)

**Files:** `conversation/summary/[id]/page.tsx` + `page-content.tsx`.

- [ ] `page.tsx` is the server entry (params: `language`, `id`); `page-content.tsx` is the client UI.
- [ ] Layout (mobile-first ≥320px): big score ring/summary of fluency / pronunciation / vocabulary; “Top 3 things to work on” from `weakAreas`; per-turn feedback list; “Practice again” + “Back to dashboard” CTAs.
- [ ] After a session ends in `conversation/page-content.tsx`, `router.push` to `/{language}/conversation/summary/{sessionId}`.
- [ ] Component test: renders scores + 3 weak-area chips from a mocked summary.
- [ ] Commit `feat(web): session summary screen`.

---

## Task 6 — Pronunciation trend chart (FR-DASH-02)

**Files:** `components/dashboard/pronunciation-trend-chart.tsx`.

- [ ] Recharts line chart of weekly average pronunciation; one line overall + optional per-weakest-phoneme lines from `useProgressService()`. Empty state when <2 data points.
- [ ] Component test: renders lines for a mocked 4-week series; shows empty state for `[]`.
- [ ] Commit `feat(web): pronunciation trend chart`.

---

## Task 7 — Learner dashboard (FR-DASH-01/03)

**Files:** `dashboard/page.tsx` + `page-content.tsx`.

- [ ] Sections: header with streak/last-active; **History** list (date, scenario, scores, tap → summary) from `useSessionHistoryService`; **Trend** chart (Task 6); **Focus areas** = aggregated weak areas from `useProgressService` (FR-DASH-03) with a “Drill” link to P2 minimal pairs.
- [ ] Empty state for new users (“Have your first conversation”).
- [ ] Component test: renders history rows + focus-area chips from mocked data; renders empty state with no sessions.
- [ ] Commit `feat(web): learner dashboard`.

---

## Task 8 — Text fallback entry (FR-CONV-12)

**Files:** Modify `conversation/page-content.tsx`.

- [ ] If `navigator.mediaDevices.getUserMedia` is denied/unavailable, show a text-input composer that sends learner text into the same turn pipeline (publish over the LiveKit data channel for the agent to consume, or POST a text turn) so a session can complete without a microphone.
- [ ] Component test: when mic permission is denied, the text composer renders and submitting adds a learner turn.
- [ ] Commit `feat(web): text-input fallback for conversations`.

---

## Definition of done
- Ending a session stores its aggregate scores and routes to a summary screen showing scores + top-3 focus areas + transcript.
- `/{language}/dashboard` shows history, a pronunciation trend chart, and weak-area focus chips; empty states handled.
- Mic-denied users can still complete a session via text.
- Aggregation logic is pure and unit-tested; API endpoints enforce ownership.
