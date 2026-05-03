import PerformanceChart from "./PerformanceChart";

export default function AlgorithmComparison({ comparison }) {
  if (!comparison) {
    return (
      <div className="empty-state">
        Run Dijkstra vs A* comparison to see algorithm results.
      </div>
    );
  }

  const dijkstra = comparison.dijkstra || {};
  const astar = comparison.astar || {};

  const chartData = [
    {
      algorithm: "Dijkstra",
      visited_nodes: dijkstra.visited_nodes_count ?? 0,
    },
    {
      algorithm: "A*",
      visited_nodes: astar.visited_nodes_count ?? 0,
    },
  ];

  return (
    <div className="comparison-section">
      <div className="comparison-grid">
        <div className="result-card">
          <h3>Dijkstra</h3>
          <p>
            <strong>Path:</strong>{" "}
            {(dijkstra.path || []).join(" → ") || "N/A"}
          </p>
          <p>
            <strong>Visited Nodes:</strong>{" "}
            {dijkstra.visited_nodes_count ?? "N/A"}
          </p>
        </div>

        <div className="result-card">
          <h3>A*</h3>
          <p>
            <strong>Path:</strong>{" "}
            {(astar.path || []).join(" → ") || "N/A"}
          </p>
          <p>
            <strong>Visited Nodes:</strong>{" "}
            {astar.visited_nodes_count ?? "N/A"}
          </p>
        </div>
      </div>

      <div className="result-card">
        <h3>Comparison Summary</h3>
        <p>
          <strong>Source:</strong> {comparison.source}
        </p>
        <p>
          <strong>Destination:</strong> {comparison.destination}
        </p>
        <p>
          <strong>Weight Used:</strong> {comparison.weight_used}
        </p>
        <p>
          <strong>Dijkstra Visited Nodes:</strong>{" "}
          {comparison.summary?.dijkstra_visited_nodes ?? "N/A"}
        </p>
        <p>
          <strong>A* Visited Nodes:</strong>{" "}
          {comparison.summary?.astar_visited_nodes ?? "N/A"}
        </p>
        <p>
          <strong>A* More Efficient:</strong>{" "}
          {comparison.summary?.astar_more_efficient ? "Yes" : "No"}
        </p>
      </div>

      <PerformanceChart data={chartData} />
    </div>
  );
}