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