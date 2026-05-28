export default function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: 'Pick a scenario',
      desc: 'Choose from community scenarios or freestyle. No setup — just press talk.',
    },
    {
      n: 2,
      title: 'Speak naturally',
      desc: 'Hold to talk. The AI listens, responds, and keeps the conversation going.',
    },
    {
      n: 3,
      title: 'Get instant feedback',
      desc: 'Per-word pronunciation scores and natural grammar corrections after every turn.',
    },
  ];

  return (
    <section className="how" id="how">
      <div className="how-header">
        <div className="section-label">{`// HOW IT WORKS`}</div>
        <h2
          className="section-title"
          style={{ margin: '0 auto', textAlign: 'center' }}
        >
          Three steps to sounding
          <br />
          <span style={{ color: 'var(--amber)' }}>like you mean it.</span>
        </h2>
      </div>

      <div className="steps">
        {steps.map(({ n, title, desc }, i) => (
          <div key={n} className="step">
            <div
              className={`step-n${i === 0 ? ' step-n-first' : ''}`}
              style={
                i === 0
                  ? {
                      background: 'var(--amber-s)',
                      borderColor: 'rgba(240,98,42,0.4)',
                    }
                  : undefined
              }
            >
              {n}
            </div>
            <div className="step-title">{title}</div>
            <div className="step-desc">{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
