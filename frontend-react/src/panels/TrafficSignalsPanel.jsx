function SignalMetric({ label, value }) {
  return (
    <div className="result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TrafficLevelBadge({ level }) {
  const normalized = String(level || "unknown").toLowerCase();

  return <span className={`traffic-badge ${normalized}`}>{level || "Unknown"}</span>;
}

function formatIntersectionName(item) {
  if (item?.from && item?.to) {
    return `${item.from} → ${item.to}`;
  }

  if (item?.source && item?.destination) {
    return `${item.source} → ${item.destination}`;
  }

  if (item?.name) {
    return item.name;
  }

  if (item?.intersection_id != null) {
    return `Intersection ${item.intersection_id}`;
  }

  if (item?.id != null) {
    return `Intersection ${item.id}`;
  }

  return "Unknown Intersection";
}

function StatusList({ statuses }) {
  const rows = statuses?.intersections ?? statuses ?? [];

  if (!Array.isArray(rows) || !rows.length) {
    return (
      <p className="workspace-panel-copy">
        No intersection status data is available yet.
      </p>
    );
  }

  return (
    <div className="signal-list">
      {rows.slice(0, 7).map((item, index) => (
        <div className="signal-item" key={item.intersection_id ?? item.id ?? index}>
          <div>
            <strong>{formatIntersectionName(item)}</strong>
            <span>
              Score: {item.congestion_score ?? item.score ?? "N/A"}
            </span>
          </div>

          <TrafficLevelBadge
            level={
              item.congestion_level ??
              item.traffic_level ??
              item.status ??
              item.level ??
              "unknown"
            }
          />
        </div>
      ))}
    </div>
  );
}

function HotspotList({ hotspots }) {
  const rows = hotspots?.hotspots ?? hotspots ?? [];

  if (!Array.isArray(rows) || !rows.length) {
    return (
      <p className="workspace-panel-copy">
        No congestion hotspots are available yet.
      </p>
    );
  }

  return (
    <div className="signal-list">
      {rows.slice(0, 6).map((item, index) => (
        <div className="signal-item hotspot-item" key={item.intersection_id ?? item.id ?? index}>
          <div>
            <strong>{formatIntersectionName(item)}</strong>
            <span>
              Congestion:{" "}
              {item.congestion_score ??
                item.score ??
                item.congestion_index ??
                "N/A"}
            </span>
          </div>

          <TrafficLevelBadge
            level={
              item.congestion_level ??
              item.traffic_level ??
              item.severity ??
              item.level ??
              "high"
            }
          />
        </div>
      ))}
    </div>
  );
}

function OptimizedSignals({ result }) {
  const rows = result?.optimized_signals ?? result?.signals ?? [];

  if (!result) {
    return (
      <p className="workspace-panel-copy">
        Run signal optimization to generate recommended green and red timing for
        busy intersections.
      </p>
    );
  }

  if (!Array.isArray(rows) || !rows.length) {
    return (
      <p className="workspace-panel-copy">
        Optimization completed, but no optimized signal rows were returned.
      </p>
    );
  }

  return (
    <div className="route-result-stack">
      {rows.slice(0, 7).map((item, index) => (
        <div className="route-result-card accent" key={item.intersection_id ?? item.id ?? index}>
          <h4>{formatIntersectionName(item)}</h4>

          <div className="result-grid">
            <SignalMetric
              label="Green Time"
              value={`${item.recommended_green_time_sec ?? item.green_time ?? "N/A"} sec`}
            />
            <SignalMetric
              label="Red Time"
              value={`${item.recommended_red_time_sec ?? item.red_time ?? "N/A"} sec`}
            />
            <SignalMetric
              label="Cycle"
              value={`${item.total_cycle_time ?? item.total_cycle_time_sec ?? item.cycle_time ?? "N/A"} sec`}
            />
            <SignalMetric
              label="Score"
              value={item.congestion_score ?? item.score ?? "N/A"}
            />
          </div>
        </div>
      ))}

      {result.summary ? (
        <div className="highlight-box">
          <span>Optimization summary</span>
          <strong>
            {result.summary.optimized_intersections ??
              result.summary.total_intersections ??
              rows.length}{" "}
            intersections optimized
          </strong>
          <p>
            Average improvement:{" "}
            {result.summary.average_improvement ??
              result.summary.improvement ??
              "N/A"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function TrafficSignalsPanel({
  signalForm,
  signalResult,
  statuses,
  hotspots,
  loading,
  error,
  onChange,
  onOptimize,
}) {
  return (
    <div className="workspace-panel-stack">
      <section className="details-card hero-panel traffic-signals-hero-panel">
        <p className="eyebrow">Traffic Operations</p>
        <h1 className="workspace-panel-title">Traffic Signals</h1>
        <p className="workspace-panel-copy">
          Monitor congestion hotspots and optimize signal timing for smoother
          traffic flow across the Cairo network.
        </p>
      </section>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="details-card">
        <h3>Signal Optimization</h3>

        <form className="smart-form" onSubmit={onOptimize}>
          <label>
            Total Cycle Time
            <input
              type="number"
              name="total_cycle_time"
              min="30"
              max="240"
              value={signalForm.total_cycle_time}
              onChange={onChange}
              disabled={loading}
            />
          </label>

          <label>
            Minimum Green Time
            <input
              type="number"
              name="min_green_time"
              min="5"
              max="120"
              value={signalForm.min_green_time}
              onChange={onChange}
              disabled={loading}
            />
          </label>

          <label>
            Maximum Green Time
            <input
              type="number"
              name="max_green_time"
              min="10"
              max="180"
              value={signalForm.max_green_time}
              onChange={onChange}
              disabled={loading}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Optimizing..." : "Optimize Signal Timing"}
          </button>
        </form>
      </section>

      <section className="details-card">
        <h3>Optimized Signals</h3>
        <OptimizedSignals result={signalResult} />
      </section>

      <section className="details-card">
        <h3>Congestion Hotspots</h3>
        <HotspotList hotspots={hotspots} />
      </section>

      <section className="details-card">
        <h3>Intersection Status</h3>
        <StatusList statuses={statuses} />
      </section>
    </div>
  );
}
