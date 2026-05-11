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

function PredictionMetric({ label, value }) {
  return (
    <div className="result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TrafficLevelBadge({ level }) {
  const normalized = String(level || "unknown").toLowerCase();

  return (
    <span className={`traffic-badge ${normalized}`}>
      {level || "Unknown"}
    </span>
  );
}

function RoadPredictionResult({ prediction }) {
  if (!prediction) {
    return (
      <p className="workspace-panel-copy">
        Select a road and run prediction to estimate speed, congestion level,
        and traffic conditions.
      </p>
    );
  }

  return (
    <div className="route-result-card accent">
      <div className="prediction-result-head">
        <h4>Road Prediction</h4>
        <TrafficLevelBadge
          level={
            prediction.traffic_level ??
            prediction.congestion_level ??
            prediction.predicted_traffic_level ??
            prediction.level
          }
        />
      </div>

      <div className="result-grid">
        <PredictionMetric
          label="Predicted Speed"
          value={`${prediction.predicted_speed_kmh ?? prediction.speed_kmh ?? "N/A"} km/h`}
        />
        <PredictionMetric
            label="Congestion Score"
          value={
            prediction.congestion_score ??
            prediction.predicted_congestion ??
            prediction.predicted_traffic_level ??
            "N/A"
          }
        />
        <PredictionMetric
          label="Road ID"
          value={prediction.road_id ?? prediction.id ?? "N/A"}
        />
        <PredictionMetric
          label="Confidence"
          value={
            prediction.confidence != null
              ? `${Math.round(Number(prediction.confidence) * 100)}%`
              : "N/A"
          }
        />
      </div>
    </div>
  );
}

function RoutePredictionResult({ prediction }) {
  if (!prediction) {
    return (
      <p className="workspace-panel-copy">
        Run route prediction to visualize the predicted route and inspect
        segment-level congestion.
      </p>
    );
  }

  const segments = prediction.segment_predictions ?? [];
  const averageSpeed =
    prediction.average_speed_kmh ?? prediction.average_predicted_speed_kmh;
  const overallLevel =
    prediction.overall_traffic_level ??
    prediction.overall_predicted_traffic_level ??
    prediction.traffic_level ??
    prediction.congestion_level;

  return (
    <div className="route-result-stack">
      <div className="route-result-card accent">
        <div className="prediction-result-head">
          <h4>Route Prediction</h4>
          <TrafficLevelBadge
            level={overallLevel}
          />
        </div>

        <div className="result-grid">
          <PredictionMetric
            label="ETA"
            value={`${prediction.estimated_time_min ?? "N/A"} min`}
          />
          <PredictionMetric
            label="Avg Speed"
            value={`${averageSpeed ?? "N/A"} km/h`}
          />
          <PredictionMetric
            label="Segments"
            value={segments.length || "N/A"}
          />
          <PredictionMetric
            label="Path Nodes"
            value={(prediction.path ?? []).length || "N/A"}
          />
        </div>

        <p className="route-path">
          {(prediction.path ?? []).join(" → ") || "No path available"}
        </p>
      </div>

      {segments.length ? (
        <div className="prediction-segment-list">
          {segments.slice(0, 6).map((segment, index) => (
            <div className="prediction-segment-item" key={index}>
              <div>
                <strong>
                  {segment.from ?? segment.source ?? "Segment"} →{" "}
                  {segment.to ?? segment.destination ?? index + 1}
                </strong>
                <span>
                  Speed:{" "}
                  {segment.predicted_speed_kmh ??
                    segment.speed_kmh ??
                    "N/A"}{" "}
                  km/h
                </span>
              </div>

              <TrafficLevelBadge
                level={
                  segment.traffic_level ??
                  segment.congestion_level ??
                  segment.predicted_traffic_level ??
                  segment.level
                }
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function TrafficPredictionPanel({
  roadOptions,
  roadForm,
  routeForm,
  roadPrediction,
  routePrediction,
  loadingRoad,
  loadingRoute,
  onRoadChange,
  onRouteChange,
  onRoadSubmit,
  onRouteSubmit,
  error,
  locations,
}) {
  const disabledRoad = loadingRoad || !roadOptions.length;
  const disabledRoute = loadingRoute || !locations.length;

  return (
    <div className="workspace-panel-stack">
      <section className="details-card hero-panel traffic-ai-hero-panel">
        <p className="eyebrow">Traffic Intelligence</p>
        <h1 className="workspace-panel-title">Traffic AI</h1>
        <p className="workspace-panel-copy">
          Predict road and route traffic using time, weather, holiday status,
          and network conditions.
        </p>
      </section>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="details-card">
        <h3>Road Prediction</h3>

        <form className="smart-form" onSubmit={onRoadSubmit}>
          <label>
            Road
            <select
              name="road_id"
              value={roadForm.road_id}
              onChange={onRoadChange}
              disabled={disabledRoad}
            >
              {roadOptions.map((road) => (
                <option key={road.id ?? road.road_id} value={road.id ?? road.road_id}>
                  {road.name ??
                    `Road ${road.id ?? road.road_id} — ${road.from ?? road.source ?? "?"} → ${
                      road.to ?? road.destination ?? "?"
                    }`}
                </option>
              ))}
            </select>
          </label>

          <label>
            Hour
            <input
              type="number"
              name="hour"
              min="0"
              max="23"
              value={roadForm.hour}
              onChange={onRoadChange}
              disabled={disabledRoad}
            />
          </label>

          <label>
            Day of Week
            <select
              name="day_of_week"
              value={roadForm.day_of_week}
              onChange={onRoadChange}
              disabled={disabledRoad}
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
              onChange={onRoadChange}
              disabled={disabledRoad}
            >
              {weatherOptions.map((weather) => (
                <option key={weather} value={weather}>
                  {weather}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="is_holiday"
              checked={roadForm.is_holiday}
              onChange={onRoadChange}
              disabled={disabledRoad}
            />
            Holiday
          </label>

          <button type="submit" disabled={disabledRoad}>
            {loadingRoad ? "Predicting..." : "Predict Road Traffic"}
          </button>
        </form>
      </section>

      <section className="details-card">
        <h3>Road Result</h3>
        <RoadPredictionResult prediction={roadPrediction} />
      </section>

      <section className="details-card">
        <h3>Route Prediction</h3>

        <form className="smart-form" onSubmit={onRouteSubmit}>
          <label>
            Source
            <select
              name="source"
              value={routeForm.source}
              onChange={onRouteChange}
              disabled={disabledRoute}
            >
              {locations.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination
            <select
              name="destination"
              value={routeForm.destination}
              onChange={onRouteChange}
              disabled={disabledRoute}
            >
              {locations.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Hour
            <input
              type="number"
              name="hour"
              min="0"
              max="23"
              value={routeForm.hour}
              onChange={onRouteChange}
              disabled={disabledRoute}
            />
          </label>

          <label>
            Day of Week
            <select
              name="day_of_week"
              value={routeForm.day_of_week}
              onChange={onRouteChange}
              disabled={disabledRoute}
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
              onChange={onRouteChange}
              disabled={disabledRoute}
            >
              {weatherOptions.map((weather) => (
                <option key={weather} value={weather}>
                  {weather}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="is_holiday"
              checked={routeForm.is_holiday}
              onChange={onRouteChange}
              disabled={disabledRoute}
            />
            Holiday
          </label>

          <button type="submit" disabled={disabledRoute}>
            {loadingRoute ? "Predicting route..." : "Predict Route Traffic"}
          </button>
        </form>
      </section>

      <section className="details-card">
        <h3>Route Result</h3>
        <RoutePredictionResult prediction={routePrediction} />
      </section>
    </div>
  );
}
