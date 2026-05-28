# Monorepo Migration Design: Turborepo + pnpm

**Date:** 2026-05-24
**Scope:** Migrate `nestjs-boilerplate/` and `extensive-react-boilerplate/` into a single Turborepo + pnpm monorepo

---

## Decisions

| Topic | Decision |
|---|---|
| Shared packages scope | Co-locate apps + shared tooling packages only (no shared business logic) |
| Prettier | Unified root config: `singleQuote: true, trailingComma: "all"` |
| CI/CD | Turborepo-aware unified CI with `--filter=[HEAD^1]` |
| Node version | Node 22 LTS, pnpm 9 |
| Approach | Minimal shared packages (Approach A) |

---

## Repository Structure

```
n2base/
├── .github/
│   └── workflows/
│       ├── ci.yml          # unified Turborepo-aware CI
│       └── e2e.yml         # E2E tests (Playwright + Docker), scoped by paths:
├── apps/
│   ├── api/                # nestjs-boilerplate (renamed/moved)
│   └── web/                # extensive-react-boilerplate (renamed/moved)
├── packages/
│   ├── eslint-config/      # @n2base/eslint-config — shared base ESLint rules
│   │   ├── package.json
│   │   └── index.js
│   └── tsconfig/           # @n2base/tsconfig — shared TypeScript configs
│       ├── package.json
│       ├── base.json
│       ├── nestjs.json     # extends base, adds decorators
│       └── nextjs.json     # extends base, adds JSX/bundler
├── .husky/                 # shared git hooks (replaces both per-app setups)
├── .prettierrc             # singleQuote: true, trailingComma: "all"
├── .gitignore
├── commitlint.config.js
├── turbo.json
├── pnpm-workspace.yaml
└── package.json            # private: true, engines: node >=22
```

---

## Turborepo Pipeline (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "cache": false
    }
  }
}
```

---

## Workspace Config

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Root `package.json`:**
```json
{
  "name": "n2base",
  "private": true,
  "engines": { "node": ">=22", "pnpm": ">=9" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "latest",
    "prettier": "^3",
    "@commitlint/cli": "^19",
    "@commitlint/config-conventional": "^19",
    "husky": "^9"
  }
}
```

---

## Shared Packages

### `packages/tsconfig/`

- **`base.json`** — strict TypeScript base: `target: ES2022`, `strict: true`, `skipLibCheck: true`, `esModuleInterop: true`
- **`nestjs.json`** — extends base, adds `experimentalDecorators: true`, `emitDecoratorMetadata: true` (no `outDir` — must be set in each app's own `tsconfig.json` since path resolution is relative to the file that declares it)
- **`nextjs.json`** — extends base, adds `lib: [dom, es2022]`, `jsx: preserve`, `moduleResolution: bundler`, `allowImportingTsExtensions: true`
- `package.json`: `name: @n2base/tsconfig`, `private: true`

### `packages/eslint-config/`

- **`index.js`** — exports shared rules: `no-console`, `no-unused-vars`, Prettier integration
- Each app's `eslint.config.mjs` imports this then layers app-specific rules on top:
  - `apps/api`: NestJS TypeScript rules, custom `configService` type-safety rule, "should" prefix test rule
  - `apps/web`: Next.js preset, MUI import rules, React Hook Form best-practice rules
- `package.json`: `name: @n2base/eslint-config`, `private: true`

---

## App Migrations

### `apps/api/` (NestJS — was `nestjs-boilerplate/`)

| Change | Detail |
|---|---|
| `package.json` name | `@n2base/api` |
| New workspace deps | `@n2base/tsconfig`, `@n2base/eslint-config` |
| `tsconfig.json` | extends `@n2base/tsconfig/nestjs.json` |
| `eslint.config.mjs` | extends `@n2base/eslint-config`, keeps NestJS-specific rules |
| Removed | `.husky/`, per-app `commitlint.config.js`, `prettier` devDep |
| Kept unchanged | `src/`, `.env.example`, Docker files, `.hygen/`, `migration:*` scripts, `seed:*` scripts, `generate:resource:*` scripts, release-it config |

### `apps/web/` (Next.js — was `extensive-react-boilerplate/`)

| Change | Detail |
|---|---|
| `package.json` name | `@n2base/web` |
| New workspace deps | `@n2base/tsconfig`, `@n2base/eslint-config` |
| `tsconfig.json` | extends `@n2base/tsconfig/nextjs.json` |
| `eslint.config.mjs` | extends `@n2base/eslint-config`, keeps Next.js + MUI rules |
| `.prettierrc` | removed — inherits root unified config |
| Removed | `.husky/`, per-app `commitlint.config.js`, `prettier` devDep |
| Kept unchanged | `src/`, `.env.example`, `.hygen/`, Storybook config, Playwright config, `generate:resource` and `generate:field` scripts, release-it config |

---

## CI/CD

### `.github/workflows/ci.yml` — Unified Turborepo CI

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-test-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build lint test --filter=[HEAD^1]
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

### `.github/workflows/e2e.yml` — E2E Tests

- **NestJS Docker E2E** job: triggered via `paths: apps/api/**` — consolidates former `docker-e2e.yml`
- **Playwright** job: triggered via `paths: apps/web/**` — consolidates former `e2e.yml`
- Both jobs are not cached (`cache: false` in turbo.json for `test:e2e`)

### Removed

- `nestjs-boilerplate/.github/workflows/cli.yml`
- `nestjs-boilerplate/.github/workflows/docker-e2e.yml`
- `extensive-react-boilerplate/.github/workflows/cli.yml`
- `extensive-react-boilerplate/.github/workflows/e2e.yml`

Hygen generator tests from both `cli.yml` files are folded into `ci.yml` as separate jobs scoped by `paths:` (one job for `apps/api/**`, one for `apps/web/**`).

---

## What Does NOT Change

- All application source code (`src/` in both apps)
- hygen templates and generators (`.hygen/` in each app)
- App-specific environment variable files (`.env.example`)
- Docker and docker-compose files
- Release-it configuration per app
- Storybook configuration (`apps/web`)
- Playwright configuration (`apps/web`)
- NestJS CLI configuration (`apps/api`)
- Database migration and seed scripts (`apps/api`)
