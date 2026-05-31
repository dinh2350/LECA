export default function StatsBar() {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <div className="stat-val">0$</div>
        <div className="stat-label">Forever free · no ceiling</div>
      </div>
      <div className="stat-sep" />
      <div className="stat-item">
        <div className="stat-val">&lt;3s</div>
        <div className="stat-label">End-to-end latency target</div>
      </div>
      <div className="stat-sep" />
      <div className="stat-item">
        <div className="stat-val">10K</div>
        <div className="stat-label">WAU target · Phase 2</div>
      </div>
      <div className="stat-sep" />
      <p className="stats-tagline">
        Daily use reinforces habits;
        <br />
        it doesn&apos;t fix them. <strong>LECA does both.</strong>
      </p>
    </div>
  );
}
