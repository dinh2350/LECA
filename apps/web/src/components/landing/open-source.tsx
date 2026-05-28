import Link from '@/components/link';

const TECH = [
  {
    name: 'Next.js 15',
    role: 'Frontend framework',
    badge: 'FREE',
    badgeClass: 'tb-free',
  },
  { name: 'NestJS', role: 'Backend API', badge: 'OSS', badgeClass: 'tb-oss' },
  {
    name: 'Whisper (local)',
    role: 'Speech-to-text',
    badge: 'WASM',
    badgeClass: 'tb-wasm',
  },
  {
    name: 'PostgreSQL',
    role: 'Primary database',
    badge: 'FREE',
    badgeClass: 'tb-free',
  },
  {
    name: 'OpenAI GPT-4o',
    role: 'Conversation AI',
    badge: 'API',
    badgeClass: 'tb-oss',
  },
  {
    name: 'Docker',
    role: 'Self-host in minutes',
    badge: 'OSS',
    badgeClass: 'tb-oss',
  },
];

export default function OpenSourceSection() {
  return (
    <section className="oss" id="oss">
      <div>
        <div className="oss-badge">⭐ Open Source · Apache 2.0</div>
        <h2 className="oss-title">
          Built on the open web.
          <br />
          <span style={{ color: 'var(--amber)' }}>Owned by no one.</span>
        </h2>
        <p className="oss-body">
          LECA is <strong>fully open source</strong> and self-hostable. Run it
          on your server, fork it, contribute scenarios, or just use the hosted
          version — all for free.
        </p>
        <div className="oss-links">
          <a
            href="https://github.com"
            className="oss-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source on GitHub
          </a>
          <Link href="/docs" className="oss-link">
            Read the architecture docs
          </Link>
          <a
            href="https://discord.gg"
            className="oss-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join the community Discord
          </a>
        </div>
      </div>

      <div className="oss-right">
        {TECH.map(({ name, role, badge, badgeClass }) => (
          <div key={name} className="tech-row">
            <div>
              <div className="tech-name">{name}</div>
              <div className="tech-role">{role}</div>
            </div>
            <div className={`tech-badge ${badgeClass}`}>{badge}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
