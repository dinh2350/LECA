# MUI → shadcn/ui + Tailwind: Phase 3 (Pages + MUI Removal) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all remaining MUI primitives (`Button`, `Container`, `Grid`, `Typography`, `Box`, `TableCell`, etc.) in every page component with Tailwind utilities, then remove MUI ThemeProvider, delete the Emotion SSR registry, and uninstall all `@mui/*` and `@emotion/*` packages.

**Architecture:** Pages use MUI layout/typography primitives that have no equivalent in shadcn — they are replaced directly with semantic HTML + Tailwind classes. The Phase 1+2 form and shell components are already shadcn — pages just need their scaffolding swapped. MUI ThemeProvider and Emotion registry are removed last, after every page is clean. The app is deployable after every task.

**Prerequisites:** Phase 0+1+2 complete — all form components and the app shell are already shadcn/Tailwind.

**Tech Stack:** Next.js 16, Tailwind CSS v4, shadcn/ui Button + Badge + Avatar + DropdownMenu (already installed in Phase 1), lucide-react

---

## MUI → Tailwind Quick Reference

Use this mapping throughout all page migrations:

| MUI Component | Tailwind Replacement |
|---|---|
| `<Container maxWidth="md">` | `<div className="mx-auto max-w-3xl px-4">` |
| `<Container maxWidth="lg">` | `<div className="mx-auto max-w-5xl px-4">` |
| `<Grid container spacing={3}>` | `<div className="flex flex-col gap-6">` or `<div className="grid gap-6">` |
| `<Grid>` (child) | `<div>` |
| `<Typography variant="h3">` | `<h3 className="font-mono text-2xl font-semibold text-[--color-foreground]">` |
| `<Typography variant="h4">` | `<h4 className="font-mono text-xl font-semibold text-[--color-foreground]">` |
| `<Typography variant="h6">` | `<h6 className="font-mono text-base font-semibold text-[--color-foreground]">` |
| `<Typography>` (body) | `<p className="text-sm text-[--color-muted]">` |
| `<Box>` | `<div>` (add Tailwind classes as needed) |
| `<MuiLink href="...">` | `<Link href="...">` (custom Link component) or `<a className="text-[--color-accent] hover:underline">` |
| `<Divider>` | `<div className="border-t border-[--color-border]" />` |
| `<Chip label="...">` | `<span className="font-mono text-xs px-2 py-0.5 rounded border border-[--color-border] text-[--color-muted]">` |
| `<Avatar src="..." />` | shadcn `<Avatar>` + `<AvatarImage>` + `<AvatarFallback>` |
| `<LinearProgress>` | `<div className="h-0.5 w-full animate-pulse bg-[--color-accent]/30" />` |
| `<TableCell>` (header) | `<th className="px-4 py-3 text-left font-mono text-xs text-[--color-muted] font-medium">` |
| `<TableCell>` (body) | `<td className="px-4 py-3 text-sm text-[--color-foreground]">` |
| `<TableRow>` | `<tr className="border-b border-[--color-border-subtle] hover:bg-[--color-surface]/50">` |
| `<Button variant="contained">` | shadcn `<Button>` with `className="bg-[--color-accent] text-[--color-bg] hover:bg-[--color-accent-hover]"` |
| `<Button variant="outlined">` | shadcn `<Button variant="outline">` |
| `<Button variant="text">` | shadcn `<Button variant="ghost">` |
| `<IconButton>` | shadcn `<Button variant="ghost" size="icon">` |

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/app/[language]/sign-in/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/sign-up/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/forgot-password/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/password-change/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/confirm-email/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/confirm-new-email/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/privacy-policy/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/profile/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/profile/edit/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/admin-panel/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/admin-panel/users/page-content.tsx` | Rewrite | Remove MUI table + split-button |
| `src/app/[language]/admin-panel/users/user-filter.tsx` | Rewrite | Remove MUI form primitives |
| `src/app/[language]/admin-panel/users/create/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/app/[language]/admin-panel/users/edit/[id]/page-content.tsx` | Rewrite | Remove MUI primitives |
| `src/components/theme/theme-provider.tsx` | Rewrite | Remove MUI ThemeProvider + StyledJsxRegistry |
| `src/components/theme/registry.tsx` | Delete | Emotion SSR helper no longer needed |
| `apps/web/package.json` | Modify | Remove @mui/* and @emotion/* dependencies |

---

## Task 1: Auth pages — sign-in, sign-up, forgot-password, password-change

All four auth pages share the same structure: centered card with a form. Replace MUI layout with a minimal Tailwind card.

**Pattern for all auth pages:**
```tsx
// Replace: <Container maxWidth="xs"><Grid container ...>
// With:
<main className="flex min-h-screen items-center justify-center bg-[--color-bg] px-4 py-12">
  <div className="w-full max-w-sm space-y-6">
    {/* content */}
  </div>
</main>
```

- [ ] **Step 1: Audit all imports in each auth page**

```bash
grep -n "@mui" apps/web/src/app/\[language\]/sign-in/page-content.tsx
grep -n "@mui" apps/web/src/app/\[language\]/sign-up/page-content.tsx
grep -n "@mui" apps/web/src/app/\[language\]/forgot-password/page-content.tsx
grep -n "@mui" apps/web/src/app/\[language\]/password-change/page-content.tsx
```

Use this output to drive the exact replacements needed in each file.

- [ ] **Step 2: Migrate sign-in/page-content.tsx**

Replace all MUI imports with:
```tsx
import { Button } from '@/components/ui/button';
import Link from '@/components/link';
```

Replace layout JSX:
- `<Container>` → `<main className="flex min-h-screen items-center justify-center bg-[--color-bg] px-4 py-12">`
- `<Grid container>` → `<div className="w-full max-w-sm space-y-6">`
- `<Grid>` children → `<div>`
- `<Typography variant="h4">` → `<h1 className="font-mono text-xl font-semibold text-[--color-foreground]">`
- `<Typography>` (body) → `<p className="text-sm text-[--color-muted]">`
- `<Box>` → `<div>`
- `<Button variant="contained">` → `<Button className="w-full bg-[--color-accent] text-[--color-bg] hover:bg-[--color-accent-hover]">`
- `<MuiLink>` → `<Link href="..." className="font-mono text-xs text-[--color-accent] hover:underline">`
- `<Divider>` → `<div className="relative flex items-center"><div className="flex-1 border-t border-[--color-border]" /><span className="mx-2 font-mono text-xs text-[--color-muted]">or</span><div className="flex-1 border-t border-[--color-border]" /></div>`

- [ ] **Step 3: Migrate sign-up/page-content.tsx**

Same pattern as sign-in. Additionally: `<Chip>` (used in social auth divider) → `<span className="font-mono text-xs text-[--color-muted]">`.

- [ ] **Step 4: Migrate forgot-password/page-content.tsx**

Same pattern as sign-in.

- [ ] **Step 5: Migrate password-change/page-content.tsx**

Same pattern as sign-in.

- [ ] **Step 6: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Verify dev server — auth pages render correctly**

```bash
cd apps/web && pnpm dev
```

Navigate to `/sign-in`. Should show a centered dark card with the form.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/\[language\]/sign-in/ apps/web/src/app/\[language\]/sign-up/ apps/web/src/app/\[language\]/forgot-password/ apps/web/src/app/\[language\]/password-change/
git commit -m "feat(web): migrate auth pages from MUI to Tailwind"
```

---

## Task 2: Utility pages — confirm-email, confirm-new-email, privacy-policy

These are simple content/status pages. Same centered card pattern.

- [ ] **Step 1: Audit MUI usage**

```bash
grep -n "@mui" apps/web/src/app/\[language\]/confirm-email/page-content.tsx
grep -n "@mui" apps/web/src/app/\[language\]/confirm-new-email/page-content.tsx
grep -n "@mui" apps/web/src/app/\[language\]/privacy-policy/page-content.tsx
```

- [ ] **Step 2: Migrate all three pages**

Apply the MUI → Tailwind quick reference table. These pages typically only use `Container`, `Typography`, `Box`, and `Button`.

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\[language\]/confirm-email/ apps/web/src/app/\[language\]/confirm-new-email/ apps/web/src/app/\[language\]/privacy-policy/
git commit -m "feat(web): migrate utility pages from MUI to Tailwind"
```

---

## Task 3: Profile pages — profile view + profile edit

**Files:**
- Rewrite: `src/app/[language]/profile/page-content.tsx`
- Rewrite: `src/app/[language]/profile/edit/page-content.tsx`

- [ ] **Step 1: Audit MUI usage**

```bash
grep -n "@mui" apps/web/src/app/\[language\]/profile/page-content.tsx
grep -n "@mui" apps/web/src/app/\[language\]/profile/edit/page-content.tsx
```

- [ ] **Step 2: Migrate profile/page-content.tsx**

The profile view displays user information. Replace:
- `<Container>` → `<div className="mx-auto max-w-2xl px-4 py-8">`
- `<Avatar>` (MUI) → shadcn `<Avatar>` + `<AvatarImage>` + `<AvatarFallback>` (already available from Phase 1)
- `<Typography>` → semantic HTML with Tailwind
- `<Box>` → `<div>`
- `<Button>` (link to edit) → shadcn `<Button variant="outline">` or `<Link>`

- [ ] **Step 3: Migrate profile/edit/page-content.tsx**

This page has three sub-forms: basic info (firstName, lastName, photo), change password, change email. Replace:
- `<Container>` → `<div className="mx-auto max-w-2xl px-4 py-8">`
- `<Grid container spacing={3}>` → `<div className="space-y-8">`
- `<Typography variant="h6">` → `<h2 className="font-mono text-base font-semibold text-[--color-foreground] border-b border-[--color-border] pb-2">`
- `<Button variant="contained">` → shadcn `<Button>`
- `<Button variant="text">` → shadcn `<Button variant="ghost">`
- `<Box>` → `<div>`

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\[language\]/profile/
git commit -m "feat(web): migrate profile pages from MUI to Tailwind"
```

---

## Task 4: Admin home page

**Files:**
- Rewrite: `src/app/[language]/admin-panel/page-content.tsx`

This is the simplest admin page — just Container, Grid, Typography.

- [ ] **Step 1: Rewrite admin-panel/page-content.tsx**

```tsx
'use client';

import { RoleEnum } from '@/services/api/types/role';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useTranslation } from '@/services/i18n/client';

function AdminPanel() {
  const { t } = useTranslation('admin-panel-home');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-2">
        <h1 className="font-mono text-2xl font-semibold text-[--color-foreground]">
          {t('title')}
        </h1>
        <p className="text-sm text-[--color-muted]">{t('description')}</p>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(AdminPanel, { roles: [RoleEnum.ADMIN] });
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\[language\]/admin-panel/page-content.tsx
git commit -m "feat(web): migrate admin home page from MUI to Tailwind"
```

---

## Task 5: Users list page — admin-panel/users/page-content.tsx

This is the most complex page. It uses:
- `TableCell`, `TableRow` (inline MUI table cells inside react-virtuoso)
- `LinearProgress` (loading bar)
- `ButtonGroup` + `Popper` + `Paper` + `Grow` + `ClickAwayListener` + `MenuList` + `MenuItem` (split action button)
- `TableSortLabel` (sortable column headers)
- `Avatar` (user avatar in row)
- `styled` (Emotion styled component for the loading cell)
- `ArrowDropDownIcon` (from @mui/icons-material)

**Files:**
- Rewrite: `src/app/[language]/admin-panel/users/page-content.tsx`

- [ ] **Step 1: Plan the replacements**

Before editing, map each MUI component to its replacement:

| MUI | Replacement |
|---|---|
| `TableCellLoadingContainer` (styled TableCell) | `<td className="p-0">` |
| `TableSortCellWrapper` | Custom `<th>` button with `<ChevronUp>` / `<ChevronDown>` icons from lucide-react |
| `<TableCell>` (header) | `<th className="px-4 py-3 text-left font-mono text-xs text-[--color-muted] font-medium">` |
| `<TableCell>` (body) | `<td className="px-4 py-3 text-sm text-[--color-foreground]">` |
| `<TableRow>` | Native `<tr>` (react-virtuoso `TableRow` component handles this via Phase 1 `TableComponents`) |
| `<LinearProgress>` | `<div className="h-0.5 w-full bg-[--color-accent] animate-pulse" />` |
| `<Avatar>` | shadcn `<Avatar>` + `<AvatarImage>` + `<AvatarFallback>` |
| `<ButtonGroup>` + `<Popper>` split button | shadcn `<DropdownMenu>` with trigger + icon button |
| `<ArrowDropDownIcon>` | `<ChevronDown className="h-4 w-4">` from lucide-react |

- [ ] **Step 2: Replace the split action button**

The MUI `ButtonGroup` + `Popper` + `Paper` + `Grow` + `ClickAwayListener` split button pattern (Edit / Delete) is replaced with a shadcn `DropdownMenu`:

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Edit, Trash } from 'lucide-react';
import Link from '@/components/link';

// In the row:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="outline"
      size="sm"
      className="font-mono text-xs border-[--color-border] text-[--color-foreground] hover:bg-[--color-surface]"
    >
      Actions <ChevronDown className="ml-1 h-3 w-3" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="bg-[--color-surface] border-[--color-border] font-mono">
    <DropdownMenuItem asChild>
      <Link href={`/admin-panel/users/edit/${user.id}`}>
        <Edit className="mr-2 h-3 w-3" /> Edit
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem
      onClick={() => handleDelete(user.id)}
      className="text-[--color-warn] focus:text-[--color-warn]"
    >
      <Trash className="mr-2 h-3 w-3" /> Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

- [ ] **Step 3: Replace TableSortCellWrapper**

Replace the MUI `TableSortLabel`-based sort header with a Tailwind button:

```tsx
function SortableHeaderCell({
  column,
  orderBy,
  order,
  label,
  onSort,
  width,
}: {
  column: UsersKeys;
  orderBy: UsersKeys;
  order: SortEnum;
  label: string;
  onSort: (e: React.MouseEvent<unknown>, column: UsersKeys) => void;
  width?: number;
}) {
  const isActive = orderBy === column;
  return (
    <th
      style={width ? { width } : undefined}
      className="px-4 py-3 text-left font-mono text-xs text-[--color-muted] font-medium"
    >
      <button
        type="button"
        onClick={(e) => onSort(e, column)}
        className="flex items-center gap-1 hover:text-[--color-foreground] transition-colors"
      >
        {label}
        {isActive ? (
          order === SortEnum.ASC ? (
            <ChevronUp className="h-3 w-3 text-[--color-accent]" />
          ) : (
            <ChevronDown className="h-3 w-3 text-[--color-accent]" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}
```

- [ ] **Step 4: Replace LinearProgress**

Replace the `TableCellLoadingContainer` styled component + `LinearProgress`:

```tsx
{isFetchingNextPage && (
  <tr>
    <td colSpan={5} className="p-0">
      <div className="h-0.5 w-full bg-[--color-accent] animate-pulse" />
    </td>
  </tr>
)}
```

- [ ] **Step 5: Replace Avatar in row**

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// In the row:
<Avatar className="h-8 w-8">
  <AvatarImage src={user.photo?.path} />
  <AvatarFallback className="bg-[--color-surface] font-mono text-xs text-[--color-muted]">
    {user.firstName?.[0]}{user.lastName?.[0]}
  </AvatarFallback>
</Avatar>
```

- [ ] **Step 6: Replace Container + Grid + Typography**

```tsx
// Replace:
<Container maxWidth="xl">
  <Grid container spacing={3}>
    <Grid>
      <Typography variant="h3">Users</Typography>
    </Grid>
  </Grid>
</Container>

// With:
<div className="mx-auto max-w-7xl px-4 py-8">
  <div className="space-y-4">
    <h1 className="font-mono text-2xl font-semibold text-[--color-foreground]">
      {t('title')}
    </h1>
  </div>
</div>
```

- [ ] **Step 7: Remove all `styled` usage and Emotion imports**

The `TableCellLoadingContainer = styled(TableCell)(...)` is the only `styled()` usage in this file. After replacing with native `<td>`, delete the `styled` import.

- [ ] **Step 8: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 9: Verify dev server — users list renders and sorts**

```bash
cd apps/web && pnpm dev
```

Navigate to `/admin-panel/users`. The table should render with dark rows. Clicking sort headers should sort. The Actions dropdown should appear.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/app/\[language\]/admin-panel/users/page-content.tsx
git commit -m "feat(web): migrate users list page from MUI to Tailwind + shadcn DropdownMenu"
```

---

## Task 6: Users list — user-filter.tsx

**Files:**
- Rewrite: `src/app/[language]/admin-panel/users/user-filter.tsx`

- [ ] **Step 1: Audit MUI usage in user-filter.tsx**

```bash
grep -n "@mui" apps/web/src/app/\[language\]/admin-panel/users/user-filter.tsx
```

- [ ] **Step 2: Migrate user-filter.tsx**

The user filter is a form with text and select inputs (already using Phase 2 form components). The remaining MUI usage is typically layout: `<Grid>`, `<Box>`, `<Button>`. Replace with Tailwind:
- `<Grid container spacing={2}>` → `<div className="flex flex-wrap gap-3">`
- `<Button variant="contained">Apply</Button>` → `<Button size="sm">Apply</Button>`
- `<Button variant="outlined">Reset</Button>` → `<Button variant="outline" size="sm">Reset</Button>`

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\[language\]/admin-panel/users/user-filter.tsx
git commit -m "feat(web): migrate user filter from MUI to Tailwind"
```

---

## Task 7: Users create + edit pages

**Files:**
- Rewrite: `src/app/[language]/admin-panel/users/create/page-content.tsx`
- Rewrite: `src/app/[language]/admin-panel/users/edit/[id]/page-content.tsx`

Both follow the same form-page pattern.

- [ ] **Step 1: Audit MUI usage in both files**

```bash
grep -n "@mui" apps/web/src/app/\[language\]/admin-panel/users/create/page-content.tsx
grep -n "@mui" apps/web/src/app/\[language\]/admin-panel/users/edit/\[id\]/page-content.tsx
```

- [ ] **Step 2: Migrate create/page-content.tsx**

Page structure:
```tsx
<div className="mx-auto max-w-2xl px-4 py-8">
  <div className="space-y-1 mb-6">
    <h1 className="font-mono text-xl font-semibold text-[--color-foreground]">{t('title')}</h1>
  </div>
  <FormProvider {...methods}>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* form fields */}
      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}
          className="bg-[--color-accent] text-[--color-bg] hover:bg-[--color-accent-hover]">
          {t('actions.submit')}
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/admin-panel/users">{t('actions.cancel')}</Link>
        </Button>
      </div>
    </form>
  </FormProvider>
</div>
```

- [ ] **Step 3: Migrate edit/[id]/page-content.tsx**

Same pattern as create.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

- [ ] **Step 5: Verify dev server — create and edit forms work**

```bash
cd apps/web && pnpm dev
```

Navigate to `/admin-panel/users/create`. Fill in the form and submit. Navigate to an edit page. Both should render correctly.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\[language\]/admin-panel/users/create/ apps/web/src/app/\[language\]/admin-panel/users/edit/
git commit -m "feat(web): migrate users create + edit pages from MUI to Tailwind"
```

---

## Task 8: Final check — no remaining MUI imports in src/

Before removing MUI, verify no page or component still imports from `@mui/*`.

- [ ] **Step 1: Scan for remaining @mui imports**

```bash
grep -r "@mui/material\|@mui/icons-material\|@mui/x-date-pickers" apps/web/src --include="*.ts" --include="*.tsx" -l
```

Expected: no results (or only the theme-provider.tsx which we handle next).

- [ ] **Step 2: Scan for remaining `styled` from @mui**

```bash
grep -r "from '@mui/material/styles'" apps/web/src --include="*.ts" --include="*.tsx"
```

Expected: only `src/components/theme/theme-provider.tsx`.

- [ ] **Step 3: Fix any remaining stragglers**

If any files appear in Step 1/2 that aren't theme-provider.tsx, apply the quick reference mapping before proceeding.

- [ ] **Step 4: Commit any stragglers**

```bash
git add apps/web/src/
git commit -m "feat(web): remove remaining stray MUI imports"
```

---

## Task 9: Remove MUI ThemeProvider + delete Emotion registry

**Files:**
- Rewrite: `src/components/theme/theme-provider.tsx`
- Delete: `src/components/theme/registry.tsx`

- [ ] **Step 1: Rewrite theme-provider.tsx — remove MUI**

Replace the entire file with:

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { PropsWithChildren } from 'react';

function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;
```

Note: If Phase 1 Task 4 already added `next-themes` wrapping around MUI, this step simplifies it by removing the MUI layer.

- [ ] **Step 2: Delete registry.tsx**

```bash
rm apps/web/src/components/theme/registry.tsx
```

- [ ] **Step 3: Verify no remaining imports of registry**

```bash
grep -r "registry" apps/web/src --include="*.ts" --include="*.tsx"
```

Expected: no results.

- [ ] **Step 4: Verify TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/theme/theme-provider.tsx
git rm apps/web/src/components/theme/registry.tsx
git commit -m "feat(web): remove MUI ThemeProvider and Emotion registry"
```

---

## Task 10: Uninstall @mui/* and @emotion/* packages

- [ ] **Step 1: Uninstall all MUI and Emotion packages**

```bash
cd apps/web && pnpm remove @mui/material @mui/icons-material @emotion/react @emotion/styled @emotion/cache @emotion/server
```

Also uninstall the Roboto font package if still present:

```bash
cd apps/web && pnpm remove @fontsource/roboto 2>/dev/null || true
```

- [ ] **Step 2: Verify TypeScript with no MUI packages**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors. If TypeScript complains about missing types, check if a type import slipped through Step 1 of Task 8.

- [ ] **Step 3: Verify dev server fully functional**

```bash
cd apps/web && pnpm dev
```

Check each route:
- `/sign-in` — form renders, submission works
- `/sign-up` — form renders, submission works
- `/admin-panel/users` — table renders, sort works, actions dropdown works
- `/admin-panel/users/create` — form renders, submission works
- `/profile/edit` — form renders with avatar upload, submission works
- Theme toggle (sun/moon) — dark/light switches correctly

- [ ] **Step 4: Run Storybook final check**

```bash
cd apps/web && pnpm sb
```

All stories should render with no MUI errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): uninstall @mui/* and @emotion/* — phase 3 complete, MUI removed"
```

---

## Task 11: Final cleanup + tag

- [ ] **Step 1: Run full TypeScript check across entire monorepo**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run linter**

```bash
cd apps/web && pnpm lint
```

Fix any lint errors introduced by the migration (unused imports are common).

- [ ] **Step 3: Run Storybook one final time**

```bash
cd apps/web && pnpm sb
```

All stories render. Background is dark. No console errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(web): complete MUI → shadcn/ui + Tailwind migration

Phase 0: Infrastructure (Tailwind, shadcn init, design tokens, next-themes)
Phase 1: UI shell (AppBar, ConfirmDialog, FullPageLoader, Table adapters, Snackbar → Sonner)
Phase 2: Form components (TextInput, Select, Autocomplete, Checkbox, Radio, Switch, DatePickers, Avatar/Image pickers)
Phase 3: Pages (all auth, profile, admin), MUI ThemeProvider removed, @mui/* uninstalled

Breaking: none — all external component APIs preserved throughout migration"
```

---

## Troubleshooting

**Dark mode flicker on first load:** Ensure `next-themes` `ThemeProvider` wraps the root layout. The `disableTransitionOnChange` prop prevents CSS transitions during theme switch which can cause flicker.

**Tailwind classes not applying in a component:** Check that the component file is within the `content` glob in `tailwind.config.ts`. By default `src/**/*.{ts,tsx}` covers everything under `src/`.

**TypeScript error `Property 'X' does not exist on type 'Y'`:** Likely a MUI prop on a non-MUI component. Check the quick reference table and use the correct shadcn prop instead.

**`@emotion/react` peer dep warning from another package:** Check with `pnpm why @emotion/react`. If it's a peer dep of a non-MUI package, add `@emotion/react` back as a dev dependency only.
