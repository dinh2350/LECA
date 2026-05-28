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
  {
    label: 'Dual Database Support',
    sub: 'PostgreSQL/TypeORM + MongoDB/Mongoose',
  },
  { label: 'File Uploads', sub: 'Local driver + AWS S3 presigned URLs' },
  { label: 'Email via Nodemailer', sub: 'Handlebars templates' },
  { label: 'Swagger / OpenAPI docs' },
  { label: 'i18n (nestjs-i18n)' },
  { label: 'Admin + User roles' },
  { label: 'E2E + unit tests', sub: 'Jest + Supertest' },
  { label: 'Docker + GitHub Actions CI' },
];

const FRONTEND_FEATURES: Feature[] = [
  {
    label: 'Auth flows',
    sub: 'Sign in, sign up, reset password, confirm email',
  },
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
    pills: [
      'pnpm workspaces',
      'Turborepo',
      'hygen',
      'Husky',
      'Commitlint',
      'Prettier',
    ],
  },
  {
    title: 'Backend',
    pills: [
      'NestJS 11',
      'TypeORM',
      'Mongoose',
      'Passport',
      'class-validator',
      'Docker',
    ],
  },
  {
    title: 'Frontend',
    pills: [
      'Next.js 16',
      'React 19',
      'shadcn/ui',
      'Tailwind CSS',
      'TanStack Query',
      'Storybook',
    ],
  },
];

const HERO_BADGES = [
  'NestJS 11',
  'Next.js 16',
  'TypeScript',
  'Turborepo',
  'Docker',
];

export default async function Home(props: Props) {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, 'home');

  // Only set when NEXT_PUBLIC_API_URL is defined; guards against /docs 404
  const swaggerUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')}/docs`
    : '';
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL ?? '';

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-2 md:items-center">
            <div>
              <span className="mb-4 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                {t('hero.badge')}
              </span>
              <h1 className="mb-3 text-3xl font-extrabold leading-tight text-[var(--color-foreground)]">
                {t('hero.title')}
              </h1>
              <p className="mb-6 text-sm leading-relaxed text-[var(--color-muted)]">
                {t('hero.subtitle')}
              </p>
              <div className="mb-5 flex flex-wrap gap-3">
                <Link
                  href="/admin-panel"
                  className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-black hover:bg-[var(--color-accent-hover)]"
                >
                  {t('hero.cta-admin')} →
                </Link>
                {swaggerUrl && (
                  <a
                    href={swaggerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-[var(--color-border)] px-5 py-2 text-sm font-medium text-[var(--color-foreground)] hover:border-[var(--color-accent)]"
                  >
                    {t('hero.cta-docs')}
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {HERO_BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Wireframe admin panel preview */}
            <div
              aria-hidden="true"
              className="overflow-hidden rounded-xl border border-[var(--color-border)] shadow-md"
            >
              <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex h-44 bg-[var(--color-surface)]">
                <div className="flex w-12 flex-col gap-2 bg-gray-900 p-2">
                  {[true, false, false, false, false].map((active, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded ${active ? 'bg-[var(--color-accent)]' : 'bg-gray-700'}`}
                    />
                  ))}
                </div>
                <div className="flex-1 p-4">
                  <div className="mb-2 h-2 w-3/5 rounded bg-[var(--color-border)]" />
                  <div className="mb-4 h-2 w-2/5 rounded bg-violet-200" />
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-bg)] p-2"
                      >
                        <div className="mb-1 h-1.5 rounded bg-violet-200" />
                        <div className="h-1.5 w-3/4 rounded bg-[var(--color-border)]" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded bg-[var(--color-border)]" />
                  <div className="mt-2 h-1.5 w-4/5 rounded bg-[var(--color-border)]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              {t('features.label')}
            </p>
            <h2 className="mb-2 text-center text-2xl font-extrabold text-[var(--color-foreground)]">
              {t('features.title')}
            </h2>
            <p className="mb-10 text-center text-sm text-[var(--color-muted)]">
              {t('features.subtitle')}
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Backend column */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
                <h3 className="mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-3 text-sm font-bold text-[var(--color-foreground)]">
                  {t('features.backend-title')}
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                    apps/api
                  </span>
                </h3>
                {BACKEND_FEATURES.map((f) => (
                  <div key={f.label} className="mb-2.5 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-xs text-[var(--color-accent)]">
                      ✓
                    </span>
                    <div>
                      <span className="text-xs text-[var(--color-foreground)]">
                        {f.label}
                      </span>
                      {f.sub && (
                        <div className="text-[10px] text-[var(--color-muted-foreground)]">
                          {f.sub}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Frontend column */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6">
                <h3 className="mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-3 text-sm font-bold text-[var(--color-foreground)]">
                  {t('features.frontend-title')}
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    apps/web
                  </span>
                </h3>
                {FRONTEND_FEATURES.map((f) => (
                  <div key={f.label} className="mb-2.5 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-xs text-[var(--color-accent)]">
                      ✓
                    </span>
                    <div>
                      <span className="text-xs text-[var(--color-foreground)]">
                        {f.label}
                      </span>
                      {f.sub && (
                        <div className="text-[10px] text-[var(--color-muted-foreground)]">
                          {f.sub}
                        </div>
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
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              {t('stack.label')}
            </p>
            <h2 className="mb-2 text-center text-2xl font-extrabold text-[var(--color-foreground)]">
              {t('stack.title')}
            </h2>
            <p className="mb-8 text-center text-sm text-[var(--color-muted)]">
              {t('stack.subtitle')}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TECH_STACK.map((col) => (
                <div
                  key={col.title}
                  className="rounded-xl border border-[var(--color-border)] p-5"
                >
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                    {col.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {col.pills.map((pill) => (
                      <span
                        key={pill}
                        className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-foreground)]"
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
            <p className="mb-5 text-sm text-gray-400">
              {t('quickstart.subtitle')}
            </p>
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
      <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--color-foreground)]">
              n2<span className="text-[var(--color-accent)]">base</span>
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              NestJS + Next.js monorepo boilerplate
            </p>
          </div>
          <nav className="flex flex-wrap gap-5">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
              >
                GitHub
              </a>
            )}
            {swaggerUrl && (
              <a
                href={swaggerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
              >
                API Docs
              </a>
            )}
            <Link
              href="/admin-panel"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
            >
              Admin Panel
            </Link>
            <Link
              href="/privacy-policy"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
