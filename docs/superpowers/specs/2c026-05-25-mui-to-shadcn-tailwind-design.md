# MUI → shadcn/ui + Tailwind CSS Migration

**Date:** 2026-05-25
**Project:** n2base / apps/web
**Status:** Approved — ready for implementation planning

## Overview

Migrate the admin panel frontend from MUI 7 + Emotion CSS-in-JS to shadcn/ui + Tailwind CSS, with a custom AI/developer-tool aesthetic (dark-first, monospace accents, terminal-style — inspired by agentskill.sh). This is not a 1:1 component replacement; it is a full UI rebuild with a new design identity.

## Design Direction

- **Theme:** Dark-first, with `next-themes` light/dark toggle
- **Aesthetic:** AI/terminal style — dark backgrounds, monospace font for labels/badges, green + orange accents
- **Approach:** shadcn/ui as primitives, all visual styling via Tailwind utilities (no Emotion, no CSS-in-JS)
- **Icons:** `lucide-react` replaces `@mui/icons-material`

### Design Tokens (globals.css CSS variables)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#09090b` | Page background |
| `--surface` | `#18181b` | Card / panel surface |
| `--border` | `#27272a` | Borders, dividers |
| `--accent` | `#22c55e` | Primary action, active state |
| `--warn` | `#f97316` | Warning, destructive |
| `--muted` | `#71717a` | Secondary text |

Dark mode: `darkMode: 'class'` in Tailwind config, toggled by `next-themes` setting `class="dark"` on `<html>`.

## Architecture

### Dependency Changes

**Remove:**
- `@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`
- `mui-tiptap`
- `@emotion/react`, `@emotion/styled`, `@emotion/cache`, `@emotion/server`
- `src/components/theme/registry.tsx` (Emotion SSR helper)

**Add:**
- `tailwindcss` + `tailwind.config.ts`
- `shadcn/ui` (CLI-installed components into `src/components/ui/`)
- `next-themes` (dark/light mode)
- `lucide-react` (icons)
- `react-day-picker` (date/time/datetime inputs)
- `@tiptap/react` + extensions (rich text editor)
- `clsx` + `tailwind-merge` → `cn()` utility

### File Structure

```
src/
├── components/
│   ├── ui/              # shadcn primitives (Button, Input, Select, etc.)
│   ├── form/            # Custom form components (DatePicker, RichText, ImagePicker, etc.)
│   ├── layout/          # AppBar, Sidebar
│   └── [feature]/       # Page-level components (users/, auth/, profile/)
├── lib/
│   └── utils.ts         # cn() helper (clsx + tailwind-merge)
└── app/
    └── globals.css      # CSS variables + Tailwind base
```

### Coexistence Strategy

MUI and shadcn/ui coexist during migration because:
- Tailwind utility classes do not conflict with MUI's Emotion CSS-in-JS
- shadcn components are plain files in `src/components/ui/` — no global style injection
- MUI `ThemeProvider` stays until the last MUI component is removed in Phase 3
- `next-themes` `ThemeProvider` wraps MUI `ThemeProvider` temporarily during migration

## Migration Strategy: Bottom-Up Incremental

Migrate in 4 phases. Each phase is independently shippable. The app remains functional throughout.

### Phase 0 — Infrastructure Setup (~1-2 days)

- Install and configure Tailwind CSS (`tailwind.config.ts`)
- Init shadcn/ui CLI
- Install `next-themes`, `lucide-react`, `react-day-picker`, `@tiptap/react`
- Create `src/lib/utils.ts` with `cn()` helper
- Set up `globals.css` with dark AI design tokens
- Wrap app with `next-themes` ThemeProvider (alongside existing MUI ThemeProvider)
- **Nothing removed. Purely additive.**

### Phase 1 — UI Shell + Primitives (~2-3 days)

Migrate shared UI components and the app shell:

| MUI Component | Replacement | Effort |
|---|---|---|
| AppBar | Custom dark terminal-style header (Tailwind) | Medium |
| Sidebar | Custom Tailwind sidebar | Medium |
| Table components | shadcn `Table` | Low |
| ConfirmDialog | shadcn `AlertDialog` | Low |
| Snackbar (react-toastify) | shadcn `Sonner` | Low |
| SwitchThemeButton | `next-themes` useTheme() + Button | Low |
| FullPageLoader | Tailwind CSS spinner | Low |
| MUI icons | `lucide-react` | Low |
| Button, Badge, Avatar, Separator | shadcn primitives | Low |

### Phase 2 — Form Components (~1-2 weeks)

Migrate all 27 form components. Each component PR includes its updated `.stories.tsx`.

| MUI Component | Replacement | Effort |
|---|---|---|
| TextInput | shadcn `Input` + `Label` | Low |
| Select / SelectExtended | shadcn `Select` | Low |
| MultipleSelect / Extended | shadcn `Command` + `Popover` | Medium |
| Autocomplete | shadcn Combobox (`Command` + `Popover`) | Medium |
| Checkbox / CheckboxBoolean | shadcn `Checkbox` | Low |
| RadioGroup | shadcn `RadioGroup` | Low |
| Switch | shadcn `Switch` | Low |
| AvatarInput | shadcn `Avatar` + custom upload logic | Medium |
| ImagePicker / MultipleImagePicker | Custom dropzone + Tailwind (react-dropzone kept) | Medium |
| DatePicker / DateTimePicker / TimePicker | `react-day-picker` + shadcn `Popover` | High |
| Rich Text (mui-tiptap) | `@tiptap/react` + custom Tailwind toolbar | High |

### Phase 3 — Pages + MUI Removal (~1 week)

- Migrate all pages to use Phase 1+2 components:
  - Auth: sign-in, sign-up, forgot-password, password-change
  - User flows: confirm-email, confirm-new-email, privacy-policy
  - Profile: view, edit
  - Admin: users list, create, edit; roles
- Remove MUI `ThemeProvider` and `createTheme()`
- Delete `src/components/theme/registry.tsx`
- Uninstall all `@mui/*` and `@emotion/*` packages

## Storybook

- Storybook stays active throughout migration
- Each form component migration PR includes its updated `.stories.tsx`
- Stories use Tailwind directly — no Emotion decorator needed
- No separate "stories migration" phase — always done alongside the component

## Key Risks

| Risk | Mitigation |
|---|---|
| DatePicker complexity (3 variants) | Allocate dedicated time; `react-day-picker` v8 supports all three |
| Tiptap toolbar rebuild | Start with minimal toolbar (bold, italic, lists), extend after migration |
| Dark mode CSS variable conflicts (MUI + Tailwind coexist) | Scope MUI ThemeProvider tightly; Tailwind tokens use `--tw-*` prefix |
| Storybook compatibility with Tailwind | Add Tailwind CSS import to `.storybook/preview.ts` in Phase 0 |
