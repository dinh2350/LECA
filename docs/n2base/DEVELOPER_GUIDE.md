# N2Base — Developer Guide

Quick reference for everything implemented in this project.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Backend (API)](#4-backend-api)
5. [Frontend (Web)](#5-frontend-web)
6. [Shared Packages](#6-shared-packages)
7. [Infrastructure](#7-infrastructure)
8. [Database Schema](#8-database-schema)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [File Uploads](#10-file-uploads)
11. [Email System](#11-email-system)
12. [Internationalization](#12-internationalization)
13. [Code Generation (Hygen)](#13-code-generation-hygen)
14. [Environment Variables](#14-environment-variables)
15. [Development Workflow](#15-development-workflow)

---

## 1. Project Overview

**n2base** is a production-ready full-stack monorepo boilerplate for building scalable SaaS applications. It supports both relational (PostgreSQL) and document (MongoDB) databases and ships with auth, file upload, email, i18n, and an admin panel out of the box.

| Attribute | Value |
|-----------|-------|
| Monorepo tool | Turborepo v2 |
| Package manager | pnpm 11.2.2 |
| Language | TypeScript 5.9.3 |
| Node version | v22+ |

---

## 2. Tech Stack

### Backend
| Category | Technology |
|----------|-----------|
| Framework | NestJS 11 + Express |
| ORM (relational) | Prisma v6 + TypeORM |
| ODM (document) | Mongoose 9 + @nestjs/mongoose |
| Database (relational) | PostgreSQL 17 |
| Database (document) | MongoDB |
| Auth | Passport.js + JWT |
| Validation | class-validator + class-transformer |
| API Docs | Swagger / OpenAPI (@nestjs/swagger) |
| Email | Nodemailer + React Email |
| i18n | nestjs-i18n |
| Testing | Jest + Supertest |

### Frontend
| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (React 19) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn + Radix UI |
| Icons | Lucide React |
| Forms | React Hook Form v7 + Zod v4 |
| Data Fetching | TanStack Query v5 |
| i18n | i18next + react-i18next |
| Rich Text | Tiptap v3 |
| Toasts | Sonner |
| E2E Testing | Playwright |
| Component Dev | Storybook v10 |

### DevOps & Tooling
| Category | Technology |
|----------|-----------|
| Orchestration | Turborepo (caching pipeline) |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Git Hooks | Husky v9 + Commitlint |
| Releases | release-it + conventional-changelog |
| Scaffolding | Hygen |
| Formatting | Prettier v3 |

---

## 3. Project Structure

```
n2base/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/           # Core auth module
│   │   │   ├── auth-google/    # Google OAuth
│   │   │   ├── auth-facebook/  # Facebook OAuth
│   │   │   ├── auth-apple/     # Apple Sign-In
│   │   │   ├── users/          # User CRUD
│   │   │   ├── files/          # File upload (local/S3)
│   │   │   ├── mail/           # Email service
│   │   │   ├── email/          # React Email templates
│   │   │   ├── session/        # Session management
│   │   │   ├── roles/          # Role management
│   │   │   ├── statuses/       # Status management
│   │   │   ├── home/           # Health check
│   │   │   ├── database/       # DB init + seeds
│   │   │   ├── config/         # App config
│   │   │   └── utils/          # Utilities
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
├── docs/
│   └── n2base/                 # Documentation
├── turbo.json                  # Turborepo config
└── pnpm-workspace.yaml
```

---

## 4. Backend (API)

**Location**: `apps/api/src/`  
**Port**: 3001 (default)  
**API prefix**: `/api`  
**Swagger docs**: `/api/docs`

### Modules

| Module | Path | Responsibility |
|--------|------|---------------|
| `AppModule` | `app.module.ts` | Root module, wires all modules |
| `AuthModule` | `auth/` | JWT auth, registration, login, password reset |
| `AuthGoogleModule` | `auth-google/` | Google OAuth2 |
| `AuthFacebookModule` | `auth-facebook/` | Facebook OAuth |
| `AuthAppleModule` | `auth-apple/` | Apple Sign-In |
| `UsersModule` | `users/` | User CRUD, profile |
| `FilesModule` | `files/` | File upload (local / S3 / S3-presigned) |
| `MailModule` | `mail/` | Transactional emails via Nodemailer |
| `SessionModule` | `session/` | JWT refresh session management |
| `RolesModule` | `roles/` | Role seeds and lookups |
| `StatusesModule` | `statuses/` | Status seeds and lookups |
| `HomeModule` | `home/` | `GET /` health check |
| `DatabaseModule` | `database/` | Prisma / Mongoose initialization + seeds |
| `I18nModule` | (nestjs-i18n) | Backend translations |

### API Versioning
Routes are prefixed by `API_PREFIX` env var (default `api`). Versioning is handled per-module via NestJS decorators.

### Key Auth Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/email/register` | Register with email |
| POST | `/api/v1/auth/email/login` | Login with email |
| POST | `/api/v1/auth/google/login` | Google OAuth login |
| POST | `/api/v1/auth/facebook/login` | Facebook OAuth login |
| POST | `/api/v1/auth/apple/login` | Apple Sign-In |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/forgot/password` | Request password reset |
| POST | `/api/v1/auth/reset/password` | Reset password |
| POST | `/api/v1/auth/email/confirm` | Confirm email |
| POST | `/api/v1/auth/logout` | Logout (invalidate session) |

### Key User Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users` | List users (admin) |
| GET | `/api/v1/users/:id` | Get user by ID |
| PATCH | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Soft-delete user |
| GET | `/api/v1/auth/me` | Current user profile |
| PATCH | `/api/v1/auth/me` | Update own profile |

### Key File Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/files/upload` | Upload file |
| GET | `/api/v1/files` | List files |
| DELETE | `/api/v1/files/:id` | Delete file |

### Database Commands
```bash
# Prisma (relational)
npm run migration:generate -- --name="description"
npm run migration:run
npm run migration:revert
npm run schema:drop

# Seeding
npm run seed:run:relational
npm run seed:run:document
```

---

## 5. Frontend (Web)

**Location**: `apps/web/src/`  
**Port**: 3000 (default)  
**Routing**: Next.js App Router under `app/[language]/`

### Pages

| Route | Page | Auth Required |
|-------|------|:---:|
| `/` | Home / Landing | No |
| `/sign-in` | Sign In | No |
| `/sign-up` | Sign Up | No |
| `/forgot-password` | Forgot Password | No |
| `/confirm-email` | Confirm Email | No |
| `/confirm-new-email` | Confirm New Email | No |
| `/password-change` | Change Password | Yes |
| `/profile` | User Profile | Yes |
| `/privacy-policy` | Privacy Policy | No |
| `/admin-panel` | Admin Dashboard | Yes (admin) |
| `/admin-panel/users` | User Management | Yes (admin) |
| `/admin-panel/files` | File Management | Yes (admin) |

### Component Structure

```
src/components/
├── form/               # FormInput, FormSelect, FormTextArea, etc.
├── ui/                 # Button, Card, Dialog, Badge, Tooltip, etc. (shadcn)
├── table/              # DataTable with sort + pagination
├── confirm-dialog/     # Reusable confirmation modal
├── theme/              # ThemeProvider
├── app-bar.tsx         # Top navigation bar
├── LanguageSwitcher.tsx
├── switch-theme-button.tsx
├── full-page-loader.tsx
└── link.tsx
```

### Services Structure

```
src/services/
├── api/
│   ├── use-fetch.ts        # Authenticated fetch with token refresh
│   └── types.ts
├── auth/                   # Auth hooks & helpers
├── react-query/            # TanStack Query hooks per resource
├── social-auth/            # Google / Facebook OAuth handlers
├── i18n/                   # i18next setup + locale files
├── helpers/                # Misc utilities
└── leave-page/             # Unsaved changes guard
```

### Supported Languages
- English (`en`)
- Ukrainian (`uk`)
- Vietnamese (`vi`)

---

## 6. Shared Packages

| Package | Import | Description |
|---------|--------|-------------|
| `@n2base/schemas` | `packages/schemas` | Shared Zod schemas used by both API and Web |
| `@n2base/tsconfig` | `packages/tsconfig` | Shared TypeScript base configs |
| `@n2base/eslint-config` | `packages/eslint-config` | Shared ESLint rules |

---

## 7. Infrastructure

### Docker Compose (`apps/api/docker-compose.yaml`)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | postgres:17.9 | 5432 | Primary database |
| `maildev` | maildev | 1080 (UI) / 1025 (SMTP) | Email testing |
| `adminer` | adminer | 8080 | Database GUI |
| `api` | Custom Dockerfile | APP_PORT | NestJS API |

```bash
# Start local stack
docker compose -f apps/api/docker-compose.yaml up
```

### CI/CD (`.github/workflows/ci.yml`)

| Job | Trigger | What it does |
|-----|---------|-------------|
| `build-test-lint` | Push / PR | Build, lint, test affected packages |
| `test-generators-api` | Push / PR | Test Hygen API generators (relational + document) |
| `test-generators-web` | Push / PR | Test Hygen web resource + field generators |

### Release
```bash
npm run release    # Bumps version, generates CHANGELOG.md, creates GitHub release
```

---

## 8. Database Schema

### Relational (PostgreSQL / Prisma)

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| `User` | id, email, password, provider, socialId, firstName, lastName, photoId, roleId, statusId, deletedAt | photo→File, role→Role, status→Status |
| `File` | id, path, name, size, mimeType, createdAt | users→User[] |
| `Role` | id, name | users→User[] |
| `Status` | id, name | users→User[] |
| `Session` | id, userId, hash, deletedAt | — |

**Soft deletes**: `User` and `Session` use `deletedAt` field.

**Prisma schema**: `apps/api/prisma/schema.prisma`  
**Migrations**: `apps/api/prisma/migrations/`

### Document (MongoDB / Mongoose)
Same entities mapped as Mongoose schemas. Switch via `DATABASE_TYPE=document`.

---

## 9. Authentication & Authorization

### Strategy
- **Access token**: JWT (short-lived, 15 min)
- **Refresh token**: JWT (long-lived, 3650 days), stored in session table
- **Session invalidation**: Deleting the session row logs out the user

### Passport Strategies
| Strategy | Module |
|----------|--------|
| JWT (access) | `auth/` |
| JWT (refresh) | `auth/` |
| Google OAuth2 | `auth-google/` |
| Facebook OAuth | `auth-facebook/` |
| Apple Sign-In | `auth-apple/` |

### Roles
| Role ID | Name |
|---------|------|
| 1 | Admin |
| 2 | User |

### Statuses
| Status ID | Name |
|-----------|------|
| 1 | Active |
| 2 | Inactive |

---

## 10. File Uploads

Switchable via `FILE_DRIVER` env var on API, `NEXT_PUBLIC_FILE_DRIVER` on Web.

| Driver | Config | Description |
|--------|--------|-------------|
| `local` | Default | Stored on server disk |
| `s3` | `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_S3_REGION` | Direct S3 upload via API |
| `s3-presigned` | Same as s3 | Frontend uploads directly to S3 via presigned URL |

**Backend modules**: `apps/api/src/files/infrastructure/uploader/{local,s3,s3-presigned}/`

---

## 11. Email System

| Component | Technology |
|-----------|-----------|
| Transport | Nodemailer (SMTP) |
| Templates | React Email v6 |
| Dev server | MailDev (port 1080 UI / 1025 SMTP) |

**Template location**: `apps/api/src/email/`  
**Mail service**: `apps/api/src/mail/`

Emails sent:
- Email confirmation on registration
- Password reset link
- Email change confirmation

---

## 12. Internationalization

### Backend
- **Library**: nestjs-i18n
- **Locale files**: `apps/api/src/i18n/`
- Validation error messages are translated

### Frontend
- **Library**: i18next + react-i18next
- **Locale files**: `apps/web/src/services/i18n/locales/{en,uk,vi}/`
- Language is part of the URL: `/{language}/...`
- Detection: browser preference, URL param

---

## 13. Code Generation (Hygen)

### API — New Resource
```bash
cd apps/api
npm run generate:resource:relational   # PostgreSQL entity + module
npm run generate:resource:document     # MongoDB schema + module
```

### API — Add Property to Entity
```bash
npm run add:property:to-relational     # Add field to existing Prisma entity
npm run add:property:to-document       # Add field to existing Mongoose schema
```

### Web — New Resource
```bash
cd apps/web
npm run generate:resource              # Creates list/create/edit pages + React Query hooks + Zod schema
npm run generate:field                 # Adds a form field to an existing resource
```

---

## 14. Environment Variables

### API (`apps/api/env-example-relational`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` / `production` |
| `APP_PORT` | API port (default 3001) |
| `APP_NAME` | Application name |
| `API_PREFIX` | URL prefix (default `api`) |
| `DATABASE_TYPE` | `postgres` or `document` |
| `DATABASE_HOST` | DB hostname |
| `DATABASE_PORT` | DB port |
| `DATABASE_USERNAME` | DB user |
| `DATABASE_PASSWORD` | DB password |
| `DATABASE_NAME` | DB name |
| `AUTH_JWT_SECRET` | JWT access token secret |
| `AUTH_JWT_TOKEN_EXPIRES_IN` | Access token TTL |
| `AUTH_REFRESH_SECRET` | JWT refresh token secret |
| `AUTH_REFRESH_TOKEN_EXPIRES_IN` | Refresh token TTL |
| `AUTH_FORGOT_SECRET` | Password reset token secret |
| `AUTH_CONFIRM_EMAIL_SECRET` | Email confirm token secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `FACEBOOK_APP_ID` | Facebook app ID |
| `FACEBOOK_APP_SECRET` | Facebook app secret |
| `APPLE_APP_AUDIENCE` | Apple app audience |
| `FILE_DRIVER` | `local` / `s3` / `s3-presigned` |
| `ACCESS_KEY_ID` | AWS access key |
| `SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET` | S3 bucket name |
| `AWS_S3_REGION` | S3 region |
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port |
| `MAIL_USER` | SMTP user |
| `MAIL_PASSWORD` | SMTP password |
| `MAIL_DEFAULT_EMAIL` | Sender email |

### Web (`apps/web/example.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | API base URL (default `http://localhost:3001/api`) |
| `NEXT_PUBLIC_IS_GOOGLE_AUTH_ENABLED` | Enable Google login button |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_IS_FACEBOOK_AUTH_ENABLED` | Enable Facebook login button |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Facebook app ID |
| `NEXT_PUBLIC_IS_SIGN_UP_ENABLED` | Show/hide sign-up page |
| `NEXT_PUBLIC_FILE_DRIVER` | `local` / `s3` / `s3-presigned` |
| `NEXT_PUBLIC_GITHUB_URL` | GitHub repo link |

---

## 15. Development Workflow

### First-time Setup
```bash
pnpm install
cp apps/api/env-example-relational apps/api/.env
cp apps/web/example.env.local apps/web/.env.local
docker compose -f apps/api/docker-compose.yaml up -d postgres maildev
cd apps/api && npm run migration:run && npm run seed:run:relational
```

### Daily Development
```bash
pnpm run dev          # Start all apps in watch mode (Turborepo)
```

Or individually:
```bash
cd apps/api && npm run start:dev    # API on :3001
cd apps/web && npm run dev          # Web on :3000
```

### Testing
```bash
pnpm run test              # All unit tests
cd apps/api && npm run test:e2e     # API E2E tests
cd apps/web && npm run test:e2e     # Playwright E2E tests
cd apps/web && npm run sb           # Storybook on :6006
```

### Useful URLs (local)
| URL | Service |
|-----|---------|
| http://localhost:3000 | Web frontend |
| http://localhost:3001/api/docs | Swagger API docs |
| http://localhost:8080 | Adminer (DB GUI) |
| http://localhost:1080 | MailDev (email testing) |

### Commit Convention
This project uses [Conventional Commits](https://www.conventionalcommits.org/):
```
feat(scope): description
fix(scope): description
refactor(scope): description
docs(scope): description
```
Husky enforces this on every commit.
