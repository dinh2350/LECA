# LECA UI System Design
_Created: 2026-05-28_

## Problem

`apps/web` inherited the n2base starter's design system — zinc-dark background (`#09090b`), green accent (`#00ff88`), JetBrains Mono as the sole font, and tight 4–8px radii. The LECA wireframes (`landing-page.html`, `ui-wireframes.html`) define a completely different visual identity: warm brown darks, amber-orange accent, a three-font editorial system, and generous radii. This divergence must be resolved before any product screen work begins.

## Goal

Standardize the entire `apps/web` front-end to the LECA design system extracted from the two reference HTML files. The shadcn/Tailwind component layer is kept — only the token layer and page implementations change.

## Approach

**Phased token-first migration (Approach B).** Four independent phases, each reviewable alone.

---

## Design System Specification

### 1. Token System

#### Color — Dark mode (default)

| CSS Variable | Value | Semantic Role |
|---|---|---|
| `--bg` | `#0C0907` | Page background |
| `--s1` | `#141008` | Card / surface |
| `--s2` | `#1C160B` | Elevated surface |
| `--s3` | `#25200F` | Hover surface |
| `--s4` | `#2E2812` | Active surface |
| `--border` | `rgba(255,235,190,0.06)` | Subtle border |
| `--border-h` | `rgba(255,235,190,0.13)` | Hover border |
| `--border-m` | `rgba(255,235,190,0.20)` | Medium border |
| `--amber` | `#F0622A` | Primary accent |
| `--amber-l` | `#F5844A` | Accent light |
| `--amber-d` | `#C44A18` | Accent dark |
| `--amber-s` | `rgba(240,98,42,0.12)` | Accent surface tint |
| `--amber-g` | `rgba(240,98,42,0.06)` | Accent ghost tint |
| `--cream` | `#F0EAE0` | Primary foreground |
| `--cream-d` | `#B5ADA4` | Secondary foreground |
| `--cream-m` | `#6A6258` | Muted foreground |
| `--cream-f` | `#3A342C` | Faint / disabled |
| `--green` | `#3CB887` | Success / correct |
| `--green-s` | `rgba(60,184,135,0.14)` | Success surface tint |
| `--yellow` | `#E8A820` | Warning |
| `--yellow-s` | `rgba(232,168,32,0.14)` | Warning surface tint |
| `--red` | `#E85050` | Error / destructive |
| `--red-s` | `rgba(232,80,80,0.14)` | Error surface tint |
| `--blue` | `#5F90EE` | Info |

#### Color — Light mode (warm variant)

| CSS Variable | Value | Note |
|---|---|---|
| `--bg` | `#FAF6EF` | Warm off-white |
| `--s1` | `#F5EFE4` | Card surface |
| `--s2` | `#EDE5D6` | Elevated surface |
| `--s3` | `#E5DAC8` | Hover surface |
| `--s4` | `#DDD0B8` | Active surface |
| `--border` | `rgba(44,28,8,0.09)` | Subtle |
| `--border-h` | `rgba(44,28,8,0.16)` | Hover |
| `--border-m` | `rgba(44,28,8,0.24)` | Medium |
| `--amber` | `#C44A18` | Darker for light bg contrast |
| `--amber-l` | `#F0622A` | — |
| `--amber-d` | `#9E3610` | — |
| `--amber-s` | `rgba(196,74,24,0.10)` | — |
| `--cream` | `#1C160B` | Near-black on light |
| `--cream-d` | `#3A342C` | — |
| `--cream-m` | `#6A6258` | Same as dark |
| `--cream-f` | `#B5ADA4` | Faint on light |
| `--green` | `#2A9068` | Darker green for light |
| `--red` | `#C43838` | Darker red for light |

#### Typography

| Variable | Font | Weights | Role |
|---|---|---|---|
| `--fd` | Bricolage Grotesque | 300–800, opsz 12..96 | Display / headings |
| `--fb` | Lora | 400–500, italic | Body prose |
| `--fm` | JetBrains Mono | 400–500 | Mono / UI labels / metadata |

Loaded via Google Fonts in `layout.tsx` using Next.js `next/font/google`.

#### Radius

| Variable | Value | Usage |
|---|---|---|
| `--r-sm` | 10px | Small chips, tags |
| `--r-md` | 16px | Inputs, small cards |
| `--r-lg` | 24px | Cards, modals |
| `--r-xl` | 32px | Large feature cards |

### 2. shadcn CSS Variable Bridge

shadcn/Tailwind reads HSL tokens from `globals.css`. These are remapped to LECA values.

| shadcn token | Dark value | Light value |
|---|---|---|
| `--background` | `16 33% 5%` (`#0C0907`) | `40 44% 95%` (`#FAF6EF`) |
| `--foreground` | `33 42% 91%` (`#F0EAE0`) | `28 42% 8%` (`#1C160B`) |
| `--card` | `28 33% 7%` (`#141008`) | `38 44% 93%` (`#F5EFE4`) |
| `--card-foreground` | same as `--foreground` | same as `--foreground` |
| `--popover` | same as `--card` | same as `--card` |
| `--primary` | `16 86% 56%` (`#F0622A`) | `16 79% 43%` (`#C44A18`) |
| `--primary-foreground` | `16 33% 5%` | `0 0% 100%` |
| `--secondary` | `28 33% 10%` (`#1C160B`) | `38 34% 88%` (`#EDE5D6`) |
| `--muted` | `28 33% 10%` | `38 34% 88%` |
| `--muted-foreground` | `25 8% 39%` (`#6A6258`) | `25 8% 39%` |
| `--accent` | `28 33% 12%` (`#25200F`) | `38 30% 84%` (`#E5DAC8`) |
| `--accent-foreground` | same as `--foreground` | same as `--foreground` |
| `--destructive` | `0 65% 60%` (`#E85050`) | `0 59% 48%` (`#C43838`) |
| `--border` | warm cream 6% | warm brown 9% |
| `--input` | same as `--border` | same as `--border` |
| `--ring` | `16 86% 56%` amber | `16 79% 43%` amber |
| `--radius` | `0.625rem` (10px) | same |

### 3. Page Architecture

#### Phase 1 — Design Tokens (globals.css + fonts)
Files changed:
- `apps/web/src/app/globals.css` — full CSS variable replacement, add custom LECA variables alongside shadcn bridge
- `apps/web/src/app/[language]/layout.tsx` — switch to `next/font/google` for Bricolage Grotesque + Lora + JetBrains Mono, apply `--fd`/`--fb`/`--fm` variables to root

#### Phase 2 — Landing Page
Files changed:
- `apps/web/src/app/[language]/page.tsx` — replace n2base feature-list placeholder with LECA landing page content
- New components under `src/components/landing/`:
  - `hero.tsx` — Hero section with animated card mock
  - `stats-bar.tsx` — 3-stat strip
  - `problem.tsx` — Problem section with insight cards
  - `features.tsx` — Three-feature grid
  - `how-it-works.tsx` — Steps section
  - `open-source.tsx` — OSS section with tech stack rows
  - `cta.tsx` — Bottom CTA
  - `site-footer.tsx` — Footer

Fidelity target: pixel-close to `landing-page.html` — same grain overlay, glow effects, animation delays, typography treatment.

#### Phase 3 — Auth Screens
Screens: sign-in, sign-up, forgot-password, confirm-email, password-change, confirm-new-email.

Changes per screen:
- Container: warm card (`--s1` background, `--border` border)
- Heading: Bricolage Grotesque `--fd`
- CTA button: amber primary (inherits from Phase 1 token swap)
- Input: warm border, cream text
- Logo: `L<span amber>E</span>CA` treatment

#### Phase 4 — App Screens
Screens: profile, admin-panel.

Changes:
- Profile page: align to Settings wireframe (Screen 13) — sectioned layout with warm card rows
- Admin panel: align to Self-Host Admin Dashboard wireframe (Screen 15) — desktop-first sidebar pattern

---

## Constraints

- **No shadcn component replacements** — only CSS variable values change; component markup stays identical.
- **No MUI** — the TECH_STACK.md lists MUI v7 but `globals.css` and `components.json` show shadcn is already the active choice. Confirm no MUI imports exist before Phase 1.
- **Light mode** — warm palette derived above; not dropped, but LECA dark is the default.
- **Grain overlay** — `body::before` pseudo-element with SVG noise filter, defined in globals.css at root level so all pages get it.
- **No scope creep** — conversation/pronunciation/dashboard app screens (Wireframes 03–12) are out of scope for this migration. They belong to product feature work.

---

## Success Criteria

| Phase | Criterion |
|---|---|
| 1 | `globals.css` tokens render amber buttons and cream text across all existing pages in dev server |
| 2 | Landing page matches `landing-page.html` visually; n2base placeholder is gone |
| 3 | All auth screens use warm LECA card surface and Bricolage headings |
| 4 | Profile and admin panel pass visual comparison against wireframes 13 and 15 |
| All | TypeScript compiles clean, Playwright E2E passes |
