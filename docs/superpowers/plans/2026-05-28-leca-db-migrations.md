# LECA Database Migrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Prisma migration for all LECA-specific tables on top of n2base's existing `user`/`session` tables, plus a seed script with 10+ starter scenarios and 1 admin user.

**Architecture:** Single new migration file adds all 16 LECA tables (UUID PKs, UTC timestamps). Prisma schema gains 16 new models. n2base models (`User`, `Session`, `File`, `Role`, `Status`) are untouched. The ARCHITECTURE.md `sessions` table is renamed `conversation_sessions` in DB to avoid conflict with n2base's `session` table.

**Tech Stack:** Prisma 6, PostgreSQL 16, TypeScript, ts-node

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/prisma/schema.prisma` | Modify | Add 16 LECA Prisma models |
| `apps/api/prisma/migrations/20260528000001_add_leca_tables/migration.sql` | Create | Raw SQL for all LECA tables |
| `apps/api/prisma/seed.ts` | Create | Seed 1 admin, 10+ scenarios |
| `apps/api/package.json` | Modify | Add `prisma.seed` config |

## Naming Decisions

| ARCHITECTURE.md table | DB table name | Reason |
|----------------------|--------------|--------|
| `users` | `users` | Different from n2base's `user` (singular) |
| `sessions` | `conversation_sessions` | Avoid conflict with n2base's `session` |
| `turns` | `turns` | No conflict |

---

### Task 1: Add LECA Prisma models to schema.prisma

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1:** Append all 16 LECA models to schema.prisma after existing models.
  Models: `Organization`, `LecaUser`, `Device`, `Class`, `ClassEnrollment`, `ScenarioPack`, `Scenario`, `ScenarioPhrase`, `ScenarioReview`, `ScenarioRating`, `LevelAssessment`, `ConversationSession`, `ConversationTurn`, `PronunciationScore`, `UserVocabulary`, `DailyUserStat`

- [ ] **Step 2:** Run `cd apps/api && pnpm prisma validate` to confirm schema is valid.

- [ ] **Step 3:** Commit: `git add apps/api/prisma/schema.prisma && git commit -m "feat(db): add LECA Prisma models to schema"`

---

### Task 2: Create migration SQL

**Files:**
- Create: `apps/api/prisma/migrations/20260528000001_add_leca_tables/migration.sql`

- [ ] **Step 1:** Create migration directory and write migration SQL matching ARCHITECTURE.md §3.2 exactly (with `conversation_sessions` instead of `sessions`).

- [ ] **Step 2:** Verify SQL is syntactically correct by reviewing against ARCHITECTURE.md §3.2 checklist.

- [ ] **Step 3:** Commit: `git add apps/api/prisma/migrations && git commit -m "feat(db): add LECA tables migration SQL"`

---

### Task 3: Add prisma.seed config + create seed script

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/prisma/seed.ts`

- [ ] **Step 1:** Add `"prisma": { "seed": "ts-node -r tsconfig-paths/register prisma/seed.ts" }` to `apps/api/package.json`.

- [ ] **Step 2:** Create `apps/api/prisma/seed.ts` that creates:
  - 1 admin user in `users` table
  - 1 scenario pack (`General Practice`)
  - 10 starter scenarios (A1/A2/B1 difficulty, everyday/work situation types) each with 3 scenario_phrases

- [ ] **Step 3:** Commit: `git add apps/api/prisma/seed.ts apps/api/package.json && git commit -m "feat(db): add LECA seed script"`

---

### Task 4: Validate

- [ ] **Step 1:** Run `cd apps/api && pnpm prisma validate` — expect no errors.
- [ ] **Step 2:** Run `cd apps/api && pnpm prisma format` — schema stays clean.
- [ ] **Step 3:** Confirm migration SQL matches ARCHITECTURE.md §3.2 checklist (all tables, indexes, FKs, check constraints present).
