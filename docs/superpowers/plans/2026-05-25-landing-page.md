# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the minimal home page with a rich landing page that showcases all n2base features for both developers and internal team members.

**Architecture:** Single server component at `apps/web/src/app/[language]/page.tsx`. Static content arrays defined at module scope (no fetching). Existing `Link` component used for internal routes; plain `<a>` tags for external links (Swagger, GitHub). Translation keys in the existing `home` namespace.

**Tech Stack:** Next.js 16 server component, Tailwind CSS, i18next (`getServerTranslation`), `@/components/link`, `NEXT_PUBLIC_API_URL` (existing) + `NEXT_PUBLIC_GITHUB_URL` (new).

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/example.env.local` | Add `NEXT_PUBLIC_GITHUB_URL` env var |
| Modify | `apps/web/src/services/i18n/locales/en/home.json` | EN translations for all new copy |
| Modify | `apps/web/src/services/i18n/locales/vi/home.json` | VI translations |
| Modify | `apps/web/src/services/i18n/locales/uk/home.json` | UK translations |
| Modify | `apps/web/src/app/[language]/page.tsx` | Full landing page implementation |

---

## Task 1: Add NEXT_PUBLIC_GITHUB_URL env variable

**Files:**
- Modify: `apps/web/example.env.local`

- [ ] **Step 1: Add the env var to example.env.local**

Open `apps/web/example.env.local`. Append at the end:

```
NEXT_PUBLIC_GITHUB_URL=https://github.com/your-org/n2base
```

Final file content:
```
# If you don't want to run the backend locally, just replace
# http://localhost:3001/api with https://nestjs-boilerplate-test.herokuapp.com/api
NEXT_PUBLIC_API_URL=http://localhost:3001/api

NEXT_PUBLIC_IS_GOOGLE_AUTH_ENABLED=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=778828327699-3hu034kj1u76k4o5qla8221ovtbgl2g0.apps.googleusercontent.com

NEXT_PUBLIC_IS_FACEBOOK_AUTH_ENABLED=true
NEXT_PUBLIC_FACEBOOK_APP_ID=738324374755195

NEXT_PUBLIC_IS_SIGN_UP_ENABLED=true

# Support "local", "s3", "s3-presigned"
NEXT_PUBLIC_FILE_DRIVER=local

NEXT_PUBLIC_GITHUB_URL=https://github.com/your-org/n2base
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/example.env.local
git commit -m "chore: add NEXT_PUBLIC_GITHUB_URL env var"
```

---

## Task 2: Add i18n translation keys

**Files:**
- Modify: `apps/web/src/services/i18n/locales/en/home.json`
- Modify: `apps/web/src/services/i18n/locales/vi/home.json`
- Modify: `apps/web/src/services/i18n/locales/uk/home.json`

- [ ] **Step 1: Update English translations**

Replace the full content of `apps/web/src/services/i18n/locales/en/home.json`:

```json
{
  "title": "n2base — Full-Stack Boilerplate",
  "description": "Welcome to the reactjs-boilerplate example app. Full documentation can be found <0>here</0>.",
  "nav": {
    "features": "Features",
    "stack": "Stack",
    "quickstart": "Quick Start",
    "signin": "Sign In"
  },
  "hero": {
    "badge": "Full-Stack Monorepo Boilerplate",
    "title": "Ship your product faster with n2base",
    "subtitle": "NestJS API + Next.js frontend — pre-wired with authentication, file uploads, i18n, Swagger, Docker, and CI. Both relational and document databases supported.",
    "cta-admin": "Open Admin Panel",
    "cta-docs": "View API Docs"
  },
  "features": {
    "label": "What's Included",
    "title": "Everything pre-wired",
    "subtitle": "No boilerplate hunting. The hard parts are already done.",
    "backend-title": "Backend — NestJS API",
    "frontend-title": "Frontend — Next.js"
  },
  "stack": {
    "label": "Tech Stack",
    "title": "Carefully chosen tools",
    "subtitle": "Modern, production-proven, and actively maintained."
  },
  "quickstart": {
    "label": "Quick Start",
    "title": "Up and running in minutes",
    "subtitle": "Clone, configure, and start developing.",
    "full-guide": "Full setup guide"
  }
}
```

- [ ] **Step 2: Update Vietnamese translations**

Replace the full content of `apps/web/src/services/i18n/locales/vi/home.json`:

```json
{
  "title": "n2base — Boilerplate Full-Stack",
  "description": "Chào mừng đến với ứng dụng mẫu reactjs-boilerplate. Tài liệu đầy đủ có thể được tìm thấy <0>tại đây</0>.",
  "nav": {
    "features": "Tính năng",
    "stack": "Công nghệ",
    "quickstart": "Bắt đầu nhanh",
    "signin": "Đăng nhập"
  },
  "hero": {
    "badge": "Boilerplate Monorepo Full-Stack",
    "title": "Xây dựng sản phẩm nhanh hơn với n2base",
    "subtitle": "NestJS API + Next.js frontend — được tích hợp sẵn xác thực, tải file, i18n, Swagger, Docker và CI. Hỗ trợ cả cơ sở dữ liệu quan hệ và tài liệu.",
    "cta-admin": "Mở Admin Panel",
    "cta-docs": "Xem tài liệu API"
  },
  "features": {
    "label": "Bao gồm gì",
    "title": "Tất cả đã được tích hợp",
    "subtitle": "Không cần tìm kiếm boilerplate. Những phần khó đã được thực hiện.",
    "backend-title": "Backend — NestJS API",
    "frontend-title": "Frontend — Next.js"
  },
  "stack": {
    "label": "Công nghệ sử dụng",
    "title": "Các công cụ được lựa chọn kỹ càng",
    "subtitle": "Hiện đại, đã được kiểm chứng trong môi trường sản xuất và được bảo trì tích cực."
  },
  "quickstart": {
    "label": "Bắt đầu nhanh",
    "title": "Chạy trong vài phút",
    "subtitle": "Clone, cấu hình và bắt đầu phát triển.",
    "full-guide": "Hướng dẫn đầy đủ"
  }
}
```

- [ ] **Step 3: Update Ukrainian translations**

Replace the full content of `apps/web/src/services/i18n/locales/uk/home.json`:

```json
{
  "title": "n2base — Full-Stack Бойлерплейт",
  "description": "Ласкаво просимо до прикладу додатку reactjs-boilerplate. Повну документацію можна знайти <0>тут</0>.",
  "nav": {
    "features": "Функції",
    "stack": "Стек",
    "quickstart": "Швидкий старт",
    "signin": "Увійти"
  },
  "hero": {
    "badge": "Full-Stack Monorepo Бойлерплейт",
    "title": "Запускайте продукт швидше з n2base",
    "subtitle": "NestJS API + Next.js frontend — вже налаштовані автентифікація, завантаження файлів, i18n, Swagger, Docker та CI. Підтримуються реляційні та документні бази даних.",
    "cta-admin": "Відкрити Admin Panel",
    "cta-docs": "Переглянути API Docs"
  },
  "features": {
    "label": "Що включено",
    "title": "Все налаштовано заздалегідь",
    "subtitle": "Не потрібно шукати бойлерплейт. Складні частини вже зроблені.",
    "backend-title": "Backend — NestJS API",
    "frontend-title": "Frontend — Next.js"
  },
  "stack": {
    "label": "Технологічний стек",
    "title": "Ретельно підібрані інструменти",
    "subtitle": "Сучасні, перевірені у виробництві та активно підтримувані."
  },
  "quickstart": {
    "label": "Швидкий старт",
    "title": "Запуск за кілька хвилин",
    "subtitle": "Клонуйте, налаштуйте та починайте розробку.",
    "full-guide": "Повний посібник"
  }
}
```

- [ ] **Step 4: Commit translations**

```bash
git add apps/web/src/services/i18n/locales/en/home.json \
        apps/web/src/services/i18n/locales/vi/home.json \
        apps/web/src/services/i18n/locales/uk/home.json
git commit -m "feat(web): add i18n keys for landing page"
```

---

## Task 3: Implement the landing page

**Files:**
- Modify: `apps/web/src/app/[language]/page.tsx`

- [ ] **Step 1: Replace page.tsx with the full landing page**

Replace the entire content of `apps/web/src/app/[language]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getServerTranslation } from '@/services/i18n';
import Link from '@/components/link';

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, 'home');
  return { title: t('title') };
}

type Feature = { label: string; sub?: string };

const BACKEND_FEATURES: Feature[] = [
  { label: 'JWT Auth + Refresh Tokens', sub: 'Passport, bcryptjs' },
  { label: 'Social Sign In', sub: 'Google, Facebook, Apple' },
  { label: 'Dual Database Support', sub: 'PostgreSQL/TypeORM + MongoDB/Mongoose' },
  { label: 'File Uploads', sub: 'Local driver + AWS S3 presigned URLs' },
  { label: 'Email via Nodemailer', sub: 'Handlebars templates' },
  { label: 'Swagger / OpenAPI docs' },
  { label: 'i18n (nestjs-i18n)' },
  { label: 'Admin + User roles' },
  { label: 'E2E + unit tests', sub: 'Jest + Supertest' },
  { label: 'Docker + GitHub Actions CI' },
];

const FRONTEND_FEATURES: Feature[] = [
  { label: 'Auth flows', sub: 'Sign in, sign up, reset password, confirm email' },
  { label: 'Admin Panel', sub: 'User CRUD, role management' },
  { label: 'shadcn/ui + Tailwind CSS', sub: 'Dark mode, design tokens' },
  { label: 'TanStack Query v5', sub: 'Server state, caching, mutations' },
  { label: 'React Hook Form + Zod validation' },
  { label: 'i18n (i18next)', sub: 'Multi-language, RTL ready' },
  { label: 'File Upload UI', sub: 'react-dropzone' },
  { label: 'Google OAuth UI' },
  { label: 'Playwright E2E + Storybook 10' },
];

const TECH_STACK: { title: string; pills: string[] }[] = [
  {
    title: 'Monorepo',
    pills: ['pnpm workspaces', 'Turborepo', 'hygen', 'Husky', 'Commitlint', 'Prettier'],
  },
  {
    title: 'Backend',
    pills: ['NestJS 11', 'TypeORM', 'Mongoose', 'Passport', 'class-validator', 'Docker'],
  },
  {
    title: 'Frontend',
    pills: ['Next.js 16', 'React 19', 'shadcn/ui', 'Tailwind CSS', 'TanStack Query', 'Storybook'],
  },
];

const HERO_BADGES = ['NestJS 11', 'Next.js 16', 'TypeScript', 'Turborepo', 'Docker'];

export default async function Home(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, 'home');

  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? '').replace('/api', '');
  const swaggerUrl = `${apiBase}/docs`;
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL ?? '';

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="text-base font-extrabold text-gray-900">
            n2<span className="text-indigo-500">base</span>
          </span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900">
              {t('nav.features')}
            </a>
            <a href="#stack" className="text-sm text-gray-500 hover:text-gray-900">
              {t('nav.stack')}
            </a>
            <a href="#quick-start" className="text-sm text-gray-500 hover:text-gray-900">
              {t('nav.quickstart')}
            </a>
            <Link
              href="/sign-in"
              className="rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-600"
            >
              {t('nav.signin')}
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-2 md:items-center">
            <div>
              <span className="mb-4 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                {t('hero.badge')}
              </span>
              <h1 className="mb-3 text-3xl font-extrabold leading-tight text-gray-900">
                {t('hero.title')}
              </h1>
              <p className="mb-6 text-sm leading-relaxed text-gray-500">
                {t('hero.subtitle')}
              </p>
              <div className="mb-5 flex flex-wrap gap-3">
                <Link
                  href="/admin-panel"
                  className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-600"
                >
                  {t('hero.cta-admin')} →
                </Link>
                <a
                  href={swaggerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
                >
                  {t('hero.cta-docs')}
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {HERO_BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Wireframe admin panel preview */}
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-md">
              <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex h-44 bg-gray-50">
                <div className="flex w-12 flex-col gap-2 bg-gray-900 p-2">
                  {[true, false, false, false, false].map((active, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded ${active ? 'bg-indigo-500' : 'bg-gray-700'}`}
                    />
                  ))}
                </div>
                <div className="flex-1 p-4">
                  <div className="mb-2 h-2 w-3/5 rounded bg-gray-200" />
                  <div className="mb-4 h-2 w-2/5 rounded bg-violet-200" />
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="rounded border border-gray-200 bg-white p-2">
                        <div className="mb-1 h-1.5 rounded bg-violet-200" />
                        <div className="h-1.5 w-3/4 rounded bg-gray-100" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded bg-gray-200" />
                  <div className="mt-2 h-1.5 w-4/5 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
              {t('features.label')}
            </p>
            <h2 className="mb-2 text-center text-2xl font-extrabold text-gray-900">
              {t('features.title')}
            </h2>
            <p className="mb-10 text-center text-sm text-gray-500">
              {t('features.subtitle')}
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Backend column */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
                <h3 className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 text-sm font-bold text-gray-900">
                  {t('features.backend-title')}
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                    apps/api
                  </span>
                </h3>
                {BACKEND_FEATURES.map((f) => (
                  <div key={f.label} className="mb-2.5 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-xs text-indigo-500">✓</span>
                    <div>
                      <span className="text-xs text-gray-700">{f.label}</span>
                      {f.sub && (
                        <div className="text-[10px] text-gray-400">{f.sub}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Frontend column */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
                <h3 className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 text-sm font-bold text-gray-900">
                  {t('features.frontend-title')}
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    apps/web
                  </span>
                </h3>
                {FRONTEND_FEATURES.map((f) => (
                  <div key={f.label} className="mb-2.5 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-xs text-green-600">✓</span>
                    <div>
                      <span className="text-xs text-gray-700">{f.label}</span>
                      {f.sub && (
                        <div className="text-[10px] text-gray-400">{f.sub}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section id="stack" className="px-6 pb-14">
          <div className="mx-auto max-w-6xl">
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
              {t('stack.label')}
            </p>
            <h2 className="mb-2 text-center text-2xl font-extrabold text-gray-900">
              {t('stack.title')}
            </h2>
            <p className="mb-8 text-center text-sm text-gray-500">
              {t('stack.subtitle')}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TECH_STACK.map((col) => (
                <div key={col.title} className="rounded-xl border border-gray-200 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                    {col.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {col.pills.map((pill) => (
                      <span
                        key={pill}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section id="quick-start" className="px-6 pb-14">
          <div className="mx-auto max-w-6xl rounded-xl bg-gray-900 p-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">
              {t('quickstart.label')}
            </p>
            <h2 className="mb-1 text-lg font-bold text-white">
              {t('quickstart.title')}
            </h2>
            <p className="mb-5 text-sm text-gray-400">{t('quickstart.subtitle')}</p>
            <pre className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-950 p-4 font-mono text-sm leading-relaxed text-gray-300">
              <code>{`# Clone and install\ngit clone ${githubUrl || '<repo-url>'}\ncd n2base && pnpm install\n\n# Copy env files and start\ncp apps/api/example.env apps/api/.env\npnpm dev`}</code>
            </pre>
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm text-blue-400 hover:underline"
              >
                {t('quickstart.full-guide')} →
              </a>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">
              n2<span className="text-indigo-500">base</span>
            </p>
            <p className="text-xs text-gray-400">NestJS + Next.js monorepo boilerplate</p>
          </div>
          <nav className="flex flex-wrap gap-5">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-indigo-500"
              >
                GitHub
              </a>
            )}
            <a
              href={swaggerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-indigo-500"
            >
              API Docs
            </a>
            <Link href="/admin-panel" className="text-xs text-gray-500 hover:text-indigo-500">
              Admin Panel
            </Link>
            <Link
              href="/privacy-policy"
              className="text-xs text-gray-500 hover:text-indigo-500"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript type-check**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors. If you see errors, they will be in the new `page.tsx` — fix them before continuing.

- [ ] **Step 3: Start the dev server and verify in browser**

```bash
pnpm dev
```

Open **http://localhost:3000** (or http://localhost:3000/en).

Check each section:
- Sticky navbar visible with Features / Stack / Quick Start / Sign In
- Hero shows split layout: left text + right wireframe preview
- "Open Admin Panel →" button routes correctly (may ask for sign-in)
- "View API Docs" link opens `http://localhost:3001/docs` in a new tab
- Anchor links (#features, #stack, #quick-start) scroll to correct sections
- Features grid shows two columns (Backend / Frontend) with checkmarks
- Tech stack shows 3 cards (Monorepo / Backend / Frontend)
- Quick start code block is visible and dark-themed
- Footer links are present

Also check Vietnamese at **http://localhost:3000/vi** — navbar and section headings should be translated.

- [ ] **Step 4: Commit the landing page**

```bash
git add apps/web/src/app/[language]/page.tsx
git commit -m "feat(web): implement landing page"
```

---

## Self-Review Notes

- All spec sections are covered: navbar ✓, hero split ✓, features grid ✓, tech stack ✓, quick start ✓, footer ✓
- `githubUrl` renders conditionally — if env var is empty, GitHub link is hidden (no broken `#` links)
- `swaggerUrl` derives from existing `NEXT_PUBLIC_API_URL` — no new env var needed for Swagger
- Translation keys are consistent between all 3 locale files and the `t()` calls in `page.tsx`
- Old `Trans` import removed — no longer needed
- `generateMetadata` preserved with updated title key
- `Link` component used for internal routes; plain `<a>` for external (Swagger, GitHub) to avoid language prefix on external URLs
