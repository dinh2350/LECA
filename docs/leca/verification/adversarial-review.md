# Adversarial Review — LECA Research & BRD
**Reviewed**: 2026-05-27  
**Scope**: BRD.md, competitor-profiles/_summary.md, market-research.md, user-personas.md  
**Verdict**: CONCERNS — significant unverified claims and flawed strategic assumptions

---

## Persona 1: The Saboteur
*"I am trying to find what will make this project fail in reality."*

---

### CRITICAL — ChatGPT Already Does This
**Claim challenged**: "No free, open-source, AI-first English conversation platform exists"

The BRD ignores the most obvious competitor: **ChatGPT, Claude, and Gemini** — all of which offer free-form English conversation practice for free (on their free tiers). A learner can open ChatGPT right now, type "Let's practice English conversation. Correct my mistakes" and get exactly what LECA promises to deliver.

- ChatGPT Advanced Voice Mode: real-time spoken English conversation, free tier available
- Gemini Live: spoken conversation AI, free on Android
- Claude.ai: text-based conversation practice, free

**Why this breaks the project**: LECA's core value proposition ("free-form AI English conversation") is already available from better-resourced competitors. The question "why use LECA instead of ChatGPT?" is never answered in the BRD.

**Verdict**: CRITICAL — the "no competition" claim is false. The entire positioning needs to address this.

---

### CRITICAL — The Latency Math Doesn't Work on Target Hardware
**Claim challenged**: "Phase 0 gate: Core pipeline latency < 3 seconds end-to-end"

The proposed stack: Whisper (STT) → LLaMA 3 (dialogue) → Coqui TTS (voice).

On realistic hardware for a self-hosted server:
- Whisper large-v3: ~1–2s transcription time (CPU), ~0.3s (GPU)
- LLaMA 3 70B: ~5–15s first-token latency on consumer GPU (RTX 4090), 30s+ on CPU
- LLaMA 3 8B: ~1–3s on GPU — barely acceptable, but quality drops significantly
- Coqui TTS: ~0.5–1s

**To hit < 3s end-to-end requires a GPU with 40GB+ VRAM** (for LLaMA 3 70B) or accepting LLaMA 3 8B quality. Most self-hosters don't have this. Most learners in developing markets certainly don't.

The BRD doesn't specify which model size achieves the latency target, or what hardware is assumed. This is not a minor detail — it's the core technical feasibility question.

**Verdict**: CRITICAL — the latency gate is unachievable with the stated stack on realistic hardware without major caveats.

---

### WARNING — "Can't Afford $12/mo" Is Overstated
**Claim challenged**: Persona 1 — "can't afford $12–20/mo apps"

Vietnam average monthly salary: ~$400–550. $12/mo = 2.2–3% of income. That is significant but millions of Vietnamese users already pay for Netflix ($7/mo), Spotify ($3/mo), and mobile data plans. The barrier is **willingness to pay**, not literal inability to afford.

This distinction matters for product strategy: "free because learners won't pay for an unknown app" is a different problem than "free because learners literally cannot afford it." The former is solved by trust and virality; the latter requires permanent subsidy.

**Verdict**: WARNING — overstated claim leads to wrong product strategy conclusions.

---

### WARNING — No Sustainability Model
The BRD has zero monetization plan. "Appendix B" lists it as an open question. Open-source projects without funding typically die within 2 years. The document references GitHub Sponsors, hosted SaaS, and institutional contracts as options — but presents no analysis of which is viable.

Comparable OSS edtech projects that failed for funding reasons: OpenMentor, many Moodle plugins, various language learning repos with 500+ stars and 0 active maintainers.

**Verdict**: WARNING — no sustainability plan = LECA is a prototype, not a product.

---

## Persona 2: The New Hire
*"I just joined this project. What buried assumptions would I not know?"*

---

### WARNING — "Open-Source" Doesn't Matter to Casual Learners
The BRD lists "open-source" as a core differentiator in the value curve. But Persona 1 (Aspiring Professional, P0) does not care about open-source. They care about: Does it work? Is it free? Is it in my language?

Open-source is a differentiator for:
- Institutions (Persona 3) — who need to audit and self-host
- Developers (Persona 4) — who want to contribute

It is irrelevant to the 400M developing-market learners identified as the primary audience. The BRD confuses the needs of Persona 3/4 (who care about OSS) with the value proposition for Persona 1 (who doesn't).

**Verdict**: WARNING — core positioning claim doesn't match the primary target user.

---

### WARNING — Free-Form Conversation May Not Be Better for Beginners
**Claim challenged**: Implied throughout BRD that free-form conversation > structured learning.

Established second language acquisition (SLA) research (Krashen, Swain, VanPatten) shows:
- **Beginners** (A1–A2) benefit most from comprehensible input + structured form focus
- **Free-form conversation at A1 level reinforces errors** rather than correcting them
- Pronunciation errors become fossilized when not corrected systematically early

ELSA and Duolingo's structured approach is pedagogically defensible for beginners. LECA's "free-form first" approach has a real risk of teaching bad English at scale.

The BRD identifies Persona 1 as "A2–B1 level" — exactly the range where unstructured conversation practice is most risky.

**Verdict**: WARNING — the core pedagogical assumption is contested by SLA research.

---

### NOTE — Personas Have No Primary Research Basis
The user-personas.md file states **confidence: Medium** and notes "no primary interviews yet." All four personas are constructed from patterns, not from interviews with real users.

The document recommends 5–10 interviews before finalizing. That recommendation should be a **prerequisite** for the BRD, not an appendix item. Building features for hypothetical personas is a classic startup failure mode.

**Verdict**: NOTE — personas are hypotheses, not validated insights. Treat all persona-based decisions as assumptions until validated.

---

### NOTE — "Community-Built Scenario Library" Has a Cold Start Problem
The BRD assumes a scenario library will organically grow through community contribution. But who contributes the first 50 scenarios? Who reviews them for quality? What prevents low-quality contributions?

GitHub has 100M+ repositories; most have 0 contributors. The "OSS flywheel" requires a critical mass that doesn't happen automatically.

**Verdict**: NOTE — no community seeding or governance strategy defined.

---

## Persona 3: The Security Auditor
*"What claims have no evidentiary basis? What will an investor or critical user attack?"*

---

### CRITICAL — Market Size Numbers Are Unverified and Likely Inflated
**Claim**: "$12–15B language learning app market, 18–20% CAGR"

These numbers appear throughout the BRD but:
- The market research file explicitly states these are "industry estimates" — not from a verified source
- Grand View Research, Mordor Intelligence (the typical sources) are known to produce optimistic projections
- The figures vary wildly by source: same market is cited as $5B to $25B depending on what's included (all e-learning? apps only? English only?)
- The actual **addressable market for LECA** is a fraction of the total — it's not the whole language learning market, it's the English-speaking AI conversation subset

**Verdict**: CRITICAL — market size is the foundation of the business case. Unverified estimates from unknown sources undermine the entire BRD. Must cite primary sources or label clearly as unverified estimates.

---

### WARNING — "1.5 Billion English Learners" Is a Stale, Contested Figure
The British Council's "1.75 billion people learning English" figure dates to a **2000 projection** — now 25+ years old. The EF EPI 2025 assessed 2.2M test-takers across 123 countries — a much smaller, self-selected sample.

The actual number of **active English learners** (people currently studying, not just those who have ever studied) is likely 200–400M. The 1.5B figure conflates lifetime exposure with active learning.

**Verdict**: WARNING — overstated audience size inflates the opportunity. Correct to "200–400M active learners" with a source.

---

### WARNING — Competitor Pricing Not Fully Verified
- **Speak.com pricing**: The pricing page returned a 404 during research. The "$15–20/mo" figure is an estimate, not verified.
- **Cambly pricing**: Scraped in Vietnamese Dong and converted — conversion rate and tier structure may be inaccurate for USD markets.
- **ELSA pricing**: The site redirected to a Vietnam-specific page — premium pricing may differ by region.

Pricing is one of the most important competitive inputs. Unverified pricing creates strategic blind spots.

**Verdict**: WARNING — at least 2 of 6 competitor pricing claims are unverified.

---

## Cross-Persona Findings (Promoted to Higher Severity)

### CRITICAL (promoted from 2× WARNING) — ChatGPT Gap
Flagged by Saboteur (fails in reality) and Security Auditor (no evidentiary basis for "no competition" claim). The BRD's entire competitive positioning assumes ChatGPT/Claude are not competitors for English practice. This is demonstrably false and the single most dangerous oversight in the document.

---

## Summary

**Overall risk profile**: The research provides a useful starting framework but contains several claims that will not survive scrutiny from a skeptical investor, educator, or user.

**The single most important fix**: Add a dedicated section in the BRD answering: *"Why would a learner use LECA instead of just talking to ChatGPT?"* Until this question is answered convincingly, the core value proposition is not established.

**What's actually solid**:
- The competitor feature comparison (Duolingo vs ELSA vs Speak) is directionally accurate
- The technology stack identification is correct — Whisper, LLaMA 3, Coqui TTS are real and OSS
- The institutional/educator gap (no self-hostable tool) is real and less contested
- The "open-source for institutions" angle is the strongest, most defensible positioning

**Recommended immediate actions**:
1. Add ChatGPT/Claude/Gemini to the competitor analysis
2. Replace unverified market size figures with clearly labeled estimates and source citations
3. Define the sustainability/monetization model before building anything
4. Conduct 5–10 user interviews before writing another line of the BRD
5. Clarify the hardware requirements for the self-hosting latency target
