'use client';

import Link from '@/components/link';
import { usePathname } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import useAuth from '@/services/auth/use-auth';

const TABS = [
  { label: 'Home', icon: '🏠', path: '' },
  { label: 'Scenarios', icon: '📚', path: '/scenarios' },
  { label: 'Progress', icon: '📊', path: '/profile' },
  { label: 'Settings', icon: '⚙️', path: '/profile/edit' },
] as const;

const HIDDEN_PATHS = [
  '/conversation',
  '/onboarding/assessment',
  '/drills/minimal-pair',
  '/session',
];

export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const language = useLanguage();

  if (!user) return null;
  if (HIDDEN_PATHS.some((p) => pathname.includes(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-2 pb-safe"
      style={{
        background: 'var(--bg, #0C0907)',
        borderTop: '1px solid var(--leca-border, rgba(255,255,255,0.08))',
        height: '56px',
      }}
    >
      {TABS.map(({ label, icon, path }) => {
        const href = path || '/';
        const active =
          path === ''
            ? pathname === `/${language}` || pathname === `/${language}/`
            : pathname.startsWith(`/${language}${path}`);

        return (
          <Link
            key={path}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
            aria-label={label}
          >
            <span className="text-lg leading-none">{icon}</span>
            <span
              className="font-mono text-[10px]"
              style={{
                color: active
                  ? 'var(--amber, #F0622A)'
                  : 'rgba(255,255,255,0.35)',
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
