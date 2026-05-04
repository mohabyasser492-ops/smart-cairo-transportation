import PerformanceChart from "./PerformanceChart";

export default function AlgorithmComparison({ comparison }) {
  if (!comparison) {
    return (
      <div className="empty-state">
        Run a routing comparison to review method performance.
      </div>
    );
  }

  const dijkstra = comparison.dijkstra || {};
  const astar = comparison.astar || {};
  const summary = comparison.summary || {};

  const chartData = [
    {
      algorithm: "Dijkstra",
      visited_nodes: dijkstra.visited_nodes_count ?? 0,
      runtime_ms: dijkstra.runtime_ms ?? 0,
      total_cost: dijkstra.total_cost ?? 0,
    },
    {
      algorithm: "A*",
      visited_nodes: astar.visited_nodes_count ?? 0,
      runtime_ms: astar.runtime_ms ?? 0,
      total_cost: astar.total_cost ?? 0,
    },
  ];

  return (
    <div className="comparison-section">
      <div className="comparison-grid">
        <div className="result-card">
          <h3>Dijkstra</h3>
          <div className="result-grid">
            <div>
              <span>Path</span>
              <strong>{(dijkstra.path || []).join(" → ") || "N/A"}</strong>
            </div>
            <div>
              <span>Total Cost</span>
              <strong>{dijkstra.total_cost ?? "N/A"}</strong>
            </div>
            <div>
              <span>Visited Nodes</span>
              <strong>{dijkstra.visited_nodes_count ?? "N/A"}</strong>
            </div>
            <div>
              <span>Runtime</span>
              <strong>{dijkstra.runtime_ms ?? "N/A"} ms</strong>
            </div>
          </div>
        </div>

        <div className="result-card">
          <h3>A*</h3>
          <div className="result-grid">
            <div>
              <span>Path</span>
              <strong>{(astar.path || []).join(" → ") || "N/A"}</strong>
            </div>
            <div>
              <span>Total Cost</span>
              <strong>{astar.total_cost ?? "N/A"}</strong>
            </div>
            <div>
              <span>Visited Nodes</span>
              <strong>{astar.visited_nodes_count ?? "N/A"}</strong>
            </div>
            <div>
              <span>Runtime</span>
              <strong>{astar.runtime_ms ?? "N/A"} ms</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="result-card">
        <h3>Comparison Summary</h3>
        <div className="result-grid">
          <div>
            <span>Winner</span>
            <strong>{summary.winner ?? "N/A"}</strong>
          </div>
          <div>
            <span>Weight Used</span>
            <strong>{comparison.weight_used ?? "N/A"}</strong>
          </div>
          <div>
            <span>Dijkstra Visited Nodes</span>
            <strong>{summary.dijkstra_visited_nodes ?? "N/A"}</strong>
          </div>
          <div>
            <span>A* Visited Nodes</span>
            <strong>{summary.astar_visited_nodes ?? "N/A"}</strong>
          </div>
          <div>
            <span>Dijkstra Runtime</span>
            <strong>{summary.dijkstra_runtime_ms ?? "N/A"} ms</strong>
          </div>
          <div>
            <span>A* Runtime</span>
            <strong>{summary.astar_runtime_ms ?? "N/A"} ms</strong>
          </div>
          <div>
            <span>Dijkstra Cost</span>
            <strong>{summary.dijkstra_total_cost ?? "N/A"}</strong>
          </div>
          <div>
            <span>A* Cost</span>
            <strong>{summary.astar_total_cost ?? "N/A"}</strong>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span>Winner Reason</span>
            <strong>{summary.winner_reason ?? "No summary available."}</strong>
          </div>
        </div>
      </div>

      <PerformanceChart data={chartData} />
    </div>
  );
}