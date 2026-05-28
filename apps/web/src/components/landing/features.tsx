export default function FeaturesSection() {
  return (
    <section className="features" id="features">
      <div className="section-label">{`// CORE FEATURES`}</div>
      <h2 className="section-title">
        Everything you need to
        <br />
        <span style={{ color: 'var(--amber)' }}>actually improve.</span>
      </h2>

      <div className="features-grid">
        {/* Feature 1 */}
        <div className="feat-cell">
          <div className="feat-num">01 / 03</div>
          <div className="feat-visual">
            <div className="conv-mini">
              <div className="conv-mini-bubble ai">
                What did you accomplish last sprint?
              </div>
              <div className="conv-mini-bubble user">
                We shipped the payment module on time.
              </div>
            </div>
          </div>
          <div className="feat-name">Free-form AI Dialogue</div>
          <div className="feat-desc">
            Talk about anything — interviews, meetings, casual chat. The AI
            adapts to your level, corrects naturally, and keeps you speaking.
          </div>
          <div className="feat-tag">Unlimited conversations</div>
        </div>

        {/* Feature 2 */}
        <div className="feat-cell">
          <div className="feat-num">02 / 03</div>
          <div className="feat-visual">
            <div className="pron-visual">
              <span className="pron-word pw-g">sched·ule</span>
              <span className="pron-word pw-g">prod·uct</span>
              <span className="pron-word pw-y">quar·ter</span>
              <span className="pron-word pw-r">launch</span>
            </div>
          </div>
          <div className="feat-name">Phoneme Feedback</div>
          <div className="feat-desc">
            Per-word pronunciation scoring using Whisper + IPA analysis. Green
            means nailed it. Red means let&apos;s fix it.
          </div>
          <div className="feat-tag">Word-level accuracy</div>
        </div>

        {/* Feature 3 */}
        <div className="feat-cell">
          <div className="feat-num">03 / 03</div>
          <div className="feat-visual">
            <div className="scen-mini">
              <div className="scen-mini-card">
                <span className="smci">💼</span>
                <span className="smct">Job Interview</span>
                <span className="smcs">Active now</span>
              </div>
              <div className="scen-mini-card">
                <span className="smci">📊</span>
                <span className="smct">Board Presentation</span>
                <span className="smcs">Popular</span>
              </div>
              <div className="scen-mini-card">
                <span className="smci">☕</span>
                <span className="smct">Office Small Talk</span>
                <span className="smcs">New</span>
              </div>
            </div>
          </div>
          <div className="feat-name">Community Scenarios</div>
          <div className="feat-desc">
            Real-world scenario cards created by the community. Practice what
            matters — not textbook dialogues.
          </div>
          <div className="feat-tag">Contribute scenarios</div>
        </div>
      </div>
    </section>
  );
}
