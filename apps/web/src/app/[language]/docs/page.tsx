import type { Metadata } from 'next';
import Link from '@/components/link';

export const metadata: Metadata = {
  title: 'Developer Docs — n2base',
  description:
    'Tech stack, modules, API endpoints, infrastructure, and quick-start guide for the n2base monorepo.',
};

/* ─── Data ─────────────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'stack', label: 'Tech Stack' },
  { id: 'structure', label: 'Structure' },
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'infra', label: 'Infrastructure' },
  { id: 'database', label: 'Database' },
  { id: 'auth', label: 'Auth' },
  { id: 'files', label: 'Files' },
  { id: 'email', label: 'Email' },
  { id: 'codegen', label: 'Code Gen' },
  { id: 'env', label: 'Env Vars' },
  { id: 'quickstart', label: 'Quick Start' },
];

const TECH_STACK = [
  {
    category: 'Monorepo',
    color: 'indigo',
    items: [
      ['Package manager', 'pnpm 11'],
      ['Orchestration', 'Turborepo v2'],
      ['Language', 'TypeScript 5.9'],
      ['Node', 'v22+'],
      ['Scaffolding', 'Hygen'],
      ['Git hooks', 'Husky + Commitlint'],
      ['Formatting', 'Prettier v3'],
      ['Releases', 'release-it'],
    ],
  },
  {
    category: 'Backend',
    color: 'violet',
    items: [
      ['Framework', 'NestJS 11 + Express'],
      ['ORM (relational)', 'Prisma v6'],
      ['ODM (document)', 'Mongoose 9'],
      ['Database (rel)', 'PostgreSQL 17'],
      ['Database (doc)', 'MongoDB'],
      ['Auth', 'Passport.js + JWT'],
      ['Validation', 'class-validator'],
      ['API Docs', '@nestjs/swagger'],
      ['i18n', 'nestjs-i18n'],
      ['Testing', 'Jest + Supertest'],
    ],
  },
  {
    category: 'Frontend',
    color: 'emerald',
    items: [
      ['Framework', 'Next.js 16 (React 19)'],
      ['Styling', 'Tailwind CSS v4'],
      ['Components', 'shadcn/ui + Radix UI'],
      ['Icons', 'Lucide React'],
      ['Forms', 'React Hook Form v7'],
      ['Validation', 'Zod v4'],
      ['Data fetching', 'TanStack Query v5'],
      ['i18n', 'i18next + react-i18next'],
      ['Rich text', 'Tiptap v3'],
      ['E2E tests', 'Playwright'],
      ['Components dev', 'Storybook v10'],
    ],
  },
];

const BACKEND_MODULES = [
  ['AppModule', 'app.module.ts', 'Root — wires all modules'],
  ['AuthModule', 'auth/', 'JWT auth, registration, login, password reset'],
  ['AuthGoogleModule', 'auth-google/', 'Google OAuth2'],
  ['AuthFacebookModule', 'auth-facebook/', 'Facebook OAuth'],
  ['AuthAppleModule', 'auth-apple/', 'Apple Sign-In'],
  ['UsersModule', 'users/', 'User CRUD, profile management'],
  ['FilesModule', 'files/', 'File upload — local / S3 / S3-presigned'],
  ['MailModule', 'mail/', 'Transactional emails via Nodemailer'],
  ['SessionModule', 'session/', 'JWT refresh session management'],
  ['RolesModule', 'roles/', 'Role seeds and lookups'],
  ['StatusesModule', 'statuses/', 'Status seeds and lookups'],
  ['HomeModule', 'home/', 'GET / health check'],
  ['DatabaseModule', 'database/', 'Prisma / Mongoose init + seeds'],
];

const AUTH_ENDPOINTS = [
  ['POST', '/api/v1/auth/email/register', 'Register with email'],
  ['POST', '/api/v1/auth/email/login', 'Login with email'],
  ['POST', '/api/v1/auth/google/login', 'Google OAuth login'],
  ['POST', '/api/v1/auth/facebook/login', 'Facebook OAuth login'],
  ['POST', '/api/v1/auth/apple/login', 'Apple Sign-In'],
  ['POST', '/api/v1/auth/refresh', 'Refresh access token'],
  ['POST', '/api/v1/auth/forgot/password', 'Request password reset'],
  ['POST', '/api/v1/auth/reset/password', 'Reset password'],
  ['POST', '/api/v1/auth/email/confirm', 'Confirm email address'],
  ['GET', '/api/v1/auth/me', 'Get current user profile'],
  ['PATCH', '/api/v1/auth/me', 'Update own profile'],
  ['POST', '/api/v1/auth/logout', 'Logout — invalidate session'],
];

const USER_ENDPOINTS = [
  ['GET', '/api/v1/users', 'List users (admin)'],
  ['GET', '/api/v1/users/:id', 'Get user by ID'],
  ['PATCH', '/api/v1/users/:id', 'Update user'],
  ['DELETE', '/api/v1/users/:id', 'Soft-delete user'],
];

const FILE_ENDPOINTS = [
  ['POST', '/api/v1/files/upload', 'Upload a file'],
  ['GET', '/api/v1/files', 'List files with metadata'],
  ['DELETE', '/api/v1/files/:id', 'Delete a file'],
];

const FRONTEND_PAGES = [
  ['/', 'Home', 'No', 'Landing + developer overview'],
  ['/sign-in', 'Sign In', 'No', 'Email + social login'],
  ['/sign-up', 'Sign Up', 'No', 'Registration form'],
  ['/forgot-password', 'Forgot Password', 'No', 'Send reset email'],
  ['/confirm-email', 'Confirm Email', 'No', 'Token confirmation'],
  [
    '/confirm-new-email',
    'Confirm New Email',
    'No',
    'Email change confirmation',
  ],
  ['/password-change', 'Password Change', 'Yes', 'Change own password'],
  ['/profile', 'Profile', 'Yes', 'View profile'],
  ['/profile/edit', 'Edit Profile', 'Yes', 'Update name, photo, email'],
  ['/privacy-policy', 'Privacy Policy', 'No', 'Legal page'],
  ['/admin-panel', 'Admin Dashboard', 'Admin', 'Overview stats'],
  ['/admin-panel/users', 'User Management', 'Admin', 'User list + CRUD'],
  ['/admin-panel/files', 'File Management', 'Admin', 'File list + delete'],
  ['/admin-panel/email', 'Email Preview', 'Admin', 'React Email templates'],
  ['/docs', 'Developer Docs', 'No', 'This page'],
];

const DOCKER_SERVICES = [
  ['postgres', 'postgres:17.9', '5432', 'Primary database'],
  ['maildev', 'maildev', '1080 (UI) / 1025 (SMTP)', 'Email testing'],
  ['adminer', 'adminer', '8080', 'Database GUI'],
  ['api', 'Custom Dockerfile', 'APP_PORT', 'NestJS API'],
];

const DB_MODELS = [
  [
    'User',
    'id, email, password, provider, socialId, firstName, lastName, photoId, roleId, statusId, deletedAt',
    'photo→File, role→Role, status→Status',
  ],
  ['File', 'id, path, name, size, mimeType, createdAt', 'users→User[]'],
  ['Role', 'id, name', 'users→User[]'],
  ['Status', 'id, name', 'users→User[]'],
  ['Session', 'id, userId, hash, createdAt, updatedAt, deletedAt', '—'],
];

const FILE_DRIVERS = [
  ['local', 'Default', 'Stored on server disk, served via /api/v1/files/:path'],
  [
    's3',
    'ACCESS_KEY_ID, SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_S3_REGION',
    'Upload via API → forwarded to S3',
  ],
  [
    's3-presigned',
    'Same as s3',
    'Frontend uploads directly to S3 via presigned URL',
  ],
];

const API_ENV = [
  ['NODE_ENV', 'development / production'],
  ['APP_PORT', 'API port (default 3001)'],
  ['APP_NAME', 'Application name'],
  ['API_PREFIX', 'URL prefix (default api)'],
  ['DATABASE_TYPE', 'postgres or document'],
  ['DATABASE_HOST', 'DB hostname'],
  ['DATABASE_PORT', 'DB port'],
  ['DATABASE_USERNAME', 'DB user'],
  ['DATABASE_PASSWORD', 'DB password'],
  ['DATABASE_NAME', 'DB name'],
  ['AUTH_JWT_SECRET', 'JWT access token secret'],
  ['AUTH_JWT_TOKEN_EXPIRES_IN', 'Access token TTL (default 15m)'],
  ['AUTH_REFRESH_SECRET', 'JWT refresh token secret'],
  ['AUTH_REFRESH_TOKEN_EXPIRES_IN', 'Refresh token TTL (default 3650d)'],
  ['AUTH_FORGOT_SECRET', 'Password reset token secret'],
  ['AUTH_CONFIRM_EMAIL_SECRET', 'Email confirm token secret'],
  ['GOOGLE_CLIENT_ID', 'Google OAuth client ID'],
  ['GOOGLE_CLIENT_SECRET', 'Google OAuth client secret'],
  ['FACEBOOK_APP_ID', 'Facebook app ID'],
  ['FACEBOOK_APP_SECRET', 'Facebook app secret'],
  ['APPLE_APP_AUDIENCE', 'Apple app audience'],
  ['FILE_DRIVER', 'local / s3 / s3-presigned'],
  ['ACCESS_KEY_ID', 'AWS access key'],
  ['SECRET_ACCESS_KEY', 'AWS secret key'],
  ['AWS_S3_BUCKET', 'S3 bucket name'],
  ['AWS_S3_REGION', 'S3 region'],
  ['MAIL_HOST', 'SMTP host'],
  ['MAIL_PORT', 'SMTP port'],
  ['MAIL_USER', 'SMTP user'],
  ['MAIL_PASSWORD', 'SMTP password'],
  ['MAIL_DEFAULT_EMAIL', 'Sender email'],
];

const WEB_ENV = [
  ['NEXT_PUBLIC_API_URL', 'API base URL (default http://localhost:3001/api)'],
  ['NEXT_PUBLIC_IS_GOOGLE_AUTH_ENABLED', 'Show Google login button'],
  ['NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'Google OAuth client ID'],
  ['NEXT_PUBLIC_IS_FACEBOOK_AUTH_ENABLED', 'Show Facebook login button'],
  ['NEXT_PUBLIC_FACEBOOK_APP_ID', 'Facebook app ID'],
  ['NEXT_PUBLIC_IS_SIGN_UP_ENABLED', 'Show / hide sign-up page'],
  ['NEXT_PUBLIC_FILE_DRIVER', 'local / s3 / s3-presigned'],
  ['NEXT_PUBLIC_GITHUB_URL', 'GitHub repo link (shown in footer)'],
];

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const METHOD_COLOR: Record<string, string> = {
  GET: 'text-emerald-500',
  POST: 'text-blue-500',
  PATCH: 'text-amber-500',
  DELETE: 'text-red-500',
};

function SectionHeader({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-5 flex scroll-mt-20 items-center gap-3 text-base font-bold text-[var(--color-foreground)]"
    >
      <span className="font-mono text-[var(--color-accent)]">#</span>
      {children}
    </h2>
  );
}

function Table({
  head,
  rows,
  mono = [],
}: {
  head: string[];
  rows: string[][];
  mono?: number[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left font-semibold text-[var(--color-muted-foreground)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-surface)]"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2.5 text-[var(--color-foreground)] ${mono.includes(j) ? 'font-mono text-[11px]' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointsTable({ rows }: { rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            {['Method', 'Path', 'Description'].map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left font-semibold text-[var(--color-muted-foreground)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([method, path, desc], i) => (
            <tr
              key={i}
              className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-surface)]"
            >
              <td className="px-4 py-2.5">
                <span
                  className={`font-mono font-bold ${METHOD_COLOR[method] ?? 'text-[var(--color-foreground)]'}`}
                >
                  {method}
                </span>
              </td>
              <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--color-foreground)]">
                {path}
              </td>
              <td className="px-4 py-2.5 text-[var(--color-muted)]">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-950 p-4 font-mono text-[11px] leading-relaxed text-gray-300">
      <code>{children}</code>
    </pre>
  );
}

function Pill({
  children,
  color = 'default',
}: {
  children: React.ReactNode;
  color?: 'default' | 'green' | 'red' | 'amber';
}) {
  const cls = {
    default:
      'bg-[var(--color-surface)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
  }[color];
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Sticky TOC bar */}
      <div className="sticky top-14 z-30 hidden overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] md:block">
        <nav className="mx-auto flex max-w-6xl gap-1 px-6 py-1.5">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-foreground)] whitespace-nowrap"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-14">
        {/* Hero */}
        <div>
          <span className="mb-3 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            Developer Reference
          </span>
          <h1 className="mb-2 font-mono text-3xl font-extrabold text-[var(--color-foreground)]">
            n2<span className="text-[var(--color-accent)]">base</span> — docs
          </h1>
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Full-stack NestJS + Next.js monorepo boilerplate. Everything below
            is already implemented and wired up.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin-panel"
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-black hover:bg-[var(--color-accent-hover)]"
            >
              Admin Panel →
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '')}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-foreground)] hover:border-[var(--color-accent)]"
            >
              Swagger API Docs
            </a>
          </div>
        </div>

        {/* Tech Stack */}
        <section id="stack">
          <SectionHeader id="stack">Tech Stack</SectionHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {TECH_STACK.map(({ category, items }) => (
              <div
                key={category}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                  {category}
                </p>
                <div className="space-y-1.5">
                  {(items as string[][]).map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-start justify-between gap-2"
                    >
                      <span className="text-xs text-[var(--color-muted)]">
                        {label}
                      </span>
                      <span className="text-right text-xs font-medium text-[var(--color-foreground)]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Project Structure */}
        <section id="structure">
          <SectionHeader id="structure">Project Structure</SectionHeader>
          <CodeBlock>{`n2base/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/                # Source modules
│   │   ├── prisma/             # Schema + migrations
│   │   └── docker-compose.yaml
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/[language]/ # Route pages
│           ├── components/     # UI components
│           └── services/       # API, auth, i18n, hooks
├── packages/
│   ├── schemas/                # Shared Zod schemas
│   ├── tsconfig/               # Shared TS config
│   └── eslint-config/          # Shared ESLint rules
├── turbo.json                  # Turborepo pipeline
└── pnpm-workspace.yaml`}</CodeBlock>
        </section>

        {/* Backend */}
        <section id="backend">
          <SectionHeader id="backend">Backend — NestJS API</SectionHeader>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
            <span>
              Port:{' '}
              <code className="font-mono text-[var(--color-foreground)]">
                3001
              </code>
            </span>
            <span>·</span>
            <span>
              Prefix:{' '}
              <code className="font-mono text-[var(--color-foreground)]">
                /api
              </code>
            </span>
            <span>·</span>
            <span>
              Swagger:{' '}
              <code className="font-mono text-[var(--color-foreground)]">
                /api/docs
              </code>
            </span>
            <span>·</span>
            <span>
              DB switch:{' '}
              <code className="font-mono text-[var(--color-foreground)]">
                DATABASE_TYPE=postgres|document
              </code>
            </span>
          </div>
          <Table
            head={['Module', 'Path', 'Responsibility']}
            rows={BACKEND_MODULES}
            mono={[1]}
          />
          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold text-[var(--color-foreground)]">
              Auth endpoints
            </p>
            <EndpointsTable rows={AUTH_ENDPOINTS} />
            <p className="text-xs font-semibold text-[var(--color-foreground)]">
              User endpoints
            </p>
            <EndpointsTable rows={USER_ENDPOINTS} />
            <p className="text-xs font-semibold text-[var(--color-foreground)]">
              File endpoints
            </p>
            <EndpointsTable rows={FILE_ENDPOINTS} />
          </div>
        </section>

        {/* Frontend */}
        <section id="frontend">
          <SectionHeader id="frontend">Frontend — Next.js</SectionHeader>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
            <span>
              Port:{' '}
              <code className="font-mono text-[var(--color-foreground)]">
                3000
              </code>
            </span>
            <span>·</span>
            <span>
              Router:{' '}
              <code className="font-mono text-[var(--color-foreground)]">
                App Router
              </code>
            </span>
            <span>·</span>
            <span>
              Routes under:{' '}
              <code className="font-mono text-[var(--color-foreground)]">
                app/[language]/
              </code>
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  {['Route', 'Page', 'Auth', 'Description'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left font-semibold text-[var(--color-muted-foreground)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FRONTEND_PAGES.map(([route, page, auth, desc], i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-surface)]"
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--color-foreground)]">
                      {route}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-foreground)]">
                      {page}
                    </td>
                    <td className="px-4 py-2.5">
                      {auth === 'No' ? (
                        <Pill color="green">Public</Pill>
                      ) : auth === 'Admin' ? (
                        <Pill color="amber">Admin</Pill>
                      ) : (
                        <Pill color="default">Auth</Pill>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-muted)]">
                      {desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="mb-3 text-xs font-bold text-[var(--color-foreground)]">
              Component & service structure
            </p>
            <CodeBlock>{`src/
├── components/
│   ├── form/           # FormInput, FormSelect, FormTextArea…
│   ├── ui/             # Button, Card, Dialog, Badge… (shadcn)
│   ├── table/          # DataTable with sort + pagination
│   ├── confirm-dialog/ # Reusable confirmation modal
│   ├── theme/          # ThemeProvider
│   └── app-bar.tsx     # Top navigation
└── services/
    ├── api/            # useFetch — authenticated fetch + token refresh
    ├── auth/           # Auth hooks & helpers
    ├── react-query/    # TanStack Query hooks per resource
    ├── social-auth/    # Google / Facebook OAuth handlers
    ├── i18n/           # i18next setup + locale files (en / uk / vi)
    ├── helpers/        # Misc utilities
    └── leave-page/     # Unsaved changes guard`}</CodeBlock>
          </div>
        </section>

        {/* Infrastructure */}
        <section id="infra">
          <SectionHeader id="infra">Infrastructure</SectionHeader>
          <p className="mb-3 text-xs font-semibold text-[var(--color-foreground)]">
            Docker services —{' '}
            <code className="font-mono">apps/api/docker-compose.yaml</code>
          </p>
          <Table
            head={['Service', 'Image', 'Port', 'Purpose']}
            rows={DOCKER_SERVICES}
          />
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-[var(--color-foreground)]">
              CI/CD —{' '}
              <code className="font-mono">.github/workflows/ci.yml</code>
            </p>
            <div className="space-y-2">
              {[
                [
                  'build-test-lint',
                  'Push / PR',
                  'Build, lint, and test all affected packages',
                ],
                [
                  'test-generators-api',
                  'Push / PR',
                  'Run Hygen API generators (relational + document)',
                ],
                [
                  'test-generators-web',
                  'Push / PR',
                  'Run Hygen web resource + field generators',
                ],
              ].map(([job, trigger, desc]) => (
                <div
                  key={job}
                  className="flex items-start gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-3"
                >
                  <code className="font-mono text-[11px] text-[var(--color-accent)] shrink-0">
                    {job}
                  </code>
                  <Pill>{trigger}</Pill>
                  <span className="text-xs text-[var(--color-muted)]">
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-[var(--color-foreground)]">
              Useful local URLs
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                ['http://localhost:3000', 'Web frontend'],
                ['http://localhost:3001/api/docs', 'Swagger API docs'],
                ['http://localhost:8080', 'Adminer — database GUI'],
                ['http://localhost:1080', 'MailDev — email testing'],
              ].map(([url, desc]) => (
                <div
                  key={url}
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-2.5"
                >
                  <code className="font-mono text-[11px] text-[var(--color-accent)]">
                    {url}
                  </code>
                  <span className="text-xs text-[var(--color-muted)]">
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Database */}
        <section id="database">
          <SectionHeader id="database">Database Schema</SectionHeader>
          <div className="mb-4 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
            <span>
              ORM:{' '}
              <code className="font-mono text-[var(--color-foreground)]">
                Prisma v6
              </code>
            </span>
            <span>·</span>
            <span>
              Schema:{' '}
              <code className="font-mono text-[var(--color-foreground)]">
                apps/api/prisma/schema.prisma
              </code>
            </span>
            <span>·</span>
            <span>
              Soft deletes on User + Session via{' '}
              <code className="font-mono text-[var(--color-foreground)]">
                deletedAt
              </code>
            </span>
          </div>
          <Table
            head={['Model', 'Key Fields', 'Relations']}
            rows={DB_MODELS}
            mono={[0]}
          />
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-[var(--color-foreground)]">
              Migration commands
            </p>
            <CodeBlock>{`npm run migration:generate -- --name="description"
npm run migration:run
npm run migration:revert
npm run schema:drop

# Seeding
npm run seed:run:relational    # PostgreSQL
npm run seed:run:document      # MongoDB`}</CodeBlock>
          </div>
        </section>

        {/* Auth */}
        <section id="auth">
          <SectionHeader id="auth">
            Authentication & Authorization
          </SectionHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="mb-3 text-xs font-bold text-[var(--color-foreground)]">
                Token strategy
              </p>
              <div className="space-y-2">
                {[
                  [
                    'Access token',
                    'JWT',
                    '15 min',
                    'Sent in Authorization header',
                  ],
                  [
                    'Refresh token',
                    'JWT',
                    '3650 days',
                    'Stored in session table; invalidated on logout',
                  ],
                  [
                    'Reset token',
                    'JWT',
                    '30 min',
                    'Sent by email for password reset',
                  ],
                  ['Confirm email', 'JWT', '1 day', 'Sent on registration'],
                ].map(([name, type, ttl, note]) => (
                  <div key={name} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-foreground)]">
                        {name}
                      </span>
                      <Pill>{type}</Pill>
                      <code className="font-mono text-[var(--color-accent)]">
                        {ttl}
                      </code>
                    </div>
                    <p className="ml-0 mt-0.5 text-[var(--color-muted)]">
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="mb-3 text-xs font-bold text-[var(--color-foreground)]">
                Passport strategies
              </p>
              <div className="space-y-1.5">
                {[
                  ['jwt', 'auth/', 'Access token validation'],
                  ['jwt-refresh', 'auth/', 'Refresh token rotation'],
                  ['google', 'auth-google/', 'Google OAuth2'],
                  ['facebook', 'auth-facebook/', 'Facebook OAuth'],
                  ['apple', 'auth-apple/', 'Apple Sign-In'],
                ].map(([strategy, module, desc]) => (
                  <div
                    key={strategy}
                    className="flex items-center gap-2 text-xs"
                  >
                    <code className="w-24 shrink-0 font-mono text-[var(--color-accent)]">
                      {strategy}
                    </code>
                    <code className="font-mono text-[10px] text-[var(--color-muted-foreground)]">
                      {module}
                    </code>
                    <span className="text-[var(--color-muted)]">{desc}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-xs font-bold text-[var(--color-foreground)]">
                  Roles & statuses
                </p>
                <div className="flex gap-2">
                  <Pill color="amber">1 — Admin</Pill>
                  <Pill>2 — User</Pill>
                </div>
                <div className="flex gap-2 pt-1">
                  <Pill color="green">1 — Active</Pill>
                  <Pill color="red">2 — Inactive</Pill>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Files */}
        <section id="files">
          <SectionHeader id="files">File Uploads</SectionHeader>
          <p className="mb-3 text-xs text-[var(--color-muted)]">
            Switched via{' '}
            <code className="font-mono text-[var(--color-foreground)]">
              FILE_DRIVER
            </code>{' '}
            (API) and{' '}
            <code className="font-mono text-[var(--color-foreground)]">
              NEXT_PUBLIC_FILE_DRIVER
            </code>{' '}
            (Web).
          </p>
          <Table
            head={['Driver', 'Required env vars', 'How it works']}
            rows={FILE_DRIVERS}
            mono={[0]}
          />
          <p className="mt-3 text-[10px] text-[var(--color-muted)]">
            Implementation:{' '}
            <code className="font-mono">
              apps/api/src/files/infrastructure/uploader/&#123;local,s3,s3-presigned&#125;/
            </code>
          </p>
        </section>

        {/* Email */}
        <section id="email">
          <SectionHeader id="email">Email System</SectionHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="mb-3 text-xs font-bold text-[var(--color-foreground)]">
                Stack
              </p>
              <div className="space-y-1.5 text-xs">
                {[
                  ['Transport', 'Nodemailer (SMTP)'],
                  ['Templates', 'React Email v6'],
                  ['Dev server', 'MailDev — port 1080 UI / 1025 SMTP'],
                  ['Template dir', 'apps/api/src/email/'],
                  ['Mail service', 'apps/api/src/mail/'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="w-28 shrink-0 text-[var(--color-muted)]">
                      {k}
                    </span>
                    <span className="text-[var(--color-foreground)]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="mb-3 text-xs font-bold text-[var(--color-foreground)]">
                Emails sent automatically
              </p>
              <div className="space-y-1.5">
                {[
                  'Email confirmation on registration',
                  'Password reset link',
                  'New email address confirmation',
                ].map((e) => (
                  <div key={e} className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--color-accent)]">✓</span>
                    <span className="text-[var(--color-foreground)]">{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Code Generation */}
        <section id="codegen">
          <SectionHeader id="codegen">Code Generation (Hygen)</SectionHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--color-foreground)]">
                API generators
              </p>
              <CodeBlock>{`cd apps/api

# New entity (relational)
npm run generate:resource:relational

# New entity (document / MongoDB)
npm run generate:resource:document

# Add field to existing entity
npm run add:property:to-relational
npm run add:property:to-document`}</CodeBlock>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--color-foreground)]">
                Web generators
              </p>
              <CodeBlock>{`cd apps/web

# New resource (pages + React Query hooks + Zod schema)
npm run generate:resource

# Add form field to existing resource
npm run generate:field`}</CodeBlock>
            </div>
          </div>
        </section>

        {/* Env Vars */}
        <section id="env">
          <SectionHeader id="env">Environment Variables</SectionHeader>
          <p className="mb-3 text-xs font-semibold text-[var(--color-foreground)]">
            API —{' '}
            <code className="font-mono">apps/api/env-example-relational</code>
          </p>
          <Table head={['Variable', 'Description']} rows={API_ENV} mono={[0]} />
          <p className="mt-5 mb-3 text-xs font-semibold text-[var(--color-foreground)]">
            Web — <code className="font-mono">apps/web/example.env.local</code>
          </p>
          <Table head={['Variable', 'Description']} rows={WEB_ENV} mono={[0]} />
        </section>

        {/* Quick Start */}
        <section id="quickstart">
          <SectionHeader id="quickstart">Quick Start</SectionHeader>
          <div className="rounded-xl bg-gray-900 p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">
              First-time setup
            </p>
            <CodeBlock>{`# Install dependencies
pnpm install

# Copy env files
cp apps/api/env-example-relational apps/api/.env
cp apps/web/example.env.local apps/web/.env.local

# Start Postgres + MailDev
docker compose -f apps/api/docker-compose.yaml up -d postgres maildev

# Run migrations and seed
cd apps/api && npm run migration:run && npm run seed:run:relational

# Start everything
pnpm run dev`}</CodeBlock>
            <p className="mt-5 mb-2 text-xs font-bold text-blue-400">
              Daily development
            </p>
            <CodeBlock>{`pnpm run dev              # Both API (:3001) and Web (:3000) in watch mode
pnpm run build            # Build all packages
pnpm run test             # Run all unit tests
pnpm run lint             # Lint all packages`}</CodeBlock>
            <p className="mt-5 mb-2 text-xs font-bold text-blue-400">
              Commit convention
            </p>
            <CodeBlock>{`feat(scope): description
fix(scope): description
refactor(scope): description
docs(scope): description
# Husky enforces this on every commit via commitlint`}</CodeBlock>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            n2<span className="font-bold text-[var(--color-accent)]">base</span>{' '}
            — NestJS + Next.js monorepo boilerplate
          </p>
          <div className="flex gap-4">
            <Link
              href="/"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
            >
              Home
            </Link>
            <Link
              href="/admin-panel"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
