import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { routingApi, dataApi } from "../api/client";
import { pageTransition, resultReveal, buttonMotion } from "../ui/motion";

const emergencyTypes = [
  { value: "ambulance", label: "Ambulance" },
  { value: "fire_truck", label: "Fire Truck" },
  { value: "police", label: "Police" },
];

function ResultMetric({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AlgorithmCard({ title, result, active = false }) {
  if (!result) return null;

  return (
    <div className="result-card" style={{ borderColor: active ? "rgba(37, 99, 235, 0.35)" : undefined }}>
      <h4 style={{ marginTop: 0, marginBottom: 14 }}>
        {title} {active ? "• Selected" : ""}
      </h4>
      <div className="result-grid">
        <ResultMetric label="Path" value={(result.path || []).join(" → ") || "N/A"} />
        <ResultMetric label="Total Cost" value={result.total_cost ?? "N/A"} />
        <ResultMetric label="Visited Nodes" value={result.visited_nodes_count ?? "N/A"} />
        <ResultMetric label="Runtime" value={result.runtime_ms != null ? `${result.runtime_ms} ms` : "N/A"} />
      </div>
    </div>
  );
}

export default function EmergencyRouting() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    source: "",
    destination: "",
    emergency_type: "ambulance",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadLocations() {
      setLoadingLocations(true);
      try {
        const [neighborhoods, facilities] = await Promise.all([
          dataApi.getNeighborhoods(),
          dataApi.getFacilities(),
        ]);

        const options = [...(neighborhoods || []), ...(facilities || [])]
          .map((item) => item?.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        if (!mounted) return;
        setLocations(options);
        setForm((previous) => ({
          ...previous,
          source: previous.source || options[0] || "",
          destination: previous.destination || options[1] || options[0] || "",
        }));
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Could not load emergency routing locations.");
      } finally {
        if (mounted) setLoadingLocations(false);
      }
    }

    loadLocations();
    return () => {
      mounted = false;
    };
  }, []);

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

  const comparisonSummary = result?.comparison?.summary || {};
  const dijkstraResult = result?.comparison?.dijkstra || null;
  const astarResult = result?.comparison?.astar || null;
  const winner = comparisonSummary?.winner || result?.chosen_algorithm || "N/A";
  const winnerReason = comparisonSummary?.winner_reason || result?.selection_reason || "N/A";

  const displayedDistance =
    result?.total_distance_km ??
    result?.distance_km ??
    result?.distance ??
    result?.total_cost ??
    null;

  const pathSteps = useMemo(() => {
    const path = result?.path || [];
    return path.length > 0 ? path.length - 1 : 0;
  }, [result]);

  return (
    <motion.div {...pageTransition}>
      <div className="page-header">
        <p className="eyebrow">Emergency Operations</p>
        <h1>Emergency Routing</h1>
        <p>
          Compare Dijkstra and A* for emergency dispatch, then automatically choose
          the better route based on route cost, runtime, and search effort.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Response Types</span>
          <strong>{emergencyTypes.length}</strong>
          <p>Ambulance, fire response, and police routing supported</p>
        </div>
        <div className="stat-card">
          <span>Decision Mode</span>
          <strong>Auto</strong>
          <p>The backend compares Dijkstra and A* and selects the better emergency route</p>
        </div>
        <div className="stat-card">
          <span>Selection Factors</span>
          <strong>3</strong>
          <p>Total cost, runtime, and visited nodes are used in the final decision</p>
        </div>
        <div className="stat-card">
          <span>Locations</span>
          <strong>{loadingLocations ? "..." : locations.length}</strong>
          <p>Available routing origins and destinations loaded dynamically from backend data</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="planner-layout">
        <div className="form-card">
          <h3>Response Inputs</h3>
          <form onSubmit={handleSubmit}>
            <label>
              Source
              <select name="source" value={form.source} onChange={handleChange} disabled={loadingLocations}>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Destination
              <select name="destination" value={form.destination} onChange={handleChange} disabled={loadingLocations}>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
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
              {loading ? "Comparing & Choosing..." : "Compare and Choose Best Route"}
            </motion.button>
          </form>
        </div>

        <motion.div className="result-card" {...resultReveal}>
          <h3>Selected Emergency Route</h3>
          {!result ? (
            <div className="empty-state">
              Run emergency routing to compare algorithms and select the best dispatch route.
            </div>
          ) : (
            <>
              <div className="traffic-highlight-box" style={{ marginTop: 0 }}>
                <span>Best Algorithm</span>
                <strong>{String(winner).toUpperCase()}</strong>
                <p>{winnerReason}</p>
              </div>

              <div className="result-grid" style={{ marginTop: 20 }}>
                <ResultMetric label="Path" value={(result.path || []).join(" → ") || "N/A"} />
                <ResultMetric label="Emergency Type" value={result.emergency_type ?? "N/A"} />
                <ResultMetric label="Priority" value={result.priority ?? "N/A"} />
                <ResultMetric label="Estimated Time" value={result.estimated_time_min != null ? `${result.estimated_time_min} min` : "N/A"} />
                <ResultMetric label="Distance / Cost" value={displayedDistance != null ? `${displayedDistance}` : "N/A"} />
                <ResultMetric label="Path Steps" value={pathSteps} />
              </div>

              <div className="traffic-highlight-box">
                <span>Recommended Action</span>
                <strong>{result.recommended_action ?? "N/A"}</strong>
                <p>
                  Decision basis: {comparisonSummary?.decision_basis ?? "N/A"}
                  {comparisonSummary?.runtime_difference_ms != null
                    ? ` • Runtime difference: ${comparisonSummary.runtime_difference_ms} ms`
                    : ""}
                  {comparisonSummary?.visited_nodes_difference != null
                    ? ` • Visited-node difference: ${comparisonSummary.visited_nodes_difference}`
                    : ""}
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {result && (
        <div className="comparison-section">
          <motion.div className="result-card" {...resultReveal}>
            <h3>Algorithm Comparison</h3>
            <div className="comparison-grid">
              <AlgorithmCard title="Dijkstra" result={dijkstraResult} active={winner === "dijkstra"} />
              <AlgorithmCard title="A*" result={astarResult} active={winner === "astar"} />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
