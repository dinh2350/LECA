export default function ProblemSection() {
  return (
    <section className="problem" id="problem">
      <div>
        <div className="problem-label">{`// THE INSIGHT`}</div>
        <h2 className="problem-quote">
          Most people who need English
          <br />
          <span style={{ color: 'var(--cream-m)' }}>daily for work have</span>
          <br />
          <span
            style={{
              position: 'relative',
              display: 'inline-block',
              color: 'var(--amber)',
            }}
          >
            never used a learning app.
            <span
              style={{
                content: "''",
                position: 'absolute',
                bottom: '-3px',
                left: 0,
                right: 0,
                height: '3px',
                background: 'var(--amber)',
                borderRadius: '2px',
                opacity: 0.5,
                display: 'block',
              }}
            />
          </span>
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {[
          {
            n: '01',
            icon: '🔁',
            title: "Exposure doesn't equal improvement",
            body: 'Showing up to meetings and calls every day reinforces existing habits — including bad ones. Real improvement requires deliberate, corrected practice.',
            featured: true,
          },
          {
            n: '02',
            icon: '💸',
            title: "Price isn't the barrier — awareness is",
            body: "It's not that professionals can't afford Cambly or ELSA. They've never heard of them and assume on-the-job exposure is enough.",
            featured: false,
          },
          {
            n: '03',
            icon: '🎯',
            title: "Drills don't transfer to real talk",
            body: 'Phonics drills and grammar apps build knowledge, not fluency. Speaking in real conversational context is what makes English feel automatic.',
            featured: false,
          },
        ].map(({ n, icon, title, body, featured }) => (
          <div
            key={n}
            className={`insight-card${featured ? ' featured' : ''}`}
            data-n={n}
          >
            <div className="insight-icon">{icon}</div>
            <div className="insight-title">{title}</div>
            <div className="insight-body">{body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
