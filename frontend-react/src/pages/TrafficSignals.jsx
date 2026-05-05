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
import { trafficApi } from "../api/client";
import {
  pageTransition,
  resultReveal,
  staggerContainer,
  cardItem,
  buttonMotion,
} from "../ui/motion";

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

  // Improved check for encoded characters or missing names
  if (item?.name && !String(item.name).includes("â")) {
    return item.name;
  }

  return item?.intersection_id ? `ID: ${item.intersection_id}` : "Unknown Intersection";
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

  // FIXED: Corrected state update logic
  function handleChange(event) {
    const { name, value } = event.target;

    setSignalForm((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value),
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
    if (!rows.length) return "0.00";

    const total = rows.reduce(
      (sum, row) => sum + Number(row.congestion_score || 0),
      0
    );
    return (total / rows.length).toFixed(2);
  }, [statuses]);

  const worstIntersection = useMemo(() => {
    if (!statuses?.intersections?.length) return null;
    // Sorting to ensure we actually get the "worst" if the API doesn't pre-sort
    return [...statuses.intersections].sort((a, b) => b.congestion_score - a.congestion_score)[0];
  }, [statuses]);

  return (
    <motion.section {...pageTransition}>
      <motion.div className="page-header" {...resultReveal}>
        <p className="eyebrow">Traffic Operations</p>
        <h1>Traffic Signals</h1>
        <p>
          Optimize signal timing, monitor congestion hotspots, and review
          intersection-level traffic performance.
        </p>
      </motion.div>

      {error && <div className="error-box">{error}</div>}

      {loadingInitial ? (
        <div className="empty-state">Loading traffic operations data...</div>
      ) : (
        <>
          <motion.div
            className="stats-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div className="stat-card" variants={cardItem}>
              <span>Intersections</span>
              <strong>{statuses?.intersections_count ?? "N/A"}</strong>
              <p>Traffic-controlled intersections currently analyzed</p>
            </motion.div>

            <motion.div className="stat-card" variants={cardItem}>
              <span>Hotspots</span>
              <strong>{hotspots?.hotspots_count ?? 0}</strong>
              <p>Detected congestion hotspots above threshold</p>
            </motion.div>

            <motion.div className="stat-card" variants={cardItem}>
              <span>Average Congestion Score</span>
              <strong>{averageScore}</strong>
              <p>Average score across all analyzed intersections</p>
            </motion.div>

            <motion.div className="stat-card" variants={cardItem}>
              <span>Worst Intersection</span>
              <strong>
                {worstIntersection ? formatIntersectionName(worstIntersection) : "N/A"}
              </strong>
              <p>Most congested intersection based on current status</p>
            </motion.div>
          </motion.div>

          <div className="prediction-section">
            <div className="prediction-section-header">
              <h2>Signal Timing Optimization</h2>
              <p>Tune signal cycle configuration to generate optimized recommendations.</p>
            </div>

            <div className="prediction-layout">
              <motion.form
                className="form-card prediction-form-card"
                onSubmit={handleOptimize}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.32, ease: "easeOut" }}
              >
                <h3>Signal Parameters</h3>

                <label>
                  Total Cycle Time (sec)
                  <input
                    type="number"
                    name="total_cycle_time"
                    value={signalForm.total_cycle_time}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Minimum Green Time (sec)
                  <input
                    type="number"
                    name="min_green_time"
                    value={signalForm.min_green_time}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Maximum Green Time (sec)
                  <input
                    type="number"
                    name="max_green_time"
                    value={signalForm.max_green_time}
                    onChange={handleChange}
                    required
                  />
                </label>

                <div className="button-row">
                  <motion.button
                    {...buttonMotion}
                    type="submit"
                    disabled={loadingSignals}
                  >
                    {loadingSignals ? "Optimizing..." : "Optimize Signal Timing"}
                  </motion.button>
                </div>
              </motion.form>

              <motion.div
                className="result-card prediction-result-card"
                {...resultReveal}
                key={signalResult ? "signals-loaded" : "signals-empty"}
              >
                <h3>Signal Timing Result</h3>

                {!signalResult ? (
                  <div className="empty-state prediction-empty-state">
                    Run optimization to review recommended durations.
                  </div>
                ) : (
                  <>
                    <div className="result-grid">
                      <div>
                        <span>Method</span>
                        <strong>{signalResult.algorithm ?? "AI-Optimized"}</strong>
                      </div>
                      <div>
                        <span>Intersections</span>
                        <strong>{signalResult.optimized_intersections_count ?? 0}</strong>
                      </div>
                      <div>
                        <span>Total Cycle</span>
                        <strong>{signalResult.total_cycle_time_sec}s</strong>
                      </div>
                    </div>

                    <motion.div className="details-card prediction-subcard" {...resultReveal}>
                      <h4>Top Optimized Intersections</h4>
                      <div className="signal-list">
                        {topSignals.map((signal) => (
                          <div key={signal.intersection_id} className="signal-item">
                            <div>
                              <strong>{formatIntersectionName(signal)}</strong>
                              <div className="segment-subtext">ID: {signal.intersection_id}</div>
                            </div>
                            <div className="signal-metrics">
                              <StatusBadge level={signal.congestion_level} />
                              <span>G: {signal.recommended_green_time_sec}s</span>
                              <span>R: {signal.recommended_red_time_sec}s</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div className="details-card prediction-subcard" {...resultReveal}>
                      <h4>Green vs Red Time Chart</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={signalChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="intersection" hide />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="green" fill="#4ade80" name="Green Time" />
                          <Bar dataKey="red" fill="#f87171" name="Red Time" />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </div>
          </div>

          <div className="comparison-grid" style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <motion.div className="result-card" whileHover={{ y: -3 }}>
              <h3>Congestion Hotspots</h3>
              <div className="signal-list">
                {hotspots?.hotspots?.map((spot) => (
                  <div key={spot.intersection_id} className="signal-item">
                    <div>
                      <strong>{spot.name || spot.intersection_id}</strong>
                      <div className="segment-subtext">Flow: {spot.incoming_flow}</div>
                    </div>
                    <StatusBadge level={spot.severity} />
                  </div>
                )) || <div className="empty-state">No hotspots found</div>}
              </div>
            </motion.div>

            <motion.div className="result-card" whileHover={{ y: -3 }}>
              <h3>Performance Overview</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="intersection" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#6366f1" name="Score" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </>
      )}
    </motion.section>
  );
}