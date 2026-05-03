export default function RouteResult({ result }) {
  if (!result) {
    return (
      <div className="empty-state">
        Run a route search to see the result here.
      </div>
    );
  }

  // If best-route-by-time returns two routes, show a special block
  if (result.normal_shortest_route && result.traffic_aware_route) {
    return (
      <div className="result-card">
        <h3>Best Route By Time Result</h3>

        <div className="result-grid">
          <div>
            <span>Source</span>
            <strong>{result.source}</strong>
          </div>

          <div>
            <span>Destination</span>
            <strong>{result.destination}</strong>
          </div>

          <div>
            <span>Departure Time</span>
            <strong>{result.departure_time}</strong>
          </div>

          <div>
            <span>Day Type</span>
            <strong>{result.day_type}</strong>
          </div>

          <div>
            <span>Recommended Algorithm</span>
            <strong>{result.recommendation?.recommended_algorithm || "N/A"}</strong>
          </div>

          <div>
            <span>Reason</span>
            <strong>{result.recommendation?.reason || "N/A"}</strong>
          </div>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h4>Normal Shortest Route</h4>
          <p>
            <strong>Path:</strong>{" "}
            {(result.normal_shortest_route.path || []).join(" → ")}
          </p>
          <p>
            <strong>Visited Nodes:</strong>{" "}
            {result.normal_shortest_route.visited_nodes_count ?? "N/A"}
          </p>
        </div>

        <div style={{ marginTop: "24px" }}>
          <h4>Traffic-Aware Route</h4>
          <p>
            <strong>Path:</strong>{" "}
            {(result.traffic_aware_route.path || []).join(" → ")}
          </p>
          <p>
            <strong>Estimated Time:</strong>{" "}
            {result.traffic_aware_route.estimated_time_min ?? "N/A"} min
          </p>
          <p>
            <strong>Traffic Multiplier:</strong>{" "}
            {result.traffic_aware_route.traffic_multiplier ?? "N/A"}
          </p>
          <p>
            <strong>Visited Nodes:</strong>{" "}
            {result.traffic_aware_route.visited_nodes_count ?? "N/A"}
          </p>
        </div>
      </div>
    );
  }

  const path = result.path || [];
  const estimatedTime = result.estimated_time_min ?? "N/A";
  const visitedNodes = result.visited_nodes_count ?? "N/A";

  return (
    <div className="result-card">
      <h3>Route Result</h3>

      <div className="result-grid">
        <div>
          <span>Algorithm</span>
          <strong>{result.algorithm ?? "N/A"}</strong>
        </div>

        <div>
          <span>Path</span>
          <strong>{path.length ? path.join(" → ") : "No path returned"}</strong>
        </div>

        <div>
          <span>Source</span>
          <strong>{result.source ?? "N/A"}</strong>
        </div>

        <div>
          <span>Destination</span>
          <strong>{result.destination ?? "N/A"}</strong>
        </div>

        <div>
          <span>Departure Time</span>
          <strong>{result.departure_time ?? "N/A"}</strong>
        </div>

        <div>
          <span>Day Type</span>
          <strong>{result.day_type ?? "N/A"}</strong>
        </div>

        <div>
          <span>Estimated Time</span>
          <strong>{estimatedTime} min</strong>
        </div>

        <div>
          <span>Traffic Multiplier</span>
          <strong>{result.traffic_multiplier ?? "N/A"}</strong>
        </div>

        <div>
          <span>Visited Nodes</span>
          <strong>{visitedNodes}</strong>
        </div>
      </div>
    </div>
  );
}
