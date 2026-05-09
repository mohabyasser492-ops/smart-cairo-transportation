function PerformanceMetric({ label, value }) {
  return (
    <div className="result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AlgorithmCard({ title, type, data }) {
  if (!data) {
    return (
      <div className="route-result-card">
        <h4>{title}</h4>
        <p className="workspace-panel-copy">No result available yet.</p>
      </div>
    );
  }

  const path = data.path ?? [];
  const explorationOrder = data.exploration_order ?? [];

  return (
    <div className={`route-result-card algorithm-card ${type}`}>
      <div className="algorithm-card-head">
        <h4>{title}</h4>
        <span className={`algorithm-pill ${type}`}>{title}</span>
      </div>

      <div className="result-grid">
        <PerformanceMetric
          label="Visited Nodes"
          value={data.visited_nodes_count ?? explorationOrder.length ?? "N/A"}
        />

        <PerformanceMetric
          label="Runtime"
          value={`${data.runtime_ms ?? "N/A"} ms`}
        />

        <PerformanceMetric
          label="Total Cost"
          value={data.total_cost ?? data.total_distance ?? "N/A"}
        />

        <PerformanceMetric label="Path Nodes" value={path.length || "N/A"} />
      </div>

      <p className="route-path">
        {path.length ? path.join(" → ") : "No path available"}
      </p>
    </div>
  );
}

function WinnerSummary({ comparison }) {
  if (!comparison) {
    return (
      <p className="workspace-panel-copy">
        Run a comparison to see which algorithm performs better for the selected
        source and destination.
      </p>
    );
  }

  const summary = comparison.summary ?? {};

  const dijkstra = comparison.dijkstra ?? {};
  const astar = comparison.astar ?? {};

  const dijkstraRuntime = Number(dijkstra.runtime_ms ?? Infinity);
  const astarRuntime = Number(astar.runtime_ms ?? Infinity);

  const dijkstraVisited = Number(dijkstra.visited_nodes_count ?? Infinity);
  const astarVisited = Number(astar.visited_nodes_count ?? Infinity);

  let computedWinner = "N/A";

  if (summary.winner || summary.best_algorithm) {
    computedWinner = summary.winner ?? summary.best_algorithm;
  } else if (astarRuntime < dijkstraRuntime || astarVisited < dijkstraVisited) {
    computedWinner = "A*";
  } else if (
    Number.isFinite(dijkstraRuntime) ||
    Number.isFinite(dijkstraVisited)
  ) {
    computedWinner = "Dijkstra";
  }

  return (
    <div className="highlight-box performance-highlight">
      <span>Recommended algorithm</span>
      <strong>{computedWinner}</strong>
      <p>
        {summary.reason ??
          "Recommendation is based on runtime, visited nodes, and route cost."}
      </p>
    </div>
  );
}

export default function PerformancePanel({
  form,
  locations,
  loading,
  comparison,
  onChange,
  onSubmit,
  error,
}) {
  const disabled = loading || !locations.length;

  return (
    <div className="workspace-panel-stack">
      <section className="details-card hero-panel performance-hero-panel">
        <p className="eyebrow">Performance Analysis</p>
        <h1 className="workspace-panel-title">Algorithm Race</h1>
        <p className="workspace-panel-copy">
          Compare Dijkstra and A* route-search behavior using runtime, visited
          nodes, total cost, and map overlays.
        </p>
      </section>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="details-card">
        <h3>Compare Algorithms</h3>

        <form className="smart-form" onSubmit={onSubmit}>
          <label>
            Source
            <select
              name="source"
              value={form.source}
              onChange={onChange}
              disabled={disabled}
            >
              {locations.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination
            <select
              name="destination"
              value={form.destination}
              onChange={onChange}
              disabled={disabled}
            >
              {locations.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Weight
            <select
              name="weight"
              value={form.weight}
              onChange={onChange}
              disabled={disabled}
            >
              <option value="distance">Distance</option>
              <option value="time">Time</option>
              <option value="traffic">Traffic</option>
            </select>
          </label>

          <button type="submit" disabled={disabled}>
            {loading ? "Comparing..." : "Run Algorithm Race"}
          </button>
        </form>
      </section>

      <section className="details-card">
        <h3>Winner</h3>
        <WinnerSummary comparison={comparison} />
      </section>

      <section className="details-card">
        <h3>Comparison Results</h3>

        {!comparison ? (
          <p className="workspace-panel-copy">
            Results will appear here after running the comparison.
          </p>
        ) : (
          <div className="route-result-stack">
            <AlgorithmCard
              title="Dijkstra"
              type="dijkstra"
              data={comparison.dijkstra}
            />

            <AlgorithmCard title="A*" type="astar" data={comparison.astar} />
          </div>
        )}
      </section>
    </div>
  );
}