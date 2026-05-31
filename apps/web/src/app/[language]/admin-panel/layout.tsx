'use client';

import Link from '@/components/link';
import { useTranslation } from '@/services/i18n/client';
import {
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  Mail,
  Users,
} from 'lucide-react';
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
  {
    href: '/admin-panel/scenarios',
    labelKey: 'common:navigation.scenarioReview' as const,
    icon: ClipboardList,
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
