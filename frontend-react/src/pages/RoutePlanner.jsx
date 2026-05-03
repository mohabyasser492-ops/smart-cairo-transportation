import { useState } from "react";
import { routingApi } from "../api/client";
import RouteResult from "../components/RouteResult";
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

const departureTimes = [
  { value: "08:30", label: "Morning Peak (08:30)" },
  { value: "14:00", label: "Afternoon (14:00)" },
  { value: "18:00", label: "Evening Peak (18:00)" },
  { value: "23:00", label: "Night (23:00)" },
];

export default function RoutePlanner() {
  const [form, setForm] = useState({
    source: "Maadi",
    destination: "Downtown Cairo",
    departure_time: "08:30",
    day_type: "weekday",
  });

  const [routeResult, setRouteResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleTimeDependentRoute(event) {
    event.preventDefault();

    setError("");
    setRouteResult(null);
    setLoadingRoute(true);

    try {
      const payload = {
        source: form.source,
        destination: form.destination,
        departure_time: form.departure_time,
        day_type: form.day_type,
      };

      const data = await routingApi.timeDependentRoute(payload);
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
      const payload = {
        source: form.source,
        destination: form.destination,
        departure_time: form.departure_time,
        day_type: form.day_type,
      };

      const data = await routingApi.bestRouteByTime(payload);
      setRouteResult(data);
    } catch (err) {
      setError(err.message || "Could not load best route by time.");
    } finally {
      setLoadingRoute(false);
    }
  }

  async function handleCompareAlgorithms() {
    setError("");
    setComparison(null);
    setLoadingComparison(true);

    try {
      const payload = {
        source: form.source,
        destination: form.destination,
        weight: "distance",
      };

      const data = await routingApi.compareDijkstraVsAstar(payload);
      setComparison(data);
    } catch (err) {
      setError(err.message || "Could not load algorithm comparison.");
    } finally {
      setLoadingComparison(false);
    }
  }

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">Shortest Path + Traffic-Aware Routing</p>
        <h1>Route Planner</h1>
        <p>
          Select a source, destination, and departure time to run a
          traffic-aware route search. You can also compare Dijkstra and A*.
        </p>
      </div>

      <div className="planner-layout">
        <form className="form-card" onSubmit={handleTimeDependentRoute}>
          <h3>Route Inputs</h3>

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
            Departure Time
            <select
              name="departure_time"
              value={form.departure_time}
              onChange={handleChange}
            >
              {departureTimes.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Day Type
            <select
              name="day_type"
              value={form.day_type}
              onChange={handleChange}
            >
              <option value="weekday">Weekday</option>
              <option value="weekend">Weekend</option>
            </select>
          </label>

          <div className="button-row">
            <button type="submit" disabled={loadingRoute}>
              {loadingRoute ? "Searching..." : "Run Time-Dependent Route"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleBestRouteByTime}
              disabled={loadingRoute}
            >
              {loadingRoute ? "Searching..." : "Best Route By Time"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleCompareAlgorithms}
              disabled={loadingComparison}
            >
              {loadingComparison ? "Comparing..." : "Compare Dijkstra vs A*"}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}
        </form>

        <RouteResult result={routeResult} />
      </div>

      <AlgorithmComparison comparison={comparison} />
    </section>
  );
}