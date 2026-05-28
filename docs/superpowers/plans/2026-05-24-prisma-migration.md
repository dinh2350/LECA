# Prisma ORM Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace TypeORM with Prisma for all relational (PostgreSQL) persistence. MongoDB/Mongoose path is untouched throughout.

**Architecture:** A single `apps/api/prisma/schema.prisma` defines all models. A `PrismaService` (extends `PrismaClient`, implements `OnModuleInit`) is injected into relational repositories. Existing repository interfaces and domain objects stay unchanged — only the implementation layer changes. TypeORM entity files are deleted; Prisma generates the types.

**Tech Stack:** @prisma/client, prisma (dev), PostgreSQL (pg stays for connection)

---

## File Map

**New:**
- `apps/api/prisma/schema.prisma`
- `apps/api/src/database/prisma.service.ts`
- `apps/api/src/database/prisma.module.ts`

**Modified:**
- `apps/api/package.json`
- `apps/api/src/database/select-persistence-module.ts` (no change needed — already works)
- `apps/api/src/users/infrastructure/persistence/relational/relational-persistence.module.ts`
- `apps/api/src/users/infrastructure/persistence/relational/repositories/user.repository.ts`
- `apps/api/src/users/infrastructure/persistence/relational/mappers/user.mapper.ts`
- *(same pattern for roles, statuses, files modules — see Task 6)*

**Deleted:**
- `apps/api/src/database/data-source.ts`
- `apps/api/src/database/typeorm-config.service.ts`
- `apps/api/src/users/infrastructure/persistence/relational/entities/user.entity.ts`
- `apps/api/src/database/migrations/` *(replaced by Prisma migrations)*
- *(same entity files for roles, statuses, files)*

---

### Task 1: Install Prisma

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install**

```bash
cd apps/api
pnpm add @prisma/client
pnpm add -D prisma
```

- [ ] **Step 2: Initialize Prisma**

```bash
cd apps/api && npx prisma init --datasource-provider postgresql
```

Expected: Creates `apps/api/prisma/schema.prisma` and adds `DATABASE_URL` to `.env`.

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json apps/api/prisma/ pnpm-lock.yaml
git commit -m "chore(api): install prisma"
```

---

### Task 2: Write Prisma schema

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

This replaces all TypeORM entity files. Models mirror the existing `*.entity.ts` column definitions.

- [ ] **Step 1: Replace schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model File {
  id        String  @id @default(uuid())
  path      String
  users     User[]

  @@map("file")
}

model Role {
  id    Int    @id
  users User[]

  @@map("role")
}

model Status {
  id    Int    @id
  users User[]

  @@map("status")
}

model User {
  id        Int       @id @default(autoincrement())
  email     String?   @unique
  password  String?
  provider  String    @default("email")
  socialId  String?   @map("social_id")
  firstName String?   @map("first_name")
  lastName  String?   @map("last_name")
  photo     File?     @relation(fields: [photoId], references: [id])
  photoId   String?   @map("photo_id")
  role      Role?     @relation(fields: [roleId], references: [id])
  roleId    Int?      @map("role_id")
  status    Status?   @relation(fields: [statusId], references: [id])
  statusId  Int?      @map("status_id")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@index([socialId])
  @@index([firstName])
  @@index([lastName])
  @@map("user")
}
```

- [ ] **Step 2: Generate Prisma client**

```bash
cd apps/api && npx prisma generate
```

Expected: `✔ Generated Prisma Client` with no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(api): add Prisma schema for user, role, status, file models"
```

---

### Task 3: Create PrismaService and PrismaModule

**Files:**
- Create: `apps/api/src/database/prisma.service.ts`
- Create: `apps/api/src/database/prisma.module.ts`

- [ ] **Step 1: Create prisma.service.ts**

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

- [ ] **Step 2: Create prisma.module.ts**

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 3: Register PrismaModule in AppModule**

Open `apps/api/src/app.module.ts`. Find the imports array and replace `TypeOrmModule.forRootAsync(...)` (inside the `selectPersistenceModule` relational branch) with `PrismaModule`. Keep the document (Mongoose) branch as-is.

The relevant part of `app.module.ts` should look like:
```ts
import { PrismaModule } from './database/prisma.module';

// In imports array, for the relational case:
// Remove: TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService })
// Add: PrismaModule
```

- [ ] **Step 4: Build**

```bash
cd apps/api && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: No output.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/database/prisma.service.ts apps/api/src/database/prisma.module.ts apps/api/src/app.module.ts
git commit -m "feat(api): add PrismaService and PrismaModule"
```

---

### Task 4: Create initial Prisma migration

**Files:**
- `apps/api/prisma/migrations/` (auto-generated)

- [ ] **Step 1: Ensure DATABASE_URL is set**

```bash
grep DATABASE_URL apps/api/.env
```

Expected: `DATABASE_URL="postgresql://..."` — must be a running PostgreSQL instance.

- [ ] **Step 2: Run migration**

```bash
cd apps/api && npx prisma migrate dev --name init
```

Expected: `✔ Generated Prisma Client` and migration file created in `prisma/migrations/`.

- [ ] **Step 3: Add migrate script to package.json**

In `apps/api/package.json`, add under `"scripts"`:
```json
"prisma:migrate": "prisma migrate dev",
"prisma:generate": "prisma generate",
"prisma:studio": "prisma studio"
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/migrations/ apps/api/package.json
git commit -m "feat(api): add initial Prisma migration"
```

---

### Task 5: Replace User relational repository

**Files:**
- Modify: `apps/api/src/users/infrastructure/persistence/relational/repositories/user.repository.ts`
- Modify: `apps/api/src/users/infrastructure/persistence/relational/mappers/user.mapper.ts`
- Modify: `apps/api/src/users/infrastructure/persistence/relational/relational-persistence.module.ts`
- Delete: `apps/api/src/users/infrastructure/persistence/relational/entities/user.entity.ts`

- [ ] **Step 1: Replace user.repository.ts**

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { User } from '../../../../domain/user';
import { UserRepository } from '../../user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersRelationalRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: User): Promise<User> {
    const record = await this.prisma.user.create({
      data: UserMapper.toPersistence(data),
      include: { photo: true, role: true, status: true },
    });
    return UserMapper.toDomain(record);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (filterOptions?.roles?.length) {
      where.roleId = { in: filterOptions.roles.map((r) => Number(r.id)) };
    }

    const orderBy: Prisma.UserOrderByWithRelationInput[] =
      sortOptions?.map((s) => ({ [s.orderBy]: s.order.toLowerCase() })) ?? [];

    const records = await this.prisma.user.findMany({
      where,
      orderBy,
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      include: { photo: true, role: true, status: true },
    });

    return records.map(UserMapper.toDomain);
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    const record = await this.prisma.user.findFirst({
      where: { id: Number(id), deletedAt: null },
      include: { photo: true, role: true, status: true },
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      where: { id: { in: ids.map(Number) }, deletedAt: null },
      include: { photo: true, role: true, status: true },
    });
    return records.map(UserMapper.toDomain);
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;
    const record = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { photo: true, role: true, status: true },
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    if (!socialId || !provider) return null;
    const record = await this.prisma.user.findFirst({
      where: { socialId, provider, deletedAt: null },
      include: { photo: true, role: true, status: true },
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async update(id: User['id'], payload: Partial<User>): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id: Number(id) },
      data: UserMapper.toPersistence({ ...payload, id } as User),
      include: { photo: true, role: true, status: true },
    });
    return UserMapper.toDomain(record);
  }

  async remove(id: User['id']): Promise<void> {
    await this.prisma.user.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });
  }
}
```

- [ ] **Step 2: Update user.mapper.ts**

Read `apps/api/src/users/infrastructure/persistence/relational/mappers/user.mapper.ts`, then update the type import. Replace any `UserEntity` import with the Prisma-generated type:

```ts
import { User as PrismaUser, Role, Status, File } from '@prisma/client';

type UserWithRelations = PrismaUser & {
  photo: File | null;
  role: Role | null;
  status: Status | null;
};
```

Update `toDomain(raw: UserWithRelations): User` and `toPersistence(domain: User): Prisma.UserCreateInput` signatures to use Prisma types instead of `UserEntity`.

- [ ] **Step 3: Update relational-persistence.module.ts**

```ts
import { Module } from '@nestjs/common';
import { UserRepository } from '../user.repository';
import { UsersRelationalRepository } from './repositories/user.repository';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: UsersRelationalRepository,
    },
  ],
  exports: [UserRepository],
})
export class RelationalUserPersistenceModule {}
```

- [ ] **Step 4: Delete user.entity.ts**

```bash
rm apps/api/src/users/infrastructure/persistence/relational/entities/user.entity.ts
```

- [ ] **Step 5: Build**

```bash
cd apps/api && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: No output.

- [ ] **Step 6: Run tests**

```bash
cd apps/api && pnpm test 2>&1 | tail -20
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/users/
git commit -m "feat(api): migrate users relational persistence to Prisma"
```

---

### Task 6: Migrate remaining relational modules

**Files:**
- `apps/api/src/roles/infrastructure/persistence/relational/`
- `apps/api/src/statuses/infrastructure/persistence/relational/`
- `apps/api/src/files/infrastructure/persistence/relational/`

Apply the same pattern from Task 5 to each module:

- [ ] **Step 1: For each module (roles, statuses, files), repeat:**

  1. Read the existing `*.entity.ts` to understand columns
  2. Read the existing `*.repository.ts` to understand queries
  3. Rewrite repository to use `this.prisma.<model>.*` queries (same pattern as Task 5)
  4. Update mapper to use Prisma generated types instead of entity types
  5. Update `relational-persistence.module.ts` to remove `TypeOrmModule.forFeature`
  6. Delete the `*.entity.ts` file

- [ ] **Step 2: Build after each module**

```bash
cd apps/api && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: No output after each module migration.

- [ ] **Step 3: Commit after all three modules**

```bash
git add apps/api/src/roles/ apps/api/src/statuses/ apps/api/src/files/
git commit -m "feat(api): migrate roles, statuses, files relational persistence to Prisma"
```

---

### Task 7: Remove TypeORM

**Files:**
- Modify: `apps/api/package.json`
- Delete: `apps/api/src/database/data-source.ts`
- Delete: `apps/api/src/database/typeorm-config.service.ts`
- Delete: `apps/api/src/database/migrations/`

- [ ] **Step 1: Delete TypeORM-specific files**

```bash
rm apps/api/src/database/data-source.ts
rm apps/api/src/database/typeorm-config.service.ts
rm -rf apps/api/src/database/migrations/
```

- [ ] **Step 2: Remove TypeORM packages**

```bash
cd apps/api && pnpm remove typeorm @nestjs/typeorm
```

- [ ] **Step 3: Final build**

```bash
cd apps/api && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: No output.

- [ ] **Step 4: Run full test suite**

```bash
cd apps/api && pnpm test 2>&1 | tail -30
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/database/ apps/api/package.json pnpm-lock.yaml
git commit -m "chore(api): remove TypeORM, complete Prisma migration"
```

---

### Task 8: Update seeds for Prisma

**Files:**
- Modify: `apps/api/src/database/seeds/relational/user/user-seed.service.ts`
- Modify: `apps/api/src/database/seeds/relational/role/role-seed.service.ts`
- Modify: `apps/api/src/database/seeds/relational/status/status-seed.service.ts`

- [ ] **Step 1: Update each seed service**

For each seed service, read the current file and replace TypeORM `Repository` injection with `PrismaService` injection. Pattern:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class RoleSeedService {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    // Replace Repository.findOne / save with:
    const count = await this.prisma.role.count({ where: { id: 1 } });
    if (!count) {
      await this.prisma.role.create({ data: { id: 1 } });
    }
    const count2 = await this.prisma.role.count({ where: { id: 2 } });
    if (!count2) {
      await this.prisma.role.create({ data: { id: 2 } });
    }
  }
}
```

Apply the same pattern to status and user seed services.

- [ ] **Step 2: Update seed modules**

Remove `TypeOrmModule.forFeature([...])` from each seed module's imports array. Add `PrismaModule` if not already globally available.

- [ ] **Step 3: Build**

```bash
cd apps/api && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: No output.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/database/seeds/
git commit -m "feat(api): migrate relational seed services to Prisma"
```
