import { useState } from "react";
import { routingApi } from "../api/client";

const locations = [
  { value: "Maadi", label: "Maadi" },
  { value: "Nasr City", label: "Nasr City" },
  { value: "Downtown Cairo", label: "Downtown Cairo" },
  { value: "New Cairo", label: "New Cairo" },
  { value: "Heliopolis", label: "Heliopolis" },
  { value: "Zamalek", label: "Zamalek" },
  { value: "6th October City", label: "6th October City" },
  { value: "Giza", label: "Giza" },
  { value: "Mohandessin", label: "Mohandessin" },
  { value: "Dokki", label: "Dokki" },
  { value: "Shubra", label: "Shubra" },
  { value: "Helwan", label: "Helwan" },
  { value: "New Administrative Capital", label: "New Administrative Capital" },
  { value: "Al Rehab", label: "Al Rehab" },
  { value: "Sheikh Zayed", label: "Sheikh Zayed" },
];

const emergencyTypes = [
  { value: "ambulance", label: "Ambulance" },
  { value: "fire_truck", label: "Fire Truck" },
  { value: "police", label: "Police" },
];

export default function EmergencyRouting() {
  const [form, setForm] = useState({
    source: "Maadi",
    destination: "Downtown Cairo",
    emergency_type: "ambulance",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        source: form.source,
        destination: form.destination,
        emergency_type: form.emergency_type,
      };

      const data = await routingApi.emergencyRoute(payload);
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not load emergency route.");
    } finally {
      setLoading(false);
    }
  }

  const path = result?.path || [];

  const visitedNodes =
    result?.visited_nodes_count ??
    result?.visited_nodes ??
    result?.explored_nodes ??
    "N/A";

  const chosenAlgorithm =
    result?.chosen_algorithm ?? result?.algorithm ?? "N/A";

  const selectionReason = result?.selection_reason ?? "N/A";

  const weightUsed = result?.weight_used ?? "distance";

  const displayedDistance =
    result?.total_distance_km ??
    result?.distance_km ??
    result?.distance ??
    (weightUsed === "distance" ? result?.total_cost : null);

  const numericDistance =
    displayedDistance !== null && displayedDistance !== undefined
      ? Number(displayedDistance)
      : null;

  const estimatedTime =
    result?.estimated_time_min ??
    result?.estimated_time_minutes ??
    result?.time_minutes ??
    result?.time ??
    (numericDistance !== null && !Number.isNaN(numericDistance)
      ? Math.round((numericDistance / 80) * 60)
      : null);

  const pathSteps = path.length > 0 ? path.length - 1 : 0;

  const dijkstraResult = result?.comparison?.dijkstra ?? null;
  const astarResult = result?.comparison?.astar ?? null;

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">Emergency Response</p>
        <h1>Emergency Routing</h1>
        <p>
          Find the best emergency route using Dijkstra and A* comparison, then
          select the most efficient route for emergency response.
        </p>
      </div>

      <div className="planner-layout">
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>Emergency Route Inputs</h3>

          <label>
            Source
            <select
              name="source"
              value={form.source}
              onChange={handleChange}
            >
              {locations.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination
            <select
              name="destination"
              value={form.destination}
              onChange={handleChange}
            >
              {locations.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Emergency Type
            <select
              name="emergency_type"
              value={form.emergency_type}
              onChange={handleChange}
            >
              {emergencyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <div className="button-row">
            <button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Run Emergency Route"}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}
        </form>

        <div className="result-card">
          <h3>Emergency Route Result</h3>

          {!result ? (
            <div className="empty-state">
              Run an emergency route search to see the result here.
            </div>
          ) : (
            <>
              <div className="result-grid">
                <div>
                  <span>Path</span>
                  <strong>{path.length ? path.join(" → ") : "N/A"}</strong>
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
                  <span>Emergency Type</span>
                  <strong>{result.emergency_type ?? "N/A"}</strong>
                </div>

                <div>
                  <span>Priority</span>
                  <strong>{result.priority ?? "N/A"}</strong>
                </div>

                <div>
                  <span>Chosen Algorithm</span>
                  <strong>{chosenAlgorithm}</strong>
                </div>

                <div>
                  <span>Visited Nodes</span>
                  <strong>{visitedNodes}</strong>
                </div>

                <div>
                  <span>Path Steps</span>
                  <strong>{pathSteps}</strong>
                </div>

                <div>
                  <span>Distance</span>
                  <strong>
                    {displayedDistance !== null &&
                    displayedDistance !== undefined
                      ? `${displayedDistance} km`
                      : "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Estimated Time</span>
                  <strong>
                    {estimatedTime !== null && estimatedTime !== undefined
                      ? `${estimatedTime} min`
                      : "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Selection Reason</span>
                  <strong>{selectionReason}</strong>
                </div>

                <div>
                  <span>Recommended Action</span>
                  <strong>{result.recommended_action ?? "N/A"}</strong>
                </div>
              </div>

              {dijkstraResult && astarResult && (
                <div className="comparison-section" style={{ marginTop: "24px" }}>
                  <h3>Algorithm Comparison</h3>

                  <div className="comparison-grid">
                    <div className="result-card">
                      <h4>Dijkstra</h4>
                      <p>
                        <strong>Path:</strong>{" "}
                        {(dijkstraResult.path || []).join(" → ") || "N/A"}
                      </p>
                      <p>
                        <strong>Visited Nodes:</strong>{" "}
                        {dijkstraResult.visited_nodes_count ?? "N/A"}
                      </p>
                      <p>
                        <strong>Total Cost:</strong>{" "}
                        {dijkstraResult.total_cost ?? "N/A"}
                      </p>
                    </div>

                    <div className="result-card">
                      <h4>A*</h4>
                      <p>
                        <strong>Path:</strong>{" "}
                        {(astarResult.path || []).join(" → ") || "N/A"}
                      </p>
                      <p>
                        <strong>Visited Nodes:</strong>{" "}
                        {astarResult.visited_nodes_count ?? "N/A"}
                      </p>
                      <p>
                        <strong>Total Cost:</strong>{" "}
                        {astarResult.total_cost ?? "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}