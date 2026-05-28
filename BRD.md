# LECA — Business Requirements Document
**Product**: LECA (Language & English Communication AI)  
**Type**: Business Requirements Document (BRD)  
**Version**: 0.6 — Updated with interviews #2–#4; synthesis complete  
**Last Updated**: 2026-05-27  
**Status**: Draft — Validated with 4 user interviews; ready for Phase 0

---

## 1. Summary

LECA is an open-source, AI-powered English communication learning platform that gives anyone in the world free access to real conversation practice with an AI tutor. Unlike existing apps (Duolingo, ELSA, Speak) which are proprietary, expensive, or focused on drills rather than real conversation, LECA combines free-form AI dialogue, phoneme-level pronunciation feedback, and a community-built scenario library — all on a fully open-source, self-hostable stack.

The core insight, validated by real users: **most people who need English daily for work have never used a learning app** — not because of price, but because they don't know what to use and assume on-the-job exposure is enough. It isn't. Daily use reinforces habits; it doesn't fix them. LECA's mission is to make deliberate English practice as effortless as opening an app at lunch.

> *"I want to use English as instinct, not as a skill anymore."* — Software developer, Ho Chi Minh City (User Interview #1)

---

## 2. Contacts

| Role | Responsibility |
|------|---------------|
| Product Owner | Owns PRD, prioritization, and roadmap decisions |
| Engineering Lead | Technical architecture, OSS stack decisions, contribution guidelines |
| Community Lead | GitHub community, scenario library governance, contributor onboarding |
| UX / Design Lead | Mobile-first UI, accessibility, onboarding flow |
| Advisor (ESL) | Curriculum validity, pedagogical review of AI feedback quality |

*Note: As an open-source project, "team" expands to include community contributors. Governance model (maintainer circle, RFC process) to be defined before v1.0 launch.*

---

## 3. Background

### Why This, Why Now

**The speaking gap is real and well-documented.** English learners globally can pass written exams but fail at spoken communication — the skill that actually matters for employment, travel, and professional advancement. App store reviews of Duolingo and Babbel consistently surface the same complaint: *"I finished 200 days but I'm still scared to speak."*

**Existing AI tools are either too narrow or too expensive:**
- ELSA Speak ($12/mo): Best pronunciation AI but scripted, not conversational
- Speak.com (~$15–20/mo, unverified — pricing page unavailable during research): Best AI conversation but proprietary, limited languages
- Cambly ($20–90/mo): Human tutors, highest quality but unaffordable at scale
- Duolingo Max ($14/mo): AI features as an expensive add-on to a quiz app

**The price barrier is real and co-exists with the discovery barrier.** Real user interviews revealed two distinct sub-groups within Segment 1: (a) working professionals who know apps exist but never tried one because they assume on-the-job exposure is enough *(discovery barrier — Interview #1)*; and (b) working professionals who are aware of apps and motivated to improve, but are blocked by cost *(price barrier — Interview #2)*. Both groups are in Segment 1. "Free forever" is therefore a core feature, not just a differentiator. In Vietnam, Indonesia, Brazil, and India — the four highest-demand English learning markets — $15/month is a meaningful cost that eliminates a real portion of motivated learners.

**None of these are accessible to the markets that need them most.** In Vietnam, Indonesia, Brazil, and India — the four highest-demand English learning markets — $15/month is a meaningful cost. But the bigger barrier is that most working professionals in these markets have never tried an English learning app at all — they simply don't know where to start.

**The technology timing is right.** In 2024–2025, the open-source AI stack reached parity with proprietary solutions for conversational language tasks:
- **Speech-to-text**: OpenAI Whisper (open-source, on-device capable)
- **Conversation AI**: Meta LLaMA 3 / Mistral (matches GPT-3.5 for dialogue)
- **Text-to-speech**: Coqui TTS / Kokoro (natural voice synthesis)
- **Pronunciation analysis**: Wav2Vec2 / Kaldi (phoneme-level scoring)

Building LECA today means zero API costs at scale, full community auditability, and the ability for institutions to self-host with full data sovereignty.

### Competitive Landscape Summary

| App | AI Depth | Free Tier | Open Source | Speaking Quality |
|-----|----------|-----------|-------------|-----------------|
| Duolingo | Low | Yes | No | Surface (read-aloud) |
| ELSA Speak | High (pronunciation) | Limited | No | Drills only |
| Speak | High (conversation) | Trial only | No | Free-form ✓ |
| Cambly | None | No | No | Human (best) |
| HelloTalk | Low | Yes | No | Unstructured |
| Babbel | Medium | First lesson | No | Scripted |
| **ChatGPT / Gemini** | **High** | **Yes (free tier)** | **No** | **Free-form ✓ (general chatbot)** |
| **LECA** | **High** | **Yes (forever)** | **Yes** | **Free-form ✓ (education-specific)** |

### Why LECA vs. ChatGPT / Claude / Gemini

> This is the most critical competitive question. General-purpose AI chatbots already offer free, free-form English conversation. LECA must be clearly differentiated.

ChatGPT and similar tools are **general-purpose chatbots**, not language learning platforms. LECA is differentiated on 5 dimensions that general AI cannot replicate:

| Dimension | ChatGPT / Gemini | LECA |
|-----------|-----------------|------|
| Pronunciation feedback | No voice analysis | Phoneme-level scoring per word |
| Progress tracking | No memory of past sessions | Full session history, improvement trends |
| Structured curriculum | No — open-ended chat | Scenario library, difficulty progression |
| Self-hostable | No — cloud-only, proprietary | Yes — full Docker self-host |
| Education-specific AI | Generic responses | Tuned for language learning feedback |
| Institutional admin tools | None | Class management, LMS integration |
| Open-source / auditable | No | Yes — educators can inspect AI behavior |

**The positioning**: *ChatGPT is a chatbot you can practice English with. LECA is a platform built to teach you English.* The distinction matters most for Segment 3 (educators who need auditability, progress reports, and curriculum control) and Segment 1 (learners who need structured guidance, not open-ended chat).

---

## 4. Objective

### Primary Objective
> Enable non-native English speakers in developing markets to practice real, free-form English conversation with an AI tutor — for free — resulting in measurable improvement in speaking confidence and fluency within 8 weeks of consistent use.

### Success Metrics (MVP — Phase 1)

| Metric | Baseline | Target (6 months post-launch) |
|--------|----------|-------------------------------|
| Weekly active users (WAU) | 0 | 10,000 |
| Avg. conversation minutes per session | — | ≥ 10 min |
| D7 retention | — | ≥ 30% |
| D30 retention | — | ≥ 15% |
| Self-reported speaking confidence improvement (Week 8 survey) | — | ≥ 60% of active users |
| GitHub stars | 0 | 1,000 |
| Community-contributed scenarios | 0 | 50 |
| Educator/institution installs (self-hosted) | 0 | 20 |

### Success Metrics (Growth — Phase 2)

| Metric | Target (12 months) |
|--------|-------------------|
| Monthly active users (MAU) | 100,000 |
| Self-reported speaking confidence improvement | ≥ 70% of active users (survey) |
| Scenario library contributions | 500+ |
| Institutional deployments | 100+ |

### Strategic Alignment
- **OSS flywheel**: More contributors → better product → more users → more contributors
- **Community moat**: A proprietary app cannot replicate a community-built scenario library
- **Trust advantage**: Open model weights and prompts = auditable AI (critical for educators)

---

## 5. Market Segments

### Segment 1 — Aspiring Professional (Primary, P0)
**Size**: ~200–400M active learners in developing markets (Vietnam, Indonesia, Brazil, India, Philippines, Mexico) — the most engaged segment of the estimated global English learning population  
**Problem**: Uses English daily at work but has never used a learning app — not because of price, but because they don't know what to use and believe on-the-job exposure is sufficient. It isn't: daily use reinforces imperfect habits rather than correcting them.  
**Real user quote**: *"I want to use English as instinct, not as a skill anymore."* (Software developer, HCMC, Vietnam)  
**Job to be done**: Practice real work and daily-life scenarios repeatedly until responses become automatic — during lunch break or evenings, without long study sessions.  
**Job to be done**: Practice speaking freely, get honest feedback, build enough confidence to pass a job interview or hold a work call in English.  
**Key constraint**: Mobile-first (Android), limited data budget, low income  
**Conversion path**: Free user → power user → evangelist (word-of-mouth in local communities)

### Segment 2 — Career Upskiller (Secondary, P1)
**Size**: ~50M professionals globally needing domain-specific English  
**Problem**: Can communicate in English but struggles under pressure (meetings, presentations, client calls) or in specific professional contexts (medical, legal, technical).  
**Job to be done**: Rehearse real professional scenarios, get feedback on naturalness and register, build executive presence in English.  
**Key constraint**: Limited time (15–20 min sessions max), needs scenario specificity  
**Conversion path**: Free user → scenario library contributor → premium features (future)

### Segment 3 — ESL Educator / Institution (Secondary, P1)
**Size**: ~50,000 ESL institutions globally (schools, universities, corporate L&D, NGOs)  
**Problem**: Cannot give students adequate speaking practice at scale. Current tools are either too expensive (per-seat pricing), too closed (cannot customize or audit), or require internet/cloud (data sovereignty issues).  
**Job to be done**: Deploy AI speaking practice for 20–500 students at zero or near-zero cost, customize to curriculum, maintain data sovereignty.  
**Key constraint**: Needs self-hosting, LMS integration, bilingual support, institutional approval process  
**Conversion path**: GitHub discovery → self-hosted pilot → community member → case study

### Segment 4 — Developer / OSS Contributor (Enabler, P2)
**Size**: Estimated 10,000–50,000 developers interested in AI OSS (not necessarily EdTech)
**Problem**: Wants to contribute to a well-maintained OSS project with an interesting AI stack but can't find one that's both high-quality and worth their time.
**Job to be done**: Find a project with a compelling tech stack (Whisper, LLaMA, Wav2Vec2), clean codebase, active maintainers, and clear onboarding — then contribute meaningfully.
**Key constraint**: DX is the #1 filter — complex setup or poor documentation causes immediate drop-off. Mission alone does not attract contributors; stack quality and repo health do.
**Conversion path**: Star repo (tech stack hook) → local setup in < 30 min → `good-first-issue` → first PR → maintainer

---

## 6. Value Propositions

### For Aspiring Professionals & Career Upskillers (Segments 1 & 2)

| Element | Detail |
|---------|--------|
| **Jobs addressed** | Practice real work + daily-life scenarios until responses become instinctive |
| **Gains** | Free forever, 15–20 min sessions, available at lunch or evenings, instant specific feedback |
| **Pains eliminated** | Discovery barrier (zero-friction onboarding), rationalization trap ("work teaches me enough"), no conversation partner needed |
| **Core positioning** | *"English as instinct, not a skill"* — deliberate repetitive practice in real scenarios until automatic |
| **Differentiation vs. Duolingo** | Real conversation vs. quizzes; builds fluency not streaks |
| **Differentiation vs. ELSA** | Free-form dialogue vs. scripted drills; covers all scenarios not just pronunciation |
| **Differentiation vs. ChatGPT** | Education-specific: curriculum, pronunciation scoring, progress tracking — not just a chatbot |

### For ESL Educators (Segment 3)

| Element | Detail |
|---------|--------|
| **Jobs addressed** | Give students speaking practice at scale, customize to curriculum, maintain data control |
| **Gains** | Free self-hosting, open codebase (auditable AI), community scenario library |
| **Pains eliminated** | Per-seat pricing, vendor lock-in, black-box AI, data sovereignty concerns |
| **Differentiation** | Only self-hostable, open-source AI English speaking tool in the market |

### Value Curve vs. Competitors

```
Feature           Duolingo  ELSA   Speak  ChatGPT  LECA
──────────────────────────────────────────────────────
Price (free)         ✓       ~      ✗       ✓       ✓
Free-form convo      ✗       ✗      ✓       ✓       ✓
Pronunciation AI     ✗       ✓      ~       ✗       ✓
Progress tracking    ✓       ✓      ✓       ✗       ✓
Structured curriculum✓       ✓      ✓       ✗       ✓
Open-source          ✗       ✗      ✗       ✗       ✓
Self-hostable        ✗       ✗      ✗       ✗       ✓
Community library    ✗       ✗      ✗       ✗       ✓
Mobile-first         ✓       ✓      ✓       ~       ✓
```

LECA is the only product combining: free + free-form AI conversation + pronunciation scoring + progress tracking + open-source + self-hostable.

---

## 7. Core Requirements

### Primary Requirement

LECA must demonstrably improve users' English communication skills through deliberate, conversational practice. "Improved" means measurable gains across four core competencies within 8 weeks of consistent use (≥ 3 sessions/week):

| Competency | Definition | How LECA Addresses It |
|-----------|-----------|----------------------|
| **Speaking Fluency** | Express ideas without long pauses or excessive self-correction | Free-form AI conversation with naturalness feedback after each turn |
| **Pronunciation Accuracy** | Phoneme-level intelligibility to native and non-native listeners | Wav2Vec2 phoneme scoring with targeted drills on recurring errors |
| **Vocabulary in Context** | Use appropriate phrases for the situation, not just grammatically correct ones | Scenario-linked phrase sets; post-session vocabulary gap detection |
| **Listening Comprehension** | Understand spoken English at natural pace across registers | AI tutor responses at calibrated pace; no text crutch by default in voice mode |

### Skill Improvement Lifecycle

The platform must support all four stages:

1. **Baseline Assessment** — Quick level check on first session (≤ 2 min). Establishes the starting point for all improvement tracking.
2. **Deliberate Practice** — Repeated exposure to real scenarios at the edge of the learner's current ability. AI adapts difficulty to level.
3. **Immediate, Specific Feedback** — After each conversation turn: what sounded unnatural and *why*, not just correct/incorrect.
4. **Progress Visibility** — Session history and improvement trends visible to the learner (and to teachers in institutional use).

### Non-Negotiable Constraints

| Constraint | Rationale |
|-----------|-----------|
| Practice must be conversational, not drill-based | Drills improve drills; conversation improves conversation |
| Feedback must be specific and explanatory | "That sounds unnatural" alone does not change behavior |
| Sessions must be ≤ 20 min and self-contained | Working professionals need lunch-break-sized practice windows |
| Platform must be free at the point of use | Price eliminates the segment that needs this most |
| AI must not over-correct accent features | Goal is intelligibility, not native-speaker mimicry |

### Acceptance Standard — What "Improved Skills" Means

LECA meets this core requirement if, after 8 weeks of consistent use:

| Metric | Target |
|--------|--------|
| Self-reported speaking confidence improvement | ≥ 60% of active users (Week 8 survey) |
| Average pronunciation score vs. baseline | ≥ 10% improvement |
| Average conversation fluency (words/min, correction rate) vs. baseline | ≥ 15% improvement |
| Scenario completion with ≤ 2 fluency interruptions/min | Achievable by ≥ 50% of users at Week 8 |

---

## 8. Solution

### Core Features (MVP)

#### 8.1 AI Conversation Tutor
**What it does**: Real-time voice conversation with an AI English tutor on any topic or selected scenario. Learner speaks, AI responds naturally, feedback is given after each exchange.

**Key behaviors**:
- Learner selects a topic/scenario (or speaks freely)
- AI responds in natural English, adapts to learner's level
- After each learner turn: feedback on fluency, naturalness, and vocabulary choice
- AI explains *why* something sounds unnatural (not just correct/wrong)
- Session summary with improvement areas highlighted

**Tech stack** (phased to achieve $0 infrastructure cost):
- **Phase 0** — Mac Mini M4 8GB (project-owned): mlx-whisper small (STT) + Ollama LLaMA 3 8B Q4 (LLM) + Kokoro-82M (TTS) + Wav2Vec2 base (pronunciation). Exposed via Cloudflare Tunnel. Cost: ~$3–5/month electricity.
- **Phase 1** — Gemini 2.0 Flash API (STT + LLM combined, free tier) + Kokoro-js on-device (TTS) + Wav2Vec2 WASM in-browser (pronunciation). No GPU server needed. Cost: $0–50/month.
- **Phase 2+** — WebLLM in-browser (primary, on-device) + Gemini API fallback. Cost: <$200/month at 10K WAU.

**Out of scope (MVP)**: Real-time interruption, multi-party conversation, video

#### 8.2 Pronunciation Analysis
**What it does**: After each utterance, highlights phonemes and words where pronunciation deviated from native-speaker norms, with a visual breakdown.

**Key behaviors**:
- Phoneme-level scoring per word
- Visual highlight of problem sounds
- Minimal pair drills triggered when a pattern of errors is detected
- Progress tracking over sessions

**Tech stack**: Wav2Vec2 base (ONNX/WASM, runs in-browser — Phase 1+) or server-side on Mac Mini M4 (Phase 0)

**Out of scope (MVP)**: Accent selection, regional dialect coaching

#### 8.3 Scenario Library
**What it does**: A curated and community-expandable library of conversation scenarios (job interview, doctor visit, customer service call, academic presentation, travel, etc.)

**Key behaviors**:
- Browseable and searchable scenario library
- Each scenario has: context, role for AI, vocabulary list, suggested difficulty
- Community can submit, rate, and fork scenarios (GitHub-like model)
- Scenarios flagged for pedagogical review before featuring

**Out of scope (MVP)**: AI-generated scenario creation, paid scenario marketplace

#### 8.4 Progress Dashboard
**What it does**: Tracks learner progress across sessions — pronunciation scores, vocabulary growth, conversation fluency metrics. Also provides a **teacher view** for class-level progress monitoring.

**Key behaviors — Learner view**:
- Session history with key stats
- Improvement trends over time
- Weak areas identified and linked to practice exercises
- Shareable progress report (for learners to show employers/schools)

**Key behaviors — Teacher view** *(P0 for institutional adoption — validated by Interview #3)*:
- Class roster with per-student progress at a glance
- Speaking time logged per student per session
- Weak areas flagged automatically (no manual grading required)
- Exportable report for parent/admin review

#### 8.5 Self-Hosting Support (for Institutions)
**What it does**: Full Docker-compose deployment for institutions who need to self-host for data sovereignty.

**Key behaviors**:
- One-command local/server setup (`docker compose up`)
- Admin dashboard for managing learner accounts and viewing progress
- LMS integration via LTI standard (Moodle, Google Classroom, Canvas)
- Configurable AI model selection (run locally with smaller model or connect to hosted)

**Hardware tiers** (self-hosting):

| Tier | Hardware | Monthly Cost | Concurrent Users | Use Case |
|------|---------|-------------|-----------------|----------|
| Apple Silicon (recommended) | Mac Mini M4 8GB+ (or M1/M2/M3) | ~$3–5 electricity | 1–2 | School with ≤ 100 students |
| Linux + consumer GPU | RTX 4090 24GB | ~$0 (owned) / ~$1,500 one-time | 3–5 | University, ≥ 300 students |
| CPU-only (text mode) | Any machine, 16GB RAM | ~$0 | 1 | Testing / very low budget |
| LECA Cloud (managed) | Provided by project | Free (Phase 1+) | Unlimited | Individual learners, teachers without IT |

> **Note**: LLaMA 3 70B is removed from the self-host stack. LLaMA 3 8B Q4 on Apple Silicon delivers acceptable quality for Beginner–Intermediate learners (the primary audience) with dramatically lower hardware requirements.

**Out of scope (MVP)**: SSO/SAML, SCIM provisioning, multi-tenant SaaS

#### 8.6 Contextual Vocabulary & Sentence Learning
**What it does**: Surfaces vocabulary and natural sentences tied to everyday and work-related situations, so learners can study phrases in context — not in isolation — and immediately apply them in conversation practice.

> **Distinction from out-of-scope items**: This is NOT a quiz, flashcard game, or grammar drill. It is a situational phrase reference integrated directly into scenarios and conversation sessions — the vocabulary exists to serve conversation, not replace it.

**User stories**:
- As a working professional (Segment 1), I want to see the key phrases and sentences used in my work situations (meetings, client calls, emails) so I can practice saying them until they feel automatic.
- As a career upskiller (Segment 2), I want vocabulary and sentences organized by situation type (everyday vs. work) so I can focus on what's most relevant to my professional context.
- As an ESL teacher (Segment 3), I want to assign situation-specific vocabulary sets to my students so they practice language that matches real-life needs.

**Key behaviors**:
- Each scenario in the Scenario Library includes a curated set of key phrases and sentences (not just word lists) with usage examples in context
- Vocabulary is categorized by situation type: **Everyday** (shopping, transport, social) and **Work** (meetings, presentations, client calls, emails)
- After a conversation session, the summary screen highlights vocabulary words the learner used naturally vs. missed opportunities (words relevant to the scenario they didn't use)
- Learner can tap any phrase to hear it pronounced, see it in a full example sentence, and immediately practice it in a new conversation turn
- Vocabulary linked to a scenario is surfaced *before* the conversation starts ("key phrases for this scenario") and *after* ("phrases you could use next time")

**MoSCoW prioritization**:

| Priority | Requirement |
|----------|-------------|
| Must | Each scenario has a curated phrase/sentence set with usage context |
| Must | Situations categorized as Everyday vs. Work |
| Must | Post-session summary flags vocabulary gaps (phrases relevant but unused) |
| Should | Learner can tap to hear pronunciation and see example sentence |
| Should | Vocabulary usage tracked across sessions (which phrases learner has practiced) |
| Could | Spaced repetition nudge: "You haven't practiced these 3 phrases in 7 days" |
| Won't (MVP) | Standalone vocabulary quiz mode, flashcard games, or grammar exercises |

**Acceptance criteria**:
- *Given* a user selects a scenario, *When* they view the scenario detail page, *Then* they see ≥ 5 key phrases/sentences relevant to that situation, each with a one-sentence usage example
- *Given* a user completes a conversation session, *When* the summary screen appears, *Then* it shows which scenario-relevant phrases they used and flags up to 3 phrases they could have used but didn't
- *Given* a user browses the Scenario Library, *When* they apply a situation filter, *Then* they can filter scenarios by "Everyday" or "Work" and see the phrase count per scenario
- *Given* a user taps a phrase in the vocabulary panel, *When* the phrase detail opens, *Then* they hear the phrase spoken by the TTS voice and see it used in a full sentence

**Tech notes**: Phrase sets are authored in the scenario YAML/JSON schema (extension of existing scenario format). No new AI inference required at MVP — phrases are human-curated. Post-session gap detection uses simple set difference between scenario phrase list and transcript.

**Out of scope (MVP)**: AI-generated phrase recommendations, vocabulary difficulty scoring, L1-translated glossary

---

### User Flows

#### Primary Flow: First Conversation Session
```
Open app → [New user: quick level assessment (2 min)]
         → Choose: Free Talk | Pick a Scenario
         → [Free Talk]: Type/speak a topic → AI starts conversation
         → [Scenario]: Browse library → select → AI sets the scene
         → Conversation begins (voice-first)
         → After each turn: optional feedback overlay
         → Session ends → Summary screen (scores, highlights, next steps)
         → "Practice this again" | "New scenario" | "Review my weak sounds"
```

#### Educator Onboarding Flow
```
GitHub README → Docker setup guide → Local install (< 30 min)
→ Admin dashboard → Create class → Assign scenarios
→ Students join with class code → Progress visible to teacher
```

### Edge Cases

1. **Poor internet connection**: App caches scenarios locally; STT can run on-device with smaller Whisper model; graceful degradation to text input
2. **Heavy accent / non-standard pronunciation**: AI calibrates baseline to learner's accent in first 3 sessions; does not penalize consistent accent features
3. **Learner speaks in L1 (not English)**: AI detects non-English input, gently redirects in learner's language, does not penalize
4. **Inappropriate content in free talk**: Content moderation layer on STT output before passing to LLM; community-reported scenarios reviewed
5. **Very low-end device**: Progressive web app (PWA) fallback; server-side processing option for users who cannot run local AI
6. **Child learner in institutional deployment**: Admin can enable content safety filters; minimum age gate for direct consumer sign-up

### Out of Scope (MVP)
- Grammar-focused lessons or standalone vocabulary quizzes/flashcard games (contextual vocabulary *within* scenarios is in scope — see 8.6)
- Peer-to-peer conversation matching (Phase 2)
- Native mobile apps (iOS/Android) — PWA first, native in Phase 2
- Paid tiers or monetization features
- Languages other than English as the target language (though UI can be multilingual)
- AI-generated full curriculum paths (community scenarios only in MVP)

### Key Assumptions

| Assumption | Evidence | Invalidating Signal |
|------------|----------|---------------------|
| Open-source LLMs are good enough for conversational English feedback | LLaMA 3 70B matches GPT-3.5 on conversational benchmarks | User testing shows feedback quality meaningfully worse than paid apps |
| Learners will use a self-serve app without a teacher | Duolingo/ELSA retention data shows this works | D7 retention below 20% in early cohorts |
| Institutions will self-host if the setup is simple | Moodle, Nextcloud adoption shows EdTech OSS self-hosting is established | Setup complexity requires more than 2 hours for a non-technical admin |

---

## 9. Release Plan

### Phase 0 — Foundation (Weeks 1–6)
- Set up repository, contribution guidelines, CODE_OF_CONDUCT
- Build core AI pipeline on **Mac Mini M4**: mlx-whisper + Ollama (LLaMA 3 8B Q4) + Kokoro-82M TTS
- Expose via **Cloudflare Tunnel** (free) for remote advisor access
- Basic web UI: free talk mode (text + voice)
- Internal dogfood with team and 5–10 ESL teacher advisors
- Define scenario schema and seed library with 10 scenarios
- **Gate**: Core pipeline latency < 3 seconds end-to-end on Mac Mini M4
- **Infrastructure cost**: ~$3–5/month (electricity only)

### Phase 1 — MVP Launch (Weeks 7–16)
- Migrate LLM + STT to **Gemini 2.0 Flash API** (free tier → paid as traffic grows)
- Pronunciation analysis: **Wav2Vec2 WASM in-browser** (Kokoro-js on-device TTS already live)
- Scenario library browser (20 scenarios at launch)
- Progress dashboard (session history, pronunciation trends)
- Docker / Ollama self-hosting setup for institutions (Apple Silicon Mac recommended)
- Public beta launch (GitHub + Product Hunt + ESL communities)
- **Gate**: D7 retention ≥ 25% in beta cohort; no P0 bugs in 2-week soak
- **Infrastructure cost**: $0–50/month (Gemini free tier covers ~500 DAU)

### Phase 2 — Community & Scale (Months 4–9)
- Migrate primary AI path to **WebLLM on-device** (WebGPU); Gemini API as fallback
- Community scenario submission and review workflow
- Mobile PWA optimization (offline mode, on-device Whisper WASM)
- LTI integration for LMS (Moodle, Google Classroom)
- Multilingual UI (Vietnamese, Indonesian, Portuguese, Hindi priority)
- Peer practice matching (connect learners for conversation exchange)
- **Gate**: 10,000 WAU; 50+ community scenarios; 20 institutional deployments
- **Infrastructure cost**: $50–200/month (Gemini fallback only; most users on-device)

### Phase 3 — Growth (Months 10–18)
- Native iOS and Android apps
- Domain-specific scenario packs (business English, medical English, academic English)
- Advanced analytics for institutions
- Optional hosted SaaS tier (for institutions that don't want to self-host)
- Community governance structure (maintainer council, RFC process)

### Rollback Criteria
- If AI feedback quality receives < 60% positive rating in user surveys after Phase 1 launch: pause growth, prioritize model tuning
- If self-hosting complexity prevents institutional adoption: prioritize managed cloud option earlier
- If D7 retention < 20% after 8 weeks: run UX research sprint before Phase 2

---

## Appendix A — Research Sources

| Document | Location |
|----------|----------|
| Competitor profiles (6 apps) | `competitor-profiles/` |
| Competitor summary | `competitor-profiles/_summary.md` |
| Market research & hypothesis set | `market-research/market-research.md` |
| User personas (4 segments) | `market-research/user-personas.md` |

---

## Appendix B — Sustainability & Monetization

Open-source projects without a sustainability model fail. LECA's model is decided upfront:

### Chosen Model: Open Core + Hosted SaaS

| Layer | Description | Revenue |
|-------|-------------|---------|
| **Core (free, OSS forever)** | Self-hostable platform, all learning features, scenario library | $0 |
| **LECA Cloud (paid)** | Managed hosting — no setup, guaranteed uptime, automatic updates | $X/institution/mo *(TBD — requires market research before Phase 3)* |
| **Institutional Support** | Priority support contracts, custom integrations, onboarding for large deployments | $X/contract |

**Why this model**:
- Learners (Persona 1, 2) always get the full product free — protects the mission
- Institutions (Persona 3) who can't or won't self-host pay for convenience, not features
- Avoids the "open-core bait-and-switch" — no features are locked behind paid tier

### Phase-by-Phase Sustainability

| Phase | Funding Source | Target |
|-------|---------------|--------|
| Phase 0–1 | Founder funding + GitHub Sponsors | Cover hosting costs |
| Phase 2 | Education grants (Mozilla Foundation, Open Society, Gates) | $50–200K |
| Phase 3 | LECA Cloud (institutional SaaS) | Revenue-positive |

### Grants to Target
- **Mozilla Foundation** — open-source and digital literacy programs
- **Open Society Foundation** — education access in developing countries
- **Gates Foundation** — global education and developing-market literacy
- **Chan Zuckerberg Initiative** — education technology

### What "Free Forever" Means
The self-hosted version will always be 100% free. LECA Cloud charges for infrastructure convenience only. If LECA Cloud shuts down, users' data and the platform continue unaffected on their own servers.

---

## Appendix C — User Interview Log

Tracking real user interviews to validate personas and assumptions over time.

| # | Date | Profile | Key Findings | Assumptions Updated |
|---|------|---------|-------------|---------------------|
| 1 | 2026-05-27 | Software developer, HCMC Vietnam, B1–B2 English, uses Teams/chat daily with foreign clients | (1) Price not mentioned — discovery is the real barrier. (2) Long meetings cause listening fatigue. (3) Clients sometimes don't understand him. (4) Never used any app. (5) Wants English as instinct, not skill. (6) Evening + lunch sessions. (7) Wants work AND life scenarios. | Revised Segment 1 job-to-be-done; downgraded price as primary barrier; added discovery barrier; added "instinct not skill" to core positioning |
| 2 | 2026-05-27 | Software engineer, US company, HCMC Vietnam, uses English daily at work (meetings, clients) and personal life (shopping, social) | (1) **Price is a real barrier** — knew apps existed but didn't use because they cost money. (2) Trigger: lost credibility in front of colleagues after leader said "I don't understand you" in meeting. (3) Core problem: translating Vietnamese→English in real-time, not thinking in English. (4) Freezes mid-sentence due to missing vocabulary and listening gaps. (5) Tried learning new words — ineffective, doesn't know why (surface fix for deep fluency problem). (6) Never used any app. (7) Would use immediately if free. (8) Wants: speak naturally, listen better, stop translating in head, improve presentation/explanation skills. (9) Would use morning + lunch + evening, ~15 min/session. | **Nuance price assumption**: Segment 1 has two sub-groups — (a) discovery barrier (Interview #1) and (b) price barrier (Interview #2). "Free forever" positioning is critical, not just a differentiator. Listening comprehension confirmed as major pain point alongside speaking. "Real-time translation" problem reinforces "instinct not skill" core positioning. |
| 3 | 2026-05-28 | ESL teacher, teaches at school + language center, beginner-level students (simulated) | (1) 30 students/class, each gets only 1-2 min speaking time per 45-min lesson — practice volume is the core problem. (2) Students fear making mistakes in front of peers — silent even when they know the answer. (3) No suitable tool exists: Duolingo lacks per-student progress tracking, requires manual grading. (4) Would use a free tool if: easy to set up, runs on basic Android phones. (5) Self-hosting less relevant for school teachers — managed access matters more. (6) Progress dashboard for teachers is a must-have, not nice-to-have. | Confirmed Segment 3 pain: scale of speaking practice. Mobile-first (Android) is non-negotiable. Teacher dashboard / progress reporting elevated to P0 for institutional use. Self-hosting less critical for individual teachers vs. institutions. |

| 3 | 2026-05-28 | ESL teacher, teaches at school + language center, beginner-level students (simulated) | (1) 30 students/class, each gets only 1-2 min speaking time per 45-min lesson — practice volume is the core problem. (2) Students fear making mistakes in front of peers — silent even when they know the answer. (3) No suitable tool exists: Duolingo lacks per-student progress tracking, requires manual grading. (4) Would use a free tool if: easy to set up, runs on basic Android phones. (5) Self-hosting less relevant for school teachers — managed access matters more. (6) Progress dashboard for teachers is a must-have, not nice-to-have. | Confirmed Segment 3 pain: scale of speaking practice. Mobile-first (Android) is non-negotiable. Teacher dashboard / progress reporting elevated to P0 for institutional use. Self-hosting less critical for individual teachers vs. institutions. |
| 4 | 2026-05-28 | Backend developer (Python), occasional OSS contributor, AI-interested (simulated) | (1) DX is the #1 filter — complex setup = immediate drop-off. (2) Needs clear CONTRIBUTING.md and well-labeled issues to know where to start. (3) Attracted by tech stack (Whisper, LLaMA), not EdTech mission. (4) Code quality and active maintainers are prerequisites before contributing. (5) Would star immediately; contributing conditional on repo health signals. | Phase 0 "< 30 min setup" gate confirmed as critical for Segment 4. Repo health signals (active maintainers, labeled issues, clean code) must be in place before public launch. Mission alone does not attract contributors — stack and DX do. |

**Target**: 4 interviews completed. Proceeding to build. *(Indonesia/Brazil learner interview deferred — can be conducted post-launch with real users from those markets.)*

## Open Questions

1. **Governance**: Who decides what gets merged? What's the RFC process for major features?
2. **Model hosting**: Do we provide a hosted default model endpoint for users who can't run locally? If so, how do we fund compute costs?
3. **Monetization**: How does the project sustain itself? Options: GitHub Sponsors, hosted SaaS tier, institutional support contracts, grants (Mozilla, Open Society Foundation)
4. **Community safety**: How do we handle harmful content in community-submitted scenarios?
5. **Pedagogical validity**: Who validates that AI feedback is linguistically accurate and not teaching bad habits?
