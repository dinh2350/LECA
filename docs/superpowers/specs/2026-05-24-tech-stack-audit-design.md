# Tech Stack Audit — Design Spec

**Date:** 2026-05-24  
**Scope:** Targeted swaps on tools with declining community health  
**Locked:** NestJS, Next.js, React, PostgreSQL, MongoDB — not in scope  
**Motivation:** Community & longevity — ensure all tools are thriving and widely adopted

---

## Goals

- Replace tools where the community has clearly shifted to a better alternative
- Keep migration scope minimal — only swap what matters
- Improve TypeScript type safety across the stack
- Share validation schemas between API and frontend

## Non-Goals

- Replacing NestJS or Next.js
- Switching UI library (MUI stays)
- Changing auth approach (Passport + JWT stays)
- Replacing Mongoose (still dominant for MongoDB)

---

## Change 1: TypeORM → Prisma

**Affects:** `apps/api` (SQL/PostgreSQL path only)

### Why
TypeORM has a large unresolved issue backlog, inconsistent type safety, and heavy decorator reliance that conflicts with modern TypeScript. Prisma is the most widely adopted ORM in the Node.js/TypeScript ecosystem — schema-first, auto-generated fully-typed client, excellent NestJS integration, and the largest community of the three major ORMs. Official `@prisma/client` has 10M+ weekly npm downloads.

### Packages
| Remove | Add |
|--------|-----|
| `typeorm` | `@prisma/client` |
| `@nestjs/typeorm` | `prisma` (dev) |

### File Changes
| Location | Change |
|----------|--------|
| `apps/api/prisma/schema.prisma` | New — defines all models (User, Role, Status, File) |
| `apps/api/src/database/` | Replace TypeORM data source + config service with Prisma service (`prisma.service.ts`) |
| `apps/api/src/*/infrastructure/persistence/relational/entities/` | Remove — Prisma generates types from schema |
| `apps/api/src/*/infrastructure/persistence/relational/repositories/` | Replace TypeORM repository methods with Prisma client queries |
| `apps/api/src/*/infrastructure/persistence/relational/mappers/` | Keep — update entity type references to Prisma generated types |
| Migration workflow | `typeorm migration:run` → `prisma migrate dev` |

### What Stays the Same
- All domain logic, service layer, controllers
- MongoDB / Mongoose path — completely untouched
- All interfaces and domain entity types

---

## Change 2: class-validator + class-transformer → Zod (API)

**Affects:** `apps/api`

### Why
Zod has 35M+ weekly npm downloads vs class-validator's ~8M. Zod schemas are the type — no decorator duplication, better inference, easier to test. `nestjs-zod` provides a drop-in `ZodValidationPipe` that integrates cleanly with NestJS's existing pipe system.

### Packages
| Remove | Add |
|--------|-----|
| `class-validator` | `zod` |
| `class-transformer` | `nestjs-zod` |

### File Changes
| Location | Change |
|----------|--------|
| `apps/api/src/*/dto/` | Replace decorator-based DTO classes with Zod schema + inferred type |
| `apps/api/src/main.ts` | Replace `new ValidationPipe()` with `new ZodValidationPipe()` from `nestjs-zod` |
| Swagger integration | `nestjs-zod` auto-generates OpenAPI schemas from Zod — no manual `@ApiProperty()` needed |

---

## Change 3: Yup → Zod (Frontend)

**Affects:** `apps/web`

### Why
Yup's growth has plateaued. The TypeScript community has standardised on Zod for schema validation. `@hookform/resolvers` already supports Zod — it's a one-line swap per form. Unified with the API validation layer.

### Packages
| Remove | Add |
|--------|-----|
| `yup` | `zod` (if not already added via shared package) |

### File Changes
| Location | Change |
|----------|--------|
| Each form schema file | Replace `yup.object({...})` with `z.object({...})` |
| Each `useForm()` call | Replace `yupResolver(schema)` with `zodResolver(schema)` |

---

## Change 4: Handlebars → react-email (Email Templates)

**Affects:** `apps/api/src/mail/`

### Why
Handlebars `.hbs` files are static strings with no type safety and no preview tooling. `react-email` lets you write emails as typed React components, previewable in a browser. It's the fastest-growing email tooling in the Node.js ecosystem (14k+ GitHub stars, backed by Resend).

### Packages
| Remove | Add |
|--------|-----|
| `handlebars` | `react-email` |
| | `@react-email/components` |
| | `@react-email/render` |
| | `react` + `react-dom` (dev, in api workspace) |

### File Changes
| Location | Change |
|----------|--------|
| `apps/api/src/mail/templates/*.hbs` | Replace with `*.tsx` React components |
| `apps/api/src/mail/mail.service.ts` | Replace `handlebars.compile(template)(data)` with `render(<Template {...data} />)` |
| `apps/api/src/mail/mail.module.ts` | No change |

### What Stays the Same
- `nodemailer` transport — react-email only handles rendering, not sending
- All mail service method signatures
- Environment config (SMTP settings, etc.)

---

## Shared Schema Package (New)

**Location:** `packages/schemas`

A new internal package that exports Zod schemas shared between API and web. This eliminates duplicated validation logic for common entities (user, auth, pagination).

| Package | Imports from |
|---------|-------------|
| `apps/api` | `@n2base/schemas` |
| `apps/web` | `@n2base/schemas` |

---

## Stack After Changes

| Layer | Before | After |
|-------|--------|-------|
| SQL ORM | TypeORM | Prisma |
| API Validation | class-validator + class-transformer | Zod + nestjs-zod |
| Frontend Validation | Yup | Zod |
| Email Templates | Handlebars | react-email |
| MongoDB ODM | Mongoose | Mongoose (unchanged) |
| UI | MUI v7 | MUI v7 (unchanged) |
| Auth | Passport + JWT | Passport + JWT (unchanged) |
| Data Fetching | TanStack Query v5 | TanStack Query v5 (unchanged) |
| Forms | React Hook Form | React Hook Form (unchanged) |
| Testing | Jest + Playwright | Jest + Playwright (unchanged) |
| Monorepo | Turborepo + pnpm | Turborepo + pnpm (unchanged) |

---

## Migration Order

1. **Zod (API + Frontend)** — lowest risk, no infrastructure changes
2. **react-email** — isolated to mail module
3. **Prisma** — largest change, do last when rest is stable
