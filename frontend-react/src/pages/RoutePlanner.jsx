import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { routingApi } from "../api/client";
import RouteResult from "../components/RouteResult";
import AlgorithmComparison from "../components/AlgorithmComparison";
import { useLocationOptions } from "../hooks/useLocationOptions";
import { pageTransition, resultReveal, buttonMotion } from "../ui/motion";

const departureTimes = [
  { value: "08:30", label: "Morning Peak (08:30)" },
  { value: "14:00", label: "Afternoon (14:00)" },
  { value: "18:00", label: "Evening Peak (18:00)" },
  { value: "23:00", label: "Night (23:00)" },
];

export default function RoutePlanner() {
  const { options: locations, loading: loadingLocations, error: locationsError } =
    useLocationOptions({ includeFacilities: false });

  const defaultSource = locations[0]?.value || "";
  const defaultDestination = locations[1]?.value || locations[0]?.value || "";

  const [form, setForm] = useState({
    source: "",
    destination: "",
    departure_time: "08:30",
    day_type: "weekday",
  });

  useEffect(() => {
    if (!locations.length) return;
    setForm((previous) => ({
      ...previous,
      source: previous.source || defaultSource,
      destination: previous.destination || defaultDestination,
    }));
  }, [defaultDestination, defaultSource, locations.length]);

  const [routeResult, setRouteResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [error, setError] = useState("");

  const formDisabled = loadingLocations || !locations.length;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleTimeDependentRoute(event) {
    event.preventDefault();
    setError("");
    setRouteResult(null);
    setLoadingRoute(true);

    try {
      const data = await routingApi.timeDependentRoute(form);
      setRouteResult(data);
    } catch (err) {
      setError(err.message || "Could not load route result.");
    } finally {
      setLoadingRoute(false);
    }
  }

  async function handleBestRouteByTime() {
    setError("");
    setRouteResult(null);
    setLoadingRoute(true);

    try {
      const data = await routingApi.bestRouteByTime(form);
      setRouteResult(data);
    } catch (err) {
      setError(err.message || "Could not load best route.");
    } finally {
      setLoadingRoute(false);
    }
  }

  async function handleCompareAlgorithms() {
    setError("");
    setComparison(null);
    setLoadingComparison(true);

    try {
      const data = await routingApi.compareDijkstraVsAstar({
        source: form.source,
        destination: form.destination,
        weight: "distance",
      });
      setComparison(data);
    } catch (err) {
      setError(err.message || "Could not load routing comparison.");
    } finally {
      setLoadingComparison(false);
    }
  }

  const locationsCount = useMemo(() => locations.length, [locations.length]);

  return (
    <motion.div {...pageTransition}>
      <div className="page-header">
        <p className="eyebrow">Routing</p>
        <h1>Route Planner</h1>
        <p>
          Find efficient routes across Cairo using traffic-aware path selection and
          time-based routing inputs.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Locations</span>
          <strong>{loadingLocations ? "..." : locationsCount}</strong>
          <p>Origins and destinations loaded dynamically from the backend dataset</p>
        </div>
        <div className="stat-card">
          <span>Departure Windows</span>
          <strong>{departureTimes.length}</strong>
          <p>Peak and off-peak routing scenarios supported</p>
        </div>
        <div className="stat-card">
          <span>Route Modes</span>
          <strong>2</strong>
          <p>Standard time-aware routing and best-route-by-time planning</p>
        </div>
        <div className="stat-card">
          <span>Comparison</span>
          <strong>Live</strong>
          <p>Review Dijkstra versus A* search efficiency on the same origin and destination</p>
        </div>
      </div>

      {(error || locationsError) && <div className="error-box">{error || locationsError}</div>}

      <div className="planner-layout">
        <div className="form-card">
          <h3>Routing Inputs</h3>
          <form onSubmit={handleTimeDependentRoute}>
            <label>
              Source
              <select
                name="source"
                value={form.source}
                onChange={handleChange}
                disabled={formDisabled}
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
                disabled={formDisabled}
              >
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Departure Time
              <select name="departure_time" value={form.departure_time} onChange={handleChange}>
                {departureTimes.map((time) => (
                  <option key={time.value} value={time.value}>
                    {time.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Day Type
              <select name="day_type" value={form.day_type} onChange={handleChange}>
                <option value="weekday">Weekday</option>
                <option value="weekend">Weekend</option>
              </select>
            </label>

            <div className="button-row">
              <motion.button {...buttonMotion} type="submit" disabled={formDisabled || loadingRoute}>
                {loadingRoute ? "Searching..." : "Find Route"}
              </motion.button>
              <motion.button
                {...buttonMotion}
                type="button"
                className="secondary-button"
                onClick={handleBestRouteByTime}
                disabled={formDisabled || loadingRoute}
              >
                {loadingRoute ? "Searching..." : "Find Best Route"}
              </motion.button>
              <motion.button
                {...buttonMotion}
                type="button"
                className="secondary-button"
                onClick={handleCompareAlgorithms}
                disabled={formDisabled || loadingComparison}
              >
                {loadingComparison ? "Comparing..." : "Compare Routing Methods"}
              </motion.button>
            </div>
          </form>
        </div>

        <div className="comparison-section">
          <motion.div className="result-card" {...resultReveal}>
            <RouteResult result={routeResult} />
          </motion.div>
          <motion.div className="result-card" {...resultReveal}>
            <AlgorithmComparison comparison={comparison} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}