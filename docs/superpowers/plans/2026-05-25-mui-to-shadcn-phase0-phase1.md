# MUI → shadcn/ui + Tailwind: Phase 0+1 (Infrastructure + UI Shell) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Tailwind CSS + shadcn/ui, configure the AI dark design system, and migrate all UI shell components (AppBar, ConfirmDialog, loaders, toasts, table adapters) from MUI to custom Tailwind components — while keeping all MUI form components working untouched.

**Architecture:** Phase 0 is purely additive — nothing is removed. Phase 1 swaps shell components one at a time. MUI ThemeProvider and form components continue to function throughout both phases. The app is deployable after every task. Phase 2 (form components) and Phase 3 (pages + MUI removal) are separate plans.

**Tech Stack:** Next.js 16, shadcn/ui (New York style), Tailwind CSS v4, next-themes, lucide-react, Sonner, pnpm monorepo (`@n2base/web`)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `apps/web/components.json` | Create | shadcn/ui config |
| `apps/web/postcss.config.mjs` | Create | Tailwind v4 PostCSS plugin |
| `apps/web/src/app/globals.css` | Modify | AI dark design tokens (replaces empty file) |
| `apps/web/src/lib/utils.ts` | Create | `cn()` helper |
| `apps/web/src/components/theme/theme-provider.tsx` | Modify | Add next-themes wrapper around MUI ThemeProvider |
| `apps/web/src/app/[language]/layout.tsx` | Modify | Remove InitColorSchemeScript, add Sonner `<Toaster>` |
| `apps/web/src/components/switch-theme-button.tsx` | Rewrite | MUI → next-themes + lucide-react |
| `apps/web/src/components/snackbar-provider.tsx` | Rewrite | react-toastify → Sonner re-export |
| `apps/web/src/components/full-page-loader.tsx` | Rewrite | MUI Modal+Spinner → Tailwind |
| `apps/web/src/components/confirm-dialog/confirm-dialog-provider.tsx` | Rewrite | MUI Dialog → shadcn AlertDialog |
| `apps/web/src/components/app-bar.tsx` | Rewrite | MUI AppBar → dark terminal-style Tailwind header |
| `apps/web/src/components/table/table-components.tsx` | Rewrite | MUI Table adapters → native HTML table adapters |
| `apps/web/.storybook/preview.ts` | Modify | Import globals.css so Tailwind works in Storybook |
| `apps/web/src/components/ui/button.tsx` | Create (shadcn) | shadcn Button primitive |
| `apps/web/src/components/ui/alert-dialog.tsx` | Create (shadcn) | shadcn AlertDialog primitive |

---

## Phase 0 — Infrastructure Setup

### Task 1: Initialize shadcn/ui + Tailwind CSS

All commands run from `apps/web/`.

**Files:**
- Create: `apps/web/components.json`
- Create: `apps/web/postcss.config.mjs`
- Modify: `apps/web/src/app/globals.css` (shadcn adds its base tokens — we override in Task 2)
- Create: `apps/web/src/lib/utils.ts`

- [ ] **Step 1: Run shadcn init from the web app directory**

```bash
cd apps/web && pnpm dlx shadcn@latest init
```

Answer the interactive prompts exactly as follows:
```
Which style would you like to use? › New York
Which base color would you like to use? › Zinc
Would you like to use CSS variables for theming? › yes
```

shadcn will install `tailwindcss`, `@tailwindcss/postcss`, create `postcss.config.mjs`, update `globals.css`, and create `src/lib/utils.ts` with `cn()`.

- [ ] **Step 2: Verify Tailwind is working**

```bash
cd apps/web && pnpm dev
```

Open http://localhost:3000 — the app should still work (MUI styles intact). Tailwind is now loaded but no Tailwind classes are used yet.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components.json apps/web/postcss.config.mjs apps/web/src/app/globals.css apps/web/src/lib/utils.ts apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): init shadcn/ui + tailwind css"
```

---

### Task 2: Override globals.css with AI dark design tokens

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Replace globals.css with AI dark theme tokens**

Replace the entire content of `apps/web/src/app/globals.css` with:

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-bg: #09090b;
  --color-surface: #18181b;
  --color-border: #27272a;
  --color-border-subtle: #1a1a1d;
  --color-accent: #22c55e;
  --color-accent-hover: #16a34a;
  --color-warn: #f97316;
  --color-muted: #71717a;
  --color-muted-foreground: #52525b;
  --color-foreground: #fafafa;
  --color-foreground-secondary: #a1a1aa;

  --font-mono: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}

:root {
  background-color: var(--color-bg);
  color: var(--color-foreground);
}

body {
  background-color: var(--color-bg);
  color: var(--color-foreground);
  font-family: var(--font-sans);
}

/* shadcn CSS variable bridge — maps shadcn token names to our tokens */
:root, .dark {
  --background: 240 10% 4%;         /* #09090b */
  --foreground: 0 0% 98%;           /* #fafafa */
  --card: 240 5% 10%;               /* #18181b */
  --card-foreground: 0 0% 98%;
  --border: 240 4% 16%;             /* #27272a */
  --input: 240 4% 16%;
  --primary: 142 71% 45%;           /* #22c55e */
  --primary-foreground: 240 10% 4%;
  --secondary: 240 5% 10%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 4% 16%;
  --muted-foreground: 240 4% 46%;   /* #71717a */
  --accent: 240 5% 25%;
  --accent-foreground: 0 0% 98%;
  --destructive: 25 95% 53%;        /* #f97316 */
  --destructive-foreground: 0 0% 98%;
  --ring: 142 71% 45%;
  --radius: 0.375rem;
}
```

- [ ] **Step 2: Remove `@fontsource/roboto` imports from layout**

In `apps/web/src/app/[language]/layout.tsx`, remove these three lines:

```ts
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
```

- [ ] **Step 3: Verify dev server still runs**

```bash
cd apps/web && pnpm dev
```

App should render. It will look darker than before — that's correct.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/app/\[language\]/layout.tsx
git commit -m "feat(web): set AI dark design tokens in globals.css"
```

---

### Task 3: Install next-themes + remaining dependencies

**Files:** `apps/web/package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install next-themes and lucide-react**

```bash
cd apps/web && pnpm add next-themes lucide-react
```

- [ ] **Step 2: Install Sonner (toast replacement)**

```bash
cd apps/web && pnpm add sonner
```

- [ ] **Step 3: Install react-day-picker and @tiptap packages** (needed now so lock file is settled before Phase 2)

```bash
cd apps/web && pnpm add react-day-picker @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): install next-themes, lucide-react, sonner, react-day-picker, tiptap"
```

---

### Task 4: Wire next-themes into ThemeProvider

MUI's `useColorScheme` reads `.dark` / `.light` CSS classes set by `next-themes`. They are compatible — no MUI changes needed yet.

**Files:**
- Modify: `apps/web/src/components/theme/theme-provider.tsx`

- [ ] **Step 1: Update ThemeProvider to wrap MUI with next-themes**

Replace the entire content of `apps/web/src/components/theme/theme-provider.tsx`:

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useMemo, PropsWithChildren } from 'react';
import StyledJsxRegistry from './registry';

function ThemeProvider({ children }: PropsWithChildren) {
  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: {
          colorSchemeSelector: 'class',
        },
        colorSchemes: { light: true, dark: true },
      }),
    [],
  );

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <StyledJsxRegistry>
        <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
      </StyledJsxRegistry>
    </NextThemesProvider>
  );
}

export default ThemeProvider;
```

- [ ] **Step 2: Remove InitColorSchemeScript from layout**

In `apps/web/src/app/[language]/layout.tsx`, remove this import:

```ts
import InitColorSchemeScript from '@/components/theme/init-color-scheme-script';
```

And remove its JSX usage:

```tsx
<InitColorSchemeScript />
```

(next-themes handles flash-of-unstyled-content automatically via its script injection.)

- [ ] **Step 3: Verify dev server — theme toggle still works**

```bash
cd apps/web && pnpm dev
```

Click the theme toggle button. Dark/light should still switch. Check browser DevTools — `<html>` should get `class="dark"` or `class="light"`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/theme/theme-provider.tsx apps/web/src/app/\[language\]/layout.tsx
git commit -m "feat(web): integrate next-themes alongside MUI ThemeProvider"
```

---

### Task 5: Add Tailwind CSS to Storybook

**Files:**
- Modify: `apps/web/.storybook/preview.ts`

- [ ] **Step 1: Import globals.css in Storybook preview**

Replace the entire content of `apps/web/.storybook/preview.ts`:

```ts
import type { Preview } from '@storybook/nextjs';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#09090b' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
};

export default preview;
```

- [ ] **Step 2: Verify Storybook starts**

```bash
cd apps/web && pnpm sb
```

Open http://localhost:6006. Background should be dark (#09090b). Existing MUI stories still render correctly.

- [ ] **Step 3: Commit**

```bash
git add apps/web/.storybook/preview.ts
git commit -m "feat(web): add tailwind css + dark background to storybook"
```

---

## Phase 1 — UI Shell Migration

### Task 6: Replace SwitchThemeButton

**Files:**
- Rewrite: `apps/web/src/components/switch-theme-button.tsx`

- [ ] **Step 1: Install shadcn Button primitive**

```bash
cd apps/web && pnpm dlx shadcn@latest add button
```

This creates `apps/web/src/components/ui/button.tsx`.

- [ ] **Step 2: Rewrite switch-theme-button.tsx**

Replace the entire content of `apps/web/src/components/switch-theme-button.tsx`:

```tsx
'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThemeSwitchButton = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="text-[--color-muted] hover:text-[--color-foreground] hover:bg-[--color-surface]"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  );
};

export default ThemeSwitchButton;
```

- [ ] **Step 3: Verify dev server — theme toggle works**

```bash
cd apps/web && pnpm dev
```

Click the sun/moon icon. Theme should switch. The icon should change.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/switch-theme-button.tsx apps/web/src/components/ui/button.tsx
git commit -m "feat(web): replace MUI SwitchThemeButton with next-themes + lucide-react"
```

---

### Task 7: Replace Snackbar with Sonner

**Files:**
- Rewrite: `apps/web/src/components/snackbar-provider.tsx`
- Modify: `apps/web/src/app/[language]/layout.tsx`

- [ ] **Step 1: Rewrite snackbar-provider.tsx as Sonner Toaster**

Replace the entire content of `apps/web/src/components/snackbar-provider.tsx`:

```tsx
'use client';

export { Toaster as default } from 'sonner';
```

- [ ] **Step 2: Update layout.tsx — replace ToastContainer props with Sonner Toaster**

In `apps/web/src/app/[language]/layout.tsx`, the existing usage is:

```tsx
<ToastContainer position="bottom-left" hideProgressBar />
```

Replace it with:

```tsx
<ToastContainer position="bottom-left" theme="dark" richColors />
```

Sonner's `Toaster` accepts `position` and `theme` props directly. The `hideProgressBar` prop does not exist on Sonner — remove it.

- [ ] **Step 3: Find all `toast()` calls in the codebase and verify they still work**

```bash
grep -r "from 'react-toastify'" apps/web/src --include="*.ts" --include="*.tsx" -l
```

Sonner's `toast()` API is compatible with react-toastify for basic calls (`toast.success()`, `toast.error()`). No changes needed to callers.

- [ ] **Step 4: Uninstall react-toastify**

```bash
cd apps/web && pnpm remove react-toastify
```

- [ ] **Step 5: Verify dev server — toast notifications still work**

```bash
cd apps/web && pnpm dev
```

Trigger a login error or success to verify toasts appear in bottom-left.

- [ ] **Step 6: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/snackbar-provider.tsx apps/web/src/app/\[language\]/layout.tsx apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): replace react-toastify with sonner"
```

---

### Task 8: Replace FullPageLoader

**Files:**
- Rewrite: `apps/web/src/components/full-page-loader.tsx`

- [ ] **Step 1: Rewrite full-page-loader.tsx**

Replace the entire content of `apps/web/src/components/full-page-loader.tsx`:

```tsx
type FullPageLoaderType = {
  isLoading: boolean;
};

export function FullPageLoader({ isLoading }: FullPageLoaderType) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[--color-bg]/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" />
        <span className="font-mono text-xs text-[--color-muted]">loading...</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify dev server — loader still renders**

```bash
cd apps/web && pnpm dev
```

Navigate to a page that triggers the full-page loader (e.g. a page with a slow API call). The spinner should appear centered with a dark overlay.

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/full-page-loader.tsx
git commit -m "feat(web): replace MUI FullPageLoader with tailwind spinner"
```

---

### Task 9: Replace ConfirmDialogProvider

**Files:**
- Modify: `apps/web/src/components/confirm-dialog/confirm-dialog-provider.tsx`

- [ ] **Step 1: Install shadcn AlertDialog**

```bash
cd apps/web && pnpm dlx shadcn@latest add alert-dialog
```

This creates `apps/web/src/components/ui/alert-dialog.tsx`.

- [ ] **Step 2: Rewrite confirm-dialog-provider.tsx**

Replace the entire content of `apps/web/src/components/confirm-dialog/confirm-dialog-provider.tsx`:

```tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ConfirmDialogActionsContext,
  ConfirmDialogOptions,
} from './confirm-dialog-context';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/services/i18n/client';

function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation('confirm-dialog');

  const defaultConfirmDialogInfo = useMemo<ConfirmDialogOptions>(
    () => ({
      title: t('title'),
      message: t('message'),
      successButtonText: t('actions.yes'),
      cancelButtonText: t('actions.no'),
    }),
    [t],
  );

  const [confirmDialogInfo, setConfirmDialogInfo] =
    useState<ConfirmDialogOptions>(defaultConfirmDialogInfo);
  const resolveRef = useRef<(value: boolean) => void>(undefined);

  const onCancel = () => {
    setIsOpen(false);
    resolveRef.current?.(false);
  };

  const onSuccess = () => {
    setIsOpen(false);
    resolveRef.current?.(true);
  };

  const confirmDialog = useCallback(
    (options: Partial<ConfirmDialogOptions> = {}) => {
      return new Promise<boolean>((resolve) => {
        setConfirmDialogInfo({ ...defaultConfirmDialogInfo, ...options });
        setIsOpen(true);
        resolveRef.current = resolve;
      });
    },
    [defaultConfirmDialogInfo],
  );

  const contextActions = useMemo(() => ({ confirmDialog }), [confirmDialog]);

  return (
    <>
      <ConfirmDialogActionsContext.Provider value={contextActions}>
        {children}
      </ConfirmDialogActionsContext.Provider>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="bg-[--color-surface] border-[--color-border] font-mono">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[--color-foreground]">
              {confirmDialogInfo.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[--color-muted]">
              {confirmDialogInfo.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={onCancel}
              className="bg-transparent border-[--color-border] text-[--color-foreground-secondary] hover:bg-[--color-bg]"
            >
              {confirmDialogInfo.cancelButtonText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onSuccess}
              className="bg-[--color-accent] text-[--color-bg] hover:bg-[--color-accent-hover]"
            >
              {confirmDialogInfo.successButtonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ConfirmDialogProvider;
```

- [ ] **Step 3: Verify dev server — confirm dialog appears correctly**

```bash
cd apps/web && pnpm dev
```

Trigger a confirm dialog (e.g. delete a user). The dialog should appear dark with green confirm button.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/confirm-dialog/confirm-dialog-provider.tsx apps/web/src/components/ui/alert-dialog.tsx
git commit -m "feat(web): replace MUI Dialog with shadcn AlertDialog in ConfirmDialogProvider"
```

---

### Task 10: Replace Table components adapter

The `table-components.tsx` provides adapters for `react-virtuoso` virtual scrolling. We replace the MUI table adapters with native HTML element equivalents.

**Files:**
- Rewrite: `apps/web/src/components/table/table-components.tsx`

- [ ] **Step 1: Install shadcn Table primitive**

```bash
cd apps/web && pnpm dlx shadcn@latest add table
```

This creates `apps/web/src/components/ui/table.tsx`.

- [ ] **Step 2: Rewrite table-components.tsx**

Replace the entire content of `apps/web/src/components/table/table-components.tsx`:

```tsx
import { Ref } from 'react';
import { ScrollerProps, TableComponents as TableComponentsType } from 'react-virtuoso';
import { cn } from '@/lib/utils';

const TableComponents: TableComponentsType = {
  Scroller: function Scroller(
    props: ScrollerProps & { ref?: Ref<HTMLDivElement> },
  ) {
    return (
      <div
        {...props}
        ref={props.ref}
        className={cn('relative w-full overflow-auto', props.className as string)}
      />
    );
  },
  Table: ({ style, ...props }) => (
    <table
      {...props}
      style={{ ...style, borderCollapse: 'separate', borderSpacing: 0 }}
      className="w-full caption-bottom text-sm font-mono"
    />
  ),
  TableHead: (({ style, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & { ref?: Ref<HTMLTableSectionElement> }) => (
    <thead {...props} className="[&_tr]:border-b border-[--color-border] bg-[--color-bg] sticky top-0 z-10" />
  )) as unknown as TableComponentsType['TableHead'],
  TableFoot: (({ style, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & { ref?: Ref<HTMLTableSectionElement> }) => (
    <tfoot {...props} className="border-t border-[--color-border] bg-[--color-surface]" />
  )) as unknown as TableComponentsType['TableFoot'],
  TableRow: ({ style, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      {...props}
      className="border-b border-[--color-border-subtle] transition-colors hover:bg-[--color-surface]/50"
    />
  ),
  TableBody: function BodyTable(
    props: React.HTMLAttributes<HTMLTableSectionElement> & { ref?: Ref<HTMLTableSectionElement> },
  ) {
    const { ref, ...rest } = props;
    return <tbody {...rest} ref={ref} className="[&_tr:last-child]:border-0" />;
  },
};

export default TableComponents;
```

- [ ] **Step 3: Verify dev server — admin user table renders**

```bash
cd apps/web && pnpm dev
```

Navigate to `/admin-panel/users`. The user list should render with dark table rows and subtle hover state.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/table/table-components.tsx apps/web/src/components/ui/table.tsx
git commit -m "feat(web): replace MUI table adapters with native HTML + tailwind for react-virtuoso"
```

---

### Task 11: Replace AppBar

The AppBar is the most complex Phase 1 component. It is auth-aware, responsive (mobile hamburger + desktop links), includes user avatar menu, language switcher, and theme toggle.

**Files:**
- Rewrite: `apps/web/src/components/app-bar.tsx`

- [ ] **Step 1: Install shadcn DropdownMenu**

```bash
cd apps/web && pnpm dlx shadcn@latest add dropdown-menu avatar separator
```

This creates `apps/web/src/components/ui/dropdown-menu.tsx`, `avatar.tsx`, `separator.tsx`.

- [ ] **Step 2: Rewrite app-bar.tsx**

Replace the entire content of `apps/web/src/components/app-bar.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Menu, X, Terminal, User, LogOut } from 'lucide-react';
import useAuth from '@/services/auth/use-auth';
import useAuthActions from '@/services/auth/use-auth-actions';
import { useTranslation } from '@/services/i18n/client';
import Link from '@/components/link';
import { RoleEnum } from '@/services/api/types/role';
import ThemeSwitchButton from '@/components/switch-theme-button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { IS_SIGN_UP_ENABLED } from '@/services/auth/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function ResponsiveAppBar() {
  const { t } = useTranslation('common');
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role?.id === String(RoleEnum.Admin);

  const navLinks = [
    ...(isAdmin ? [{ href: '/admin-panel/users', label: t('navigation.users') }] : []),
  ];

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U'
    : '';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[--color-border] bg-[--color-bg]/95 backdrop-blur supports-[backdrop-filter]:bg-[--color-bg]/60">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-4 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-semibold text-[--color-foreground] no-underline"
        >
          <Terminal className="h-4 w-4 text-[--color-accent]" />
          <span>&gt;_ n2base</span>
        </Link>

        {/* Desktop nav */}
        {isLoaded && user && navLinks.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-3 py-1.5 font-mono text-xs text-[--color-muted] no-underline transition-colors hover:bg-[--color-surface] hover:text-[--color-foreground]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitchButton />

          {isLoaded && !user && (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="font-mono text-xs">
                  {t('navigation.signIn')}
                </Button>
              </Link>
              {IS_SIGN_UP_ENABLED && (
                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="font-mono text-xs bg-[--color-accent] text-[--color-bg] hover:bg-[--color-accent-hover]"
                  >
                    {t('navigation.signUp')}
                  </Button>
                </Link>
              )}
            </div>
          )}

          {isLoaded && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.photo?.path} alt={userInitials} />
                    <AvatarFallback className="bg-[--color-surface] border border-[--color-border] font-mono text-xs text-[--color-accent]">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-[--color-surface] border-[--color-border] font-mono text-xs"
              >
                <div className="px-2 py-1.5 text-[--color-muted]">
                  {user.email}
                </div>
                <DropdownMenuSeparator className="bg-[--color-border]" />
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-[--color-foreground-secondary] no-underline"
                  >
                    <User className="h-3 w-3" />
                    {t('navigation.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[--color-border]" />
                <DropdownMenuItem
                  onClick={logOut}
                  className="flex items-center gap-2 text-[--color-warn] focus:text-[--color-warn] cursor-pointer"
                >
                  <LogOut className="h-3 w-3" />
                  {t('navigation.logOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile hamburger */}
          {isLoaded && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[--color-border] bg-[--color-bg] px-4 py-3 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="font-mono text-xs text-[--color-muted] no-underline py-1"
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <>
              <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full font-mono text-xs">
                  {t('navigation.signIn')}
                </Button>
              </Link>
              {IS_SIGN_UP_ENABLED && (
                <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full font-mono text-xs bg-[--color-accent] text-[--color-bg]">
                    {t('navigation.signUp')}
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default ResponsiveAppBar;
```

- [ ] **Step 3: Verify dev server — AppBar renders correctly**

```bash
cd apps/web && pnpm dev
```

Check:
- Dark sticky header with `>_ n2base` logo and green terminal icon
- Logged out: Sign In / Sign Up buttons visible
- Logged in: Avatar with dropdown showing profile + logout
- Mobile: hamburger opens/closes nav drawer
- Theme toggle still works

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/app-bar.tsx apps/web/src/components/ui/dropdown-menu.tsx apps/web/src/components/ui/avatar.tsx apps/web/src/components/ui/separator.tsx
git commit -m "feat(web): replace MUI AppBar with dark terminal-style tailwind header"
```

---

### Task 12: Final Phase 1 cleanup

Remove MUI packages that are no longer used by any remaining Phase 1 shell component. Note: `@mui/material` and `@emotion/*` stay until Phase 3 (form components still use them).

**Files:**
- Modify: `apps/web/src/components/theme/init-color-scheme-script.tsx` (can be deleted)

- [ ] **Step 1: Delete init-color-scheme-script.tsx**

```bash
rm apps/web/src/components/theme/init-color-scheme-script.tsx
```

- [ ] **Step 2: Verify no remaining imports of init-color-scheme-script**

```bash
grep -r "init-color-scheme-script" apps/web/src --include="*.ts" --include="*.tsx"
```

Expected: no results (we already removed it from layout.tsx in Task 4 Step 2).

- [ ] **Step 3: Verify TypeScript + lint**

```bash
cd apps/web && pnpm tsc --noEmit && pnpm lint
```

Expected: no errors (warnings about `any` types in existing files are pre-existing and not our concern).

- [ ] **Step 4: Run Storybook to verify no regressions**

```bash
cd apps/web && pnpm sb
```

All existing MUI form component stories should render. Backgrounds should be dark.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(web): phase 0+1 complete — shadcn/tailwind shell with MUI form coexistence"
```

---

## Next Steps

- **Phase 2 plan:** `docs/superpowers/plans/2026-05-25-mui-to-shadcn-phase2-form-components.md`
  - Migrate all 27 form components to shadcn + Tailwind (including DatePicker, Tiptap rich text)
  - Each component migrated alongside its Storybook story

- **Phase 3 plan:** `docs/superpowers/plans/2026-05-25-mui-to-shadcn-phase3-pages-cleanup.md`
  - Migrate all pages to use Phase 1+2 components
  - Remove MUI ThemeProvider, Emotion registry
  - Uninstall all `@mui/*` and `@emotion/*` packages
