import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { trafficApi } from "../api/client";

function StatusBadge({ level }) {
  const normalized = String(level || "unknown").toLowerCase();

  return (
    <span className={`traffic-badge ${normalized}`}>
      {level || "Unknown"}
    </span>
  );
}

function formatIntersectionName(item) {
  if (item?.from && item?.to) {
    return `${item.from} → ${item.to}`;
  }

  if (item?.name && !String(item.name).includes("â")) {
    return item.name;
  }

  return item?.intersection_id || "Unknown Intersection";
}

export default function TrafficSignals() {
  const [signalForm, setSignalForm] = useState({
    total_cycle_time: 120,
    min_green_time: 20,
    max_green_time: 90,
  });

  const [signalResult, setSignalResult] = useState(null);
  const [hotspots, setHotspots] = useState(null);
  const [statuses, setStatuses] = useState(null);

  const [loadingSignals, setLoadingSignals] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      setLoadingInitial(true);
      setError("");

      try {
        const [hotspotsData, statusesData] = await Promise.all([
          trafficApi.getCongestionHotspots(),
          trafficApi.getIntersectionsStatus(),
        ]);

        setHotspots(hotspotsData);
        setStatuses(statusesData);
      } catch (err) {
        setError(err.message || "Could not load traffic signal data.");
      } finally {
        setLoadingInitial(false);
      }
    }

    loadInitialData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setSignalForm((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  }

  async function handleOptimize(event) {
    event.preventDefault();

    setLoadingSignals(true);
    setError("");
    setSignalResult(null);

    try {
      const data = await trafficApi.optimizeSignals(signalForm);
      setSignalResult(data);
    } catch (err) {
      setError(err.message || "Could not optimize traffic signals.");
    } finally {
      setLoadingSignals(false);
    }
  }

  const topStatuses = useMemo(() => {
    return (statuses?.intersections || []).slice(0, 8);
  }, [statuses]);

  const topSignals = useMemo(() => {
    return (signalResult?.optimized_signals || []).slice(0, 8);
  }, [signalResult]);

  const signalChartData = useMemo(() => {
    return topSignals.map((item) => ({
      intersection: formatIntersectionName(item),
      green: item.recommended_green_time_sec,
      red: item.recommended_red_time_sec,
      score: item.congestion_score,
    }));
  }, [topSignals]);

  const statusChartData = useMemo(() => {
    return topStatuses.map((item) => ({
      intersection: formatIntersectionName(item),
      score: item.congestion_score,
    }));
  }, [topStatuses]);

  const averageScore = useMemo(() => {
    const rows = statuses?.intersections || [];
    if (!rows.length) return "N/A";

    const total = rows.reduce((sum, row) => sum + Number(row.congestion_score || 0), 0);
    return (total / rows.length).toFixed(2);
  }, [statuses]);

  const worstIntersection = useMemo(() => {
    return statuses?.intersections?.[0] || null;
  }, [statuses]);

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">Traffic Operations</p>
        <h1>Traffic Signals Optimizer</h1>
        <p>
          Optimize signal timing with a greedy strategy, monitor congestion
          hotspots, and inspect intersection-level traffic status across the
          network.
        </p>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loadingInitial ? (
        <div className="empty-state">Loading traffic operations data...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Intersections</span>
              <strong>{statuses?.intersections_count ?? "N/A"}</strong>
              <p>Traffic-controlled road intersections currently analyzed</p>
            </div>

            <div className="stat-card">
              <span>Hotspots</span>
              <strong>{hotspots?.hotspots_count ?? "N/A"}</strong>
              <p>Detected congestion hotspots above the configured threshold</p>
            </div>

            <div className="stat-card">
              <span>Average Congestion Score</span>
              <strong>{averageScore}</strong>
              <p>Average score across all analyzed intersections</p>
            </div>

            <div className="stat-card">
              <span>Worst Intersection</span>
              <strong>
                {worstIntersection ? formatIntersectionName(worstIntersection) : "N/A"}
              </strong>
              <p>Most congested intersection based on current backend status</p>
            </div>
          </div>

          <div className="prediction-section">
            <div className="prediction-section-header">
              <h2>Signal Optimization</h2>
              <p>
                Tune the traffic signal cycle configuration and generate optimized
                green/red timing recommendations.
              </p>
            </div>

            <div className="prediction-layout">
              <form className="form-card prediction-form-card" onSubmit={handleOptimize}>
                <h3>Optimization Inputs</h3>

                <label>
                  Total Cycle Time (sec)
                  <input
                    type="number"
                    name="total_cycle_time"
                    value={signalForm.total_cycle_time}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Minimum Green Time (sec)
                  <input
                    type="number"
                    name="min_green_time"
                    value={signalForm.min_green_time}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Maximum Green Time (sec)
                  <input
                    type="number"
                    name="max_green_time"
                    value={signalForm.max_green_time}
                    onChange={handleChange}
                  />
                </label>

                <div className="button-row">
                  <button type="submit" disabled={loadingSignals}>
                    {loadingSignals ? "Optimizing..." : "Optimize Traffic Signals"}
                  </button>
                </div>
              </form>

              <div className="result-card prediction-result-card">
                <h3>Optimization Result</h3>

                {!signalResult ? (
                  <div className="empty-state prediction-empty-state">
                    Run signal optimization to see recommended green/red times,
                    congestion levels, and expected waiting-time reduction.
                  </div>
                ) : (
                  <>
                    <div className="result-grid">
                      <div>
                        <span>Algorithm</span>
                        <strong>{signalResult.algorithm ?? "N/A"}</strong>
                      </div>

                      <div>
                        <span>Optimized Intersections</span>
                        <strong>{signalResult.optimized_intersections_count ?? "N/A"}</strong>
                      </div>

                      <div>
                        <span>Total Cycle Time</span>
                        <strong>{signalResult.total_cycle_time_sec ?? "N/A"} sec</strong>
                      </div>

                      <div>
                        <span>Min Green Time</span>
                        <strong>{signalResult.min_green_time_sec ?? "N/A"} sec</strong>
                      </div>

                      <div>
                        <span>Max Green Time</span>
                        <strong>{signalResult.max_green_time_sec ?? "N/A"} sec</strong>
                      </div>
                    </div>

                    <div className="details-card prediction-subcard">
                      <h4>Top Optimized Intersections</h4>

                      {topSignals.length ? (
                        <div className="signal-list">
                          {topSignals.map((signal) => (
                            <div key={signal.intersection_id} className="signal-item">
                              <div>
                                <strong>{formatIntersectionName(signal)}</strong>
                                <div className="segment-subtext">
                                  Intersection ID: {signal.intersection_id}
                                </div>
                              </div>

                              <div className="signal-metrics">
                                <StatusBadge level={signal.congestion_level} />
                                <span>Green: {signal.recommended_green_time_sec}s</span>
                                <span>Red: {signal.recommended_red_time_sec}s</span>
                                <span>
                                  Waiting reduction:{" "}
                                  {signal.expected_waiting_time_reduction_percentage}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">No optimized signals available.</div>
                      )}
                    </div>

                    <div className="details-card prediction-subcard">
                      <h4>Green vs Red Time Chart</h4>

                      {signalChartData.length ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={signalChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="intersection" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="green" name="Green Time (sec)" />
                            <Bar dataKey="red" name="Red Time (sec)" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="empty-state">No chart data available.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="comparison-grid" style={{ marginBottom: "24px" }}>
            <div className="result-card">
              <h3>Congestion Hotspots</h3>

              {!hotspots ? (
                <div className="empty-state">No hotspot data available.</div>
              ) : hotspots.hotspots_count === 0 ? (
                <div className="empty-state">
                  No congestion hotspots were detected above the current threshold.
                </div>
              ) : (
                <div className="signal-list">
                  {hotspots.hotspots.map((spot) => (
                    <div key={spot.intersection_id} className="signal-item">
                      <div>
                        <strong>{spot.name || spot.intersection_id}</strong>
                        <div className="segment-subtext">
                          Flow: {spot.incoming_flow} / Capacity: {spot.capacity}
                        </div>
                      </div>

                      <div className="signal-metrics">
                        <StatusBadge level={spot.severity} />
                        <span>Score: {spot.congestion_score}</span>
                        <span>Wait: {spot.average_waiting_time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="result-card">
              <h3>Intersection Status Overview</h3>

              {!statuses?.intersections?.length ? (
                <div className="empty-state">No intersection status data available.</div>
              ) : (
                <>
                  <div className="result-grid">
                    <div>
                      <span>Total Intersections</span>
                      <strong>{statuses.intersections_count}</strong>
                    </div>

                    <div>
                      <span>Average Congestion Score</span>
                      <strong>{averageScore}</strong>
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <span>Worst Intersection</span>
                      <strong>
                        {worstIntersection
                          ? `${formatIntersectionName(worstIntersection)} (${worstIntersection.congestion_score})`
                          : "N/A"}
                      </strong>
                    </div>
                  </div>

                  <div className="details-card prediction-subcard">
                    <h4>Top Congestion Scores</h4>

                    {statusChartData.length ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="intersection" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="score" name="Congestion Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-state">No chart data available.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="result-card">
            <h3>Intersection Status Details</h3>

            {!statuses?.intersections?.length ? (
              <div className="empty-state">No detailed intersection status available.</div>
            ) : (
              <div className="signal-list">
                {statuses.intersections.slice(0, 12).map((item) => (
                  <div key={item.intersection_id} className="signal-item">
                    <div>
                      <strong>{formatIntersectionName(item)}</strong>
                      <div className="segment-subtext">
                        ID: {item.intersection_id}
                      </div>
                    </div>

                    <div className="signal-metrics">
                      <StatusBadge level={item.status} />
                      <span>Flow: {item.incoming_flow}</span>
                      <span>Capacity: {item.capacity}</span>
                      <span>Wait: {item.average_waiting_time}</span>
                      <span>Score: {item.congestion_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}