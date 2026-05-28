# LECA — Software Requirements Specification (SRS)

**Product**: LECA (Language & English Communication AI)
**Document Type**: Software Requirements Specification
**Version**: 1.0
**Status**: Draft
**Date**: 2026-05-28
**Source BRD**: BRD.md v0.6
**Scope**: Phase 0 (Foundation) + Phase 1 (MVP)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [External Interface Requirements](#5-external-interface-requirements)
6. [System Constraints](#6-system-constraints)
7. [Acceptance Criteria](#7-acceptance-criteria)
8. [Requirements Traceability Matrix](#8-requirements-traceability-matrix)

---

## 1. Introduction

### 1.1 Purpose

This SRS defines the functional and non-functional requirements for LECA — an open-source, AI-powered English communication learning platform. It is the authoritative technical reference for engineering, QA, and community contributors building toward the Phase 0 and Phase 1 milestones.

### 1.2 Scope

LECA provides:
- Real-time AI voice conversation practice in English
- Phoneme-level pronunciation analysis and feedback
- A community-built scenario library
- A progress dashboard for learners and educators
- Self-hosting support via Docker for institutions

**Out of scope for this SRS**: Native iOS/Android apps, peer-to-peer matching, paid tiers, languages other than English as the target, AI-generated curriculum paths, SSO/SAML/SCIM.

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|-----------|
| STT | Speech-to-Text |
| TTS | Text-to-Speech |
| WAU | Weekly Active Users |
| D7 / D30 | Day-7 / Day-30 retention rate |
| PWA | Progressive Web App |
| LTI | Learning Tools Interoperability (standard for LMS integration) |
| LMS | Learning Management System |
| NFR | Non-Functional Requirement |
| FR | Functional Requirement |
| Phoneme | The smallest unit of sound in a language |
| Scenario | A structured conversation context (e.g., job interview, doctor visit) |
| Session | A single continuous conversation interaction between learner and AI |

### 1.4 Users and Roles

| Role | Description |
|------|-------------|
| **Learner** | End user practicing English (Segments 1 & 2) |
| **Educator** | ESL teacher or institution admin using LECA for a class (Segment 3) |
| **Contributor** | Developer or community member submitting scenarios or code (Segment 4) |
| **Self-hoster** | Institution technical admin deploying LECA on own infrastructure |
| **System** | The LECA AI pipeline and backend services |

---

## 2. Overall Description

### 2.1 Product Context

LECA is a standalone web application (PWA) deployable via:
1. **LECA Cloud** — hosted endpoint provided by the project (default for individual users)
2. **Self-hosted** — Docker Compose on institution-managed hardware

The AI pipeline is tiered by deployment phase to achieve $0 infrastructure cost during Phase 0–1:

| Phase | STT | LLM | TTS | Pronunciation | Infrastructure |
|-------|-----|-----|-----|---------------|---------------|
| **Phase 0** | mlx-whisper small (on-device, Mac Mini M4) | Ollama + LLaMA 3 8B Q4 (Mac Mini M4) | Kokoro-82M (on-device) | Wav2Vec2 base (Mac Mini M4) | Mac Mini M4 8GB via Cloudflare Tunnel |
| **Phase 1** | Gemini 2.0 Flash native audio (server-side) | Gemini 2.0 Flash API (free tier → paid) | Kokoro-js (in-browser, on-device) | Wav2Vec2 WASM (in-browser) | Stateless API server (no GPU needed) |
| **Phase 2+** | WebLLM/Whisper WASM (on-device, primary) | WebLLM in-browser (primary) + Gemini fallback | Kokoro-js (in-browser) | Wav2Vec2 WASM (in-browser) | Minimal server (auth, DB, sync only) |

**Cost target**: $0/month through Phase 0; < $50/month at Phase 1 beta (500 DAU); < $200/month at 10K WAU.

### 2.2 Assumptions

| ID | Assumption | Invalidating Signal |
|----|-----------|---------------------|
| A1 | LLaMA 3 8B Q4 (on Mac Mini M4) and Gemini 2.0 Flash produce feedback quality sufficient for conversational English learning at Beginner–Intermediate level | User testing shows feedback quality meaningfully worse than paid apps |
| A2 | Learners will engage consistently with a self-serve app without a human teacher | D7 retention below 20% in early cohorts |
| A3 | Most ESL teachers want managed access (not self-host); self-hosting is primarily for institutions with IT staff | Interview #3 confirmed: teachers want simple setup, not Docker admin |
| A4 | Android-first PWA covers the primary device profile of Segments 1–3 | Significant usage from iOS or desktop in beta analytics |
| A5 | Gemini 2.0 Flash free tier (1,000 req/day) is sufficient for Phase 1 beta up to ~500 DAU | Daily request quota exhausted before 500 DAU |
| A6 | Mac Mini M4 8GB can serve Phase 0 (5–10 concurrent advisors) with < 3s end-to-end latency | Observed latency consistently > 3s during Phase 0 internal testing |
| A7 | Kokoro-js runs adequately on Android 10+ mid-range devices in-browser | TTS audio quality or latency unacceptable on target devices |

### 2.3 Dependencies

| Dependency | Version / Source | Phase | Risk |
|-----------|-----------------|-------|------|
| Apple MLX / mlx-whisper | Latest (Apple open-source) | Phase 0 | Apple Silicon only — not portable to non-M-chip hardware |
| Ollama | Latest stable | Phase 0 | LLaMA 3 8B quality ceiling vs. 70B |
| Meta LLaMA 3 8B Q4_K_M | via Ollama | Phase 0 | License: Meta LLaMA Community License (commercial use allowed) |
| Kokoro TTS (82M) | kokoro-82m (Apache 2.0) | All phases | Small model — voice quality lower than Coqui XTTS |
| Kokoro-js | npm package | Phase 1+ | In-browser TTS; WebAssembly support required |
| Google Gemini 2.0 Flash | Google AI API | Phase 1+ | Free tier rate limits (15 RPM / 1,000 RPD); Google ToS applies |
| Wav2Vec2 base | facebook/wav2vec2-base-960h | All phases | HuggingFace availability; WASM port via ONNX runtime |
| WebLLM / MLC-AI | @mlc-ai/web-llm | Phase 2+ | Requires WebGPU (Chrome 113+, Android 10+ mid-range) |
| Cloudflare Tunnel | cloudflared (free) | Phase 0 | Bandwidth limits on free tier; acceptable for internal testing |

---

## 3. Functional Requirements

Requirements are labeled `FR-[module]-[number]` and prioritized using MoSCoW: **M** (Must), **S** (Should), **C** (Could), **W** (Won't for MVP).

---

### 3.1 User Authentication & Onboarding

#### FR-AUTH-01 — Guest Access **[M]**
The system shall allow users to start a conversation session without creating an account. Guest sessions shall be limited to 3 sessions per device before prompting account creation.

#### FR-AUTH-02 — Account Registration **[M]**
The system shall support account creation via email + password. No OAuth in Phase 1.

#### FR-AUTH-03 — Level Assessment **[M]**
On first authenticated session, the system shall administer a 2-minute spoken level assessment (5–7 prompts) and classify the learner as Beginner / Intermediate / Advanced. Classification shall seed the AI's adaptive difficulty baseline.

#### FR-AUTH-04 — Age Gate **[M]**
Self-hosted deployments with child learners: admin must enable content safety filter via config flag. Consumer sign-up requires age confirmation (13+ gate, COPPA-compliant).

---

### 3.2 AI Conversation Tutor

#### FR-CONV-01 — Voice Input Capture **[M]**
The system shall capture microphone audio at 16kHz, 16-bit mono. Recording starts on user action (push-to-talk button) and ends on release or after 60 seconds of silence.

#### FR-CONV-02 — Speech-to-Text Transcription **[M]**
The system shall transcribe learner audio using a phase-appropriate STT backend:
- **Phase 0**: mlx-whisper small model running on Mac Mini M4 via server-side API. Transcription shall complete within 0.5 seconds for utterances ≤ 15 seconds.
- **Phase 1+**: Gemini 2.0 Flash multimodal API, which processes audio natively (no separate Whisper call). Transcription is embedded in the LLM call with a combined latency target of ≤ 2 seconds.
- **Fallback**: whisper.cpp WASM (base model) running in-browser when server STT is unavailable.

#### FR-CONV-03 — AI Dialogue Response **[M]**
The system shall generate a contextually appropriate English response using a phase-appropriate LLM backend:
- **Phase 0**: LLaMA 3 8B Q4_K_M via Ollama on Mac Mini M4 (~30–40 tok/s via Metal GPU).
- **Phase 1+**: Gemini 2.0 Flash API (STT + dialogue combined in one multimodal call).
- **Phase 2+**: WebLLM in-browser (primary); Gemini API as fallback for low-end devices.

Response must:
- Be grammatically correct English
- Adapt register and vocabulary to the learner's assessed level
- Not exceed 4 sentences per turn to maintain conversational pacing

#### FR-CONV-04 — Post-Turn Feedback **[M]**
After each learner turn, the system shall display structured feedback covering:
- **Fluency**: whether the utterance flowed naturally
- **Naturalness**: whether word choice and phrasing matches native speaker norms
- **Vocabulary**: one alternative word/phrase suggestion when applicable
- **Explanation**: a 1-sentence explanation of *why* something sounds unnatural (not just correct/wrong)

Feedback display shall be optional — learner can toggle it off per session.

#### FR-CONV-05 — Text-to-Speech Response **[M]**
The system shall synthesize the AI's text response into audio using **Kokoro-js running in-browser** (on-device, no server call). Audio playback shall begin within 400ms of the TTS input being available. On devices that do not support the required WASM/Web Audio APIs, the system shall fall back to displaying text only.

#### FR-CONV-06 — Free Talk Mode **[M]**
The system shall provide a Free Talk mode where the learner can speak on any topic without a predefined scenario. The AI shall maintain conversation context across up to 20 turns within a session.

#### FR-CONV-07 — Scenario Mode **[M]**
The system shall provide a Scenario mode where the AI adopts a defined role (e.g., interviewer, doctor, customer service agent) and initiates the conversation from the scenario context. AI behavior shall be constrained to the scenario role throughout the session.

#### FR-CONV-08 — Session Summary **[M]**
At session end, the system shall display a summary including:
- Total speaking time
- Number of turns
- Top 3 improvement areas (fluency, vocabulary, pronunciation)
- Pronunciation score (aggregate, 0–100)
- Option to: Practice again | Choose new scenario | Review weak sounds

#### FR-CONV-09 — Non-English Input Handling **[M]**
If the system detects non-English input (L1 language), it shall:
1. Gently redirect the learner in a simplified English prompt
2. Not penalize the turn in pronunciation or fluency scoring
3. Not pass the non-English content to the LLM without language filtering

#### FR-CONV-10 — Content Moderation **[M]**
The system shall apply a content moderation filter to all STT output before passing to the LLM. Flagged content shall be blocked silently and the learner prompted to rephrase.

#### FR-CONV-11 — Context Persistence Within Session **[S]**
The AI shall maintain full conversation history within a session for coherent multi-turn dialogue. History shall be truncated using a sliding window of 2,000 tokens if context exceeds model limits.

#### FR-CONV-12 — Graceful Degradation to Text Input **[S]**
If microphone access is denied or audio quality is too low (SNR < 10dB), the system shall fall back to text input mode without breaking the session.

---

### 3.3 Pronunciation Analysis

#### FR-PRON-01 — Phoneme Alignment **[M]**
The system shall align the learner's audio to the expected phoneme sequence using Wav2Vec2 and Montreal Forced Aligner. Alignment shall be computed per utterance.

#### FR-PRON-02 — Phoneme-Level Scoring **[M]**
The system shall produce a per-word pronunciation score (0–100) and a per-phoneme deviation indicator (correct / close / incorrect) for each learner utterance.

#### FR-PRON-03 — Visual Pronunciation Feedback **[M]**
The system shall display the transcribed utterance with each word color-coded by pronunciation score:
- Green: score ≥ 80
- Yellow: score 60–79
- Red: score < 60

Tapping/clicking a word shall expand to show phoneme-level breakdown.

#### FR-PRON-04 — Minimal Pair Drill Trigger **[S]**
If the system detects the same phoneme error ≥ 3 times across a session, it shall offer a minimal pair drill exercise targeting that phoneme at session end.

#### FR-PRON-05 — Accent Calibration **[S]**
Over the learner's first 3 sessions, the system shall build a baseline accent profile. Scoring shall account for consistent accent features, distinguishing them from pronunciation errors.

#### FR-PRON-06 — Pronunciation Trend Tracking **[M]**
The system shall persist phoneme-level scores per session and compute a rolling improvement trend for each phoneme over the last 10 sessions.

---

### 3.4 Scenario Library

#### FR-SCEN-01 — Scenario Browse **[M]**
The system shall provide a browseable scenario library. Each scenario card shall display: title, category, difficulty level (Beginner / Intermediate / Advanced), and community rating.

#### FR-SCEN-02 — Scenario Search **[M]**
The system shall support full-text search across scenario titles and descriptions with results returned in < 500ms.

#### FR-SCEN-03 — Scenario Schema **[M]**
Each scenario shall be defined as a structured document containing:

```
title: string
category: string (e.g., "Job Interview", "Medical", "Travel")
difficulty: enum [beginner, intermediate, advanced]
context: string (backstory for the AI to set the scene)
ai_role: string (e.g., "You are a hiring manager at a tech company")
opening_line: string (AI's first utterance)
vocabulary_list: string[] (key terms learner should know)
tags: string[]
author: string (GitHub handle)
version: semver
```

#### FR-SCEN-04 — Community Scenario Submission **[S]**
Authenticated users shall be able to submit new scenarios via a form. Submissions shall enter a review queue and be visible only to the submitter until approved.

#### FR-SCEN-05 — Scenario Rating **[S]**
Authenticated users shall be able to rate a scenario (1–5 stars) after completing it. Aggregate rating shall be displayed on the scenario card.

#### FR-SCEN-06 — Pedagogical Review Flag **[S]**
Maintainers shall be able to flag a scenario for pedagogical review. Flagged scenarios shall not appear in the default browse view until reviewed.

#### FR-SCEN-07 — Seed Library at Launch **[M]**
The system shall ship with a minimum of 10 (Phase 0) and 20 (Phase 1 launch) pre-validated scenarios covering at minimum: job interview, customer service call, doctor visit, workplace meeting, academic presentation, travel/daily life.

---

### 3.5 Progress Dashboard

#### FR-DASH-01 — Session History (Learner) **[M]**
The learner dashboard shall display a list of all past sessions with: date, scenario used (or "Free Talk"), duration, aggregate pronunciation score, and top improvement area.

#### FR-DASH-02 — Pronunciation Trend Chart (Learner) **[M]**
The dashboard shall display a line chart of aggregate pronunciation score over the last 30 sessions, rendered with sufficient resolution to show improvement on small screens (≥ 320px width).

#### FR-DASH-03 — Weak Area Identification (Learner) **[M]**
The dashboard shall surface the top 3 weak phoneme categories based on the last 10 sessions and provide a direct link to practice scenarios targeting those categories.

#### FR-DASH-04 — Shareable Progress Report (Learner) **[S]**
The system shall generate a shareable PDF or link containing: learner name, date range, pronunciation trend chart, session count, and self-assessed confidence rating. Link shall expire after 30 days.

#### FR-DASH-05 — Class Roster View (Educator) **[M]**
The educator dashboard shall display a class roster with per-student: last active date, total speaking time (this week), aggregate pronunciation score trend (arrow: improving / stable / declining), and top weak area.

#### FR-DASH-06 — Speaking Time Tracking (Educator) **[M]**
The system shall log the total seconds of learner audio recorded per session and aggregate by student, week, and class.

#### FR-DASH-07 — Automated Weak Area Flagging (Educator) **[M]**
The system shall automatically flag students whose pronunciation score has declined > 10 points over 5 sessions, displaying a visual indicator on the class roster.

#### FR-DASH-08 — Exportable Class Report (Educator) **[S]**
Educators shall be able to export a class progress report as CSV or PDF covering the last 4 weeks, including all metrics from FR-DASH-05 and FR-DASH-06.

---

### 3.6 Self-Hosting & Institutional Administration

#### FR-SELF-01 — Docker Compose Deployment **[M]**
The system shall be deployable via a single `docker compose up` command. All services (web, API, AI pipeline, database) shall be containerized. The deployment shall reach a functional state within 15 minutes on hardware meeting the Light self-host tier spec.

#### FR-SELF-02 — Admin Dashboard **[M]**
The self-hosted admin dashboard shall allow: creating/managing learner accounts, creating classes, assigning scenarios, viewing class-level progress, and resetting learner passwords.

#### FR-SELF-03 — Class Code Enrollment **[M]**
Learners shall be able to join a class by entering a 6-character class code. The code shall be generated by the educator in the admin dashboard.

#### FR-SELF-04 — Configurable AI Model **[M]**
Administrators shall be able to configure which LLM backend is used via an environment variable: `LECA_LLM_BACKEND` (options: `llama3-8b`, `llama3-70b`, `openai-compatible`). The system shall validate the selected backend on startup and fail fast with a descriptive error if unavailable.

#### FR-SELF-05 — LTI Integration **[S]**
The system shall implement LTI 1.3 to enable launch from Moodle, Google Classroom, and Canvas. LTI launch shall auto-provision a learner account using the LMS-provided identity.

#### FR-SELF-06 — Content Safety Filter Config **[M]**
Self-hosted deployments shall support a `LECA_CONTENT_SAFETY=strict` config flag that enables an additional profanity and adult content filter layer before the LLM. Default: `standard`.

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Threshold | Measurement Method |
|----|------------|-----------|-------------------|
| NFR-PERF-01 | End-to-end latency (audio in → audio out) — Phase 0, Mac Mini M4 | < 3 seconds (P95) | Measured locally with 5–10 concurrent advisor sessions |
| NFR-PERF-02 | End-to-end latency — Phase 1, Gemini 2.0 Flash + Kokoro-js | < 3 seconds (P95) | Synthetic test, 100 sequential requests from Southeast Asia |
| NFR-PERF-03 | End-to-end latency — Phase 2, WebLLM on-device | < 5 seconds (P95) | Tested on Android 10 mid-range (Snapdragon 765G class) |
| NFR-PERF-04 | Scenario search response time | < 500ms (P99) | 1,000-scenario library benchmark |
| NFR-PERF-05 | Dashboard page load (learner) | < 2 seconds on 4G connection (10 Mbps) | Lighthouse / WebPageTest |
| NFR-PERF-06 | Pronunciation alignment (Wav2Vec2 WASM in-browser) | < 1.5 seconds per utterance ≤ 15 seconds | Automated browser test suite |
| NFR-PERF-07 | Kokoro-js TTS first-chunk playback | < 400ms after text input available | Automated browser test |

### 4.2 Scalability

| ID | Requirement |
|----|------------|
| NFR-SCALE-01 | The LECA Cloud architecture shall support horizontal scaling of the web and API tiers to handle 10,000 concurrent users without architecture changes. |
| NFR-SCALE-02 | The database schema shall support ≥ 1,000,000 learner session records without query degradation on indexed fields. |
| NFR-SCALE-03 | The self-hosted deployment shall support a minimum class size of 500 learners per instance on Light self-host hardware. |

### 4.3 Reliability & Availability

| ID | Requirement |
|----|------------|
| NFR-REL-01 | LECA Cloud uptime: ≥ 99.5% monthly (≤ 3.6 hours downtime/month). |
| NFR-REL-02 | If the AI pipeline fails mid-session, the system shall persist the completed portion of the session and display a recoverable error — not lose session data. |
| NFR-REL-03 | If the TTS service fails, the system shall fall back to displaying the AI's text response without audio, without breaking the session. |
| NFR-REL-04 | The system shall cache the 20 most recently used scenarios locally in the browser (IndexedDB) so that offline or poor-connectivity users can select a scenario without a network call. |

### 4.4 Security

| ID | Requirement |
|----|------------|
| NFR-SEC-01 | All data in transit shall be encrypted via TLS 1.3. |
| NFR-SEC-02 | User passwords shall be stored as bcrypt hashes (cost factor ≥ 12). Plain-text passwords shall never be logged or stored. |
| NFR-SEC-03 | **Phase 0**: Audio is processed server-side on the project-owned Mac Mini M4 and is not persisted beyond the session. **Phase 1+**: Audio is sent to Gemini 2.0 Flash API (Google's data processing terms apply — disclosed in Privacy Policy). **Phase 2+**: Audio stays on-device (WebLLM path) and never leaves the user's browser. Transcriptions and scores may be persisted per user consent. |
| NFR-SEC-04 | Self-hosted deployments retain full control of all audio and learner data. No telemetry shall be sent to LECA Cloud from a self-hosted instance without explicit admin opt-in. |
| NFR-SEC-05 | The API shall enforce rate limiting: ≤ 60 requests/minute per authenticated user, ≤ 10 requests/minute for unauthenticated (guest) sessions. |
| NFR-SEC-06 | All community-submitted scenario content shall be sanitized for XSS before rendering. |
| NFR-SEC-07 | Educator class codes shall be randomly generated (cryptographically random 6-character alphanumeric) and expire after 30 days of inactivity. |
| NFR-SEC-08 | Self-hosted admin dashboard shall require authentication and shall not be accessible on the public port by default. |

### 4.5 Usability

| ID | Requirement |
|----|------------|
| NFR-USE-01 | A new learner shall be able to complete their first conversation session within 3 minutes of opening the app for the first time, with no tutorial required. |
| NFR-USE-02 | The UI shall be mobile-first, fully functional on screens ≥ 320px wide. |
| NFR-USE-03 | The push-to-talk interface shall have a touch target ≥ 48×48px (WCAG 2.1 AA minimum). |
| NFR-USE-04 | All user-facing text shall be available in English. Multilingual UI (Vietnamese, Indonesian, Portuguese, Hindi) is Phase 2. |
| NFR-USE-05 | Pronunciation feedback visualizations shall be comprehensible without color alone (colorblind-safe palette + text labels). |
| NFR-USE-06 | The app shall function on Android 8.0+ (API level 26+) via PWA with no native app installation required. |

### 4.6 Maintainability & Developer Experience

| ID | Requirement |
|----|------------|
| NFR-DX-01 | A developer with no prior project context shall be able to set up a local development environment and run the full stack in ≤ 30 minutes by following the README. |
| NFR-DX-02 | The repository shall maintain test coverage ≥ 70% on all non-AI pipeline modules. |
| NFR-DX-03 | All public APIs shall be documented via OpenAPI 3.x spec, auto-generated from code. |
| NFR-DX-04 | The codebase shall pass CI (lint, type check, tests) on every PR. CI shall complete in ≤ 10 minutes. |
| NFR-DX-05 | The repository shall include a `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and labeled `good-first-issue` issues before public launch. |

### 4.7 Compliance & Data Privacy

| ID | Requirement |
|----|------------|
| NFR-COMP-01 | The system shall comply with GDPR: users shall be able to export all their data and delete their account (and all associated data) from the settings page. |
| NFR-COMP-02 | Consumer sign-up shall require acceptance of Terms of Service and Privacy Policy before account creation. |
| NFR-COMP-03 | The Privacy Policy shall explicitly state what audio data is processed, for how long, and by whom (LECA Cloud vs. self-host). |
| NFR-COMP-04 | COPPA: users under 13 shall not be able to create consumer accounts. Institutional deployments may serve under-13 users under the institution's own data processing agreement. |

### 4.8 Openness & Licensing

| ID | Requirement |
|----|------------|
| NFR-OSS-01 | All LECA source code shall be licensed under Apache 2.0 or MIT. |
| NFR-OSS-02 | AI model weights used by LECA shall be open-source or permissively licensed (no commercial-use restrictions for the self-hosted tier). |
| NFR-OSS-03 | The community scenario library format shall be a documented open schema, forkable and importable without LECA dependency. |

---

## 5. External Interface Requirements

### 5.1 User Interfaces

| Interface | Description |
|-----------|-------------|
| Learner web app (PWA) | Mobile-first, push-to-talk conversation UI, scenario browser, progress dashboard |
| Educator admin (web) | Class roster, progress view, class code management, report export |
| Self-host admin (web) | Account management, model config, system health |

### 5.2 Hardware Interfaces

| Tier | Hardware | Use Case | Concurrent Users | Monthly Cost |
|------|---------|----------|-----------------|-------------|
| **Phase 0 dev server** | Mac Mini M4 8GB (project-owned) | Internal testing, Phase 0 advisors | 1 (sequential) | ~$3–5 electricity |
| **Phase 1 API server** | Any VPS with 2 vCPU / 4GB RAM (no GPU) | Stateless API + DB only; LLM via Gemini API | Unlimited (Gemini handles scale) | ~$10–20/month VPS |
| **Institutional self-host (light)** | Apple Silicon Mac (M1/M2/M3/M4, ≥ 8GB) or Linux + 16GB RAM | School with ≤ 100 students, air-gapped | 1–2 concurrent | Hardware already owned |
| **Institutional self-host (full)** | Linux server + RTX 4090 (24GB VRAM) | University, ≥ 300 students | 3–5 concurrent | ~$1,500–1,800 one-time |
| **User device (on-device AI)** | Android 10+ mid-range or Chrome 113+ desktop | Phase 2+ primary path | N/A (per-device) | $0 |

### 5.3 Software Interfaces

| System | Interface Type | Phase | Purpose |
|--------|---------------|-------|---------|
| mlx-whisper | Python library (Apple MLX) | Phase 0 | STT on Mac Mini M4 via Metal GPU |
| Ollama | Local REST API | Phase 0 | LLM serving (LLaMA 3 8B Q4) on Mac Mini M4 |
| Gemini 2.0 Flash API | Google AI REST API | Phase 1+ | Combined STT + LLM in one multimodal call |
| Kokoro-js | npm / WASM (in-browser) | All phases | On-device TTS, no server required |
| Wav2Vec2 base (ONNX) | ONNX Runtime Web (in-browser) | All phases | In-browser phoneme feature extraction |
| WebLLM / MLC-AI | npm / WebGPU (in-browser) | Phase 2+ | On-device LLM inference |
| Cloudflare Tunnel | cloudflared CLI | Phase 0 | Expose Mac Mini M4 to internet without static IP |
| LMS (Moodle, Canvas, Google Classroom) | LTI 1.3 over HTTPS | Phase 2 | Educator SSO and class launch |
| Browser MediaDevices API | Web standard | All phases | Microphone capture |

### 5.4 Communication Interfaces

| Interface | Protocol | Notes |
|-----------|---------|-------|
| Client ↔ API | HTTPS / REST + WebSocket (for streaming audio) | WebSocket for real-time STT streaming |
| API ↔ AI pipeline | Internal HTTP (Docker network) | Not exposed externally |
| API ↔ Database | PostgreSQL wire protocol | |
| Educator ↔ LMS | LTI 1.3 over HTTPS | |

---

## 6. System Constraints

| ID | Constraint | Rationale |
|----|-----------|-----------|
| CON-01 | **Phase 0**: The AI pipeline runs entirely on the project-owned Mac Mini M4 — no external API calls required. **Phase 1**: Gemini 2.0 Flash API is used; institutional self-hosted deployments using Ollama remain fully offline after model download. **Phase 2+**: On-device (WebLLM) path requires no external API. | Data sovereignty for institutional deployments; $0 infrastructure for Phase 0 |
| CON-02 | The Phase 0 gate latency (< 3 seconds end-to-end, Mac Mini M4) must be demonstrated before Phase 1 development begins. | Validated by BRD Phase 0 gate definition |
| CON-03 | The system must run on standard Android browsers (Chrome for Android 80+) without native app installation. | Segment 1 & 3 users are Android-first with limited device budget |
| CON-04 | Phase 0 infrastructure cost must be $0 (excluding electricity). Phase 1 cost must be < $50/month at 500 DAU. Phase 2 cost must be < $200/month at 10K WAU. | Core "free forever" mission; Gemini free tier covers Phase 1 beta |
| CON-05 | Institutional self-host setup on Apple Silicon Mac (M1+, ≥ 8GB) must complete in ≤ 30 minutes via `docker compose up` or equivalent Ollama setup script. | Interview #3 confirmed: teachers need simple setup, not sysadmin expertise |
| CON-06 | The scenario library schema must be stable (no breaking changes) from Phase 0 onward. Community-submitted scenarios must not require migration to work on future LECA versions. | Community contributor trust |

---

## 7. Acceptance Criteria

Criteria follow Given-When-Then format, keyed to Phase 0 and Phase 1 gates from the BRD.

### Phase 0 Gate Criteria

**AC-P0-01 — End-to-end latency**
- **Given** a learner on LECA Cloud with a standard 10 Mbps connection
- **When** they submit a ≤ 15-second audio utterance
- **Then** they receive an AI audio response within 3 seconds (P95 across 100 test runs)

**AC-P0-02 — Basic conversation session**
- **Given** a new user with no account
- **When** they open the app and press the push-to-talk button
- **Then** they can complete a 3-turn free-talk conversation with no errors or manual configuration

**AC-P0-03 — Seed scenario library**
- **Given** the scenario library is populated
- **When** a learner opens the scenario browser
- **Then** they see ≥ 10 scenarios across ≥ 4 categories

### Phase 1 Gate Criteria

**AC-P1-01 — D7 retention in beta cohort**
- **Given** the public beta has been live for 14 days (2-week soak)
- **When** D7 retention is measured across the first 500 registered users
- **Then** D7 retention ≥ 25%

**AC-P1-02 — No P0 bugs in soak**
- **Given** the app has been running in public beta for 14 days
- **When** the bug tracker is reviewed
- **Then** zero P0 bugs (data loss, security vulnerability, complete feature outage) are open or unresolved

**AC-P1-03 — Self-host setup time**
- **Given** a non-technical admin following the README on Light self-host hardware
- **When** they run `docker compose up` for the first time
- **Then** the system is fully operational within 15 minutes (exclusive of model download time)

**AC-P1-04 — Pronunciation feedback accuracy**
- **Given** a set of 50 test utterances with known phoneme errors (ground truth annotated by ESL advisor)
- **When** the pronunciation analysis pipeline processes each utterance
- **Then** per-phoneme error detection precision ≥ 75%

**AC-P1-05 — Developer setup time**
- **Given** a developer with standard dev tools (Docker, Python, Node) following CONTRIBUTING.md
- **When** they set up a local dev environment from scratch
- **Then** the full stack is running and tests pass within 30 minutes

---

## 8. Requirements Traceability Matrix

| Requirement ID | BRD Section | Feature | Phase | Priority |
|---------------|-------------|---------|-------|---------|
| FR-AUTH-01–04 | §7 (User Flows) | Auth & Onboarding | P1 | M |
| FR-CONV-01–05 | §7.1 | AI Conversation Tutor | P0 | M |
| FR-CONV-06–08 | §7.1 | AI Conversation Tutor | P0 | M |
| FR-CONV-09–10 | §7 (Edge Cases) | Safety & Moderation | P0 | M |
| FR-CONV-11–12 | §7 (Edge Cases) | Resilience | P1 | S |
| FR-PRON-01–03 | §7.2 | Pronunciation Analysis | P1 | M |
| FR-PRON-04–05 | §7.2 | Pronunciation Analysis | P1 | S |
| FR-PRON-06 | §7.2 | Progress Tracking | P1 | M |
| FR-SCEN-01–03 | §7.3 | Scenario Library | P0–P1 | M |
| FR-SCEN-04–06 | §7.3 | Community Contributions | P2 | S |
| FR-SCEN-07 | §8 (Phase 0) | Seed Library | P0 | M |
| FR-DASH-01–03 | §7.4 | Learner Dashboard | P1 | M |
| FR-DASH-04 | §7.4 | Shareable Report | P1 | S |
| FR-DASH-05–07 | §7.4 | Educator Dashboard | P1 | M |
| FR-DASH-08 | §7.4 | Educator Export | P1 | S |
| FR-SELF-01–04 | §7.5 | Self-Hosting | P1 | M |
| FR-SELF-05 | §7.5 | LTI Integration | P2 | S |
| FR-SELF-06 | §7.5 (Edge Cases) | Content Safety | P1 | M |
| NFR-PERF-01 | §8 (Phase 0 gate) | Performance | P0 | M |
| NFR-SEC-01–08 | §7 (general) | Security | P0–P1 | M |
| NFR-USE-01–06 | §5 (Segment 1, 3) | Usability | P1 | M |
| NFR-DX-01–05 | §5 (Segment 4) | Developer Experience | P0 | M |
| NFR-COMP-01–04 | Appendix B | Compliance | P1 | M |
| NFR-OSS-01–03 | §3, Appendix B | Licensing | P0 | M |
