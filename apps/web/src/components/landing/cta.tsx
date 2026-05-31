import Link from '@/components/link';

export default function CtaSection() {
  return (
    <section className="cta-section">
      <div className="cta-glow" />
      <div className="cta-label">{`// START TODAY`}</div>
      <h2 className="cta-title">
        Stop preparing to practice.
        <br />
        <span style={{ color: 'var(--amber)' }}>Just practice.</span>
      </h2>
      <p className="cta-sub">
        No account required. No credit card. No excuses.
      </p>
      <div className="cta-actions">
        <Link href="/sign-up" className="btn-primary">
          🎙 Start practicing free
        </Link>
        <a
          href="https://github.com"
          className="btn-secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          ★ Star on GitHub
        </a>
      </div>
      <div className="cta-fine">
        Apache 2.0 · Self-hostable · No account required
      </div>
    </section>
  );
}
