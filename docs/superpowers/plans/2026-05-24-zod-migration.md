# Zod Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace class-validator + class-transformer (API) and Yup (frontend) with Zod, sharing a `packages/schemas` package across the stack.

**Architecture:** `nestjs-zod` bridges Zod with NestJS's validation pipeline and Swagger. All input DTOs use `createZodDto()`. Frontend forms replace `yupResolver` with `zodResolver`. A new `@n2base/schemas` package holds shared field schemas (email, password) to eliminate duplication.

**Tech Stack:** zod ^3.24, nestjs-zod ^4, @hookform/resolvers/zod, pnpm workspaces

---

## File Map

**New:**
- `packages/schemas/package.json`
- `packages/schemas/src/index.ts`
- `packages/schemas/src/auth.schema.ts`

**Modified (API):**
- `apps/api/package.json`
- `apps/api/src/main.ts`
- `apps/api/src/auth/dto/auth-email-login.dto.ts`
- `apps/api/src/auth/dto/auth-register-login.dto.ts`
- `apps/api/src/auth/dto/auth-forgot-password.dto.ts`
- `apps/api/src/auth/dto/auth-reset-password.dto.ts`
- `apps/api/src/auth/dto/auth-confirm-email.dto.ts`
- `apps/api/src/auth/dto/auth-update.dto.ts`
- `apps/api/src/auth-apple/dto/auth-apple-login.dto.ts`
- `apps/api/src/auth-facebook/dto/auth-facebook-login.dto.ts`
- `apps/api/src/auth-google/dto/auth-google-login.dto.ts`
- `apps/api/src/users/dto/create-user.dto.ts`
- `apps/api/src/users/dto/update-user.dto.ts`
- `apps/api/src/users/dto/query-user.dto.ts`
- `apps/api/src/files/dto/file.dto.ts`
- `apps/api/src/roles/dto/role.dto.ts`
- `apps/api/src/statuses/dto/status.dto.ts`

**Modified (web):**
- `apps/web/package.json`
- `apps/web/src/app/[language]/sign-up/page-content.tsx`
- `apps/web/src/app/[language]/sign-in/page-content.tsx`
- `apps/web/src/app/[language]/profile/edit/page-content.tsx`
- `apps/web/src/app/[language]/password-change/page-content.tsx`
- `apps/web/src/app/[language]/forgot-password/page-content.tsx`
- `apps/web/src/app/[language]/admin-panel/users/edit/[id]/page-content.tsx`
- `apps/web/src/app/[language]/admin-panel/users/create/page-content.tsx`

**Deleted:**
- `apps/api/src/utils/validation-options.ts`

---

### Task 1: Create `packages/schemas`

**Files:**
- Create: `packages/schemas/package.json`
- Create: `packages/schemas/src/index.ts`
- Create: `packages/schemas/src/auth.schema.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@n2base/schemas",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.24.0"
  }
}
```

- [ ] **Step 2: Create src/auth.schema.ts**

```ts
import { z } from 'zod';

export const emailSchema = z.string().email().transform((v) => v.toLowerCase());
export const passwordSchema = z.string().min(6);
```

- [ ] **Step 3: Create src/index.ts**

```ts
export * from './auth.schema';
```

- [ ] **Step 4: Commit**

```bash
git add packages/schemas/
git commit -m "feat: add shared @n2base/schemas package"
```

---

### Task 2: Install packages in API

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install and remove**

```bash
cd apps/api
pnpm add zod nestjs-zod @n2base/schemas
pnpm remove class-validator class-transformer
```

- [ ] **Step 2: Verify**

```bash
node -e "require('./node_modules/nestjs-zod')" && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore(api): replace class-validator/class-transformer with zod + nestjs-zod"
```

---

### Task 3: Update `main.ts`

**Files:**
- Modify: `apps/api/src/main.ts`
- Delete: `apps/api/src/utils/validation-options.ts`

- [ ] **Step 1: Replace main.ts**

```ts
import 'dotenv/config';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';

patchNestJsSwagger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    { exclude: ['/'] },
  );
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(new ZodValidationPipe());

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: { example: 'en' },
    })
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, options));
  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
```

- [ ] **Step 2: Delete validation-options.ts**

```bash
rm apps/api/src/utils/validation-options.ts
```

- [ ] **Step 3: Build to verify no broken imports**

```bash
cd apps/api && pnpm build 2>&1 | grep -E "error|Error" | head -20
```

Expected: No output (no errors). If errors appear about missing `validation-options` import, search for and remove those imports: `grep -r "validation-options" apps/api/src/`.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/main.ts apps/api/src/utils/validation-options.ts
git commit -m "feat(api): replace ValidationPipe with ZodValidationPipe, patch Swagger"
```

---

### Task 4: Migrate auth DTOs

**Files:**
- Modify: all 9 files listed in File Map under auth

The pattern for every DTO: define a `const Schema = z.object({...})`, export a class using `createZodDto(Schema)`. The class name stays identical so no other file needs to change.

- [ ] **Step 1: Replace auth-email-login.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { emailSchema } from '@n2base/schemas';
import { z } from 'zod';

const AuthEmailLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export class AuthEmailLoginDto extends createZodDto(AuthEmailLoginSchema) {}
```

- [ ] **Step 2: Replace auth-register-login.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { emailSchema, passwordSchema } from '@n2base/schemas';
import { z } from 'zod';

const AuthRegisterLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export class AuthRegisterLoginDto extends createZodDto(AuthRegisterLoginSchema) {}
```

- [ ] **Step 3: Replace auth-forgot-password.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { emailSchema } from '@n2base/schemas';
import { z } from 'zod';

const AuthForgotPasswordSchema = z.object({ email: emailSchema });

export class AuthForgotPasswordDto extends createZodDto(AuthForgotPasswordSchema) {}
```

- [ ] **Step 4: Replace auth-reset-password.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { passwordSchema } from '@n2base/schemas';
import { z } from 'zod';

const AuthResetPasswordSchema = z.object({
  password: passwordSchema,
  hash: z.string().min(1),
});

export class AuthResetPasswordDto extends createZodDto(AuthResetPasswordSchema) {}
```

- [ ] **Step 5: Replace auth-confirm-email.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AuthConfirmEmailSchema = z.object({ hash: z.string().min(1) });

export class AuthConfirmEmailDto extends createZodDto(AuthConfirmEmailSchema) {}
```

- [ ] **Step 6: Replace auth-update.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { emailSchema, passwordSchema } from '@n2base/schemas';
import { z } from 'zod';

const AuthUpdateSchema = z.object({
  photo: z.object({ id: z.string() }).nullable().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  oldPassword: z.string().min(1).optional(),
});

export class AuthUpdateDto extends createZodDto(AuthUpdateSchema) {}
```

- [ ] **Step 7: Replace auth-apple-login.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AuthAppleLoginSchema = z.object({
  idToken: z.string().min(1),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

export class AuthAppleLoginDto extends createZodDto(AuthAppleLoginSchema) {}
```

- [ ] **Step 8: Replace auth-facebook-login.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AuthFacebookLoginSchema = z.object({ accessToken: z.string().min(1) });

export class AuthFacebookLoginDto extends createZodDto(AuthFacebookLoginSchema) {}
```

- [ ] **Step 9: Replace auth-google-login.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AuthGoogleLoginSchema = z.object({ idToken: z.string().min(1) });

export class AuthGoogleLoginDto extends createZodDto(AuthGoogleLoginSchema) {}
```

- [ ] **Step 10: Build**

```bash
cd apps/api && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: No output.

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/auth/ apps/api/src/auth-apple/ apps/api/src/auth-facebook/ apps/api/src/auth-google/
git commit -m "feat(api): migrate auth DTOs to Zod schemas"
```

---

### Task 5: Migrate users and shared DTOs

**Files:**
- Modify: `apps/api/src/users/dto/create-user.dto.ts`
- Modify: `apps/api/src/users/dto/update-user.dto.ts`
- Modify: `apps/api/src/users/dto/query-user.dto.ts`
- Modify: `apps/api/src/roles/dto/role.dto.ts`
- Modify: `apps/api/src/statuses/dto/status.dto.ts`
- Modify: `apps/api/src/files/dto/file.dto.ts`

- [ ] **Step 1: Replace role.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RoleDtoSchema = z.object({ id: z.number() });

export class RoleDto extends createZodDto(RoleDtoSchema) {}
```

- [ ] **Step 2: Replace status.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const StatusDtoSchema = z.object({ id: z.number() });

export class StatusDto extends createZodDto(StatusDtoSchema) {}
```

- [ ] **Step 3: Replace file.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const FileDtoSchema = z.object({
  id: z.string(),
  path: z.string().optional(),
});

export class FileDto extends createZodDto(FileDtoSchema) {}
```

- [ ] **Step 4: Replace create-user.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { emailSchema, passwordSchema } from '@n2base/schemas';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: emailSchema.nullable(),
  password: passwordSchema.optional(),
  provider: z.string().optional(),
  socialId: z.string().nullable().optional(),
  firstName: z.string().min(1).nullable(),
  lastName: z.string().min(1).nullable(),
  photo: z.object({ id: z.string() }).nullable().optional(),
  role: z.object({ id: z.number() }).nullable().optional(),
  status: z.object({ id: z.number() }).optional(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
```

- [ ] **Step 5: Replace update-user.dto.ts**

```ts
import { createZodDto } from 'nestjs-zod';
import { emailSchema, passwordSchema } from '@n2base/schemas';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  email: emailSchema.nullable().optional(),
  password: passwordSchema.optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  photo: z.object({ id: z.string() }).nullable().optional(),
  role: z.object({ id: z.number() }).nullable().optional(),
  status: z.object({ id: z.number() }).optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
```

- [ ] **Step 6: Replace query-user.dto.ts**

The `filters` and `sort` fields arrive as JSON strings in query params and need parsing.

```ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const jsonPreprocess = (val: unknown) => {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
};

const FilterUserSchema = z.object({
  roles: z.array(z.object({ id: z.number() })).nullable().optional(),
});

const SortUserSchema = z.object({
  orderBy: z.string(),
  order: z.enum(['ASC', 'DESC']),
});

const QueryUserSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  filters: z.preprocess(jsonPreprocess, FilterUserSchema).nullable().optional(),
  sort: z.preprocess(jsonPreprocess, z.array(SortUserSchema)).nullable().optional(),
});

export class FilterUserDto extends createZodDto(FilterUserSchema) {}
export class SortUserDto extends createZodDto(SortUserSchema) {}
export class QueryUserDto extends createZodDto(QueryUserSchema) {}
```

- [ ] **Step 7: Build**

```bash
cd apps/api && pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: No output.

- [ ] **Step 8: Run tests**

```bash
cd apps/api && pnpm test 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/users/ apps/api/src/roles/ apps/api/src/statuses/ apps/api/src/files/
git commit -m "feat(api): migrate users, roles, statuses, files DTOs to Zod schemas"
```

---

### Task 6: Install Zod in web + migrate forms

**Files:**
- Modify: `apps/web/package.json`
- Modify: all 7 form files listed in File Map

- [ ] **Step 1: Install and remove**

```bash
cd apps/web
pnpm add zod @n2base/schemas
pnpm remove yup
```

- [ ] **Step 2: Migrate sign-up/page-content.tsx**

Replace the yup imports and `useValidationSchema`:

```tsx
// Remove these two lines:
// import * as yup from 'yup';
// import { yupResolver } from '@hookform/resolvers/yup';

// Add:
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Replace useValidationSchema:
const useValidationSchema = () => {
  const { t } = useTranslation('sign-up');
  return z.object({
    firstName: z.string().min(1, t('sign-up:inputs.firstName.validation.required')),
    lastName: z.string().min(1, t('sign-up:inputs.lastName.validation.required')),
    email: z.string().email(t('sign-up:inputs.email.validation.invalid')),
    password: z.string().min(6, t('sign-up:inputs.password.validation.min')),
    policy: z
      .array(z.object({ id: z.string(), name: z.string() }))
      .min(1, t('sign-up:inputs.policy.validation.required')),
  });
};

// Replace type:
type SignUpFormData = z.infer<ReturnType<typeof useValidationSchema>>;

// In useForm, replace yupResolver with zodResolver:
const methods = useForm<SignUpFormData>({
  resolver: zodResolver(validationSchema),
  defaultValues: { firstName: '', lastName: '', email: '', password: '', policy: [] },
});
```

- [ ] **Step 3: Migrate remaining 6 form files**

For each file, read it, then apply the same pattern:
1. Replace `import * as yup from 'yup'` and `import { yupResolver }` with `import { z } from 'zod'` and `import { zodResolver } from '@hookform/resolvers/zod'`
2. Replace `yup.object().shape({...})` with `z.object({...})` — `yup.string().required()` → `z.string().min(1)`, `yup.string().email()` → `z.string().email()`, `yup.string().min(N)` → `z.string().min(N)`
3. Replace `yupResolver(schema)` with `zodResolver(schema)` in `useForm`
4. Replace manual `type FormData = {...}` with `type FormData = z.infer<typeof schema>` (or `z.infer<ReturnType<typeof useValidationSchema>>` if schema is in a hook)

Files:
- `sign-in/page-content.tsx`
- `profile/edit/page-content.tsx`
- `password-change/page-content.tsx`
- `forgot-password/page-content.tsx`
- `admin-panel/users/edit/[id]/page-content.tsx`
- `admin-panel/users/create/page-content.tsx`

- [ ] **Step 4: Build web**

```bash
cd apps/web && pnpm build 2>&1 | grep -E "error" | head -20
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): migrate form validation from yup to zod"
```
