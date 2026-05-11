import { useMemo } from "react";

function PerformanceMetric({ label, value }) {
  return (
    <div className="result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getNodePoint(name, locationLookup) {
  const node = locationLookup?.get?.(String(name));
  const position = node?.mapPosition;

  if (!Array.isArray(position) || position.length !== 2) return null;

  const lat = Number(position[0]);
  const lng = Number(position[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    name,
    lat,
    lng,
  };
}

function buildPolyline(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function AlgorithmRaceVisualization({
  comparison,
  locationLookup,
  raceStep,
  maxRaceSteps,
  isRacePlaying,
  onToggleRace,
  onRestartRace,
  onStepRace,
}) {
  const dijkstraOrder = comparison?.dijkstra?.exploration_order ?? [];
  const astarOrder = comparison?.astar?.exploration_order ?? [];

  const dijkstraVisible = dijkstraOrder.slice(0, raceStep + 1);
  const astarVisible = astarOrder.slice(0, raceStep + 1);
  const dijkstraCurrent =
    dijkstraOrder[Math.min(raceStep, Math.max(dijkstraOrder.length - 1, 0))];
  const astarCurrent =
    astarOrder[Math.min(raceStep, Math.max(astarOrder.length - 1, 0))];

  const dijkstraProgress = comparison
    ? Math.round((dijkstraVisible.length / Math.max(dijkstraOrder.length, 1)) * 100)
    : 0;
  const astarProgress = comparison
    ? Math.round((astarVisible.length / Math.max(astarOrder.length, 1)) * 100)
    : 0;

  const plot = useMemo(() => {
    const dijkstraPoints = dijkstraVisible
      .map((name) => getNodePoint(name, locationLookup))
      .filter(Boolean);
    const astarPoints = astarVisible
      .map((name) => getNodePoint(name, locationLookup))
      .filter(Boolean);
    const dijkstraPath = (comparison?.dijkstra?.path ?? [])
      .map((name) => getNodePoint(name, locationLookup))
      .filter(Boolean);
    const astarPath = (comparison?.astar?.path ?? [])
      .map((name) => getNodePoint(name, locationLookup))
      .filter(Boolean);
    const allPoints = [
      ...dijkstraPoints,
      ...astarPoints,
      ...dijkstraPath,
      ...astarPath,
    ];

    if (!allPoints.length) {
      return {
        dijkstraPoints: [],
        astarPoints: [],
        dijkstraPath: [],
        astarPath: [],
      };
    }

    const minLat = Math.min(...allPoints.map((point) => point.lat));
    const maxLat = Math.max(...allPoints.map((point) => point.lat));
    const minLng = Math.min(...allPoints.map((point) => point.lng));
    const maxLng = Math.max(...allPoints.map((point) => point.lng));
    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;
    const padding = 28;
    const width = 360;
    const height = 220;

    function project(point) {
      return {
        ...point,
        x: padding + ((point.lng - minLng) / lngRange) * (width - padding * 2),
        y: height - padding - ((point.lat - minLat) / latRange) * (height - padding * 2),
      };
    }

    return {
      dijkstraPoints: dijkstraPoints.map(project),
      astarPoints: astarPoints.map(project),
      dijkstraPath: dijkstraPath.map(project),
      astarPath: astarPath.map(project),
    };
  }, [
    astarVisible,
    comparison?.astar?.path,
    comparison?.dijkstra?.path,
    dijkstraVisible,
    locationLookup,
  ]);

  if (!comparison) {
    return (
      <p className="workspace-panel-copy">
        Run a comparison to watch Dijkstra and A* race across the same network.
      </p>
    );
  }

  const dijkstraRunner = plot.dijkstraPoints.at(-1);
  const astarRunner = plot.astarPoints.at(-1);
  const canScrub = maxRaceSteps > 1;

  return (
    <div className="algorithm-race-visual">
      <div className="race-board" aria-label="Algorithm race visualization">
        <svg viewBox="0 0 360 220" role="img">
          <rect className="race-map-bg" x="0" y="0" width="360" height="220" rx="18" />

          {plot.dijkstraPath.length > 1 ? (
            <polyline
              className="race-path dijkstra"
              points={buildPolyline(plot.dijkstraPath)}
            />
          ) : null}

          {plot.astarPath.length > 1 ? (
            <polyline
              className="race-path astar"
              points={buildPolyline(plot.astarPath)}
            />
          ) : null}

          {plot.dijkstraPoints.length > 1 ? (
            <polyline
              className="race-trail dijkstra"
              points={buildPolyline(plot.dijkstraPoints)}
            />
          ) : null}

          {plot.astarPoints.length > 1 ? (
            <polyline
              className="race-trail astar"
              points={buildPolyline(plot.astarPoints)}
            />
          ) : null}

          {plot.dijkstraPoints.map((point) => (
            <circle
              key={`dijkstra-${point.name}`}
              className="race-node dijkstra"
              cx={point.x}
              cy={point.y}
              r="4"
            />
          ))}

          {plot.astarPoints.map((point) => (
            <circle
              key={`astar-${point.name}`}
              className="race-node astar"
              cx={point.x}
              cy={point.y}
              r="4"
            />
          ))}

          {dijkstraRunner ? (
            <g className="race-runner dijkstra" transform={`translate(${dijkstraRunner.x} ${dijkstraRunner.y})`}>
              <circle r="9" />
              <text y="4">D</text>
            </g>
          ) : null}

          {astarRunner ? (
            <g className="race-runner astar" transform={`translate(${astarRunner.x} ${astarRunner.y})`}>
              <circle r="9" />
              <text y="4">A</text>
            </g>
          ) : null}
        </svg>
      </div>

      <div className="race-lanes">
        <div className="race-lane dijkstra">
          <div className="race-progress-row">
            <strong>Dijkstra</strong>
            <span>{dijkstraProgress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill dijkstra" style={{ width: `${dijkstraProgress}%` }} />
          </div>
          <span>Current: {dijkstraCurrent ?? "N/A"}</span>
        </div>

        <div className="race-lane astar">
          <div className="race-progress-row">
            <strong>A*</strong>
            <span>{astarProgress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill astar" style={{ width: `${astarProgress}%` }} />
          </div>
          <span>Current: {astarCurrent ?? "N/A"}</span>
        </div>
      </div>

      <div className="race-controls">
        <button type="button" onClick={onToggleRace}>
          {isRacePlaying ? "Pause Race" : "Play Race"}
        </button>
        <button type="button" className="secondary-button" onClick={onRestartRace}>
          Restart
        </button>
      </div>

      <label className="race-scrubber">
        Step {Math.min(raceStep + 1, maxRaceSteps)} of {maxRaceSteps}
        <input
          type="range"
          min="0"
          max={Math.max(maxRaceSteps - 1, 0)}
          value={raceStep}
          disabled={!canScrub}
          onChange={(event) => onStepRace(Number(event.target.value))}
        />
      </label>
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
  locationLookup,
  raceStep = 0,
  maxRaceSteps = 1,
  isRacePlaying = false,
  onToggleRace,
  onRestartRace,
  onStepRace,
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
              <option value="travel_time">Travel Time</option>
            </select>
          </label>

          <button type="submit" disabled={disabled}>
            {loading ? "Comparing..." : "Run Algorithm Race"}
          </button>
        </form>
      </section>

      <section className="details-card">
        <h3>Live Algorithm Race</h3>
        <AlgorithmRaceVisualization
          comparison={comparison}
          locationLookup={locationLookup}
          raceStep={raceStep}
          maxRaceSteps={maxRaceSteps}
          isRacePlaying={isRacePlaying}
          onToggleRace={onToggleRace}
          onRestartRace={onRestartRace}
          onStepRace={onStepRace}
        />
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
