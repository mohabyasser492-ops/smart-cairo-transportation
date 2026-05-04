import { useState } from "react";
import { motion } from "framer-motion";
import { routingApi } from "../api/client";
import { pageTransition, resultReveal, buttonMotion } from "../ui/motion";

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

  const selectedMethod = result?.chosen_algorithm ?? result?.algorithm ?? "N/A";
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
    <motion.section {...pageTransition}>
      <motion.div className="page-header" {...resultReveal}>
        <p className="eyebrow">Emergency Operations</p>
        <h1>Emergency Routing</h1>
        <p>
          Generate priority routes for emergency response and evaluate the most
          effective path across the network.
        </p>
      </motion.div>

      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut", delay: 0.05 }}
      >
        <div className="stat-card">
          <span>Coverage</span>
          <strong>{locations.length}</strong>
          <p>Available emergency routing locations in the Cairo network</p>
        </div>

        <div className="stat-card">
          <span>Response Types</span>
          <strong>{emergencyTypes.length}</strong>
          <p>Ambulance, fire response, and police routing supported</p>
        </div>

        <div className="stat-card">
          <span>Routing Strategy</span>
          <strong>Adaptive</strong>
          <p>Evaluates the most effective response path based on backend output</p>
        </div>

        <div className="stat-card">
          <span>Method Comparison</span>
          <strong>Included</strong>
          <p>Compare search efficiency between supported routing methods</p>
        </div>
      </motion.div>

      <div className="planner-layout">
        <motion.form
          className="form-card"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <h3>Response Inputs</h3>

          <label>
            Source
            <select name="source" value={form.source} onChange={handleChange}>
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
            <motion.button
              {...buttonMotion}
              type="submit"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Emergency Route"}
            </motion.button>
          </div>

          {error && <div className="error-box">{error}</div>}
        </motion.form>

        <motion.div
          className="result-card"
          {...resultReveal}
          key={result ? "response-loaded" : "response-empty"}
        >
          <h3>Response Route Result</h3>

          {!result ? (
            <div className="empty-state">
              Generate an emergency route to review the recommended path and
              response details.
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
                  <span>Selected Method</span>
                  <strong>{selectedMethod}</strong>
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
                    {displayedDistance !== null && displayedDistance !== undefined
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
                <motion.div
                  className="comparison-section"
                  style={{ marginTop: "24px" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut", delay: 0.06 }}
                >
                  <h3>Method Comparison</h3>

                  <div className="comparison-grid">
                    <motion.div
                      className="result-card"
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.18 }}
                    >
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
                    </motion.div>

                    <motion.div
                      className="result-card"
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.18 }}
                    >
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
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}