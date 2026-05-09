const departureTimes = [
  { value: "08:30", label: "Morning Peak (08:30)" },
  { value: "14:00", label: "Afternoon (14:00)" },
  { value: "18:00", label: "Evening Peak (18:00)" },
  { value: "23:00", label: "Night (23:00)" },
];

function ResultMetric({ label, value }) {
  return (
    <div className="result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RouteSummary({ result }) {
  if (!result) {
    return (
      <p className="workspace-panel-copy">
        Run a route search to see distance, ETA, visited nodes, and selected
        path.
      </p>
    );
  }

  if (result.normal_shortest_route && result.traffic_aware_route) {
    const normal = result.normal_shortest_route;
    const traffic = result.traffic_aware_route;

    return (
      <div className="route-result-stack">
        <div className="route-result-card">
          <h4>Normal Shortest Route</h4>

          <div className="result-grid">
            <ResultMetric
              label="ETA"
              value={`${normal.estimated_time_min ?? "N/A"} min`}
            />
            <ResultMetric
              label="Cost"
              value={normal.total_cost ?? normal.total_distance ?? "N/A"}
            />
          </div>

          <p className="route-path">
            {(normal.path ?? []).join(" → ") || "No path available"}
          </p>
        </div>

        <div className="route-result-card accent">
          <h4>Traffic-Aware Route</h4>

          <div className="result-grid">
            <ResultMetric
              label="ETA"
              value={`${traffic.estimated_time_min ?? "N/A"} min`}
            />
            <ResultMetric
              label="Cost"
              value={traffic.total_cost ?? traffic.total_distance ?? "N/A"}
            />
          </div>

          <p className="route-path">
            {(traffic.path ?? []).join(" → ") || "No path available"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="route-result-card accent">
      <h4>Route Result</h4>

      <div className="result-grid">
        <ResultMetric
          label="ETA"
          value={`${result.estimated_time_min ?? "N/A"} min`}
        />
        <ResultMetric
          label="Visited Nodes"
          value={result.visited_nodes_count ?? "N/A"}
        />
        <ResultMetric
          label="Total Cost"
          value={result.total_cost ?? result.total_distance ?? "N/A"}
        />
        <ResultMetric label="Algorithm" value={result.algorithm ?? "N/A"} />
      </div>

      <p className="route-path">
        {(result.path ?? []).join(" → ") || "No path available"}
      </p>
    </div>
  );
}

function AlgorithmComparisonSummary({ comparison }) {
  if (!comparison) {
    return (
      <p className="workspace-panel-copy">
        Compare Dijkstra and A* to visualize which algorithm explores fewer
        nodes and runs faster.
      </p>
    );
  }

  const dijkstra = comparison.dijkstra ?? {};
  const astar = comparison.astar ?? {};
  const summary = comparison.summary ?? {};

  return (
    <div className="route-result-stack">
      <div className="route-result-card">
        <h4>Dijkstra</h4>

        <div className="result-grid">
          <ResultMetric
            label="Visited"
            value={dijkstra.visited_nodes_count ?? "N/A"}
          />
          <ResultMetric
            label="Runtime"
            value={`${dijkstra.runtime_ms ?? "N/A"} ms`}
          />
          <ResultMetric label="Cost" value={dijkstra.total_cost ?? "N/A"} />
          <ResultMetric
            label="Path Nodes"
            value={(dijkstra.path ?? []).length}
          />
        </div>
      </div>

      <div className="route-result-card accent">
        <h4>A*</h4>

        <div className="result-grid">
          <ResultMetric
            label="Visited"
            value={astar.visited_nodes_count ?? "N/A"}
          />
          <ResultMetric
            label="Runtime"
            value={`${astar.runtime_ms ?? "N/A"} ms`}
          />
          <ResultMetric label="Cost" value={astar.total_cost ?? "N/A"} />
          <ResultMetric label="Path Nodes" value={(astar.path ?? []).length} />
        </div>
      </div>

      <div className="highlight-box">
        <span>Recommended</span>
        <strong>{summary.winner ?? summary.best_algorithm ?? "N/A"}</strong>
        <p>{summary.reason ?? "Comparison completed successfully."}</p>
      </div>
    </div>
  );
}

export default function RoutePlannerPanel({
  form,
  locations,
  onChange,
  onSubmitRoute,
  onSubmitBestRoute,
  onCompare,
  loadingRoute,
  loadingComparison,
  routeResult,
  comparison,
  error,
}) {
  const disabled = !locations.length || loadingRoute || loadingComparison;

  return (
    <div className="workspace-panel-stack">
      <section className="details-card hero-panel">
        <p className="eyebrow">Routing</p>
        <h1 className="workspace-panel-title">Route Planner</h1>
        <p className="workspace-panel-copy">
          Plan time-aware, traffic-aware, and algorithm-comparison routes
          directly on the live Cairo network map.
        </p>
      </section>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="details-card">
        <h3>Plan Route</h3>

        <form className="smart-form" onSubmit={onSubmitRoute}>
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
            Departure Time
            <select
              name="departure_time"
              value={form.departure_time}
              onChange={onChange}
              disabled={disabled}
            >
              {departureTimes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Day Type
            <select
              name="day_type"
              value={form.day_type}
              onChange={onChange}
              disabled={disabled}
            >
              <option value="weekday">Weekday</option>
              <option value="weekend">Weekend</option>
            </select>
          </label>

          <div className="button-stack">
            <button type="submit" disabled={disabled}>
              {loadingRoute ? "Finding route..." : "Find Time Route"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={onSubmitBestRoute}
              disabled={disabled}
            >
              {loadingRoute ? "Analyzing..." : "Best Route by Time"}
            </button>

            <button
              type="button"
              className="ghost-button"
              onClick={onCompare}
              disabled={disabled}
            >
              {loadingComparison ? "Comparing..." : "Compare Dijkstra vs A*"}
            </button>
          </div>
        </form>
      </section>

      <section className="details-card">
        <h3>Route Result</h3>
        <RouteSummary result={routeResult} />
      </section>

      <section className="details-card">
        <h3>Algorithm Comparison</h3>
        <AlgorithmComparisonSummary comparison={comparison} />
      </section>
    </div>
  );
}