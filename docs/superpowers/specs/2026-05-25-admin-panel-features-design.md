# Admin Panel Feature Pages Design

**Date:** 2026-05-25
**Status:** Approved

## Overview

Add two new pages to the admin panel (File Manager, Email) and rename the existing Users page to "Users & Roles". Each feature gets its own sidebar link following the existing navigation pattern — no new routing patterns, no tab components required.

## Goals

- Dual-purpose: works as a testing sandbox during development AND as real admin tooling in production
- File Manager: browse, upload, and delete all system files
- Email: send test emails and view email delivery history
- Users & Roles: full user management with role assignment (already exists, label rename only)

## Navigation Structure

**File:** `apps/web/src/app/[language]/admin-panel/layout.tsx`

Add two new entries to `NAV_ITEMS` and rename the existing Users entry:

| Label | Path | Status |
|---|---|---|
| Dashboard | `/admin-panel` | existing |
| Users & Roles | `/admin-panel/users` | rename only |
| File Manager | `/admin-panel/files` | new |
| Email | `/admin-panel/email` | new |

Translation keys updated in `admin-panel-home.json` (en/uk/vi) for new labels.

---

## Page 1: File Manager (`/admin-panel/files`)

### Layout

Toolbar (heading + stats + search + Upload button) → type filter tabs (All / Images / Documents / Other) → file grid.

### File Grid

- 4-column responsive grid
- Each card: thumbnail (images) or icon (docs/other), filename, size, upload date, Delete button
- Last card in grid: drag-and-drop upload zone
- Delete triggers `alert-dialog.tsx` confirmation before removal

### Behaviour

- **Upload:** reuses `useFileUploadService` and the drag-and-drop pattern from `multiple-image-picker`
- **Filter tabs:** client-side filtering by MIME type prefix (`image/*`, `application/pdf`, etc.)
- **Pagination:** same pattern as existing users list
- **Delete:** confirmation dialog → API delete call → optimistic removal from grid

### Files to create

```
apps/web/src/app/[language]/admin-panel/files/
  page.tsx             — server component, metadata
  page-content.tsx     — client component, file grid logic
```

### Translation namespace

`admin-panel-files.json` (en/uk/vi)

---

## Page 2: Email (`/admin-panel/email`)

### Layout

Two-column layout (collapses to single column on mobile):
- **Left column:** Send Test Email form
- **Right column:** Email Log table

### Send Test Email Form

Fields: To (email, required), Subject (text, required), Body (textarea, required).

On submit: POST to email API → show success/error inline below the button → refresh the email log.

Uses React Hook Form with validation (required fields, email format for To field).

### Email Log Table

Columns: Recipient | Subject | Status | Sent At

- Status badges: Sent (green) / Failed (red) / Pending (yellow)
- Fetched from backend API, paginated
- Auto-refreshes after a successful send
- Manual refresh button

### Files to create

```
apps/web/src/app/[language]/admin-panel/email/
  page.tsx             — server component, metadata
  page-content.tsx     — client component, form + log
```

### Translation namespace

`admin-panel-email.json` (en/uk/vi)

---

## Page 3: Users & Roles (`/admin-panel/users`)

**No logic changes.** This page already provides full CRUD and role filtering.

### Changes only

1. Sidebar label: `"Users"` → `"Users & Roles"` in `layout.tsx`
2. Page heading in `page-content.tsx`: update title and subtitle text
3. Translation keys in `admin-panel-users.json` (en/uk/vi): update the page title string

---

## Backend Dependencies (Verify Before Implementing)

These API endpoints are required by the new pages. Confirm they exist in the backend before starting frontend work:

| Endpoint | Used by | Notes |
|---|---|---|
| `GET /api/files` | File Manager — list all files | Must return filename, size, MIME type, URL, upload date |
| `DELETE /api/files/:id` | File Manager — delete a file | |
| `POST /api/files` | File Manager — upload | Likely already exists via `useFileUploadService` |
| `POST /api/email/send` | Email — send test email | Accepts to, subject, body |
| `GET /api/email/logs` | Email — fetch history | Returns recipient, subject, status, sentAt |

If any endpoint is missing, it must be added to the backend before the corresponding frontend page can be completed.

---

## What Is NOT in Scope

- No shadcn Tabs component needed (sidebar links replace tabs)
- No changes to existing users CRUD logic
- No email provider configuration UI (assumed already configured in backend)
- No bulk file operations
- No file preview modal

---

## File Summary

| Action | File |
|---|---|
| Edit | `apps/web/src/app/[language]/admin-panel/layout.tsx` |
| Edit | `apps/web/src/app/[language]/admin-panel/users/page-content.tsx` |
| Create | `apps/web/src/app/[language]/admin-panel/files/page.tsx` |
| Create | `apps/web/src/app/[language]/admin-panel/files/page-content.tsx` |
| Create | `apps/web/src/app/[language]/admin-panel/email/page.tsx` |
| Create | `apps/web/src/app/[language]/admin-panel/email/page-content.tsx` |
| Create | `apps/web/src/services/i18n/locales/en/admin-panel-files.json` |
| Create | `apps/web/src/services/i18n/locales/uk/admin-panel-files.json` |
| Create | `apps/web/src/services/i18n/locales/vi/admin-panel-files.json` |
| Create | `apps/web/src/services/i18n/locales/en/admin-panel-email.json` |
| Create | `apps/web/src/services/i18n/locales/uk/admin-panel-email.json` |
| Create | `apps/web/src/services/i18n/locales/vi/admin-panel-email.json` |
| Edit | `apps/web/src/services/i18n/locales/en/admin-panel-users.json` |
| Edit | `apps/web/src/services/i18n/locales/uk/admin-panel-users.json` |
| Edit | `apps/web/src/services/i18n/locales/vi/admin-panel-users.json` |
