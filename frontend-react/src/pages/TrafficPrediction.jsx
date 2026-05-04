import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { dataApi, predictionApi } from "../api/client";
import { pageTransition, resultReveal, buttonMotion } from "../ui/motion";

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

function formatMetricLabel(key) {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function LevelBadge({ level }) {
  const normalized = String(level || "").toLowerCase();

  return (
    <span className={`traffic-badge ${normalized || "unknown"}`}>
      {level || "Unknown"}
    </span>
  );
}

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
        setError(err.message || "Could not load traffic prediction data.");
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
      setError(err.message || "Could not predict road conditions.");
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
      setError(err.message || "Could not predict route conditions.");
    } finally {
      setLoadingRoute(false);
    }
  }

  const selectedRoadMeta = useMemo(() => {
    return roadOptions.find((road) => road.id === roadForm.road_id) || null;
  }, [roadOptions, roadForm.road_id]);

  const routeChartData = useMemo(() => {
    if (!routePrediction?.segment_predictions?.length) return [];

    return routePrediction.segment_predictions.map((segment) => ({
      segment: `${segment.from} → ${segment.to}`,
      speed: segment.predicted_speed_kmh,
    }));
  }, [routePrediction]);

  const numericMetrics = useMemo(() => {
    if (!metrics) return [];

    return Object.entries(metrics)
      .filter(([key]) => key !== "feature_names")
      .map(([key, value]) => ({
        key,
        label: formatMetricLabel(key),
        value,
      }));
  }, [metrics]);

  const featureNames = useMemo(() => {
    if (!metrics?.feature_names) return [];
    if (Array.isArray(metrics.feature_names)) return metrics.feature_names;
    return String(metrics.feature_names).split(",");
  }, [metrics]);

  return (
    <motion.section {...pageTransition}>
      <motion.div className="page-header" {...resultReveal}>
        <p className="eyebrow">Traffic Intelligence</p>
        <h1>Traffic Prediction</h1>
        <p>
          Forecast road and route conditions using historical traffic patterns
          and model-based speed estimation.
        </p>
      </motion.div>

      {error && <div className="error-box">{error}</div>}

      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut", delay: 0.05 }}
      >
        <div className="stat-card">
          <span>Forecast Modes</span>
          <strong>2</strong>
          <p>Road-level forecasting and full route forecasting</p>
        </div>

        <div className="stat-card">
          <span>Road Records</span>
          <strong>{roadOptions.length}</strong>
          <p>Road segments loaded directly from the infrastructure dataset</p>
        </div>

        <div className="stat-card">
          <span>Weather Scenarios</span>
          <strong>{weatherOptions.length}</strong>
          <p>Clear, cloudy, rain, storm, and fog scenarios supported</p>
        </div>

        <div className="stat-card">
          <span>Model Performance</span>
          <strong>{loadingMetrics ? "..." : metrics ? "Ready" : "N/A"}</strong>
          <p>Saved model metrics and feature details available for review</p>
        </div>
      </motion.div>

      <div className="prediction-section">
        <div className="prediction-section-header">
          <h2>Road Forecast</h2>
          <p>Forecast the expected speed and congestion level for a single road segment.</p>
        </div>

        <div className="prediction-layout">
          <motion.form
            className="form-card prediction-form-card"
            onSubmit={handleRoadPrediction}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <h3>Road Forecast Inputs</h3>

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
              <motion.button
                {...buttonMotion}
                type="submit"
                disabled={loadingRoad}
              >
                {loadingRoad ? "Forecasting..." : "Generate Road Forecast"}
              </motion.button>
            </div>
          </motion.form>

          <motion.div
            className="result-card prediction-result-card"
            {...resultReveal}
            key={roadPrediction ? "road-forecast-loaded" : "road-forecast-empty"}
          >
            <h3>Road Forecast Result</h3>

            {!roadPrediction ? (
              <div className="empty-state prediction-empty-state">
                Generate a road forecast to review predicted speed, congestion,
                confidence, and model inputs.
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
                    <span>Congestion Level</span>
                    <strong>
                      <LevelBadge level={roadPrediction.predicted_traffic_level} />
                    </strong>
                  </div>

                  <div>
                    <span>Confidence</span>
                    <strong>{roadPrediction.confidence}</strong>
                  </div>
                </div>

                {selectedRoadMeta && (
                  <motion.div className="details-card prediction-subcard" {...resultReveal}>
                    <h4>Road Metadata</h4>
                    <div className="result-grid">
                      <div>
                        <span>From</span>
                        <strong>{selectedRoadMeta.from}</strong>
                      </div>

                      <div>
                        <span>To</span>
                        <strong>{selectedRoadMeta.to}</strong>
                      </div>

                      <div>
                        <span>Distance</span>
                        <strong>{selectedRoadMeta.distance_km} km</strong>
                      </div>

                      <div>
                        <span>Capacity</span>
                        <strong>{selectedRoadMeta.capacity_vehicles_per_hour}</strong>
                      </div>

                      <div>
                        <span>Condition</span>
                        <strong>{selectedRoadMeta.condition}</strong>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.div className="details-card prediction-subcard" {...resultReveal}>
                  <h4>Model Inputs</h4>
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
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <div className="prediction-section">
        <div className="prediction-section-header">
          <h2>Route Forecast</h2>
          <p>
            Forecast traffic conditions for an entire route and inspect segment-level
            predictions.
          </p>
        </div>

        <div className="prediction-layout">
          <motion.form
            className="form-card prediction-form-card"
            onSubmit={handleRoutePrediction}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <h3>Route Forecast Inputs</h3>

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
              <motion.button
                {...buttonMotion}
                type="submit"
                disabled={loadingRoute}
              >
                {loadingRoute ? "Forecasting..." : "Generate Route Forecast"}
              </motion.button>
            </div>
          </motion.form>

          <motion.div
            className="result-card prediction-result-card"
            {...resultReveal}
            key={routePrediction ? "route-forecast-loaded" : "route-forecast-empty"}
          >
            <h3>Route Forecast Result</h3>

            {!routePrediction ? (
              <div className="empty-state prediction-empty-state">
                Generate a route forecast to inspect the path, average speed,
                overall congestion, and segment-level predictions.
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
                    <span>Overall Congestion Level</span>
                    <strong>
                      <LevelBadge
                        level={routePrediction.overall_predicted_traffic_level}
                      />
                    </strong>
                  </div>
                </div>

                <motion.div className="details-card prediction-subcard" {...resultReveal}>
                  <h4>Segment Speed Chart</h4>

                  {routeChartData.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={routeChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="segment" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="speed" name="Predicted Speed (km/h)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">No chart data available.</div>
                  )}
                </motion.div>

                <motion.div className="details-card prediction-subcard" {...resultReveal}>
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
                            <LevelBadge level={segment.predicted_traffic_level} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">No segment predictions available.</div>
                  )}
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <motion.div className="result-card" {...resultReveal}>
        <h3>Model Performance</h3>

        {loadingMetrics ? (
          <div className="empty-state">Loading model performance...</div>
        ) : !metrics ? (
          <div className="empty-state">No model performance data available.</div>
        ) : (
          <>
            <div className="metrics-grid">
              {numericMetrics.map((metric) => (
                <motion.div
                  key={metric.key}
                  className="metric-card"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.18 }}
                >
                  <span>{metric.label}</span>
                  <strong>{String(metric.value)}</strong>
                </motion.div>
              ))}
            </div>

            {!!featureNames.length && (
              <motion.div className="details-card prediction-subcard" {...resultReveal}>
                <h4>Feature Set</h4>
                <div className="feature-names-box">
                  {featureNames.map((feature) => (
                    <span key={feature.trim()} className="feature-chip">
                      {feature.trim()}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </motion.section>
  );
}

