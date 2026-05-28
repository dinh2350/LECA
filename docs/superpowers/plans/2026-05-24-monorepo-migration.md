# Monorepo Migration (Turborepo + pnpm) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `nestjs-boilerplate/` and `extensive-react-boilerplate/` into a single Turborepo + pnpm monorepo with shared tooling packages.

**Architecture:** Root workspace with `apps/` (api, web) and `packages/` (eslint-config, tsconfig). Turborepo orchestrates build/lint/test pipelines with caching. Shared tooling packages centralize ESLint base rules and TypeScript config variants. Apps retain all source code, app-specific config, and scripts unchanged.

**Tech Stack:** pnpm 9, Turborepo latest, Node 22, @n2base/tsconfig, @n2base/eslint-config, GitHub Actions, Husky 9, Commitlint 19

---

### Task 1: Create root monorepo scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `package.json`
- Create: `.prettierrc`
- Create: `.gitignore`
- Create: `commitlint.config.js`

- [ ] **Step 1: Verify pnpm and Node versions**

```bash
node --version   # expect v22.x.x
pnpm --version   # expect 9.x.x
```

If pnpm is not installed or not v9: `corepack enable && corepack prepare pnpm@9 --activate`

- [ ] **Step 2: Create pnpm-workspace.yaml**

Create `/Users/devinnguyen/Documents/project/n2base/pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

Create `/Users/devinnguyen/Documents/project/n2base/turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", ".next/cache/**"]
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

- [ ] **Step 4: Create root package.json**

Create `/Users/devinnguyen/Documents/project/n2base/package.json`:

```json
{
  "name": "n2base",
  "private": true,
  "engines": {
    "node": ">=22",
    "pnpm": ">=9"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "prepare": "is-ci || husky"
  },
  "devDependencies": {
    "@commitlint/cli": "^19",
    "@commitlint/config-conventional": "^19",
    "husky": "^9",
    "is-ci": "^4",
    "prettier": "^3",
    "turbo": "latest"
  }
}
```

- [ ] **Step 5: Create unified .prettierrc**

Create `/Users/devinnguyen/Documents/project/n2base/.prettierrc`:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true,
  "endOfLine": "auto"
}
```

- [ ] **Step 6: Create root .gitignore**

Create `/Users/devinnguyen/Documents/project/n2base/.gitignore`:

```
# Dependencies
node_modules/

# Build outputs
dist/
.next/
out/
build/

# Turborepo cache
.turbo/

# Environment files
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Editors
.vscode/
.idea/
```

- [ ] **Step 7: Create root commitlint.config.js**

Create `/Users/devinnguyen/Documents/project/n2base/commitlint.config.js`:

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

---

### Task 2: Create @n2base/tsconfig shared package

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nestjs.json`
- Create: `packages/tsconfig/nextjs.json`

- [ ] **Step 1: Create packages/tsconfig/package.json**

Create `/Users/devinnguyen/Documents/project/n2base/packages/tsconfig/package.json`:

```json
{
  "name": "@n2base/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": ["*.json"],
  "license": "MIT"
}
```

- [ ] **Step 2: Create base.json**

Create `/Users/devinnguyen/Documents/project/n2base/packages/tsconfig/base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

No `strict`, `target`, or `module` here — these differ between NestJS (CommonJS) and Next.js (ESM/bundler) and are set in the variant files.

- [ ] **Step 3: Create nestjs.json**

Create `/Users/devinnguyen/Documents/project/n2base/packages/tsconfig/nestjs.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

No `outDir` — path resolution is relative to the declaring file, so each app must set `outDir` in its own tsconfig.json.

- [ ] **Step 4: Create nextjs.json**

Create `/Users/devinnguyen/Documents/project/n2base/packages/tsconfig/nextjs.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "jsx": "react-jsx",
    "plugins": [{ "name": "next" }]
  }
}
```

---

### Task 3: Create @n2base/eslint-config shared package

**Files:**
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/index.js`

- [ ] **Step 1: Create packages/eslint-config/package.json**

Create `/Users/devinnguyen/Documents/project/n2base/packages/eslint-config/package.json`:

```json
{
  "name": "@n2base/eslint-config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "index.js",
  "license": "MIT",
  "dependencies": {
    "eslint-config-prettier": "10.1.8",
    "eslint-plugin-prettier": "5.5.5"
  }
}
```

- [ ] **Step 2: Create packages/eslint-config/index.js**

Create `/Users/devinnguyen/Documents/project/n2base/packages/eslint-config/index.js`:

```js
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  prettierConfig,
];
```

This provides the Prettier integration for both apps: `prettier/prettier: error` reads rules from the root `.prettierrc`, and `eslint-config-prettier` disables any ESLint formatting rules that conflict with Prettier.

---

### Task 4: Move apps into place

**Files:**
- Move: `nestjs-boilerplate/` → `apps/api/`
- Move: `extensive-react-boilerplate/` → `apps/web/`

- [ ] **Step 1: Create apps/ directory and move nestjs-boilerplate**

```bash
mkdir -p /Users/devinnguyen/Documents/project/n2base/apps
mv /Users/devinnguyen/Documents/project/n2base/nestjs-boilerplate /Users/devinnguyen/Documents/project/n2base/apps/api
```

Verify: `ls /Users/devinnguyen/Documents/project/n2base/apps/api/src` — should list NestJS source folders (auth, users, files, etc.)

- [ ] **Step 2: Move extensive-react-boilerplate**

```bash
mv /Users/devinnguyen/Documents/project/n2base/extensive-react-boilerplate /Users/devinnguyen/Documents/project/n2base/apps/web
```

Verify: `ls /Users/devinnguyen/Documents/project/n2base/apps/web/src` — should list Next.js source folders (app, components, hooks, services)

- [ ] **Step 3: Remove old node_modules from both apps**

```bash
rm -rf /Users/devinnguyen/Documents/project/n2base/apps/api/node_modules
rm -rf /Users/devinnguyen/Documents/project/n2base/apps/web/node_modules
```

These will be reinstalled by pnpm from the workspace root with proper symlinking.

- [ ] **Step 4: Remove old package-lock.json files**

```bash
rm -f /Users/devinnguyen/Documents/project/n2base/apps/api/package-lock.json
rm -f /Users/devinnguyen/Documents/project/n2base/apps/web/package-lock.json
```

pnpm will create a single `pnpm-lock.yaml` at the workspace root.

- [ ] **Step 5: Remove per-app .github directories**

```bash
rm -rf /Users/devinnguyen/Documents/project/n2base/apps/api/.github
rm -rf /Users/devinnguyen/Documents/project/n2base/apps/web/.github
```

CI workflows are consolidated in the root `.github/workflows/` created in Task 9.

- [ ] **Step 6: Remove per-app .husky directories**

```bash
rm -rf /Users/devinnguyen/Documents/project/n2base/apps/api/.husky
rm -rf /Users/devinnguyen/Documents/project/n2base/apps/web/.husky
```

Husky is set up at the workspace root in Task 8.

---

### Task 5: Migrate apps/api config files

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/tsconfig.json`
- Modify: `apps/api/eslint.config.mjs`
- Delete: `apps/api/commitlint.config.js`

- [ ] **Step 1: Update apps/api/package.json — name**

In `/Users/devinnguyen/Documents/project/n2base/apps/api/package.json`, change:

```json
"name": "nestjs-boilerplate",
```

to:

```json
"name": "@n2base/api",
```

- [ ] **Step 2: Update apps/api/package.json — engines**

Change the engines field from:

```json
"engines": {
  "node": ">=16.0.0",
  "npm": ">=8.0.0"
},
```

to:

```json
"engines": {
  "node": ">=22",
  "pnpm": ">=9"
},
```

- [ ] **Step 3: Remove prepare script from apps/api/package.json**

In the scripts section, remove:

```json
"prepare": "is-ci || husky",
```

Husky is now managed at the workspace root.

- [ ] **Step 4: Remove per-app devDependencies from apps/api/package.json**

Remove these five entries from devDependencies (they moved to the root package.json):

```
"@commitlint/cli": "20.5.0",
"@commitlint/config-conventional": "20.5.0",
"husky": "9.1.7",
"is-ci": "4.1.0",
"prettier": "3.8.1",
```

- [ ] **Step 5: Add workspace packages to apps/api/package.json devDependencies**

Add these two entries to devDependencies:

```json
"@n2base/eslint-config": "workspace:*",
"@n2base/tsconfig": "workspace:*",
```

- [ ] **Step 6: Replace apps/api/tsconfig.json**

Replace the entire content of `/Users/devinnguyen/Documents/project/n2base/apps/api/tsconfig.json` with:

```json
{
  "extends": "@n2base/tsconfig/nestjs.json",
  "compilerOptions": {
    "declaration": true,
    "removeComments": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "outDir": "./dist",
    "incremental": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "noFallthroughCasesInSwitch": false
  },
  "include": ["src/**/*", "test/**/*", ".install-scripts/**/*"]
}
```

These app-level overrides intentionally relax certain strict checks (the NestJS boilerplate uses selective strictness, not full `strict: true`). `outDir: ./dist` must live here, not in the shared package, because tsconfig path resolution is relative to the declaring file.

- [ ] **Step 7: Replace apps/api/eslint.config.mjs**

Replace the entire content of `/Users/devinnguyen/Documents/project/n2base/apps/api/eslint.config.mjs` with:

```js
import sharedConfig from '@n2base/eslint-config';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...sharedConfig,
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  {
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'require-await': 'off',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.object.name=configService][callee.property.name=/^(get|getOrThrow)$/]:not(:has([arguments.1] Property[key.name=infer][value.value=true])), CallExpression[callee.object.property.name=configService][callee.property.name=/^(get|getOrThrow)$/]:not(:has([arguments.1] Property[key.name=infer][value.value=true]))',
          message:
            'Add "{ infer: true }" to configService.get() for correct typechecking. Example: configService.get("database.port", { infer: true })',
        },
        {
          selector:
            'CallExpression[callee.name=it][arguments.0.value!=/^should/]',
          message: '"it" should start with "should"',
        },
      ],
    },
  },
];
```

Key change from original: replaced `...compat.extends('plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended')` with `...sharedConfig` (Prettier integration) + `...compat.extends('plugin:@typescript-eslint/recommended')` only. Prettier config now comes from root `.prettierrc`.

- [ ] **Step 8: Delete apps/api/commitlint.config.js**

```bash
rm /Users/devinnguyen/Documents/project/n2base/apps/api/commitlint.config.js
```

---

### Task 6: Migrate apps/web config files

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/tsconfig.json`
- Modify: `apps/web/eslint.config.mjs`
- Delete: `apps/web/.prettierrc`
- Delete: `apps/web/commitlint.config.js`

- [ ] **Step 1: Update apps/web/package.json — name**

In `/Users/devinnguyen/Documents/project/n2base/apps/web/package.json`, change:

```json
"name": "reactjs-boilerplate",
```

to:

```json
"name": "@n2base/web",
```

- [ ] **Step 2: Update apps/web/package.json — engines**

Change:

```json
"engines": {
  "node": ">=16.0.0",
  "npm": ">=8.0.0"
},
```

to:

```json
"engines": {
  "node": ">=22",
  "pnpm": ">=9"
},
```

- [ ] **Step 3: Remove prepare script from apps/web/package.json**

Remove from scripts:

```json
"prepare": "is-ci || husky",
```

- [ ] **Step 4: Remove per-app devDependencies from apps/web/package.json**

Remove these five entries from devDependencies:

```
"@commitlint/cli": "20.5.0",
"@commitlint/config-conventional": "20.5.0",
"husky": "9.1.7",
"is-ci": "4.1.0",
"prettier": "3.8.3",
```

- [ ] **Step 5: Add workspace packages to apps/web/package.json devDependencies**

Add to devDependencies:

```json
"@n2base/eslint-config": "workspace:*",
"@n2base/tsconfig": "workspace:*",
```

- [ ] **Step 6: Replace apps/web/tsconfig.json**

Replace the entire content of `/Users/devinnguyen/Documents/project/n2base/apps/web/tsconfig.json` with:

```json
{
  "extends": "@n2base/tsconfig/nextjs.json",
  "compilerOptions": {
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "src/proxy.ts",
    "./.next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules", "**/*.stories.ts", "**/*.stories.tsx"]
}
```

- [ ] **Step 7: Replace apps/web/eslint.config.mjs**

Replace the entire content of `/Users/devinnguyen/Documents/project/n2base/apps/web/eslint.config.mjs` with:

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import sharedConfig from '@n2base/eslint-config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...sharedConfig,
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'dist/**',
    'playwright-report/**',
    'test-results/**',
    '*.config.js',
    '*.config.mjs',
  ]),

  {
    rules: {
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'array-callback-return': 'error',
      eqeqeq: 'error',
      'no-alert': 'error',
      'no-return-assign': 'error',
      'no-extra-boolean-cast': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-empty-pattern': 'error',
      'no-unused-vars': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.property.name=required][callee.object.callee.property.name=nullable]',
          message:
            '.nullable() should be after .required() for correct validation and type inference. Example: id: yup.string().required().nullable()',
        },
        {
          selector:
            'CallExpression[callee.name=watch], MemberExpression[object.name=methods][property.name=watch]',
          message:
            '"watch" re-render the whole form component. Use hook "useWatch" instead.',
        },
        {
          selector:
            'VariableDeclarator > ObjectPattern > Property[key.name=formState]',
          message:
            '"formState" re-render the whole form component. Use hook "useFormState" instead.',
        },
        {
          selector: 'MemberExpression[object.name=React][property.name=/^use/]',
          message:
            'Use hooks without "React" prefix. Example: "useEffect" instead of "React.useEffect".',
        },
        {
          selector:
            'ConditionalExpression[consequent.type=Literal][consequent.value=true][alternate.type=Literal][alternate.value=false]',
          message:
            'Do not use "condition ? true : false". Simplify "someVariable === 42 ? true : false" to "someVariable === 42"',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@mui/material',
              message:
                "Please use \"import ComponentName from '@mui/material/ComponentName'\" instead.",
            },
            {
              name: '@mui/icons-material',
              message:
                "Please use \"import IconName from '@mui/icons-material/IconName'\" instead.",
            },
            {
              name: 'next/link',
              message:
                'Please use "import Link from \'@/components/link\'" instead. This is needed for "leave page" logic.',
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
```

Key changes: removed `import prettierPlugin` and its inline `prettier/prettier` rule config (which had the old `singleQuote: false` settings). Added `...sharedConfig` which now provides the Prettier integration using the unified root `.prettierrc`.

- [ ] **Step 8: Delete apps/web/.prettierrc**

```bash
rm /Users/devinnguyen/Documents/project/n2base/apps/web/.prettierrc
```

The root `.prettierrc` now applies to both apps.

- [ ] **Step 9: Delete apps/web/commitlint.config.js**

```bash
rm /Users/devinnguyen/Documents/project/n2base/apps/web/commitlint.config.js
```

---

### Task 7: Install dependencies and verify builds

- [ ] **Step 1: Run pnpm install from workspace root**

```bash
cd /Users/devinnguyen/Documents/project/n2base && pnpm install
```

Expected: pnpm discovers all 4 packages (api, web, eslint-config, tsconfig), installs all dependencies, creates `pnpm-lock.yaml` at root. Final line should read something like:
```
Progress: resolved 1200 packages, reused 1150 packages, downloaded 50 packages, added 1200 packages, done
```

If you see `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` errors: verify that the `name` fields in `packages/eslint-config/package.json` and `packages/tsconfig/package.json` exactly match the `workspace:*` references in the app package.json files.

- [ ] **Step 2: Verify apps/api builds**

```bash
cd /Users/devinnguyen/Documents/project/n2base && pnpm turbo run build --filter=@n2base/api
```

Expected output ends with:
```
@n2base/api:build: Successfully compiled 156 files
Tasks:    1 successful, 1 total
```

If TypeScript errors appear from missing decorator metadata: verify `apps/api/tsconfig.json` has `"extends": "@n2base/tsconfig/nestjs.json"` and that `experimentalDecorators` and `emitDecoratorMetadata` are present in `packages/tsconfig/nestjs.json`.

- [ ] **Step 3: Verify apps/api lints**

```bash
pnpm turbo run lint --filter=@n2base/api
```

Expected: No ESLint errors. If `prettier/prettier` errors appear (wrong quotes), check that the root `.prettierrc` exists and has `singleQuote: true`. ESLint picks up the nearest Prettier config — there should be no `.prettierrc` inside `apps/api/`.

- [ ] **Step 4: Verify apps/api tests pass**

```bash
pnpm turbo run test --filter=@n2base/api
```

Expected: Jest test suite passes. The NestJS app has unit tests colocated in `src/` and integration tests in `test/`.

- [ ] **Step 5: Verify apps/web builds**

```bash
pnpm turbo run build --filter=@n2base/web
```

Expected: Next.js build completes, generating `.next/` directory. Final output:
```
@n2base/web:build: ✓ Compiled successfully
Tasks:    1 successful, 1 total
```

- [ ] **Step 6: Verify apps/web lints**

```bash
pnpm turbo run lint --filter=@n2base/web
```

Expected: 0 ESLint errors. If `prettier/prettier` errors about quote style appear (singleQuote), verify the inline prettier config block was fully removed from `apps/web/eslint.config.mjs` — there should be no `prettier: prettierPlugin` in the plugins object and no inline `"prettier/prettier": ["error", { ... }]` rule.

---

### Task 8: Set up root Husky git hooks

**Files:**
- Create: `.husky/commit-msg`
- Create: `.husky/pre-commit`

Note: Husky requires a git repository. If `n2base/` is not yet a git repo, run `git init` before this task.

- [ ] **Step 1: Initialize Husky at workspace root**

```bash
cd /Users/devinnguyen/Documents/project/n2base && pnpm exec husky init
```

Expected: Creates `.husky/` directory with a sample `pre-commit` file. Output: `husky - created .husky/pre-commit`

- [ ] **Step 2: Write .husky/pre-commit**

Replace the generated content of `/Users/devinnguyen/Documents/project/n2base/.husky/pre-commit` with:

```sh
pnpm turbo run lint
```

- [ ] **Step 3: Create .husky/commit-msg**

Create `/Users/devinnguyen/Documents/project/n2base/.husky/commit-msg` with:

```sh
pnpm exec commitlint --edit "$1"
```

- [ ] **Step 4: Make hooks executable**

```bash
chmod +x /Users/devinnguyen/Documents/project/n2base/.husky/pre-commit
chmod +x /Users/devinnguyen/Documents/project/n2base/.husky/commit-msg
```

- [ ] **Step 5: Test commitlint hook**

```bash
cd /Users/devinnguyen/Documents/project/n2base
echo "bad commit message" | pnpm exec commitlint
```

Expected: exits with error:
```
⧗   input: bad commit message
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```

Then test a valid message:

```bash
echo "feat: add monorepo structure" | pnpm exec commitlint
```

Expected: No output, exit code 0.

---

### Task 9: Set up unified GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/e2e.yml`

- [ ] **Step 1: Create .github/workflows directory**

```bash
mkdir -p /Users/devinnguyen/Documents/project/n2base/.github/workflows
```

- [ ] **Step 2: Create .github/workflows/ci.yml**

Create `/Users/devinnguyen/Documents/project/n2base/.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-test-lint:
    name: Build, Test, Lint
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

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build, lint, test affected packages
        run: pnpm turbo run build lint test --filter=[HEAD^1]
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

  test-generators-api:
    name: Test API hygen generators
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Test relational generators
        working-directory: apps/api
        run: bash test/generators/run-static.sh relational

      - name: Test document generators
        working-directory: apps/api
        run: bash test/generators/run-static.sh document

  test-generators-web:
    name: Test web hygen generators
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Test resource generator
        working-directory: apps/web
        run: pnpm exec hygen generate resource --name TestResource

      - name: Test field generator
        working-directory: apps/web
        run: pnpm exec hygen generate field --name testField
```

Note on generator test commands: `hygen generate resource --name TestResource` passes the resource name as a CLI arg to skip interactive prompts. If the hygen template requires additional prompts, cross-reference the original `apps/web/.github/workflows/cli.yml` (recoverable from git history if the repo was previously initialized) for the exact commands used.

- [ ] **Step 3: Create .github/workflows/e2e.yml**

Create `/Users/devinnguyen/Documents/project/n2base/.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  e2e-api-relational:
    name: API Docker E2E (relational)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run relational E2E in Docker
        working-directory: apps/api
        run: bash test/generators/run-crud-relational.sh

  e2e-web:
    name: Web Playwright E2E
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        working-directory: apps/web
        run: pnpm exec playwright install --with-deps chromium

      - name: Run Playwright tests
        working-directory: apps/web
        run: pnpm run test:e2e
        env:
          CI: true
```

---

### Task 10: Final integration verification

- [ ] **Step 1: Run full workspace build**

```bash
cd /Users/devinnguyen/Documents/project/n2base && pnpm turbo run build
```

Expected:
```
Tasks:    2 successful, 2 total
Cached:   0 cached, 2 total
Time:     ...
```

- [ ] **Step 2: Run full workspace lint**

```bash
pnpm turbo run lint
```

Expected: Both `@n2base/api` and `@n2base/web` report 0 ESLint errors.

- [ ] **Step 3: Run full workspace tests**

```bash
pnpm turbo run test
```

Expected: NestJS Jest tests pass. Next.js may skip (no unit test script configured) — this is expected.

- [ ] **Step 4: Verify Turborepo cache works**

```bash
pnpm turbo run build
```

Expected — both tasks are cache hits:
```
Tasks:    2 successful, 2 total
Cached:   2 cached, 2 total
```

No rebuild should occur since no files changed.

- [ ] **Step 5: Verify filter works for targeted execution**

```bash
# Should only build/lint/test the API
pnpm turbo run build lint test --filter=@n2base/api
```

Expected: Only `@n2base/api:build`, `@n2base/api:lint`, `@n2base/api:test` appear in output. `@n2base/web` tasks do not run.

- [ ] **Step 6: Verify dev servers start**

```bash
# Start API dev server — Ctrl+C to stop
pnpm turbo run dev --filter=@n2base/api
```

Expected: NestJS server starts on its configured port with no errors.

```bash
# Start web dev server — Ctrl+C to stop
pnpm turbo run dev --filter=@n2base/web
```

Expected: Next.js dev server starts with Turbopack on its configured port with no errors.
