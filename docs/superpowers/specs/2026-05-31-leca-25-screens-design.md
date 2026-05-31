# LECA — 25 Screens Implementation Design

**Date:** 2026-05-31  
**Scope:** All 25 wireframe screens across 4 sub-projects  
**Approach:** Feature-complete sub-projects · Real APIs throughout · Responsive mobile-first  
**Tech stack:** Next.js App Router · shadcn/ui · Tailwind CSS · TypeScript

---

## Overview

The 25 screens from `docs/leca/wireframes/ui-wireframes.html` are implemented in four sequential sub-projects. Each sub-project is completed end-to-end (real APIs, tested) before the next begins. Learner screens come first.

### Sub-project Order

| # | Name | Screens | Count |
|---|------|---------|-------|
| 1 | Learner Core Session Loop | 01, 02, 03, 04, 05, 10, 12, 16, 17, 20 | 10 |
| 2 | Learner Discovery & Progress | 06, 07, 11, 18, 19, 23, 25 | 7 |
| 3 | Learner Edge Cases & Social | 13, 14, 21, 22, 24 | 5 |
| 4 | Educator & Admin | 08, 15 | 3 |

---

## Sub-project 1 — Learner Core Session Loop

The full "open app → practice → see results" journey. Spec for Sub-projects 2–4 will be written after Sub-project 1 ships.

### Routes & Status

| Screen | Route | Status |
|--------|-------|--------|
| 01 — Splash / Onboarding | `/onboarding` | Enhance existing |
| 02 — Home / Mode Selection | `/` | Enhance existing |
| 03 — Live Conversation | `/conversation` | Enhance existing |
| 04 — Pronunciation Feedback | *(overlay inside `/conversation`)* | New component |
| 05 — Session Summary + Vocab Gaps | `/session/[id]/summary` | New page |
| 10 — Level Assessment | `/onboarding/assessment` | Enhance existing |
| 12 — Minimal Pair Drill | `/drills/minimal-pair` | New page |
| 16 — Key Phrases Panel | *(sheet inside `/conversation`)* | New component |
| 17 — Phrase Detail Sheet | *(bottom sheet inside `/conversation`)* | New component |
| 20 — Text Input Fallback | *(toggle inside `/conversation`)* | New component |

Screens 04, 16, 17, and 20 are UI components mounted within `/conversation` — not separate routes. This keeps the session URL stable and avoids navigation interrupting the active practice flow.

### New Pages

**`SessionSummaryPage`** (`/session/[id]/summary`)
- Overall pronunciation score (0–100) in a score ring
- 4 competency scores: Fluency · Pronunciation · Vocab in Context · Listening (BRD §7.1)
- Session stats: duration, turns, speaking time
- Top 3 improvement areas with ranked issues and practice/review CTAs
- Vocabulary this session: phrases used naturally + up to 3 missed phrases with practice CTAs (BRD §7.6 AC-2)
- Action buttons: "Practice this again" · "Choose new scenario" · "Share progress report" · "Review weak sounds"
- "Share progress report" CTA: rendered but disabled in Sub-project 1 (Screen 23 ships in Sub-project 2); shows tooltip "Coming soon"

**`MinimalPairDrillPage`** (`/drills/minimal-pair`)
- Triggered when same phoneme error occurs ≥3× in a session (FR-PRON-04)
- Displays target phoneme symbol, examples, and "hear native example" TTS
- 4-card word pair grid: tap word you hear, then say it with PTT
- Per-word pronunciation scores (0–100) with color coding: green ≥80, red <60 (FR-PRON-02/03)
- Colorblind-safe: text labels and icons alongside color (NFR-USE-05)
- Progress indicator: "N of M words · X correct so far"

### New Components (inside `/conversation`)

**`PronunciationFeedbackOverlay`**
- Triggered when user taps a word in the conversation transcript
- Bottom sheet showing: word, IPA transcription, pronunciation score, color-coded feedback
- Accessible from within an active session without interrupting it

**`KeyPhrasesPanel`**
- Bottom sheet shown before the conversation starts (pre-session)
- Lists scenario-specific key phrases with phrase count (BRD §7.6)
- Each phrase tappable → opens PhraseDetailSheet
- "Start Conversation" CTA dismisses panel and begins session

**`PhraseDetailSheet`**
- Second-level bottom sheet (stacked over KeyPhrasesPanel)
- Shows: phrase text, TTS audio playback, example sentence, practice CTA
- Back button returns to KeyPhrasesPanel

**`TextInputFallback`**
- Toggle in the conversation toolbar (mic icon → keyboard icon)
- Swaps PTT mic for a text input field
- Use cases: mic permission denied, accessibility need, silent environment
- Submitted text is processed identically to transcribed speech

### Existing Pages to Enhance

**`/onboarding`** (Screen 01)
- On completion: redirect to `/onboarding/assessment` if first session, else `/`
- Wire assessment skip logic for returning users

**`/`** (Screen 02)
- Add authenticated bottom nav bar: Home · Scenarios · Progress · Settings
- Bottom nav hidden when user is not authenticated (landing page mode remains)

**`/conversation`** (Screen 03)
- Mount KeyPhrasesPanel (shown on load before session starts)
- Mount PronunciationFeedbackOverlay (on word tap)
- Mount PhraseDetailSheet (on phrase tap in KeyPhrasesPanel)
- Mount TextInputFallback toggle in toolbar
- On session end: redirect to `/session/[id]/summary`
- Pass `scenarioId` as query param to pre-load key phrases

**`/onboarding/assessment`** (Screen 10)
- Wire result to set `user.level` via PATCH `/users/:id`
- On completion: redirect to `/` (home)

### Data Flow

```
User taps scenario → /conversation?scenarioId=:id
  └─ GET /scenarios/:id → loads key phrases for KeyPhrasesPanel
  └─ Session starts → WebSocket/SSE to conversation API
  └─ Session ends → API returns { sessionId }
  └─ Redirect to /session/:sessionId/summary

/session/:id/summary
  └─ GET /sessions/:id → scores, vocab gaps, improvement areas
  └─ "Review weak sounds" → /drills/minimal-pair?sessionId=:id&phoneme=:phoneme

/drills/minimal-pair
  └─ GET /sessions/:id/phoneme-errors?phoneme=:phoneme → word pairs + error history
  └─ POST /drills/attempt → submit PTT result, get per-word score
```

### Shared UI Patterns

**Bottom Navigation Bar**
- 4 tabs: Home · Scenarios · Progress · Settings
- Mounted in `apps/web/src/app/[language]/layout.tsx` for authenticated users
- Hidden during: active conversation (Screen 03), assessment (Screen 10), drill (Screen 12)
- Uses existing shadcn/ui primitives, no new library

**Mobile-first layout shell**
- All learner screens: `max-w-sm mx-auto` container
- Intentional appearance on desktop — no phone frame (that's a wireframe documentation artifact)
- Tailwind responsive classes throughout

**Bottom sheets** (Screens 04, 16, 17)
- shadcn/ui `Sheet` component, anchored to bottom, drag-to-dismiss
- No new library required

**PTT Button** (`<PttButton>`)
- Shared component used in Screens 03, 12, 20
- Min 48×48px touch target (NFR-USE-03)
- Colorblind-safe: icon + text label, never color alone (NFR-USE-05)
- Extracted to `apps/web/src/components/ptt-button.tsx`

### API Contracts Needed

| Endpoint | Method | Used by |
|----------|--------|---------|
| `/sessions/:id` | GET | Session Summary (Screen 05) |
| `/sessions/:id/phoneme-errors` | GET | Minimal Pair Drill (Screen 12) |
| `/drills/attempt` | POST | Minimal Pair Drill score submission |
| `/scenarios/:id` (phrases) | GET | Key Phrases Panel (Screen 16) — phrases field already in scenario model |

### Wireframe Requirements Traced

| Requirement | Screen | Implementation |
|-------------|--------|----------------|
| BRD §7.1 — 4 competencies per session | 05 | SessionSummaryPage competency grid |
| BRD §7.3 Stage 3+4 — immediate feedback + progress | 05 | Improvement areas + score delta |
| BRD §7.6 AC-2 — phrases used + up to 3 missed | 05 | Vocab gap section |
| BRD §7.6 AC-3 — phrase set before session | 16 | KeyPhrasesPanel |
| FR-CONV-08 — summary: duration, turns, score, actions | 05 | Stats row + action buttons |
| FR-PRON-02 — per-word score 0–100 | 12 | Drill score per attempt |
| FR-PRON-03 — green ≥80, red <60 | 12 | Color + text label |
| FR-PRON-04 — drill triggered at ≥3 phoneme errors | 12 | Session summary CTA + query param |
| FR-DASH-04 — share report with 30-day expiry | 05 | Share CTA → Sub-project 2 Screen 23 |
| NFR-USE-01 — first session reachable <3 min | 01 | Onboarding flow wire-up |
| NFR-USE-03 — PTT touch target ≥48×48px | 03, 12 | PttButton shared component |
| NFR-USE-05 — colorblind-safe | 12 | Icon + text alongside color |
| NFR-COMP-01 — GDPR data export/delete | 13 | Sub-project 3 |
| NFR-SEC-03 — audio path disclosure | 13 | Sub-project 3 |

---

## Sub-projects 2–4

Specs for Sub-projects 2, 3, and 4 will be written after Sub-project 1 is complete. Each follows the same structure: routes, new pages, new components, data flow, shared patterns, API contracts, wireframe requirements.

**Sub-project 2 screens:** 06 (Scenario Library enhance), 07 (Learner Dashboard), 11 (Scenario Detail enhance), 18 (Session Summary detailed), 19 (Situation Filter), 23 (Shareable Progress Report), 25 (Core Competencies Dashboard)

**Sub-project 3 screens:** 13 (Settings & Privacy), 14 (Join a Class), 21 (Guest Session Limit), 22 (L1 Redirect), 24 (Scenario Submission enhance)

**Sub-project 4 screens:** 08 (Educator Dashboard — desktop), 15 (Admin Dashboard enhance)
