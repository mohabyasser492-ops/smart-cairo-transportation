import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { routingApi } from "../api/client";
import AlgorithmComparison from "../components/AlgorithmComparison";
import { useLocationOptions } from "../hooks/useLocationOptions";
import { pageTransition, resultReveal, buttonMotion } from "../ui/motion";

const weights = [{ value: "distance", label: "Distance" }];

export default function AlgorithmRace() {
  const { options: locations, loading: loadingLocations, error: locationsError } =
    useLocationOptions({ includeFacilities: false });

  const [form, setForm] = useState({ source: "", destination: "", weight: "distance" });
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [raceStep, setRaceStep] = useState(0);

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
    setComparison(null);
    setIsPlaying(false);
    setRaceStep(0);

    try {
      const data = await routingApi.compareDijkstraVsAstar(form);
      setComparison(data);
      setRaceStep(0);
      setIsPlaying(true);
    } catch (err) {
      setError(err.message || "Could not run routing comparison.");
    } finally {
      setLoading(false);
    }
  }

  const dijkstraOrder = comparison?.dijkstra?.exploration_order || [];
  const astarOrder = comparison?.astar?.exploration_order || [];
  const maxSteps = useMemo(() => Math.max(dijkstraOrder.length, astarOrder.length, 1), [astarOrder.length, dijkstraOrder.length]);

  useEffect(() => {
    if (!isPlaying || !comparison) return undefined;

    const interval = setInterval(() => {
      setRaceStep((previous) => {
        if (previous >= maxSteps - 1) {
          return previous;
        }
        return previous + 1;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [comparison, isPlaying, maxSteps]);

  const dijkstraCurrentNode = dijkstraOrder[Math.min(raceStep, Math.max(dijkstraOrder.length - 1, 0))] || "N/A";
  const astarCurrentNode = astarOrder[Math.min(raceStep, Math.max(astarOrder.length - 1, 0))] || "N/A";
  const dijkstraVisibleOrder = dijkstraOrder.slice(0, raceStep + 1);
  const astarVisibleOrder = astarOrder.slice(0, raceStep + 1);
  const dijkstraProgress = comparison ? Math.round((dijkstraVisibleOrder.length / Math.max(dijkstraOrder.length, 1)) * 100) : 0;
  const astarProgress = comparison ? Math.round((astarVisibleOrder.length / Math.max(astarOrder.length, 1)) * 100) : 0;

  return (
    <motion.div {...pageTransition}>
      <div className="page-header">
        <p className="eyebrow">Performance Analysis</p>
        <h1>Routing Performance</h1>
        <p>
          Compare routing behavior, exploration order, and efficiency across supported
          pathfinding methods.
        </p>
      </div>

      {(error || locationsError) && <div className="error-box">{error || locationsError}</div>}

      <div className="planner-layout">
        <div className="form-card">
          <h3>Comparison Inputs</h3>
          <form onSubmit={handleSubmit}>
            <label>
              Source
              <select name="source" value={form.source} onChange={handleChange} disabled={loadingLocations}>
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>{location.label}</option>
                ))}
              </select>
            </label>
            <label>
              Destination
              <select name="destination" value={form.destination} onChange={handleChange} disabled={loadingLocations}>
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>{location.label}</option>
                ))}
              </select>
            </label>
            <label>
              Weight
              <select name="weight" value={form.weight} onChange={handleChange}>
                {weights.map((weight) => (
                  <option key={weight.value} value={weight.value}>{weight.label}</option>
                ))}
              </select>
            </label>
            <motion.button {...buttonMotion} type="submit" disabled={loading || loadingLocations}>
              {loading ? "Running..." : "Run Performance Comparison"}
            </motion.button>
          </form>
        </div>

        <div className="comparison-section">
          <motion.div className="result-card" {...resultReveal}>
            <h3>Race Playback</h3>
            {!comparison ? (
              <div className="empty-state">Run a routing comparison to start the animation.</div>
            ) : (
              <>
                <div className="comparison-grid">
                  <div>
                    <div className="race-progress-row">
                      <span>Dijkstra</span>
                      <span>{dijkstraProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${dijkstraProgress}%` }} />
                    </div>
                    <strong>Current Node: {dijkstraCurrentNode}</strong>
                    <p>{dijkstraVisibleOrder.join(" → ") || "Not started"}</p>
                  </div>
                  <div>
                    <div className="race-progress-row">
                      <span>A*</span>
                      <span>{astarProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill alt" style={{ width: `${astarProgress}%` }} />
                    </div>
                    <strong>Current Node: {astarCurrentNode}</strong>
                    <p>{astarVisibleOrder.join(" → ") || "Not started"}</p>
                  </div>
                </div>

                <div className="race-controls" style={{ marginTop: 16 }}>
                  <motion.button {...buttonMotion} type="button" onClick={() => setIsPlaying((value) => !value)}>
                    {isPlaying ? "Pause Animation" : "Play Animation"}
                  </motion.button>
                  <motion.button {...buttonMotion} type="button" className="secondary-button" onClick={() => { setRaceStep(0); setIsPlaying(true); }}>
                    Restart Animation
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>

          <motion.div className="result-card" {...resultReveal}>
            <AlgorithmComparison comparison={comparison} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}