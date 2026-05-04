import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { routingApi } from "../api/client";
import AlgorithmComparison from "../components/AlgorithmComparison";
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

const weights = [{ value: "distance", label: "Distance" }];

export default function AlgorithmRace() {
  const [form, setForm] = useState({
    source: "Maadi",
    destination: "Giza",
    weight: "distance",
  });

  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [raceStep, setRaceStep] = useState(0);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setComparison(null);
    setIsPlaying(false);
    setRaceStep(0);

    try {
      const payload = {
        source: form.source,
        destination: form.destination,
        weight: form.weight,
      };

      const data = await routingApi.compareDijkstraVsAstar(payload);
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

  const maxSteps = useMemo(() => {
    return Math.max(dijkstraOrder.length, astarOrder.length, 1);
  }, [dijkstraOrder, astarOrder]);

  useEffect(() => {
    if (!isPlaying || !comparison) return;

    const interval = setInterval(() => {
      setRaceStep((previous) => {
        if (previous >= maxSteps - 1) {
          clearInterval(interval);
          return previous;
        }

        return previous + 1;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [isPlaying, comparison, maxSteps]);

  const dijkstraCurrentNode =
    dijkstraOrder[Math.min(raceStep, Math.max(dijkstraOrder.length - 1, 0))] ||
    "N/A";

  const astarCurrentNode =
    astarOrder[Math.min(raceStep, Math.max(astarOrder.length - 1, 0))] || "N/A";

  const dijkstraVisibleOrder = dijkstraOrder.slice(0, raceStep + 1);
  const astarVisibleOrder = astarOrder.slice(0, raceStep + 1);

  const dijkstraProgress = comparison
    ? Math.round(
        (dijkstraVisibleOrder.length / Math.max(dijkstraOrder.length, 1)) * 100
      )
    : 0;

  const astarProgress = comparison
    ? Math.round((astarVisibleOrder.length / Math.max(astarOrder.length, 1)) * 100)
    : 0;

  const winner = comparison?.summary?.winner ?? "N/A";
  const winnerReason =
    comparison?.summary?.winner_reason ?? "No summary available.";

  function handlePlayPause() {
    if (!comparison) return;
    setIsPlaying((previous) => !previous);
  }

  function handleRestartRace() {
    if (!comparison) return;
    setRaceStep(0);
    setIsPlaying(true);
  }

  return (
    <motion.section {...pageTransition}>
      <motion.div className="page-header" {...resultReveal}>
        <p className="eyebrow">Performance Analysis</p>
        <h1>Routing Performance</h1>
        <p>
          Compare routing behavior, exploration order, and efficiency across
          supported pathfinding methods.
        </p>
      </motion.div>

      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut", delay: 0.05 }}
      >
        <div className="stat-card">
          <span>Comparison Scope</span>
          <strong>2</strong>
          <p>Dijkstra and A* are evaluated side by side on the same route</p>
        </div>

        <div className="stat-card">
          <span>Supported Locations</span>
          <strong>{locations.length}</strong>
          <p>Routing points available across the Cairo network</p>
        </div>

        <div className="stat-card">
          <span>Animation</span>
          <strong>Live</strong>
          <p>Step-by-step exploration order playback for both methods</p>
        </div>

        <div className="stat-card">
          <span>Evaluation Mode</span>
          <strong>{weights[0].label}</strong>
          <p>Current comparison runs on distance-based routing weight</p>
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
          <h3>Comparison Inputs</h3>

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
            Weight
            <select name="weight" value={form.weight} onChange={handleChange}>
              {weights.map((weight) => (
                <option key={weight.value} value={weight.value}>
                  {weight.label}
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
              {loading ? "Running..." : "Run Performance Comparison"}
            </motion.button>
          </div>

          {error && <div className="error-box">{error}</div>}
        </motion.form>

        <motion.div
          className="result-card"
          {...resultReveal}
          key={comparison ? "performance-loaded" : "performance-empty"}
        >
          <h3>Performance Summary</h3>

          {!comparison ? (
            <div className="empty-state">
              Run a routing comparison to review the summary and leading method.
            </div>
          ) : (
            <div className="race-summary-card">
              <div className="winner-row">
                <span className="winner-label">Leading Method</span>
                <span className="winner-badge">{winner}</span>
              </div>

              <p className="winner-reason">{winnerReason}</p>

              <div className="race-controls">
                <motion.button
                  {...buttonMotion}
                  type="button"
                  className="secondary-button"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? "Pause Animation" : "Play Animation"}
                </motion.button>

                <motion.button
                  {...buttonMotion}
                  type="button"
                  className="secondary-button"
                  onClick={handleRestartRace}
                >
                  Restart Animation
                </motion.button>
              </div>

              <div className="result-grid">
                <div>
                  <span>Source</span>
                  <strong>{comparison.source ?? "N/A"}</strong>
                </div>

                <div>
                  <span>Destination</span>
                  <strong>{comparison.destination ?? "N/A"}</strong>
                </div>

                <div>
                  <span>Weight Used</span>
                  <strong>{comparison.weight_used ?? "N/A"}</strong>
                </div>

                <div>
                  <span>Current Step</span>
                  <strong>{comparison ? `${raceStep + 1} / ${maxSteps}` : "N/A"}</strong>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {comparison && (
        <motion.div
          className="comparison-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <div className="comparison-grid">
            <motion.div
              className="result-card"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.18 }}
            >
              <h3>Dijkstra Exploration</h3>

              <div className="race-progress-row">
                <span>Progress</span>
                <strong>{dijkstraProgress}%</strong>
              </div>

              <div className="progress-bar">
                <motion.div
                  className="progress-bar-fill"
                  animate={{ width: `${dijkstraProgress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>

              <p>
                <strong>Current Node:</strong> {dijkstraCurrentNode}
              </p>

              <p>
                <strong>Exploration Order:</strong>{" "}
                {dijkstraVisibleOrder.length
                  ? dijkstraVisibleOrder.join(" → ")
                  : "Not started"}
              </p>
            </motion.div>

            <motion.div
              className="result-card"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.18 }}
            >
              <h3>A* Exploration</h3>

              <div className="race-progress-row">
                <span>Progress</span>
                <strong>{astarProgress}%</strong>
              </div>

              <div className="progress-bar">
                <motion.div
                  className="progress-bar-fill alt"
                  animate={{ width: `${astarProgress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>

              <p>
                <strong>Current Node:</strong> {astarCurrentNode}
              </p>

              <p>
                <strong>Exploration Order:</strong>{" "}
                {astarVisibleOrder.length
                  ? astarVisibleOrder.join(" → ")
                  : "Not started"}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}

      <motion.div {...resultReveal}>
        <AlgorithmComparison comparison={comparison} />
      </motion.div>
    </motion.section>
  );
}