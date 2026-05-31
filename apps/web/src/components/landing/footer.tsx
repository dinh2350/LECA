import Link from '@/components/link';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--leca-border)',
        padding: '40px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--fd)',
          fontSize: '18px',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: 'var(--cream)',
        }}
      >
        L<em style={{ color: 'var(--amber)', fontStyle: 'normal' }}>E</em>CA
      </div>

      <ul
        style={{
          display: 'flex',
          gap: '32px',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {[
          { href: '/#features', label: 'Features' },
          { href: '/#how', label: 'How it works' },
          { href: '/#oss', label: 'Open Source' },
          { href: '/docs', label: 'Docs' },
        ].map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="leca-nav-link">
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div
        style={{
          fontFamily: 'var(--fm)',
          fontSize: '10px',
          color: 'var(--cream-m)',
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'var(--green-s)',
            border: '1px solid rgba(60,184,135,0.28)',
            borderRadius: '999px',
            padding: '3px 10px',
            color: 'var(--green)',
          }}
        >
          ● Open Source
        </span>
        © {new Date().getFullYear()} LECA
      </div>
    </footer>
  );
}
