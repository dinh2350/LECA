'use client';

// eslint-disable-next-line no-restricted-imports
import NextLink from 'next/link';
import useLanguage from '@/services/i18n/use-language';

type Props = {
  open: boolean;
};

export default function GuestLimitModal({ open }: Props) {
  const language = useLanguage();

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-limit-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '420px',
          width: '90%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ fontSize: '40px' }}>🎙️</div>
        <h2
          id="guest-limit-title"
          style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff' }}
        >
          You&apos;ve used your 3 free sessions
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
          }}
        >
          Create a free account to continue practicing — unlimited sessions,
          progress tracking, and pronunciation history.
        </p>
        <NextLink
          href={`/${language}/sign-up`}
          style={{
            display: 'block',
            background: '#f59e0b',
            color: '#000',
            fontWeight: 700,
            fontSize: '15px',
            padding: '14px 28px',
            borderRadius: '999px',
            textDecoration: 'none',
          }}
        >
          Create free account
        </NextLink>
        <NextLink
          href={`/${language}/sign-in`}
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'underline',
          }}
        >
          Already have an account? Sign in
        </NextLink>
      </div>
    </div>
  );
}
