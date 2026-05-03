import { useEffect, useMemo, useState } from "react";
import { routingApi } from "../api/client";
import AlgorithmComparison from "../components/AlgorithmComparison";

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
      [name]: value,
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
      setError(err.message || "Could not run algorithm comparison.");
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
    ? Math.round((dijkstraVisibleOrder.length / Math.max(dijkstraOrder.length, 1)) * 100)
    : 0;

  const astarProgress = comparison
    ? Math.round((astarVisibleOrder.length / Math.max(astarOrder.length, 1)) * 100)
    : 0;

  const winner = comparison?.summary?.winner ?? "N/A";
  const winnerReason = comparison?.summary?.winner_reason ?? "No summary available.";

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
    <section>
      <div className="page-header">
        <p className="eyebrow">Bonus Visualization</p>
        <h1>Dijkstra vs A* Algorithm Race</h1>
        <p>
          Run both algorithms on the same route, animate their exploration order,
          compare total cost, runtime, and visited nodes, then identify the winner.
        </p>
      </div>

      <div className="planner-layout">
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>Race Inputs</h3>

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
            <button type="submit" disabled={loading}>
              {loading ? "Running Race..." : "Run Algorithm Race"}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}
        </form>

        <div className="result-card">
          <h3>Race Summary</h3>

          {!comparison ? (
            <div className="empty-state">
              Run the algorithm race to see the winner and summary here.
            </div>
          ) : (
            <div className="race-summary-card">
              <div className="winner-row">
                <span className="winner-label">Winner</span>
                <span className="winner-badge">{winner}</span>
              </div>

              <p className="winner-reason">{winnerReason}</p>

              <div className="race-controls">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? "Pause Race" : "Play Race"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleRestartRace}
                >
                  Restart Race
                </button>
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
                  <strong>
                    {comparison ? `${raceStep + 1} / ${maxSteps}` : "N/A"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {comparison && (
        <div className="comparison-section">
          <div className="comparison-grid">
            <div className="result-card">
              <h3>Dijkstra Race Track</h3>

              <div className="race-progress-row">
                <span>Progress</span>
                <strong>{dijkstraProgress}%</strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${dijkstraProgress}%` }}
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
            </div>

            <div className="result-card">
              <h3>A* Race Track</h3>

              <div className="race-progress-row">
                <span>Progress</span>
                <strong>{astarProgress}%</strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-bar-fill alt"
                  style={{ width: `${astarProgress}%` }}
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
            </div>
          </div>
        </div>
      )}

      <AlgorithmComparison comparison={comparison} />
    </section>
  );
}