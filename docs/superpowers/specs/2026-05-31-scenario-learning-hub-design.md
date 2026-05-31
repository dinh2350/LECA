# Scenario Learning Hub — Design Spec

**Date:** 2026-05-31  
**Status:** Approved

## Goal

Transform `/scenarios/[id]` from a flat info page into a 3-tab learning hub. Scenarios become the core of the application — users learn vocabulary and phrases tied to a scenario before practicing with the AI.

## User Flow

1. User opens a scenario detail page
2. Reads the scenario overview (existing content, now in a tab)
3. Browses key phrases in the Vocabulary tab (expandable cards with translation + audio)
4. Drills the phrases in the Drill tab (flashcard or quiz mode)
5. Starts a conversation with the AI at any point via a sticky CTA

## Approach

Enhance the existing `/scenarios/[id]` page in-place. No new routes. All existing content is preserved and reorganized into the Overview tab.

---

## Section 1: Data Changes

### Prisma Schema

Add one optional field to `ScenarioPhrase`:

```prisma
model ScenarioPhrase {
  // existing fields...
  translation String? // native language translation, e.g. "Tôi muốn đặt lịch hẹn"
}
```

Requires a Prisma migration. Existing phrases are unaffected (field is nullable).

### Backend DTOs

**`ScenarioPhraseDto`** (`apps/api/src/scenarios/dto/scenarios.dto.ts`):
```typescript
translation?: string | null;
```

**`CreateScenarioPhraseDto`** (`apps/api/src/scenarios/dto/create-scenario.dto.ts`):
```typescript
translation?: string; // optional, max 500 chars
```

No new API endpoints. The existing `GET /scenarios/:id` returns all phrases and is sufficient.

### Frontend Types

**`ScenarioPhrase`** (`apps/web/src/services/api/services/scenarios.ts`):
```typescript
translation?: string | null;
```

---

## Section 2: Tab Structure & Navigation

### URL Design

Tab state is driven by a `?tab=` search param for bookmarkability:

| URL | Active tab |
|---|---|
| `/scenarios/[id]` | Overview (default) |
| `/scenarios/[id]?tab=vocabulary` | Vocabulary |
| `/scenarios/[id]?tab=drill` | Drill |

### Layout

```
┌─────────────────────────────┐
│  ← Back    [Title] [Badges] │  ← scenario header (always visible)
├─────────────────────────────┤
│  Overview │ Vocabulary │ Drill │  ← tab bar
├─────────────────────────────┤
│                             │
│        Tab content          │
│                             │
│                             │
├─────────────────────────────┤
│   ▶ Start Conversation      │  ← sticky CTA (always visible)
└─────────────────────────────┘
```

### New Components

| Component | Location | Responsibility |
|---|---|---|
| `ScenarioTabs` | `components/scenarios/` | Tab switcher bar (wraps shadcn Tabs or custom pill nav) |
| `ScenarioOverviewTab` | `components/scenarios/` | Existing page content extracted into a component |
| `ScenarioVocabularyTab` | `components/scenarios/` | Phrase list |
| `ScenarioDrillTab` | `components/scenarios/` | Drill session manager |
| `PhraseCard` | `components/scenarios/` | Expandable phrase card |
| `FlashcardDrill` | `components/scenarios/` | Flashcard flip UI |
| `QuizDrill` | `components/scenarios/` | Multiple-choice quiz UI |

### Sticky CTA

- Always visible at bottom of screen across all tabs
- Default label: `▶ Start Conversation`
- After drill completion: `✓ Ready to practice! Start Conversation`
- Label change driven by `isComplete` callback prop from `ScenarioDrillTab` → lifted to page-content state

---

## Section 3: Vocabulary Tab

### Behavior

- Phrases rendered as vertically stacked expandable cards, ordered by `displayOrder`
- **Only one card expanded at a time** — opening one collapses the previous
- No loading state needed — phrases arrive with the parent `useGetScenarioService()` call

### Card States

**Collapsed:**
```
"I'd like to make an appointment"    ▼
```

**Expanded:**
```
"I'd like to make an appointment"    ▲
  Tôi muốn đặt lịch hẹn               ← translation (hidden if null)
  I'd like to make an appt for Thu.   ← example sentence (italic)
  🔊  [A2]                             ← audio button (hidden if no audioUrl) + difficulty badge
```

### Component: `PhraseCard`

- Props: `phrase: ScenarioPhrase`, `isOpen: boolean`, `onToggle: () => void`
- Parent (`ScenarioVocabularyTab`) tracks `openId` and passes `isOpen` + `onToggle` down
- Audio playback via browser native `<audio>` element, hidden; button triggers `.play()`

---

## Section 4: Drill Tab

### Mode Toggle

Pill switch at the top of the Drill tab:

```
[ Flashcard ]  Quiz
```

Defaults to Flashcard. Switching mode resets current index and score.

### Flashcard Mode

- One phrase per screen, centered
- **Front face:** English phrase
- **Tap to flip → Back face:** example sentence + translation (if present)
- Flip animation: CSS `rotateY` transform
- Below card: `✗ Didn't know` (red) / `✓ Got it` (green) buttons
- Progress bar: `current / total` at the top

### Quiz Mode

- Only available if the scenario has **≥ 4 phrases** — if fewer, the Quiz toggle is hidden and the mode defaults to Flashcard only
- Shows `exampleSentence` with the phrase replaced by `_____`
- 4 options: correct phrase + 3 randomly sampled from the other phrases in the scenario (without replacement)
- Correct → highlights green, wrong → highlights red + reveals correct answer
- Auto-advances after 1 second

### Summary Screen (both modes)

Shown after the last card:

```
  🎉 Drill complete!
  You knew 8 of 12 phrases.
  
  [ Retry missed ]   [ ▶ Start Conversation ]
```

`isComplete: true` is emitted via callback prop, changing the sticky CTA label.

### Component: `ScenarioDrillTab`

State (all local, no persistence):

| State | Type | Description |
|---|---|---|
| `mode` | `'flashcard' \| 'quiz'` | Active drill mode |
| `shuffledPhrases` | `ScenarioPhrase[]` | Phrases shuffled on mount |
| `currentIndex` | `number` | Current card index |
| `score` | `number` | Count of "got it" / correct answers |
| `isComplete` | `boolean` | True when last card is answered |

Props:
- `phrases: ScenarioPhrase[]`
- `onComplete: () => void` — called when drill finishes, triggers CTA label change in parent

---

## Out of Scope

- Persisting drill scores to the backend (follow-up: spaced repetition via `UserVocabulary`)
- Redesigning the `/scenarios` list page with per-scenario progress indicators
- Admin UI for adding translations to existing phrases
- Phrase audio recording/upload flow

---

## Files Changed

| File | Change |
|---|---|
| `apps/api/prisma/schema.prisma` | Add `translation String?` to `ScenarioPhrase` |
| `apps/api/prisma/migrations/` | New migration file |
| `apps/api/src/scenarios/dto/scenarios.dto.ts` | Add `translation` to `ScenarioPhraseDto` |
| `apps/api/src/scenarios/dto/create-scenario.dto.ts` | Add optional `translation` to `CreateScenarioPhraseDto` |
| `apps/api/src/scenarios/scenarios.service.ts` | Include `translation` in phrase select/return |
| `apps/web/src/services/api/services/scenarios.ts` | Add `translation` to `ScenarioPhrase` type |
| `apps/web/src/app/[language]/scenarios/[id]/page-content.tsx` | Refactor into tabbed layout |
| `apps/web/src/components/scenarios/ScenarioTabs.tsx` | New |
| `apps/web/src/components/scenarios/ScenarioOverviewTab.tsx` | New (extracted from page-content) |
| `apps/web/src/components/scenarios/ScenarioVocabularyTab.tsx` | New |
| `apps/web/src/components/scenarios/ScenarioDrillTab.tsx` | New |
| `apps/web/src/components/scenarios/PhraseCard.tsx` | New |
| `apps/web/src/components/scenarios/FlashcardDrill.tsx` | New |
| `apps/web/src/components/scenarios/QuizDrill.tsx` | New |
