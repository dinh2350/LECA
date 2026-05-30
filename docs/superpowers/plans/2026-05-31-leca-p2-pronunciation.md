# P2 · Pronunciation Analysis Pipeline Implementation Plan

> **For agentic workers:** Execute with superpowers:subagent-driven-development or superpowers:executing-plans. One commit per task. Write the failing test first. **Depends on P1** (turns must be persisted before they can be scored).

**Goal:** Give learners per-word, color-coded pronunciation feedback and a phoneme-level trend. Phase 1 runs Wav2Vec2 **in the browser (WASM)**; the API persists scores and computes trends. After this plan: a learner finishing a turn sees each word colored green/amber/red, can drill weak phonemes with minimal pairs, and the dashboard (P3) can chart pronunciation over time.

**FRs:** FR-PRON-01 (per-word score), FR-PRON-02 (color-coded), FR-PRON-03 (phoneme breakdown), FR-PRON-04/05 (minimal-pair drills), FR-PRON-06 (trend over time). ARCHITECTURE §3 (Phase-1 in-browser Wav2Vec2), data model `pronunciation_scores` (`phoneme_scores` JSONB, `overall_score`).

**Architecture:** The browser already captures push-to-talk audio. After a turn, the web runs a Wav2Vec2 WASM scorer to produce `{word, overallScore, phonemeScores[]}`, POSTs them to the API, and renders color-coded words. The API persists `pronunciation_scores` and exposes a trend endpoint that aggregates per phoneme over time. Minimal-pair drills are derived client-side from the weakest phonemes.

**Tech Stack:** NestJS + Prisma (`PronunciationScore`), Next.js + Wav2Vec2 WASM (onnxruntime-web), React Query, zod.

---

## File Map

| Action | Path | App |
|--------|------|-----|
| New | `packages/schemas/src/pronunciation.schema.ts` | schemas |
| Modify | `packages/schemas/src/index.ts` | schemas |
| New | `apps/api/src/pronunciation/pronunciation.module.ts` | api |
| New | `apps/api/src/pronunciation/pronunciation.controller.ts` | api |
| New | `apps/api/src/pronunciation/pronunciation.service.ts` | api |
| New | `apps/api/src/pronunciation/pronunciation.service.spec.ts` | api |
| New | `apps/api/src/pronunciation/dto/record-pronunciation.dto.ts` | api |
| Modify | `apps/api/src/app.module.ts` | api |
| New | `apps/web/src/services/pronunciation/score-color.ts` | web |
| New | `apps/web/src/services/pronunciation/score-color.spec.ts` | web |
| New | `apps/web/src/services/pronunciation/minimal-pairs.ts` | web |
| New | `apps/web/src/services/pronunciation/wav2vec-scorer.ts` | web |
| New | `apps/web/src/services/api/services/pronunciation.ts` | web |
| New | `apps/web/src/components/pronunciation/colored-transcript.tsx` | web |
| New | `apps/web/src/components/pronunciation/minimal-pair-drill.tsx` | web |
| Modify | `apps/web/src/app/[language]/conversation/page-content.tsx` | web |

---

## Task 1 — Shared pronunciation contract

**Files:** Create `packages/schemas/src/pronunciation.schema.ts`; modify index; test alongside.

- [ ] Failing test asserts: `phonemeScoreSchema` requires `{ phoneme, score 0-100 }`; `recordPronunciationSchema` requires ≥1 word, each with `overallScore 0-100` and ≥1 phoneme.
- [ ] Implement:
```ts
import { z } from 'zod';

export const phonemeScoreSchema = z.object({
  phoneme: z.string().min(1),
  score: z.number().min(0).max(100),
});
export const wordScoreSchema = z.object({
  word: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  phonemeScores: z.array(phonemeScoreSchema).min(1),
});
export const recordPronunciationSchema = z.object({
  words: z.array(wordScoreSchema).min(1).max(100),
});
export type PhonemeScore = z.infer<typeof phonemeScoreSchema>;
export type WordScore = z.infer<typeof wordScoreSchema>;
export type RecordPronunciationInput = z.infer<typeof recordPronunciationSchema>;
```
- [ ] Export from index. Run test → PASS. Commit `feat(schemas): add pronunciation contract`.

---

## Task 2 — Persist client-computed pronunciation scores

**Files:** `pronunciation.module.ts`, `pronunciation.controller.ts`, `pronunciation.service.ts`, `dto/record-pronunciation.dto.ts`, spec; register in `app.module.ts`.

- [ ] Create `RecordPronunciationDto` (class-validator/swagger mirror of the zod schema): `words: WordScoreDto[]`, each `{ word, overallScore, phonemeScores: PhonemeScoreDto[] }`.
- [ ] Failing test `pronunciation.service.spec.ts`:
```ts
describe('recordTurnScores', () => {
  it('persists one pronunciation_scores row per word', async () => {
    prisma.conversationTurn.findUnique.mockResolvedValue({ id: 't1', sessionId: 's1' });
    prisma.conversationSession.findUnique.mockResolvedValue({ id: 's1', userId: 'u1' });
    prisma.pronunciationScore.create.mockResolvedValue({});
    const res = await service.recordTurnScores('u1', 's1', 't1', {
      words: [{ word: 'thirty', overallScore: 42, phonemeScores: [{ phoneme: 'TH', score: 30 }, { phoneme: 'IH', score: 60 }] }],
    });
    expect(res).toEqual({ recorded: 1 });
    expect(prisma.pronunciationScore.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ turnId: 't1', sessionId: 's1', userId: 'u1', word: 'thirty', overallScore: 42 }) }),
    );
  });
  it('rejects a turn that does not belong to the user’s session', async () => {
    prisma.conversationTurn.findUnique.mockResolvedValue({ id: 't1', sessionId: 's1' });
    prisma.conversationSession.findUnique.mockResolvedValue({ id: 's1', userId: 'someone-else' });
    await expect(service.recordTurnScores('u1', 's1', 't1', { words: [{ word: 'x', overallScore: 1, phonemeScores: [{ phoneme: 'X', score: 1 }] }] })).rejects.toThrow();
  });
});
```
- [ ] Implement service:
```ts
async recordTurnScores(userId: string, sessionId: string, turnId: string, dto: RecordPronunciationDto) {
  const turn = await this.prisma.conversationTurn.findUnique({ where: { id: turnId } });
  if (!turn || turn.sessionId !== sessionId) throw new NotFoundException('Turn not found');
  const session = await this.prisma.conversationSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) throw new ForbiddenException('Not your session');
  for (const w of dto.words) {
    await this.prisma.pronunciationScore.create({
      data: { turnId, sessionId, userId, word: w.word, overallScore: w.overallScore, phonemeScores: w.phonemeScores as Prisma.InputJsonValue },
    });
  }
  return { recorded: dto.words.length };
}
```
- [ ] Controller (JWT-guarded, resolves Leca user id like other modules): `POST /conversation-sessions/:sessionId/turns/:turnId/pronunciation`.
- [ ] Run tests + build → PASS. Commit `feat(api): persist per-word pronunciation scores`.

---

## Task 3 — Per-phoneme trend endpoint (FR-PRON-06)

**Files:** extend service + controller + spec.

- [ ] Failing test: `getPhonemeTrend(userId)` returns, per phoneme, the average score grouped by ISO week for the last 8 weeks, plus the current weakest phonemes (lowest average).
- [ ] Implement using a raw aggregate over `pronunciation_scores` (unnest `phoneme_scores` JSONB) **or** an in-service reduction over recent rows:
```ts
async getPhonemeTrend(userId: string) {
  const rows = await this.prisma.pronunciationScore.findMany({
    where: { userId, scoredAt: { gte: new Date(Date.now() - 56 * 864e5) } },
    select: { phonemeScores: true, scoredAt: true },
    orderBy: { scoredAt: 'asc' },
  });
  // reduce rows → { weakest: {phoneme, avg}[], series: { week, avgByPhoneme }[] }
}
```
- [ ] Controller `GET /me/pronunciation/trend`. Run tests → PASS. Commit `feat(api): pronunciation phoneme trend`.

---

## Task 4 — Web score→color mapping (pure)

**Files:** `score-color.ts`, `score-color.spec.ts`.

- [ ] Failing test:
```ts
import { scoreColor } from './score-color';
it('maps thresholds', () => {
  expect(scoreColor(85)).toBe('good');   // green  >= 80
  expect(scoreColor(60)).toBe('fair');   // amber  50-79
  expect(scoreColor(30)).toBe('poor');   // red    < 50
});
```
- [ ] Implement:
```ts
export type ScoreBand = 'good' | 'fair' | 'poor';
export function scoreColor(score: number): ScoreBand {
  if (score >= 80) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}
export const BAND_CLASS: Record<ScoreBand, string> = {
  good: 'text-emerald-600',
  fair: 'text-amber-600',
  poor: 'text-red-600',
};
```
- [ ] Run → PASS. Commit `feat(web): pronunciation score color bands`.

---

## Task 5 — Minimal-pair lookup (pure, FR-PRON-04/05)

**Files:** `minimal-pairs.ts` + spec.

- [ ] Failing test: `minimalPairsFor('TH')` returns ≥1 pair like `{ a: 'think', b: 'sink' }`; unknown phoneme returns `[]`.
- [ ] Implement a static map keyed by phoneme of common confusable pairs (TH/S, R/L, V/W, IH/IY, etc.) and `minimalPairsFor(phoneme)`.
- [ ] Run → PASS. Commit `feat(web): minimal-pair drill data`.

---

## Task 6 — Wav2Vec2 WASM scorer (integration)

**Files:** `wav2vec-scorer.ts`.

This is the ML integration; isolate it behind an interface so the rest of the app is testable without the model.

- [ ] Define the interface + lazy WASM loader:
```ts
import type { WordScore } from '@leca/schemas';

export interface PronunciationScorer {
  score(audio: Float32Array, sampleRate: number, transcript: string): Promise<WordScore[]>;
}

export async function loadWav2VecScorer(): Promise<PronunciationScorer> {
  const ort = await import('onnxruntime-web');
  const session = await ort.InferenceSession.create('/models/wav2vec2-phoneme.onnx');
  return {
    async score(audio, sampleRate, transcript) {
      // 1) resample to 16k, 2) run model → phoneme logits/timestamps,
      // 3) align phonemes to transcript words (CTC), 4) per-word + per-phoneme 0-100.
      // Returns WordScore[]; alignment + scoring helpers are pure and unit-tested separately.
    },
  };
}
```
- [ ] Extract the **alignment + scoring math** (logits → per-word score) into pure functions in the same file and unit-test them with synthetic logits (no model load).
- [ ] Place the model file under `apps/web/public/models/` and document the source in the PR. Manual verify the model loads in the browser.
- [ ] Commit `feat(web): wav2vec2 wasm pronunciation scorer`.

---

## Task 7 — Pronunciation API hooks + colored transcript + drills

**Files:** `services/api/services/pronunciation.ts`, `components/pronunciation/colored-transcript.tsx`, `components/pronunciation/minimal-pair-drill.tsx`.

- [ ] React Query hooks: `useRecordPronunciationService()` (POST per turn) and `usePronunciationTrendService()` (GET trend) — mirror existing `services/api/services/*` patterns.
- [ ] `ColoredTranscript({ words })` renders each word with `BAND_CLASS[scoreColor(word.overallScore)]`; tapping a word opens a popover of its `phonemeScores` (FR-PRON-03).
- [ ] `MinimalPairDrill({ phoneme })` shows the worst phoneme’s pairs, each playable via Kokoro TTS (reuse existing TTS util), with a record-and-compare CTA (FR-PRON-04/05).
- [ ] Component tests: colored transcript applies the right class per band; drill renders pairs for a phoneme.
- [ ] Commit `feat(web): colored transcript + minimal-pair drills`.

---

## Task 8 — Wire scoring into the conversation flow

**Files:** Modify `apps/web/src/app/[language]/conversation/page-content.tsx`.

- [ ] After a learner PTT segment finalizes and its turn id is known (learner turn index from P1), feed the captured audio + transcript to the scorer, then `useRecordPronunciationService().mutate(...)` and render `ColoredTranscript` under the learner bubble. Run scoring **off the audio thread** and never block the next turn (NFR-PERF).
- [ ] When the worst phoneme score < 50, surface a “Practice this sound” entry point to `MinimalPairDrill`.
- [ ] Manual verify end-to-end: speak “thirty-three” → weak `TH` shows red, drill offered, trend endpoint returns data.
- [ ] Commit `feat(web): score pronunciation per turn and show feedback`.

---

## Definition of done
- `pronunciation_scores` rows are written per learner word with `phoneme_scores` JSONB.
- Words render color-coded; phoneme breakdown on tap; weak phonemes offer minimal-pair drills.
- `GET /me/pronunciation/trend` returns per-phoneme weekly averages + weakest phonemes (consumed by P3).
- Pure mapping/alignment/minimal-pair logic is unit-tested; ML stays behind an interface.
