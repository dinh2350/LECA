# Tech Stack

## Monorepo
| Tool | Purpose |
|------|---------|
| pnpm workspaces | Package manager |
| Turborepo | Task orchestration & caching |
| Husky + Commitlint | Git hooks & conventional commits |
| Prettier | Code formatting |
| hygen | Code generation (resources, properties) |

---

## Backend (`apps/api`) — NestJS

| Category | Tech |
|----------|------|
| Framework | NestJS 11 + Express |
| Language | TypeScript 5.9 |
| Database (SQL) | PostgreSQL + TypeORM |
| Database (NoSQL) | MongoDB + Mongoose |
| Auth | JWT, Passport, bcryptjs |
| Social Auth | Google, Facebook, Apple |
| File Storage | AWS S3 + presigned URLs |
| Email | Nodemailer + Handlebars templates |
| Validation | class-validator + class-transformer |
| API Docs | Swagger / OpenAPI |
| i18n | nestjs-i18n |
| Testing | Jest + Supertest |
| Container | Docker (Node 24 Alpine) |

---

## Frontend (`apps/web`) — Next.js

| Category | Tech |
|----------|------|
| Framework | Next.js 16 + React 19 |
| Language | TypeScript 5.9 |
| UI Library | MUI v7 + Emotion |
| Forms | React Hook Form + Yup |
| Data Fetching | TanStack Query v5 |
| i18n | i18next + react-i18next |
| Social Auth | @react-oauth/google |
| Rich Text | mui-tiptap |
| Notifications | react-toastify |
| File Upload | react-dropzone |
| Testing | Playwright (e2e) |
| Component Dev | Storybook 10 |

---

## Infrastructure

| Tool | Purpose |
|------|---------|
| Docker Compose | Local dev environments |
| AWS S3 | File storage |
| release-it | Versioning & changelogs |
| Node ≥ 22 | Runtime requirement |
