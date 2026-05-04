import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { routingApi } from "../api/client";
import { useLocationOptions } from "../hooks/useLocationOptions";
import { pageTransition, resultReveal, buttonMotion } from "../ui/motion";

const emergencyTypes = [
  { value: "ambulance", label: "Ambulance" },
  { value: "fire_truck", label: "Fire Truck" },
  { value: "police", label: "Police" },
];

export default function EmergencyRouting() {
  const { options: locations, loading: loadingLocations, error: locationsError } =
    useLocationOptions({ includeFacilities: false });

  const [form, setForm] = useState({
    source: "",
    destination: "",
    emergency_type: "ambulance",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!locations.length) return;
    setForm((previous) => ({
      ...previous,
      source: previous.source || locations[0]?.value || "",
      destination: previous.destination || locations[1]?.value || locations[0]?.value || "",
    }));
  }, [locations]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await routingApi.emergencyRoute(form);
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not load emergency route.");
    } finally {
      setLoading(false);
    }
  }

  const path = result?.path || [];
  const visitedNodes =
    result?.visited_nodes_count ?? result?.visited_nodes ?? result?.explored_nodes ?? "N/A";
  const selectedMethod = result?.chosen_algorithm ?? result?.algorithm ?? "N/A";
  const selectionReason = result?.selection_reason ?? "N/A";
  const displayedDistance =
    result?.total_distance_km ??
    result?.distance_km ??
    result?.distance ??
    result?.total_cost ??
    null;
  const estimatedTime = result?.estimated_time_min ?? result?.estimated_time_minutes ?? "N/A";

  return (
    <motion.div {...pageTransition}>
      <div className="page-header">
        <p className="eyebrow">Emergency Operations</p>
        <h1>Emergency Routing</h1>
        <p>
          Generate priority routes for emergency response and evaluate the most effective
          path across the network.
        </p>
      </div>

      {(error || locationsError) && <div className="error-box">{error || locationsError}</div>}

      <div className="planner-layout">
        <div className="form-card">
          <h3>Response Inputs</h3>
          <form onSubmit={handleSubmit}>
            <label>
              Source
              <select name="source" value={form.source} onChange={handleChange} disabled={loadingLocations}>
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
                disabled={loadingLocations}
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
              <select name="emergency_type" value={form.emergency_type} onChange={handleChange}>
                {emergencyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <motion.button {...buttonMotion} type="submit" disabled={loading || loadingLocations}>
              {loading ? "Generating..." : "Generate Emergency Route"}
            </motion.button>
          </form>
        </div>

        <motion.div className="result-card" {...resultReveal}>
          <h3>Response Route Result</h3>
          {!result ? (
            <div className="empty-state">
              Generate an emergency route to review the recommended path and response details.
            </div>
          ) : (
            <>
              <div className="result-grid">
                <div>
                  <span>Path</span>
                  <strong>{path.length ? path.join(" → ") : "N/A"}</strong>
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
                  <span>Estimated Time</span>
                  <strong>{estimatedTime !== "N/A" ? `${estimatedTime} min` : "N/A"}</strong>
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
                  <span>Priority</span>
                  <strong>{result.priority ?? "N/A"}</strong>
                </div>
              </div>

              <div className="traffic-highlight-box">
                <span>Selection Reason</span>
                <strong>{selectionReason}</strong>
                <p>{result.recommended_action ?? "No recommended action provided."}</p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}