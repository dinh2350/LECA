'use client';

import Link from '@/components/link';

export default function HeroSection() {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        padding: '120px 48px 80px',
        position: 'relative',
        overflow: 'hidden',
        gap: '64px',
      }}
    >
      {/* Glows */}
      <div
        style={{
          position: 'absolute',
          top: '-200px',
          left: '-100px',
          width: '700px',
          height: '700px',
          background:
            'radial-gradient(ellipse, rgba(240,98,42,0.14) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-50px',
          width: '500px',
          height: '500px',
          background:
            'radial-gradient(ellipse, rgba(60,184,135,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Left */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-badge">OPEN SOURCE · FREE FOREVER</div>

        <h1 className="hero-headline">
          English
          <br />
          as <span style={{ color: 'var(--amber)' }}>instinct,</span>
          <br />
          <span
            style={{
              WebkitTextStroke: '2px var(--cream-f)',
              color: 'transparent',
            }}
          >
            not a skill.
          </span>
        </h1>

        <p className="hero-sub">
          Real conversation practice with an AI tutor — free-form dialogue,
          phoneme-level pronunciation feedback, and community scenarios. No
          subscription. No drills. No ceiling.
        </p>

        <div className="hero-actions">
          <Link href="/sign-up" className="btn-primary">
            🎙 Start practicing free
          </Link>
          <a
            href="https://github.com/brocoders/nestjs-boilerplate"
            className="btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            ★ GitHub
          </a>
        </div>

        <div className="hero-meta">
          <div className="meta-item">
            <span className="meta-dot" /> No account required
          </div>
          <div className="meta-item">
            <span className="meta-dot" /> Self-hostable
          </div>
          <div className="meta-item">
            <span className="meta-dot" /> Apache 2.0
          </div>
        </div>
      </div>

      {/* Right – conversation card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="hero-card">
          <div className="card-header">
            <div className="card-avatar">🤖</div>
            <div>
              <div className="card-title">Job Interview Practice</div>
              <div className="card-sub">● Live · AI Tutor</div>
            </div>
            <div className="card-timer">3:24</div>
          </div>

          <div className="card-messages">
            <div className="msg-ai">
              <span className="msg-who">LECA AI</span>
              <div className="bubble bubble-ai">
                Tell me about a time you had to handle a difficult deadline.
                What was your approach?
              </div>
            </div>
            <div className="msg-user">
              <span className="msg-who">You</span>
              <div className="bubble bubble-user">
                Last quarter we had a very tight schedule for the product
                launch…
              </div>
              <div className="feedback-chip">✦ Fluency 87 · Tap to expand</div>
            </div>
            <div className="msg-ai">
              <span className="msg-who">LECA AI</span>
              <div className="bubble bubble-ai">
                Good use of past tense! Try <em>&quot;quarter&quot;</em> with a
                softer /r/ sound. Go on — what happened next?
              </div>
            </div>
          </div>

          <div className="card-ptt">
            <div className="wave-bars">
              {[6, 14, 20, 10, 18, 8, 16].map((h, i) => (
                <div key={i} className="wbar" style={{ height: `${h}px` }} />
              ))}
            </div>
            <button className="ptt" aria-label="Push to talk">
              🎙
            </button>
            <span className="ptt-hint">HOLD TO SPEAK · RELEASE TO SUBMIT</span>
          </div>

          <div className="pron-row">
            <span className="pron-lbl">Last turn</span>
            <span className="ph ph-g">/skɛ.djul/</span>
            <span className="ph ph-g">/prɒd.əkt/</span>
            <span className="ph ph-y">/ˈkwɔː.tə/</span>
            <span className="ph ph-r">/lɔːntʃ/</span>
          </div>
        </div>
      </div>
    </section>
  );
}
