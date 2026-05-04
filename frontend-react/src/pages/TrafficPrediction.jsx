import { useEffect, useState } from "react";
import { dataApi, predictionApi } from "../api/client";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const weatherOptions = ["clear", "cloudy", "rain", "storm", "fog"];

const locations = [
  "Maadi",
  "Nasr City",
  "Downtown Cairo",
  "New Cairo",
  "Heliopolis",
  "Zamalek",
  "6th October City",
  "Giza",
  "Mohandessin",
  "Dokki",
  "Shubra",
  "Helwan",
  "New Administrative Capital",
  "Al Rehab",
  "Sheikh Zayed",
];

export default function TrafficPrediction() {
  const [roadOptions, setRoadOptions] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const [roadForm, setRoadForm] = useState({
    road_id: "2-3",
    hour: 8,
    day_of_week: "Monday",
    weather: "clear",
    is_holiday: false,
  });

  const [routeForm, setRouteForm] = useState({
    source: "Maadi",
    destination: "Downtown Cairo",
    hour: 8,
    day_of_week: "Monday",
    weather: "clear",
    is_holiday: false,
    weight: "distance",
  });

  const [roadPrediction, setRoadPrediction] = useState(null);
  const [routePrediction, setRoutePrediction] = useState(null);

  const [loadingRoad, setLoadingRoad] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      setLoadingMetrics(true);

      try {
        const [existingRoads, modelMetrics] = await Promise.all([
          dataApi.getExistingRoads(),
          predictionApi.getModelMetrics(),
        ]);

        setRoadOptions(existingRoads || []);
        setMetrics(modelMetrics || null);

        if (existingRoads?.length) {
          setRoadForm((prev) => ({
            ...prev,
            road_id: existingRoads[0].id,
          }));
        }
      } catch (err) {
        setError(err.message || "Could not load traffic prediction page data.");
      } finally {
        setLoadingMetrics(false);
      }
    }

    loadInitialData();
  }, []);

  function handleRoadChange(event) {
    const { name, value, type, checked } = event.target;

    setRoadForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "hour" ? Number(value) : value,
    }));
  }

  function handleRouteChange(event) {
    const { name, value, type, checked } = event.target;

    setRouteForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "hour" ? Number(value) : value,
    }));
  }

  async function handleRoadPrediction(event) {
    event.preventDefault();

    setLoadingRoad(true);
    setError("");
    setRoadPrediction(null);

    try {
      const data = await predictionApi.predictTraffic(roadForm);
      setRoadPrediction(data);
    } catch (err) {
      setError(err.message || "Could not predict road traffic.");
    } finally {
      setLoadingRoad(false);
    }
  }

  async function handleRoutePrediction(event) {
    event.preventDefault();

    setLoadingRoute(true);
    setError("");
    setRoutePrediction(null);

    try {
      const data = await predictionApi.predictRouteTraffic(routeForm);
      setRoutePrediction(data);
    } catch (err) {
      setError(err.message || "Could not predict route traffic.");
    } finally {
      setLoadingRoute(false);
    }
  }

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">ML Bonus</p>
        <h1>Traffic Prediction</h1>
        <p>
          Predict road traffic conditions and full route traffic using the trained
          traffic model, then inspect route segments, speed estimates, confidence,
          and model metrics.
        </p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <span>Prediction Mode</span>
          <strong>Road + Route</strong>
          <p>Supports single-road and route-wide traffic estimation</p>
        </div>

        <div className="stat-card">
          <span>Model Metrics</span>
          <strong>{loadingMetrics ? "..." : "Loaded"}</strong>
          <p>Metrics are fetched from the backend model registry</p>
        </div>

        <div className="stat-card">
          <span>Road Options</span>
          <strong>{roadOptions.length}</strong>
          <p>Road IDs loaded dynamically from backend data</p>
        </div>

        <div className="stat-card">
          <span>Weather Support</span>
          <strong>5</strong>
          <p>Clear, cloudy, rain, storm, and fog scenarios</p>
        </div>
      </div>

      <div className="prediction-layout">
        <form className="form-card" onSubmit={handleRoadPrediction}>
          <h3>Single Road Traffic Prediction</h3>

          <label>
            Road ID
            <select
              name="road_id"
              value={roadForm.road_id}
              onChange={handleRoadChange}
            >
              {roadOptions.map((road) => (
                <option key={road.id} value={road.id}>
                  {road.id} ({road.from} → {road.to})
                </option>
              ))}
            </select>
          </label>

          <label>
            Hour
            <input
              type="number"
              min="0"
              max="23"
              name="hour"
              value={roadForm.hour}
              onChange={handleRoadChange}
            />
          </label>

          <label>
            Day of Week
            <select
              name="day_of_week"
              value={roadForm.day_of_week}
              onChange={handleRoadChange}
            >
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>

          <label>
            Weather
            <select
              name="weather"
              value={roadForm.weather}
              onChange={handleRoadChange}
            >
              {weatherOptions.map((weather) => (
                <option key={weather} value={weather}>
                  {weather}
                </option>
              ))}
            </select>
          </label>

          <label className="toggle-item">
            <input
              type="checkbox"
              name="is_holiday"
              checked={roadForm.is_holiday}
              onChange={handleRoadChange}
            />
            Holiday
          </label>

          <div className="button-row">
            <button type="submit" disabled={loadingRoad}>
              {loadingRoad ? "Predicting..." : "Predict Road Traffic"}
            </button>
          </div>
        </form>

        <div className="result-card">
          <h3>Road Prediction Result</h3>

          {!roadPrediction ? (
            <div className="empty-state">
              Predict a road to see traffic speed, level, confidence, and features used.
            </div>
          ) : (
            <>
              <div className="result-grid">
                <div>
                  <span>Road ID</span>
                  <strong>{roadPrediction.road_id}</strong>
                </div>

                <div>
                  <span>Predicted Speed</span>
                  <strong>{roadPrediction.predicted_speed_kmh} km/h</strong>
                </div>

                <div>
                  <span>Traffic Level</span>
                  <strong>{roadPrediction.predicted_traffic_level}</strong>
                </div>

                <div>
                  <span>Confidence</span>
                  <strong>{roadPrediction.confidence}</strong>
                </div>
              </div>

              <div className="details-card" style={{ marginTop: "18px" }}>
                <h4>Features Used</h4>
                <div className="result-grid">
                  <div>
                    <span>Hour</span>
                    <strong>{roadPrediction.features_used?.hour}</strong>
                  </div>

                  <div>
                    <span>Day</span>
                    <strong>{roadPrediction.features_used?.day_of_week}</strong>
                  </div>

                  <div>
                    <span>Weather</span>
                    <strong>{roadPrediction.features_used?.weather}</strong>
                  </div>

                  <div>
                    <span>Holiday</span>
                    <strong>
                      {roadPrediction.features_used?.is_holiday ? "Yes" : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>Road Capacity</span>
                    <strong>{roadPrediction.features_used?.road_capacity}</strong>
                  </div>

                  <div>
                    <span>Road Length</span>
                    <strong>{roadPrediction.features_used?.road_length_km} km</strong>
                  </div>

                  <div>
                    <span>Historical Flow</span>
                    <strong>{roadPrediction.features_used?.historical_flow}</strong>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="prediction-layout">
        <form className="form-card" onSubmit={handleRoutePrediction}>
          <h3>Route Traffic Prediction</h3>

          <label>
            Source
            <select
              name="source"
              value={routeForm.source}
              onChange={handleRouteChange}
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination
            <select
              name="destination"
              value={routeForm.destination}
              onChange={handleRouteChange}
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <label>
            Hour
            <input
              type="number"
              min="0"
              max="23"
              name="hour"
              value={routeForm.hour}
              onChange={handleRouteChange}
            />
          </label>

          <label>
            Day of Week
            <select
              name="day_of_week"
              value={routeForm.day_of_week}
              onChange={handleRouteChange}
            >
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>

          <label>
            Weather
            <select
              name="weather"
              value={routeForm.weather}
              onChange={handleRouteChange}
            >
              {weatherOptions.map((weather) => (
                <option key={weather} value={weather}>
                  {weather}
                </option>
              ))}
            </select>
          </label>

          <label>
            Weight
            <select
              name="weight"
              value={routeForm.weight}
              onChange={handleRouteChange}
            >
              <option value="distance">Distance</option>
            </select>
          </label>

          <label className="toggle-item">
            <input
              type="checkbox"
              name="is_holiday"
              checked={routeForm.is_holiday}
              onChange={handleRouteChange}
            />
            Holiday
          </label>

          <div className="button-row">
            <button type="submit" disabled={loadingRoute}>
              {loadingRoute ? "Predicting..." : "Predict Route Traffic"}
            </button>
          </div>
        </form>

        <div className="result-card">
          <h3>Route Prediction Result</h3>

          {!routePrediction ? (
            <div className="empty-state">
              Predict a route to see segment-by-segment traffic and overall speed.
            </div>
          ) : (
            <>
              <div className="result-grid">
                <div>
                  <span>Source</span>
                  <strong>{routePrediction.source}</strong>
                </div>

                <div>
                  <span>Destination</span>
                  <strong>{routePrediction.destination}</strong>
                </div>

                <div>
                  <span>Path</span>
                  <strong>{(routePrediction.path || []).join(" → ")}</strong>
                </div>

                <div>
                  <span>Segments Count</span>
                  <strong>{routePrediction.segments_count}</strong>
                </div>

                <div>
                  <span>Average Predicted Speed</span>
                  <strong>{routePrediction.average_predicted_speed_kmh} km/h</strong>
                </div>

                <div>
                  <span>Overall Traffic Level</span>
                  <strong>{routePrediction.overall_predicted_traffic_level}</strong>
                </div>
              </div>

              <div className="details-card" style={{ marginTop: "18px" }}>
                <h4>Segment Predictions</h4>

                {routePrediction.segment_predictions?.length ? (
                  <div className="segments-list">
                    {routePrediction.segment_predictions.map((segment) => (
                      <div key={segment.road_id} className="segment-item">
                        <div>
                          <strong>
                            {segment.from} → {segment.to}
                          </strong>
                          <div className="segment-subtext">
                            Road ID: {segment.road_id}
                          </div>
                        </div>

                        <div className="segment-metrics">
                          <span>{segment.predicted_speed_kmh} km/h</span>
                          <span>{segment.predicted_traffic_level}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No segment predictions available.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="result-card">
        <h3>Model Metrics</h3>

        {loadingMetrics ? (
          <div className="empty-state">Loading model metrics...</div>
        ) : !metrics ? (
          <div className="empty-state">No model metrics available.</div>
        ) : (
          <div className="result-grid">
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}