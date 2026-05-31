# LECA UI System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the n2base zinc/green design system in `apps/web` with the LECA warm-brown/amber system defined in `docs/leca/wireframes/landing-page.html` and `ui-wireframes.html`.

**Architecture:** Phased token-first migration. Phase 1 replaces the CSS token layer so all existing shadcn components immediately inherit the new palette. Phases 2–4 rebuild pages to match wireframe fidelity. No shadcn component APIs change — only styling.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui (radix-nova), `next/font/google`, TypeScript 5.9, Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-05-28-leca-ui-system-design.md`

---

## Pre-flight check

- [ ] **Confirm no MUI imports exist**

  ```bash
  grep -r "@mui" apps/web/src --include="*.tsx" --include="*.ts" -l
  ```

  Expected output: _(empty — no files)_. If any appear, stop and report before continuing.

- [ ] **Confirm dev server starts clean**

  ```bash
  cd apps/web && pnpm dev
  ```

  Navigate to `http://localhost:3000`. Expected: existing n2base UI loads without errors. Stop the server (`Ctrl+C`).

---

## Phase 1 — Design Tokens

### Task 1: Replace `globals.css` with LECA tokens

**Files:**
- Modify: `apps/web/src/app/globals.css` (full replacement)

- [ ] **Step 1: Replace `globals.css` contents**

  Replace the entire file with:

  ```css
  @import "tailwindcss";

  @custom-variant dark (&:is(.dark *));

  /* ── LECA DESIGN TOKENS ── */
  @theme inline {
    /* Typography */
    --font-display: 'Bricolage Grotesque', sans-serif;
    --font-body: 'Lora', serif;
    --font-mono: 'JetBrains Mono', monospace;

    /* Radius */
    --radius-sm: 10px;
    --radius-md: 16px;
    --radius-lg: 24px;
    --radius-xl: 32px;
  }

  /* ── DARK MODE (default) ── */
  :root {
    /* Raw LECA palette */
    --bg:       #0C0907;
    --s1:       #141008;
    --s2:       #1C160B;
    --s3:       #25200F;
    --s4:       #2E2812;
    --border:   rgba(255,235,190,0.06);
    --border-h: rgba(255,235,190,0.13);
    --border-m: rgba(255,235,190,0.20);

    --amber:    #F0622A;
    --amber-l:  #F5844A;
    --amber-d:  #C44A18;
    --amber-s:  rgba(240,98,42,0.12);
    --amber-g:  rgba(240,98,42,0.06);

    --cream:    #F0EAE0;
    --cream-d:  #B5ADA4;
    --cream-m:  #6A6258;
    --cream-f:  #3A342C;

    --green:    #3CB887;
    --green-s:  rgba(60,184,135,0.14);
    --yellow:   #E8A820;
    --yellow-s: rgba(232,168,32,0.14);
    --red:      #E85050;
    --red-s:    rgba(232,80,80,0.14);
    --blue:     #5F90EE;

    --fd: 'Bricolage Grotesque', sans-serif;
    --fb: 'Lora', serif;
    --fm: 'JetBrains Mono', monospace;

    --r-sm: 10px;
    --r-md: 16px;
    --r-lg: 24px;
    --r-xl: 32px;

    /* shadcn HSL bridge — dark */
    --background: 16 33% 5%;
    --foreground: 33 42% 91%;
    --card: 28 33% 7%;
    --card-foreground: 33 42% 91%;
    --popover: 28 33% 7%;
    --popover-foreground: 33 42% 91%;
    --primary: 16 86% 56%;
    --primary-foreground: 16 33% 5%;
    --secondary: 28 33% 10%;
    --secondary-foreground: 33 42% 91%;
    --muted: 28 33% 10%;
    --muted-foreground: 25 8% 39%;
    --accent: 28 33% 12%;
    --accent-foreground: 33 42% 91%;
    --destructive: 0 65% 60%;
    --destructive-foreground: 33 42% 91%;
    --border: 33 20% 12%;
    --input: 33 20% 12%;
    --ring: 16 86% 56%;
    --radius: 0.625rem;

    /* Tailwind utility aliases */
    --color-bg: var(--bg);
    --color-surface: var(--s1);
    --color-border: rgba(255,235,190,0.13);
    --color-border-subtle: rgba(255,235,190,0.06);
    --color-foreground: var(--cream);
    --color-muted: var(--cream-m);
    --color-muted-foreground: var(--cream-d);
    --color-accent: var(--amber);
    --color-accent-hover: var(--amber-l);
    --color-warn: var(--red);
    --font-sans: var(--fm);
  }

  /* ── LIGHT MODE ── */
  .light {
    --bg:       #FAF6EF;
    --s1:       #F5EFE4;
    --s2:       #EDE5D6;
    --s3:       #E5DAC8;
    --s4:       #DDD0B8;
    --border:   rgba(44,28,8,0.09);
    --border-h: rgba(44,28,8,0.16);
    --border-m: rgba(44,28,8,0.24);

    --amber:    #C44A18;
    --amber-l:  #F0622A;
    --amber-d:  #9E3610;
    --amber-s:  rgba(196,74,24,0.10);
    --amber-g:  rgba(196,74,24,0.05);

    --cream:    #1C160B;
    --cream-d:  #3A342C;
    --cream-m:  #6A6258;
    --cream-f:  #B5ADA4;

    --green:    #2A9068;
    --green-s:  rgba(42,144,104,0.14);
    --red:      #C43838;
    --red-s:    rgba(196,56,56,0.14);

    /* shadcn HSL bridge — light */
    --background: 40 44% 95%;
    --foreground: 28 42% 8%;
    --card: 38 44% 93%;
    --card-foreground: 28 42% 8%;
    --popover: 40 44% 95%;
    --popover-foreground: 28 42% 8%;
    --primary: 16 79% 43%;
    --primary-foreground: 0 0% 100%;
    --secondary: 38 34% 88%;
    --secondary-foreground: 28 42% 8%;
    --muted: 38 34% 88%;
    --muted-foreground: 25 8% 39%;
    --accent: 38 30% 84%;
    --accent-foreground: 28 42% 8%;
    --destructive: 0 59% 48%;
    --destructive-foreground: 0 0% 100%;
    --border: 33 22% 84%;
    --input: 33 22% 84%;
    --ring: 16 79% 43%;

    --color-bg: var(--bg);
    --color-surface: var(--s1);
    --color-border: rgba(44,28,8,0.16);
    --color-border-subtle: rgba(44,28,8,0.09);
    --color-foreground: var(--cream);
    --color-muted: var(--cream-m);
    --color-muted-foreground: var(--cream-d);
    --color-accent: var(--amber);
    --color-accent-hover: var(--amber-l);
    --color-warn: var(--red);
  }

  /* ── BASE STYLES ── */
  *, *::before, *::after { box-sizing: border-box; }

  html { scroll-behavior: smooth; }

  body {
    background-color: var(--bg);
    color: var(--cream);
    font-family: var(--fb);
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    padding-top: 3.5rem;
  }

  /* Grain overlay — applied globally for LECA brand texture */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: overlay;
    opacity: 0.6;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--s4); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--cream-m); }
  ```

- [ ] **Step 2: Verify the dev server compiles without errors**

  ```bash
  cd apps/web && pnpm dev 2>&1 | head -30
  ```

  Expected: `✓ Ready` line, no CSS parse errors.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/app/globals.css
  git commit -m "feat(web): replace design tokens with LECA warm-amber system"
  ```

---

### Task 2: Load LECA fonts via `next/font/google`

**Files:**
- Modify: `apps/web/src/app/[language]/layout.tsx`

- [ ] **Step 1: Add font imports and apply to `<html>`**

  Add these imports at the top of `layout.tsx` (after the existing imports):

  ```typescript
  import {
    Bricolage_Grotesque,
    Lora,
    JetBrains_Mono,
  } from 'next/font/google';

  const bricolage = Bricolage_Grotesque({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800'],
    variable: '--font-bricolage',
    display: 'swap',
  });

  const lora = Lora({
    subsets: ['latin'],
    weight: ['400', '500'],
    style: ['normal', 'italic'],
    variable: '--font-lora',
    display: 'swap',
  });

  const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['400', '500'],
    variable: '--font-jetbrains',
    display: 'swap',
  });
  ```

  Then update the `<html>` tag in the return to include the font class names:

  ```tsx
  <html
    lang={language}
    dir={dir(language)}
    suppressHydrationWarning
    className={`${bricolage.variable} ${lora.variable} ${jetbrainsMono.variable}`}
  >
  ```

  Then update `globals.css` `@theme inline` to use the Next.js CSS variables:

  ```css
  @theme inline {
    --font-display: var(--font-bricolage), sans-serif;
    --font-body: var(--font-lora), serif;
    --font-mono: var(--font-jetbrains), monospace;
  }
  ```

  And in `:root`, update the font custom properties:

  ```css
  --fd: var(--font-bricolage), sans-serif;
  --fb: var(--font-lora), serif;
  --fm: var(--font-jetbrains), monospace;
  ```

- [ ] **Step 2: Run dev and visually verify fonts load**

  Open `http://localhost:3000`. The app-bar logo and nav links should render in JetBrains Mono. The body copy should render in Lora serif. No FOUT (flash of unstyled text) since `display: 'swap'` is set.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/app/[language]/layout.tsx apps/web/src/app/globals.css
  git commit -m "feat(web): load LECA fonts via next/font (Bricolage Grotesque, Lora, JetBrains Mono)"
  ```

---

### Task 3: Restyle the app-bar to LECA nav

**Files:**
- Modify: `apps/web/src/components/app-bar.tsx`

The current app-bar uses `--color-surface` background and `--color-accent` (now amber) logo. We need to match the LECA nav: warm dark glassy background, `L<amber>E</amber>CA` logo, mono nav links, amber CTA pill.

- [ ] **Step 1: Update `app-bar.tsx`**

  Replace the `<header>` className and interior styles:

  ```tsx
  // Header: glassy warm dark nav matching landing-page.html nav styles
  <header
    className="fixed top-0 left-0 right-0 z-40"
    style={{
      background: 'rgba(12,9,7,0.82)',
      backdropFilter: 'blur(28px) saturate(1.4)',
      borderBottom: '1px solid var(--border)',
      height: '64px',
    }}
  >
    <div className="mx-auto flex h-full max-w-screen-xl items-center gap-6 px-12">
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: 'var(--fd)',
          fontSize: '22px',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: 'var(--cream)',
          textDecoration: 'none',
        }}
      >
        L<span style={{ color: 'var(--amber)' }}>E</span>CA
      </Link>
      {/* ... rest of nav ... */}
    </div>
  </header>
  ```

  Update nav link styles to use `--cream-m` / `--fm` mono:

  ```tsx
  <Button
    variant="ghost"
    size="sm"
    asChild
    style={{ fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--cream-m)', letterSpacing: '0.08em' }}
  >
    <Link href="/">{t('common:navigation.home')}</Link>
  </Button>
  ```

  Update the Sign In CTA to amber pill:

  ```tsx
  <Link
    href="/sign-in"
    style={{
      fontFamily: 'var(--fd)',
      fontSize: '13px',
      fontWeight: 700,
      background: 'var(--amber)',
      color: 'var(--bg)',
      padding: '9px 22px',
      borderRadius: '999px',
      letterSpacing: '0.01em',
      boxShadow: '0 4px 24px rgba(240,98,42,0.35)',
      textDecoration: 'none',
    }}
  >
    {t('common:navigation.sign-in')}
  </Link>
  ```

  Also update `body` `padding-top` in `globals.css` from `3.5rem` (56px) to `4rem` (64px) to match the new nav height.

- [ ] **Step 2: Verify nav appearance**

  Check `http://localhost:3000` — logo shows `L[amber]E[/amber]CA`, background is glassy warm dark, Sign In button is amber pill.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/components/app-bar.tsx apps/web/src/app/globals.css
  git commit -m "feat(web): restyle app-bar to LECA glassy nav with amber CTA"
  ```

---

## Phase 2 — Landing Page

### Task 4: Create landing page component structure

**Files:**
- Create: `apps/web/src/components/landing/hero.tsx`
- Create: `apps/web/src/components/landing/stats-bar.tsx`
- Create: `apps/web/src/components/landing/problem.tsx`
- Create: `apps/web/src/components/landing/features.tsx`
- Create: `apps/web/src/components/landing/how-it-works.tsx`
- Create: `apps/web/src/components/landing/open-source.tsx`
- Create: `apps/web/src/components/landing/cta.tsx`
- Create: `apps/web/src/components/landing/site-footer.tsx`
- Modify: `apps/web/src/app/[language]/page.tsx`

**Reference:** `docs/leca/wireframes/landing-page.html` — read this file in full before implementing. All section structure, copy, and CSS animations must match it.

- [ ] **Step 1: Create `hero.tsx`**

  Port the `.hero`, `.hero-left`, `.hero-right`, `.hero-card`, `.hero-badge`, `.hero-headline`, `.hero-sub`, `.hero-actions`, `.hero-meta` sections from `landing-page.html` verbatim using inline styles + `<style jsx global>` or a `<style>` tag via a `StyleSheet` component.

  Recommended approach — use a `<style>` tag within the component for the animation keyframes, and inline styles for static properties:

  ```tsx
  export function Hero() {
    return (
      <>
        <style>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.7); }
          }
          @keyframes wv {
            0%, 100% { transform: scaleY(0.3); }
            50% { transform: scaleY(1); }
          }
          @keyframes pring {
            0% { transform: scale(1); opacity: 0.7; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <section style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          padding: '120px 48px 80px',
          position: 'relative',
          overflow: 'hidden',
          gap: '64px',
        }}>
          {/* glow-1 */}
          <div style={{
            position: 'absolute', top: '-200px', left: '-100px',
            width: '700px', height: '700px',
            background: 'radial-gradient(ellipse, rgba(240,98,42,0.14) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          {/* glow-2 */}
          <div style={{
            position: 'absolute', bottom: '-100px', right: '-50px',
            width: '500px', height: '500px',
            background: 'radial-gradient(ellipse, rgba(60,184,135,0.07) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          {/* Left copy */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--amber-s)', border: '1px solid rgba(240,98,42,0.28)',
              borderRadius: '999px', padding: '6px 14px',
              fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--amber)',
              letterSpacing: '0.08em', marginBottom: '28px',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--amber)',
                display: 'inline-block',
                animation: 'pulse-dot 2.5s ease-in-out infinite',
              }} />
              OPEN SOURCE · VOICE-FIRST · AI-POWERED
            </div>
            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--fd)',
              fontSize: 'clamp(52px, 5.5vw, 80px)',
              fontWeight: 800, lineHeight: 1.01,
              letterSpacing: '-0.04em', color: 'var(--cream)',
              marginBottom: '24px',
            }}>
              English as{' '}
              <span style={{ color: 'var(--amber)' }}>instinct,</span>
              <br />
              <span style={{ WebkitTextStroke: '2px var(--cream-f)', color: 'transparent' }}>
                not a skill.
              </span>
            </h1>
            {/* Subheading */}
            <p style={{
              fontFamily: 'var(--fb)', fontSize: '18px', fontStyle: 'italic',
              color: 'var(--cream-d)', lineHeight: 1.7, maxWidth: '420px',
              marginBottom: '40px',
            }}>
              AI conversation practice that adapts to your gaps — pronunciation, vocabulary, fluency — in real-world scenarios.
            </p>
            {/* Actions */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '36px' }}>
              <a href="/sign-up" style={{
                fontFamily: 'var(--fd)', fontSize: '14px', fontWeight: 700,
                background: 'linear-gradient(135deg, var(--amber), var(--amber-d))',
                color: 'var(--bg)', padding: '14px 32px', borderRadius: '999px',
                textDecoration: 'none', letterSpacing: '0.01em',
                boxShadow: '0 8px 32px rgba(240,98,42,0.4)',
              }}>
                Start for free →
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{
                fontFamily: 'var(--fd)', fontSize: '14px', fontWeight: 600,
                color: 'var(--cream-d)', border: '1px solid var(--border-h)',
                padding: '14px 32px', borderRadius: '999px', textDecoration: 'none',
                background: 'rgba(255,235,190,0.03)',
              }}>
                View on GitHub
              </a>
            </div>
            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--cream-m)', letterSpacing: '0.06em' }}>Apache 2.0 License</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--cream-m)', letterSpacing: '0.06em' }}>Self-hostable</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--cream-m)', letterSpacing: '0.06em' }}>No data sold</span>
              </div>
            </div>
          </div>
          {/* Right card mock — port .hero-card from landing-page.html */}
          <div style={{
            background: 'linear-gradient(145deg, var(--s2), var(--s1))',
            border: '1px solid var(--border-h)', borderRadius: 'var(--r-xl)',
            overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            {/* Port the full .card-header, .card-messages, .card-ptt, .pron-row from landing-page.html */}
            {/* Read landing-page.html lines 275–420 for exact markup */}
          </div>
        </section>
      </>
    );
  }
  ```

  **Important:** Complete the right-side card by reading `landing-page.html` from line 265 to 420 and porting every element (card header with avatar + timer, AI/user message bubbles, feedback chip, PTT button with wave bars, pronunciation row).

- [ ] **Step 2: Create `stats-bar.tsx`**

  Port `.stats-bar` from `landing-page.html` (lines ~427–477). Three stats with separators and a tagline:

  ```tsx
  export function StatsBar() {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0', padding: '0 48px',
        background: 'var(--s1)', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
      }}>
        {[
          { val: '8 weeks', label: 'to measurable fluency gains' },
          { val: '4 domains', label: 'pronunciation · vocab · fluency · context' },
          { val: '100%', label: 'open source, self-hostable' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'contents' }}>
            {i > 0 && <div style={{ width: '1px', height: '48px', background: 'var(--border-h)', flexShrink: 0 }} />}
            <div style={{ padding: '28px 48px', textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--fd)', fontSize: '32px', fontWeight: 800,
                color: 'var(--cream)', letterSpacing: '-0.03em',
              }}>{s.val}</div>
              <div style={{
                fontFamily: 'var(--fm)', fontSize: '10px', color: 'var(--cream-m)',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '4px',
              }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```

- [ ] **Step 3: Create `problem.tsx`**

  Port `.problem` section from `landing-page.html` (lines ~481–558). Two-column: large quote left, insight cards right. Reference the exact copy and card content from the HTML file.

- [ ] **Step 4: Create `features.tsx`**

  Port `.features` section (lines ~563–639). Three feature cells in a horizontal grid: AI Conversation, Pronunciation Feedback, Scenario Library.

- [ ] **Step 5: Create `how-it-works.tsx`**

  Port `.how` section (lines ~711–781). Four numbered steps with connector lines.

- [ ] **Step 6: Create `open-source.tsx`**

  Port `.oss` section (lines ~785–876). Left: badge + copy + links. Right: tech stack rows with free/OSS/WASM badges.

- [ ] **Step 7: Create `cta.tsx`**

  Port `.cta-section` (lines ~883–941). Centered amber glow, headline, sub, two CTA buttons, fine print.

- [ ] **Step 8: Create `site-footer.tsx`**

  Port `<footer>` (lines ~945–995). Logo, footer links, OSS pill.

- [ ] **Step 9: Replace `page.tsx` with LECA landing**

  Replace `apps/web/src/app/[language]/page.tsx` content:

  ```tsx
  import type { Metadata } from 'next';
  import { getServerTranslation } from '@/services/i18n';
  import { Hero } from '@/components/landing/hero';
  import { StatsBar } from '@/components/landing/stats-bar';
  import { Problem } from '@/components/landing/problem';
  import { Features } from '@/components/landing/features';
  import { HowItWorks } from '@/components/landing/how-it-works';
  import { OpenSource } from '@/components/landing/open-source';
  import { Cta } from '@/components/landing/cta';
  import { SiteFooter } from '@/components/landing/site-footer';

  type Props = { params: Promise<{ language: string }> };

  export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const { t } = await getServerTranslation(params.language, 'home');
    return { title: t('title') };
  }

  export default async function Home() {
    return (
      <>
        <Hero />
        <StatsBar />
        <Problem />
        <Features />
        <HowItWorks />
        <OpenSource />
        <Cta />
        <SiteFooter />
      </>
    );
  }
  ```

  Also remove the `padding-top: 3.5rem` / `4rem` body rule from `globals.css` — the landing page sections are full-bleed. The auth pages have their own container padding.

  Actually: keep `body { padding-top: 64px }` so auth/app pages still clear the nav. The Hero section compensates with its own `padding: 120px 48px 80px`.

- [ ] **Step 10: Verify landing page visually**

  Open `http://localhost:3000`. Compare side-by-side with `docs/leca/wireframes/landing-page.html` opened in a browser. All sections should be present: Hero → Stats → Problem → Features → How It Works → Open Source → CTA → Footer.

- [ ] **Step 11: Commit**

  ```bash
  git add apps/web/src/components/landing/ apps/web/src/app/[language]/page.tsx
  git commit -m "feat(web): build LECA landing page (all sections from wireframe)"
  ```

---

## Phase 3 — Auth Screens

### Task 5: Restyle sign-in page

**Files:**
- Modify: `apps/web/src/app/[language]/sign-in/page-content.tsx`

Reference: `docs/leca/wireframes/ui-wireframes.html` Screen 09 (Registration, similar pattern).

- [ ] **Step 1: Wrap form in LECA card**

  The sign-in page currently renders the form bare. Wrap it in a centered warm card:

  ```tsx
  // In the Form() component, replace the outermost <div> wrapper with:
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '40px 20px',
  }}>
    <div style={{
      width: '100%', maxWidth: '400px',
      background: 'var(--s1)', border: '1px solid var(--border-h)',
      borderRadius: 'var(--r-lg)', padding: '40px 36px',
      boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'var(--fd)', fontSize: '24px', fontWeight: 800,
        letterSpacing: '-0.04em', color: 'var(--cream)', marginBottom: '8px',
      }}>
        L<span style={{ color: 'var(--amber)' }}>E</span>CA
      </div>
      {/* Heading */}
      <h1 style={{
        fontFamily: 'var(--fd)', fontSize: '22px', fontWeight: 700,
        color: 'var(--cream)', marginBottom: '4px',
      }}>
        {t('sign-in:title')}
      </h1>
      <p style={{
        fontFamily: 'var(--fm)', fontSize: '12px', color: 'var(--cream-m)',
        marginBottom: '28px',
      }}>
        {t('sign-in:subtitle')}
      </p>
      {/* Form fields */}
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormTextInput name="email" label={t('sign-in:inputs.email.label')} type="email" />
          <FormTextInput name="password" label={t('sign-in:inputs.password.label')} type="password" />
          <FormActions />
        </form>
      </FormProvider>
      {/* Links */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link href="/forgot-password" style={{
          fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--cream-m)',
        }}>
          {t('sign-in:actions.forgot-password')}
        </Link>
      </div>
      {IS_SIGN_UP_ENABLED && (
        <p style={{
          fontFamily: 'var(--fm)', fontSize: '11px', color: 'var(--cream-m)',
          marginTop: '16px', textAlign: 'center',
        }}>
          {t('sign-in:actions.dont-have-account')}{' '}
          <Link href="/sign-up" style={{ color: 'var(--amber)' }}>
            {t('sign-in:actions.sign-up')}
          </Link>
        </p>
      )}
      {(isGoogleAuthEnabled || isFacebookAuthEnabled) && (
        <div style={{ marginTop: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontFamily: 'var(--fm)', fontSize: '10px', color: 'var(--cream-m)', letterSpacing: '0.08em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
          <SocialAuth />
        </div>
      )}
    </div>
  </div>
  ```

- [ ] **Step 2: Verify sign-in page**

  Navigate to `http://localhost:3000/sign-in`. Expected: centered warm card, LECA logo, amber submit button (inherits from primary token), Bricolage heading.

- [ ] **Step 3: Commit**

  ```bash
  git add apps/web/src/app/[language]/sign-in/
  git commit -m "feat(web): restyle sign-in to LECA warm card layout"
  ```

---

### Task 6: Restyle sign-up, forgot-password, confirm-email, password-change

**Files:**
- Modify: `apps/web/src/app/[language]/sign-up/page-content.tsx`
- Modify: `apps/web/src/app/[language]/forgot-password/page-content.tsx`
- Modify: `apps/web/src/app/[language]/confirm-email/page-content.tsx`
- Modify: `apps/web/src/app/[language]/password-change/page-content.tsx`
- Modify: `apps/web/src/app/[language]/confirm-new-email/page-content.tsx`

Apply the same warm card wrapper pattern from Task 5 to each page. Each page follows the identical outer container and card shell — only the inner form fields, heading, and link text differ.

- [ ] **Step 1: Apply LECA card wrapper to sign-up**

  Same container + card structure as Task 5. Heading: `t('sign-up:title')`. Form: name, email, password fields.

- [ ] **Step 2: Apply LECA card wrapper to forgot-password**

  Single email field. Amber submit button. Link back to sign-in.

- [ ] **Step 3: Apply LECA card wrapper to confirm-email**

  Static message card — no form. Center the icon, heading, and body text within the warm card.

- [ ] **Step 4: Apply LECA card wrapper to password-change**

  Old password, new password, confirm fields.

- [ ] **Step 5: Apply LECA card wrapper to confirm-new-email**

  Static confirmation message.

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/app/[language]/sign-up/ \
          apps/web/src/app/[language]/forgot-password/ \
          apps/web/src/app/[language]/confirm-email/ \
          apps/web/src/app/[language]/password-change/ \
          apps/web/src/app/[language]/confirm-new-email/
  git commit -m "feat(web): restyle all auth screens to LECA warm card layout"
  ```

---

## Phase 4 — App Screens

### Task 7: Restyle profile page

**Files:**
- Modify: `apps/web/src/app/[language]/profile/` (all files in this directory)

Reference: `docs/leca/wireframes/ui-wireframes.html` Screen 13 (Settings & Privacy).

- [ ] **Step 1: Read the profile page structure**

  ```bash
  ls apps/web/src/app/[language]/profile/
  ```

  Read the main page-content file to understand existing sections.

- [ ] **Step 2: Apply Settings wireframe layout**

  Wrap sections in warm cards matching Screen 13's section-row pattern:
  - Section header: `--fd` font, `--cream-m` color, mono uppercase label
  - Each setting row: `border-bottom: 1px solid var(--border)`, `padding: 16px 0`
  - Destructive actions (delete account): `--red` color

- [ ] **Step 3: Verify profile page**

  Log in and navigate to `/profile`. Compare visually against wireframe Screen 13.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/app/[language]/profile/
  git commit -m "feat(web): restyle profile page to LECA settings layout (wireframe 13)"
  ```

---

### Task 8: Restyle admin panel

**Files:**
- Modify: `apps/web/src/app/[language]/admin-panel/` (all files)

Reference: `docs/leca/wireframes/ui-wireframes.html` Screen 15 (Self-Host Admin Dashboard).

- [ ] **Step 1: Read admin panel structure**

  ```bash
  ls apps/web/src/app/[language]/admin-panel/
  ```

- [ ] **Step 2: Apply admin wireframe styling**

  Screen 15 is desktop-first with a top bar, stat cards, and a user table.

  - Top bar: `--s1` background, amber accent, mono labels
  - Stat cards: `--s2` background, `--border-h` border, `--r-md` radius
  - Table rows: `border-bottom: 1px solid var(--border)`, hover `--s2` background
  - Role badge: `--amber-s` background, `--amber` color for ADMIN; `--green-s`/`--green` for USER

- [ ] **Step 3: Verify admin panel**

  Log in as admin, navigate to `/admin-panel`. Compare visually against wireframe Screen 15.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/app/[language]/admin-panel/
  git commit -m "feat(web): restyle admin panel to LECA admin dashboard (wireframe 15)"
  ```

---

## Final verification

- [ ] **Run TypeScript compiler**

  ```bash
  cd apps/web && pnpm tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Run E2E tests**

  ```bash
  cd apps/web && pnpm test:e2e
  ```

  Expected: all existing Playwright tests pass. If a test references a color or class that no longer exists, update the selector (do not skip the test).

- [ ] **Final commit and tag**

  ```bash
  git add -A
  git commit -m "feat(web): complete LECA UI system migration (all 4 phases)"
  ```
