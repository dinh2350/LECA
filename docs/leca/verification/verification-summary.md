# Verification Summary — LECA Research & BRD
**Date**: 2026-05-27  
**Sources**: Adversarial review + live fact-checking  
**Verdict**: CONCERNS — safe to continue planning with corrections; NOT ready for external presentation

---

## What You Can Trust

| Item | Confidence | Basis |
|------|-----------|-------|
| Competitor feature comparison (Duolingo vs ELSA vs Speak vs Cambly) | High | Live web scraping + known public facts |
| Duolingo stats (500M users, 40M DAU, $531M revenue) | High | Public company audited financials |
| HelloTalk stats (70M users, 260 languages) | High | Verified from their official About page |
| "No polished OSS English conversation app exists" | High | GitHub search confirmed only 1-star projects |
| Open-source tech stack (Whisper, LLaMA 3, Coqui TTS) | High | All confirmed open-source and actively maintained |
| Institutional gap (no self-hostable tool for ESL) | High | Logical derivation from confirmed competitor data |

---

## What Needs Correction Before Sharing Externally

### Fix 1 — Market Size (HIGH PRIORITY)
- **Current**: "$12–15B market, 18–20% CAGR"  
- **Problem**: Could not verify from primary sources. Paid research reports are paywalled.
- **Fix**: Change to *"Estimated $5–15B (industry estimates; primary source not independently verified)"*

### Fix 2 — English Learner Count (HIGH PRIORITY)
- **Current**: "1.5 billion non-native English learners"
- **Problem**: Traces to a British Council projection from 2000. Overstates active learners by 3–5×.
- **Fix**: Change to *"an estimated 200–400M active English learners globally"*

### Fix 3 — ChatGPT Gap (CRITICAL — strategic, not just factual)
- **Current**: BRD doesn't mention ChatGPT, Claude, or Gemini as competitors
- **Problem**: All three offer free, free-form AI English conversation today — directly competing with LECA's core value proposition
- **Fix**: Add to competitor analysis. Answer clearly: *"Why use LECA instead of ChatGPT?"* Best answer: LECA is open-source + self-hostable + English-education-specific (curriculum, pronunciation scoring, progress tracking) — ChatGPT is a general chatbot, not a learning platform

### Fix 4 — Hardware Requirements for Self-Hosting
- **Current**: "Docker self-hosting setup" with no hardware spec mentioned
- **Problem**: LLaMA 3 70B requires ~40GB VRAM (server GPU). Most self-hosters can't do this. LLaMA 3 8B runs on consumer GPUs but with quality trade-offs.
- **Fix**: Add explicit hardware tiers to the BRD:
  - Hosted (cloud) tier: no hardware needed, LECA provides endpoint
  - Light self-host: LLaMA 3 8B, 16GB VRAM (consumer GPU)
  - Full self-host: LLaMA 3 70B, 40GB+ VRAM (server GPU)

### Fix 5 — Monetization Plan (HIGH PRIORITY)
- **Current**: Listed as an open question in Appendix B
- **Problem**: No sustainability model = project dies. This must be decided before building.
- **Recommended options to evaluate**:
  - GitHub Sponsors + Open Collective (community funding)
  - Hosted SaaS tier (free self-host, paid cloud hosting)
  - Institutional support contracts (ESL schools, NGOs)
  - Grants (Mozilla, Open Society, Gates Foundation education grants)

### Fix 6 — Speak.com Pricing Unverified
- **Current**: "$15–20/mo (est.)"
- **Fix**: Add "(unverified — pricing page unavailable during research)" label

---

## Strategic Issues That Remain Open

These aren't factual errors — they're genuine strategic questions the BRD doesn't resolve:

| Question | Why It Matters |
|----------|---------------|
| Why use LECA over ChatGPT? | Core positioning must answer this |
| Does free-form conversation help A2 beginners or reinforce errors? | Pedagogical validity of the core feature |
| Who seeds the scenario library before community grows? | Cold-start problem for OSS flywheel |
| What hardware does a typical ESL school have for self-hosting? | Determines feasibility of institutional segment |
| What's the governance model for OSS maintainership? | Determines long-term project health |

---

## Recommended Next Steps (Priority Order)

1. **Immediately**: Apply the 6 corrections above to the BRD and market research docs
2. **Before building**: Conduct 5–10 user interviews with Persona 1 (Vietnamese/Indonesian learners) to validate personas
3. **Before building**: Answer "Why LECA over ChatGPT?" — this is the most critical strategic question
4. **Before building**: Decide monetization model — pick one and commit
5. **Technical spike**: Run latency benchmark with Whisper + LLaMA 3 8B + Coqui TTS on target hardware to validate the <3s gate is achievable

---

## Final Confidence Assessment

| Document | Trust Level | Use For |
|----------|------------|---------|
| Competitor profiles | High | Internal product decisions ✓ |
| Market research | Medium | Internal only — not for investor pitch |
| User personas | Low-Medium | Hypothesis only — validate with interviews |
| BRD | Medium | Internal planning ✓ — needs 6 corrections before external use |
