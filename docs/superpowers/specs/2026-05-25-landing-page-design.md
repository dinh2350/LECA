# Landing Page Design — n2base

**Date:** 2026-05-25
**Status:** Approved

---

## Overview

Replace the current minimal home page (`apps/web/src/app/[language]/page.tsx`) with a rich, single-scrollable landing page that showcases all project information and features. Serves both developers evaluating the boilerplate and internal team members needing a quick project reference.

---

## Goals

- Show all project features (backend + frontend) at a glance
- Link to the admin panel, Swagger API docs, and GitHub
- Provide a minimal quick-start teaser (single code block, not a full guide)
- Match the existing shadcn/Tailwind stack already in use

---

## Visual Style

- **Theme:** Modern SaaS Light — white background, indigo (`#6366f1`) accent, subtle gray borders
- **Layout:** Single scrollable page, no tabs, no sidebar
- **Typography:** System font stack, 800-weight headings
- **No dark mode toggling required** — follows the existing theme system already in the app

---

## Page Structure

### 1. Sticky Navbar

- Left: `n2base` wordmark (logo text)
- Center-right: anchor links — Features, Stack, Quick Start
- Far right: "Sign In" button (routes to `/sign-in`)
- Stays fixed at top on scroll

### 2. Hero (Split Layout)

- **Left column:**
  - Badge pill: "Full-Stack Monorepo Boilerplate"
  - H1: "Ship your product faster with n2base"
  - Subtitle: one to two sentences describing NestJS + Next.js, databases, and pre-wired features
  - Two CTAs:
    - Primary button: "Open Admin Panel →" → routes to `/admin-panel`
    - Secondary button: "View API Docs" → links to the Swagger endpoint
  - Tech badges row: NestJS 11, Next.js 16, TypeScript, Turborepo, Docker

- **Right column:**
  - Static wireframe mockup of the admin panel (no live iframe)
  - Rendered as plain HTML/CSS — no images required

### 3. Features Grid (anchor: `#features`)

- Section label: "What's Included"
- H2: "Everything pre-wired"
- Subtitle: "No boilerplate hunting. The hard parts are already done."
- Two equal columns:

  **Backend — NestJS API** (`apps/api`)
  - JWT Auth + Refresh Tokens (Passport, bcryptjs)
  - Social Sign In (Google, Facebook, Apple)
  - Dual Database Support (PostgreSQL/TypeORM + MongoDB/Mongoose)
  - File Uploads (local driver + AWS S3 presigned URLs)
  - Email via Nodemailer (Handlebars templates)
  - Swagger / OpenAPI docs
  - i18n (nestjs-i18n)
  - Admin + User roles
  - E2E + unit tests (Jest + Supertest)
  - Docker + GitHub Actions CI

  **Frontend — Next.js** (`apps/web`)
  - Auth flows (sign in, sign up, reset password, confirm email)
  - Admin Panel (user CRUD, role management)
  - shadcn/ui + Tailwind CSS (dark mode, design tokens)
  - TanStack Query v5 (server state, caching, mutations)
  - React Hook Form + Zod validation
  - i18n (i18next + react-i18next, multi-language)
  - File Upload UI (react-dropzone)
  - Google OAuth UI (@react-oauth/google)
  - Playwright E2E tests + Storybook 10

### 4. Tech Stack (anchor: `#stack`)

- Section label: "Tech Stack"
- H2: "Carefully chosen tools"
- Three-column card grid:
  - **Monorepo:** pnpm workspaces, Turborepo, hygen, Husky, Commitlint, Prettier
  - **Backend:** NestJS 11, TypeORM, Mongoose, Passport, class-validator, Docker
  - **Frontend:** Next.js 16, React 19, shadcn/ui, Tailwind CSS, TanStack Query, Storybook

### 5. Quick Start (anchor: `#quick-start`)

- Dark-themed code block (single block, not a full tutorial)
- Content:
  ```bash
  # Clone and install
  git clone $NEXT_PUBLIC_GITHUB_URL
  cd n2base && pnpm install

  # Copy env files and start
  cp apps/api/example.env apps/api/.env
  pnpm dev
  ```
- Note below: "Full setup guide →" links to `$NEXT_PUBLIC_GITHUB_URL` (GitHub README)

### 6. Footer

- Left: n2base wordmark + tagline ("NestJS + Next.js monorepo boilerplate")
- Right: links — GitHub, API Docs, Admin Panel, Privacy Policy

---

## Routing & Links

| Element | Destination |
|---|---|
| Sign In button (navbar) | `/sign-in` |
| Open Admin Panel (hero CTA) | `/admin-panel` |
| View API Docs (hero CTA) | Swagger URL (env-configured) |
| GitHub (footer) | External GitHub URL |
| API Docs (footer) | Swagger URL |
| Admin Panel (footer) | `/admin-panel` |
| Privacy Policy (footer) | `/privacy-policy` |

The Swagger URL and GitHub URL must be read from Next.js public environment variables:
- `NEXT_PUBLIC_API_URL` — base API URL (e.g. `http://localhost:3001`). Swagger is served at `$NEXT_PUBLIC_API_URL/docs`.
- `NEXT_PUBLIC_GITHUB_URL` — full GitHub repo URL. Add to `example.env.local` with a placeholder value.

---

## Implementation Scope

- **File to edit:** `apps/web/src/app/[language]/page.tsx` — replace current minimal content with new landing page. Keep the existing `generateMetadata` export, updating the title key as needed.
- **i18n:** Use existing `home` namespace. Add new translation keys for all new copy (title, subtitle, section headings, badge text). Keep existing keys.
- **No new dependencies** — use shadcn/ui components already installed, Tailwind utilities, and the existing `Link` component from `@/components/link`
- **No live app preview iframe** — the right-column hero preview is a static HTML/CSS wireframe
- **Accessibility:** All sections use semantic HTML (`nav`, `main`, `section`, `footer`). Navbar anchor links scroll to sections via `id` attributes.

---

## Out of Scope

- Dark mode variant (follows existing theme system)
- Animated transitions or scroll effects
- Testimonials, pricing, or changelog sections
- Fetching live data (user count, version, etc.)
