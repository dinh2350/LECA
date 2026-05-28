# Admin Panel Feature Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add File Manager and Email pages to the admin panel sidebar, and rename the existing Users page to "Users & Roles".

**Architecture:** Two new Next.js page pairs (`page.tsx` + `page-content.tsx`) added under `apps/web/src/app/[language]/admin-panel/`, following the identical pattern used by the existing Users page. Two new API service modules added to `services/api/services/`. Sidebar navigation updated with two new entries and a fixed active-state detection bug.

**Tech Stack:** Next.js 15, React 19, TanStack Query v5, React Hook Form, react-dropzone, lucide-react, shadcn/Radix UI, i18next (en/vi/uk)

---

> ⚠️ **Backend dependencies — verify before Tasks 4 and 6:**
> - `GET /v1/files` — list all files (must return `id`, `path`, `name`, `size`, `mimeType`, `createdAt`)
> - `DELETE /v1/files/:id` — delete a file
> - `POST /v1/email/send` — send email (accepts `to`, `subject`, `body`)
> - `GET /v1/email/logs` — email history (returns `id`, `to`, `subject`, `status`, `createdAt`)
>
> If any endpoint is missing, add it to the backend before implementing the corresponding frontend task.

---

## File Map

| Action | File |
|---|---|
| Modify | `apps/web/src/app/[language]/admin-panel/layout.tsx` |
| Modify | `apps/web/src/services/i18n/locales/en/common.json` |
| Modify | `apps/web/src/services/i18n/locales/vi/common.json` |
| Modify | `apps/web/src/services/i18n/locales/uk/common.json` |
| Modify | `apps/web/src/services/i18n/locales/en/admin-panel-users.json` |
| Modify | `apps/web/src/services/i18n/locales/vi/admin-panel-users.json` |
| Modify | `apps/web/src/services/i18n/locales/uk/admin-panel-users.json` |
| Modify | `apps/web/src/services/api/services/files.ts` |
| Create | `apps/web/src/services/api/services/email.ts` |
| Create | `apps/web/src/app/[language]/admin-panel/files/page.tsx` |
| Create | `apps/web/src/app/[language]/admin-panel/files/page-content.tsx` |
| Create | `apps/web/src/app/[language]/admin-panel/email/page.tsx` |
| Create | `apps/web/src/app/[language]/admin-panel/email/page-content.tsx` |
| Create | `apps/web/src/services/i18n/locales/en/admin-panel-files.json` |
| Create | `apps/web/src/services/i18n/locales/vi/admin-panel-files.json` |
| Create | `apps/web/src/services/i18n/locales/uk/admin-panel-files.json` |
| Create | `apps/web/src/services/i18n/locales/en/admin-panel-email.json` |
| Create | `apps/web/src/services/i18n/locales/vi/admin-panel-email.json` |
| Create | `apps/web/src/services/i18n/locales/uk/admin-panel-email.json` |

---

## Task 1: Update Sidebar Navigation

**Files:**
- Modify: `apps/web/src/app/[language]/admin-panel/layout.tsx`

- [ ] **Step 1: Replace layout.tsx**

Replace the entire file content:

```typescript
'use client';

import Link from '@/components/link';
import { useTranslation } from '@/services/i18n/client';
import { FolderOpen, LayoutDashboard, Mail, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    href: '/admin-panel',
    labelKey: 'common:navigation.dashboard' as const,
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin-panel/users',
    labelKey: 'common:navigation.users' as const,
    icon: Users,
    exact: false,
  },
  {
    href: '/admin-panel/files',
    labelKey: 'common:navigation.fileManager' as const,
    icon: FolderOpen,
    exact: false,
  },
  {
    href: '/admin-panel/email',
    labelKey: 'common:navigation.email' as const,
    icon: Mail,
    exact: false,
  },
];

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation('common');
  const pathname = usePathname();

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <nav className="flex flex-col gap-1 p-3 pt-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname.endsWith('/admin-panel')
              : pathname.includes(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--color-accent)] text-black'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-foreground)]',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Verify dev server compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\[language\]/admin-panel/layout.tsx
git commit -m "feat(admin-panel): add File Manager and Email sidebar links"
```

---

## Task 2: Update Translations — Navigation Labels and Users & Roles Rename

**Files:**
- Modify: `apps/web/src/services/i18n/locales/en/common.json`
- Modify: `apps/web/src/services/i18n/locales/vi/common.json`
- Modify: `apps/web/src/services/i18n/locales/uk/common.json`
- Modify: `apps/web/src/services/i18n/locales/en/admin-panel-users.json`
- Modify: `apps/web/src/services/i18n/locales/vi/admin-panel-users.json`
- Modify: `apps/web/src/services/i18n/locales/uk/admin-panel-users.json`

- [ ] **Step 1: Update en/common.json navigation section**

In `apps/web/src/services/i18n/locales/en/common.json`, replace the `navigation` object:

```json
"navigation": {
  "home": "Home",
  "signIn": "Sign In",
  "signUp": "Sign Up",
  "profile": "Profile",
  "dashboard": "Dashboard",
  "users": "Users & Roles",
  "fileManager": "File Manager",
  "email": "Email",
  "logout": "Logout"
},
```

- [ ] **Step 2: Update vi/common.json navigation section**

In `apps/web/src/services/i18n/locales/vi/common.json`, replace the `navigation` object:

```json
"navigation": {
  "home": "Trang chủ",
  "signIn": "Đăng nhập",
  "signUp": "Đăng ký",
  "profile": "Hồ sơ",
  "dashboard": "Bảng điều khiển",
  "users": "Người dùng & Vai trò",
  "fileManager": "Quản lý tệp",
  "email": "Email",
  "logout": "Đăng xuất"
},
```

- [ ] **Step 3: Update uk/common.json navigation section**

In `apps/web/src/services/i18n/locales/uk/common.json`, replace the `navigation` object:

```json
"navigation": {
  "home": "Головна",
  "signIn": "Увійти",
  "signUp": "Зареєструватися",
  "profile": "Профіль",
  "dashboard": "Панель управління",
  "users": "Користувачі та ролі",
  "fileManager": "Менеджер файлів",
  "email": "Електронна пошта",
  "logout": "Вийти"
},
```

- [ ] **Step 4: Update en/admin-panel-users.json title**

In `apps/web/src/services/i18n/locales/en/admin-panel-users.json`, change:

```json
"title": "Users & Roles",
```

- [ ] **Step 5: Update vi/admin-panel-users.json title**

In `apps/web/src/services/i18n/locales/vi/admin-panel-users.json`, change:

```json
"title": "Người dùng & Vai trò",
```

- [ ] **Step 6: Update uk/admin-panel-users.json title**

In `apps/web/src/services/i18n/locales/uk/admin-panel-users.json`, change:

```json
"title": "Користувачі та ролі",
```

- [ ] **Step 7: Verify in browser**

Navigate to `http://localhost:3000/en/admin-panel`. The sidebar must show:
- Dashboard
- Users & Roles
- File Manager
- Email

Clicking each link must highlight only that item (not multiple items at once).

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/services/i18n/locales/
git commit -m "feat(admin-panel): rename Users to Users & Roles, add fileManager and email nav keys"
```

---

## Task 3: Extend File API Service

> ⚠️ Verify `GET /v1/files` and `DELETE /v1/files/:id` exist in the backend before this task.

**Files:**
- Modify: `apps/web/src/services/api/services/files.ts`

- [ ] **Step 1: Append new types and services to files.ts**

Add the following to the END of `apps/web/src/services/api/services/files.ts` (do not modify existing exports):

```typescript
export type FileListItem = {
  id: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
};

export type FilesListResponse = {
  data: FileListItem[];
};

export function useGetFilesService() {
  const fetchClient = useFetch();

  return useCallback(
    async (requestConfig?: RequestConfigType) => {
      return fetchClient(`${API_URL}/v1/files`, {
        method: 'GET',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<FilesListResponse>);
    },
    [fetchClient],
  );
}

export type FileDeleteRequest = {
  id: string;
};

export function useDeleteFileService() {
  const fetchClient = useFetch();

  return useCallback(
    async (data: FileDeleteRequest, requestConfig?: RequestConfigType) => {
      return fetchClient(`${API_URL}/v1/files/${data.id}`, {
        method: 'DELETE',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>);
    },
    [fetchClient],
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/api/services/files.ts
git commit -m "feat(api): add useGetFilesService and useDeleteFileService"
```

---

## Task 4: Create File Manager Page

**Files:**
- Create: `apps/web/src/services/i18n/locales/en/admin-panel-files.json`
- Create: `apps/web/src/services/i18n/locales/vi/admin-panel-files.json`
- Create: `apps/web/src/services/i18n/locales/uk/admin-panel-files.json`
- Create: `apps/web/src/app/[language]/admin-panel/files/page.tsx`
- Create: `apps/web/src/app/[language]/admin-panel/files/page-content.tsx`

- [ ] **Step 1: Create en/admin-panel-files.json**

```json
{
  "title": "File Manager",
  "description": "Browse, upload, and delete system files.",
  "upload": "Upload",
  "filter": {
    "all": "All",
    "images": "Images",
    "documents": "Documents",
    "other": "Other"
  },
  "confirm": {
    "delete": {
      "title": "Delete File",
      "message": "Are you sure you want to delete this file? This action cannot be undone."
    }
  },
  "actions": {
    "delete": "Delete"
  },
  "empty": "No files found."
}
```

- [ ] **Step 2: Create vi/admin-panel-files.json**

```json
{
  "title": "Quản lý tệp",
  "description": "Duyệt, tải lên và xóa tệp hệ thống.",
  "upload": "Tải lên",
  "filter": {
    "all": "Tất cả",
    "images": "Hình ảnh",
    "documents": "Tài liệu",
    "other": "Khác"
  },
  "confirm": {
    "delete": {
      "title": "Xóa tệp",
      "message": "Bạn có chắc chắn muốn xóa tệp này không? Hành động này không thể hoàn tác."
    }
  },
  "actions": {
    "delete": "Xóa"
  },
  "empty": "Không tìm thấy tệp nào."
}
```

- [ ] **Step 3: Create uk/admin-panel-files.json**

```json
{
  "title": "Менеджер файлів",
  "description": "Переглядайте, завантажуйте та видаляйте системні файли.",
  "upload": "Завантажити",
  "filter": {
    "all": "Всі",
    "images": "Зображення",
    "documents": "Документи",
    "other": "Інші"
  },
  "confirm": {
    "delete": {
      "title": "Видалити файл",
      "message": "Ви впевнені, що хочете видалити цей файл? Цю дію неможливо скасувати."
    }
  },
  "actions": {
    "delete": "Видалити"
  },
  "empty": "Файлів не знайдено."
}
```

- [ ] **Step 4: Create files/page.tsx**

```typescript
import type { Metadata } from 'next';
import { getServerTranslation } from '@/services/i18n';
import FileManager from './page-content';

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    'admin-panel-files',
  );
  return { title: t('title') };
}

export default function Page() {
  return <FileManager />;
}
```

- [ ] **Step 5: Create files/page-content.tsx**

```typescript
'use client';

import { RoleEnum } from '@/services/api/types/role';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useTranslation } from '@/services/i18n/client';
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileListItem,
  useDeleteFileService,
  useFileUploadService,
  useGetFilesService,
} from '@/services/api/services/files';
import useConfirmDialog from '@/components/confirm-dialog/use-confirm-dialog';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { File, FileText, Image, Trash2, Upload } from 'lucide-react';

const filesQueryKey = ['admin-files'];

type FilterType = 'all' | 'images' | 'documents' | 'other';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesFilter(item: FileListItem, filter: FilterType): boolean {
  if (filter === 'all') return true;
  if (filter === 'images') return item.mimeType.startsWith('image/');
  if (filter === 'documents')
    return (
      item.mimeType === 'application/pdf' ||
      item.mimeType.startsWith('text/')
    );
  return (
    !item.mimeType.startsWith('image/') &&
    item.mimeType !== 'application/pdf' &&
    !item.mimeType.startsWith('text/')
  );
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/'))
    return <Image className="h-8 w-8 text-blue-400" />;
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/'))
    return <FileText className="h-8 w-8 text-orange-400" />;
  return <File className="h-8 w-8 text-[var(--color-muted)]" />;
}

function FileCard({
  item,
  onDelete,
}: {
  item: FileListItem;
  onDelete: (item: FileListItem) => void;
}) {
  const { t } = useTranslation('admin-panel-files');
  const isImage = item.mimeType.startsWith('image/');

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="h-20 flex items-center justify-center bg-[var(--color-border)]/20">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.path}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <FileTypeIcon mimeType={item.mimeType} />
        )}
      </div>
      <div className="p-2">
        <p
          className="text-xs text-[var(--color-foreground)] truncate"
          title={item.name}
        >
          {item.name}
        </p>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          {formatFileSize(item.size)}
        </p>
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-[var(--color-warn)] hover:text-[var(--color-warn)]"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {t('admin-panel-files:actions.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FileManager() {
  const { t } = useTranslation('admin-panel-files');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { confirmDialog } = useConfirmDialog();
  const getFiles = useGetFilesService();
  const deleteFile = useDeleteFileService();
  const uploadFile = useFileUploadService();

  const { data, isLoading } = useQuery({
    queryKey: filesQueryKey,
    queryFn: async () => {
      const result = await getFiles();
      if (result.status === HTTP_CODES_ENUM.OK) return result.data.data;
      return [];
    },
  });

  const files = useMemo(
    () => (data ?? []).filter((f) => matchesFilter(f, filter)),
    [data, filter],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);
      for (const file of acceptedFiles) {
        await uploadFile(file);
      }
      await queryClient.invalidateQueries({ queryKey: filesQueryKey });
      setIsUploading(false);
    },
    [uploadFile, queryClient],
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    disabled: isUploading,
  });

  const handleDelete = useCallback(
    async (item: FileListItem) => {
      const confirmed = await confirmDialog({
        title: t('admin-panel-files:confirm.delete.title'),
        message: t('admin-panel-files:confirm.delete.message'),
      });
      if (!confirmed) return;
      await deleteFile({ id: item.id });
      await queryClient.invalidateQueries({ queryKey: filesQueryKey });
    },
    [confirmDialog, deleteFile, queryClient, t],
  );

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('admin-panel-files:filter.all') },
    { key: 'images', label: t('admin-panel-files:filter.images') },
    { key: 'documents', label: t('admin-panel-files:filter.documents') },
    { key: 'other', label: t('admin-panel-files:filter.other') },
  ];

  return (
    <div {...getRootProps()} className="max-w-7xl mx-auto px-4 pt-6">
      <input {...getInputProps()} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
            {t('admin-panel-files:title')}
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {t('admin-panel-files:description')}
          </p>
        </div>
        <Button onClick={open} disabled={isUploading}>
          <Upload className="h-4 w-4 mr-2" />
          {t('admin-panel-files:upload')}
        </Button>
      </div>

      <div className="flex gap-1 border-b border-[var(--color-border)] mb-6">
        {filterTabs.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === f.key
                ? 'border-[var(--color-accent)] text-[var(--color-foreground)]'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-muted)]">
          {t('common:loading')}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-muted)]">
          {t('admin-panel-files:empty')}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <FileCard key={file.id} item={file} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(FileManager, { roles: [RoleEnum.ADMIN] });
```

- [ ] **Step 6: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Verify in browser**

Navigate to `http://localhost:3000/en/admin-panel/files` while logged in as Admin.

Expected:
- "File Manager" heading with "Upload" button
- Filter tabs: All / Images / Documents / Other
- "File Manager" sidebar link is highlighted
- Upload button opens file picker; dropped files upload and appear in grid
- Delete button shows confirmation dialog; confirming removes the file

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/\[language\]/admin-panel/files/ apps/web/src/services/i18n/locales/
git commit -m "feat(admin-panel): add File Manager page"
```

---

## Task 5: Create Email API Service

> ⚠️ Verify `POST /v1/email/send` and `GET /v1/email/logs` exist in the backend before this task.

**Files:**
- Create: `apps/web/src/services/api/services/email.ts`

- [ ] **Step 1: Create email.ts**

```typescript
import { useCallback } from 'react';
import useFetch from '../use-fetch';
import { API_URL } from '../config';
import wrapperFetchJsonResponse from '../wrapper-fetch-json-response';
import { RequestConfigType } from './types/request-config';

export type SendEmailRequest = {
  to: string;
  subject: string;
  body: string;
};

export type SendEmailResponse = {
  message: string;
};

export type EmailLog = {
  id: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  createdAt: string;
};

export type EmailLogsResponse = {
  data: EmailLog[];
};

export function useSendEmailService() {
  const fetchClient = useFetch();

  return useCallback(
    async (data: SendEmailRequest, requestConfig?: RequestConfigType) => {
      return fetchClient(`${API_URL}/v1/email/send`, {
        method: 'POST',
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<SendEmailResponse>);
    },
    [fetchClient],
  );
}

export function useGetEmailLogsService() {
  const fetchClient = useFetch();

  return useCallback(
    async (requestConfig?: RequestConfigType) => {
      return fetchClient(`${API_URL}/v1/email/logs`, {
        method: 'GET',
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EmailLogsResponse>);
    },
    [fetchClient],
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/api/services/email.ts
git commit -m "feat(api): add useSendEmailService and useGetEmailLogsService"
```

---

## Task 6: Create Email Page

**Files:**
- Create: `apps/web/src/services/i18n/locales/en/admin-panel-email.json`
- Create: `apps/web/src/services/i18n/locales/vi/admin-panel-email.json`
- Create: `apps/web/src/services/i18n/locales/uk/admin-panel-email.json`
- Create: `apps/web/src/app/[language]/admin-panel/email/page.tsx`
- Create: `apps/web/src/app/[language]/admin-panel/email/page-content.tsx`

- [ ] **Step 1: Create en/admin-panel-email.json**

```json
{
  "title": "Email",
  "description": "Send test emails and monitor delivery history.",
  "send": {
    "title": "Send Test Email",
    "to": "To",
    "subject": "Subject",
    "body": "Body",
    "submit": "Send Email",
    "success": "Email sent successfully to {{to}}.",
    "error": "Failed to send email. Please try again.",
    "validation": {
      "to": {
        "required": "Recipient email is required.",
        "invalid": "Please enter a valid email address."
      },
      "subject": {
        "required": "Subject is required."
      },
      "body": {
        "required": "Body is required."
      }
    }
  },
  "log": {
    "title": "Email Log",
    "refresh": "Refresh",
    "columns": {
      "recipient": "Recipient",
      "subject": "Subject",
      "status": "Status",
      "sentAt": "Sent At"
    },
    "status": {
      "sent": "Sent",
      "failed": "Failed",
      "pending": "Pending"
    },
    "empty": "No emails sent yet."
  }
}
```

- [ ] **Step 2: Create vi/admin-panel-email.json**

```json
{
  "title": "Email",
  "description": "Gửi email thử nghiệm và theo dõi lịch sử gửi.",
  "send": {
    "title": "Gửi Email Thử Nghiệm",
    "to": "Đến",
    "subject": "Tiêu đề",
    "body": "Nội dung",
    "submit": "Gửi Email",
    "success": "Email đã được gửi thành công đến {{to}}.",
    "error": "Gửi email thất bại. Vui lòng thử lại.",
    "validation": {
      "to": {
        "required": "Email người nhận là bắt buộc.",
        "invalid": "Vui lòng nhập địa chỉ email hợp lệ."
      },
      "subject": {
        "required": "Tiêu đề là bắt buộc."
      },
      "body": {
        "required": "Nội dung là bắt buộc."
      }
    }
  },
  "log": {
    "title": "Nhật Ký Email",
    "refresh": "Làm mới",
    "columns": {
      "recipient": "Người nhận",
      "subject": "Tiêu đề",
      "status": "Trạng thái",
      "sentAt": "Thời gian gửi"
    },
    "status": {
      "sent": "Đã gửi",
      "failed": "Thất bại",
      "pending": "Đang chờ"
    },
    "empty": "Chưa có email nào được gửi."
  }
}
```

- [ ] **Step 3: Create uk/admin-panel-email.json**

```json
{
  "title": "Електронна пошта",
  "description": "Надсилайте тестові листи та відстежуйте історію доставки.",
  "send": {
    "title": "Надіслати тестовий лист",
    "to": "Кому",
    "subject": "Тема",
    "body": "Тіло",
    "submit": "Надіслати лист",
    "success": "Лист успішно надіслано на {{to}}.",
    "error": "Не вдалося надіслати лист. Спробуйте ще раз.",
    "validation": {
      "to": {
        "required": "Email отримувача є обов'язковим.",
        "invalid": "Будь ласка, введіть дійсну адресу електронної пошти."
      },
      "subject": {
        "required": "Тема є обов'язковою."
      },
      "body": {
        "required": "Тіло є обов'язковим."
      }
    }
  },
  "log": {
    "title": "Журнал листів",
    "refresh": "Оновити",
    "columns": {
      "recipient": "Одержувач",
      "subject": "Тема",
      "status": "Статус",
      "sentAt": "Надіслано"
    },
    "status": {
      "sent": "Надіслано",
      "failed": "Помилка",
      "pending": "Очікує"
    },
    "empty": "Листи ще не надсилались."
  }
}
```

- [ ] **Step 4: Create email/page.tsx**

```typescript
import type { Metadata } from 'next';
import { getServerTranslation } from '@/services/i18n';
import EmailPage from './page-content';

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(
    params.language,
    'admin-panel-email',
  );
  return { title: t('title') };
}

export default function Page() {
  return <EmailPage />;
}
```

- [ ] **Step 5: Create email/page-content.tsx**

```typescript
'use client';

import { RoleEnum } from '@/services/api/types/role';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useTranslation } from '@/services/i18n/client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmailLog,
  SendEmailRequest,
  useGetEmailLogsService,
  useSendEmailService,
} from '@/services/api/services/email';
import { Button } from '@/components/ui/button';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';

const emailLogsQueryKey = ['admin-email-logs'];

function StatusBadge({ status }: { status: EmailLog['status'] }) {
  const { t } = useTranslation('admin-panel-email');
  const styles: Record<EmailLog['status'], string> = {
    sent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {t(`admin-panel-email:log.status.${status}`)}
    </span>
  );
}

type FormValues = SendEmailRequest;

function EmailPageContent() {
  const { t } = useTranslation('admin-panel-email');
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const sendEmail = useSendEmailService();
  const getEmailLogs = useGetEmailLogsService();

  const {
    data: logsData,
    isLoading: logsLoading,
    refetch,
  } = useQuery({
    queryKey: emailLogsQueryKey,
    queryFn: async () => {
      const result = await getEmailLogs();
      if (result.status === HTTP_CODES_ENUM.OK) return result.data.data;
      return [];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setSendResult(null);
    const result = await sendEmail(values);
    if (
      result.status === HTTP_CODES_ENUM.CREATED ||
      result.status === HTTP_CODES_ENUM.OK
    ) {
      setSendResult({
        success: true,
        message: t('admin-panel-email:send.success', { to: values.to }),
      });
      reset();
      await queryClient.invalidateQueries({ queryKey: emailLogsQueryKey });
    } else {
      setSendResult({
        success: false,
        message: t('admin-panel-email:send.error'),
      });
    }
  };

  const logs = logsData ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6">
      <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-1">
        {t('admin-panel-email:title')}
      </h1>
      <p className="text-sm text-[var(--color-muted)] mb-6">
        {t('admin-panel-email:description')}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6">
        {/* Send Test Email */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-4">
            {t('admin-panel-email:send.title')}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                {t('admin-panel-email:send.to')}
              </label>
              <input
                type="email"
                {...register('to', {
                  required: t('admin-panel-email:send.validation.to.required'),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: t('admin-panel-email:send.validation.to.invalid'),
                  },
                })}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
              {errors.to && (
                <p className="text-xs text-[var(--color-warn)] mt-1">
                  {errors.to.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                {t('admin-panel-email:send.subject')}
              </label>
              <input
                type="text"
                {...register('subject', {
                  required: t(
                    'admin-panel-email:send.validation.subject.required',
                  ),
                })}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
              {errors.subject && (
                <p className="text-xs text-[var(--color-warn)] mt-1">
                  {errors.subject.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                {t('admin-panel-email:send.body')}
              </label>
              <textarea
                rows={4}
                {...register('body', {
                  required: t(
                    'admin-panel-email:send.validation.body.required',
                  ),
                })}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
              />
              {errors.body && (
                <p className="text-xs text-[var(--color-warn)] mt-1">
                  {errors.body.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {t('admin-panel-email:send.submit')}
            </Button>

            {sendResult && (
              <p
                className={`text-sm ${sendResult.success ? 'text-green-600 dark:text-green-400' : 'text-[var(--color-warn)]'}`}
              >
                {sendResult.message}
              </p>
            )}
          </form>
        </div>

        {/* Email Log */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--color-foreground)]">
              {t('admin-panel-email:log.title')}
            </h2>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              {t('admin-panel-email:log.refresh')}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--color-muted)] uppercase">
                    {t('admin-panel-email:log.columns.recipient')}
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--color-muted)] uppercase">
                    {t('admin-panel-email:log.columns.subject')}
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--color-muted)] uppercase">
                    {t('admin-panel-email:log.columns.status')}
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--color-muted)] uppercase">
                    {t('admin-panel-email:log.columns.sentAt')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-[var(--color-muted)]"
                    >
                      {t('common:loading')}
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-[var(--color-muted)]"
                    >
                      {t('admin-panel-email:log.empty')}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-border)]/10"
                    >
                      <td className="py-2 px-3 text-xs truncate max-w-[140px]">
                        {log.to}
                      </td>
                      <td className="py-2 px-3 text-xs truncate max-w-[160px]">
                        {log.subject}
                      </td>
                      <td className="py-2 px-3">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="py-2 px-3 text-xs text-[var(--color-muted)]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(EmailPageContent, {
  roles: [RoleEnum.ADMIN],
});
```

- [ ] **Step 6: Type-check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Verify in browser**

Navigate to `http://localhost:3000/en/admin-panel/email` while logged in as Admin.

Expected:
- "Email" heading and description
- "Email" sidebar link is highlighted
- Left panel: Send Test Email form with To / Subject / Body fields
- Submitting empty form shows validation errors inline
- Submitting a valid form shows success message and the email appears in the log table
- Right panel: Email Log table with Recipient / Subject / Status / Sent At columns; status badges are colour-coded (green/red/yellow)
- Refresh button re-fetches the log

- [ ] **Step 8: Final commit**

```bash
git add apps/web/src/app/\[language\]/admin-panel/email/ apps/web/src/services/i18n/locales/
git commit -m "feat(admin-panel): add Email page with send form and log table"
```
