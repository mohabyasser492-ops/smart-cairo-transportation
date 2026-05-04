import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { networkApi } from "../api/client";
import {
  pageTransition,
  resultReveal,
  staggerContainer,
  cardItem,
  buttonMotion,
} from "../ui/motion";

/**
 * Helper to format numbers as currency
 */
function formatCurrency(value) {
  const numeric = Number(value);
  if (isNaN(numeric)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

/**
 * Reusable summary grid for displaying key-value pairs
 */
function SummaryGrid({ items = [] }) {
  if (!items || items.length === 0) {
    return <div className="empty-state">No summary data available.</div>;
  }

  return (
    <div className="result-grid">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

/**
 * Reusable list to display road segments/edges
 */
function EdgeList({ title, edges = [], mode = "expansion" }) {
  return (
    <motion.div
      className="details-card optimizer-subcard"
      {...resultReveal}
      key={`${title}-${edges.length}-${mode}`}
    >
      <h4>{title}</h4>

      {!edges || edges.length === 0 ? (
        <div className="empty-state">No roads available.</div>
      ) : (
        <div className="optimizer-road-list">
          {edges.map((edge, index) => {
            const key = `${edge.road_id || edge.id || edge.source}-${edge.destination}-${index}`;

            return (
              <motion.div
                key={key}
                className="optimizer-road-item"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18 }}
              >
                <div>
                  <strong>
                    {edge.source} → {edge.destination}
                  </strong>
                  <div className="segment-subtext">
                    Road ID: {edge.road_id || edge.id || "N/A"}
                  </div>
                </div>

                {mode === "maintenance" ? (
                  <div className="optimizer-road-metrics">
                    <span>Condition: {edge.condition ?? "N/A"}</span>
                    <span>Benefit: {edge.benefit_score ?? "N/A"}</span>
                    <span>{formatCurrency(edge.maintenance_cost)}</span>
                  </div>
                ) : (
                  <div className="optimizer-road-metrics">
                    <span>
                      {edge.distance_km != null ? `${edge.distance_km} km` : "N/A"}
                    </span>
                    <span>
                      {edge.construction_cost != null
                        ? formatCurrency(edge.construction_cost)
                        : "N/A"}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default function InfrastructureOptimizer() {
  // Data States
  const [mstData, setMstData] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [expansionResult, setExpansionResult] = useState(null);
  const [maintenanceResult, setMaintenanceResult] = useState(null);

  // Loading & Error States
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingExpansion, setLoadingExpansion] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [error, setError] = useState("");

  // Form States
  const [expansionForm, setExpansionForm] = useState({
    use_potential_roads: true,
    cost_per_km: 10000000,
    priority: "cost",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    budget: 50000000,
  });

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setLoadingInitial(true);
      setError("");
      try {
        const [mst, plan] = await Promise.all([
          networkApi.getMinimumSpanningTree(),
          networkApi.getInfrastructurePlan(),
        ]);

        if (isMounted) {
          setMstData(mst);
          setPlanData(plan);
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Could not load infrastructure data.");
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  // Form Handlers
  function handleExpansionChange(event) {
    const { name, value, type, checked } = event.target;
    setExpansionForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (name === "cost_per_km" ? Number(value) : value),
    }));
  }

  function handleMaintenanceChange(event) {
    const { name, value } = event.target;
    // FIX: Correctly update the specific field in the state object
    setMaintenanceForm((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  }

  // API Execution Handlers
  async function handleRunExpansion(event) {
    event.preventDefault();
    setLoadingExpansion(true);
    setError("");
    try {
      const data = await networkApi.optimizeExpansion(expansionForm);
      setExpansionResult(data);
    } catch (err) {
      setError(err.message || "Could not optimize expansion.");
    } finally {
      setLoadingExpansion(false);
    }
  }

  async function handleRunMaintenance(event) {
    event.preventDefault();
    setLoadingMaintenance(true);
    setError("");
    try {
      const data = await networkApi.createMaintenancePlan(maintenanceForm);
      setMaintenanceResult(data);
    } catch (err) {
      setError(err.message || "Could not create maintenance plan.");
    } finally {
      setLoadingMaintenance(false);
    }
  }

  // Memoized Summaries
  const mstSummaryItems = useMemo(() => {
    if (!mstData) return [];
    return [
      { label: "Connected", value: mstData.connected ? "Yes" : "No" },
      { label: "Nodes Count", value: mstData.nodes_count ?? "N/A" },
      { label: "Selected Edges", value: mstData.selected_edges_count ?? "N/A" },
      {
        label: "Total Distance",
        value: mstData.total_distance_km != null ? `${mstData.total_distance_km} km` : "N/A",
      },
      {
        label: "Total Cost",
        value: mstData.total_cost != null ? formatCurrency(mstData.total_cost) : "N/A",
      },
      { label: "Method", value: mstData.algorithm ?? "N/A" },
    ];
  }, [mstData]);

  const expansionSummaryItems = useMemo(() => {
    if (!expansionResult?.summary) return [];
    const s = expansionResult.summary;
    return [
      { label: "Selected Roads", value: s.selected_roads ?? "N/A" },
      {
        label: "Total Distance",
        value: s.total_distance_km != null ? `${s.total_distance_km} km` : "N/A",
      },
      {
        label: "Total Construction Cost",
        value: s.estimated_total_cost != null ? formatCurrency(s.estimated_total_cost) : "N/A",
      },
      { label: "Network Connected", value: s.network_connected ? "Yes" : "No" },
    ];
  }, [expansionResult]);

  const maintenanceProjects = useMemo(() => {
    return maintenanceResult?.selected_projects || [];
  }, [maintenanceResult]);

  return (
    <motion.section {...pageTransition} className="optimizer-container">
      <motion.div className="page-header" {...resultReveal}>
        <p className="eyebrow">Network Planning</p>
        <h1>Infrastructure Optimizer</h1>
        <p>
          Evaluate connectivity, optimize road expansion, and generate
          maintenance plans for the transport network.
        </p>
      </motion.div>

      {error && <div className="error-box">{error}</div>}

      {loadingInitial ? (
        <div className="empty-state">Loading infrastructure planning data...</div>
      ) : (
        <>
          {/* Top Stats Bar */}
          <motion.div
            className="stats-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div className="stat-card" variants={cardItem}>
              <span>Network Connected</span>
              <strong>{mstData?.connected ? "Yes" : "No"}</strong>
              <p>Shows whether the neighborhood network is fully connected</p>
            </motion.div>

            <motion.div className="stat-card" variants={cardItem}>
              <span>Selected Edges</span>
              <strong>{mstData?.selected_edges_count ?? "N/A"}</strong>
              <p>Roads selected by the connectivity plan</p>
            </motion.div>

            <motion.div className="stat-card" variants={cardItem}>
              <span>Total Distance</span>
              <strong>
                {mstData?.total_distance_km != null ? `${mstData.total_distance_km} km` : "N/A"}
              </strong>
              <p>Minimum total road distance for full network connectivity</p>
            </motion.div>

            <motion.div className="stat-card" variants={cardItem}>
              <span>Method</span>
              <strong>{mstData?.algorithm ?? "N/A"}</strong>
              <p>Current infrastructure planning method used by the backend</p>
            </motion.div>
          </motion.div>

          {/* Primary Data Cards */}
          <motion.div
            className="comparison-grid"
            style={{ marginBottom: "24px" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <motion.div className="result-card" whileHover={{ y: -3 }}>
              <h3>Connectivity Summary</h3>
              <SummaryGrid items={mstSummaryItems} />
            </motion.div>

            <motion.div className="result-card" whileHover={{ y: -3 }}>
              <h3>Infrastructure Plan</h3>
              {!planData ? (
                <div className="empty-state">No infrastructure plan available.</div>
              ) : (
                <>
                  <div className="result-grid">
                    <div>
                      <span>Plan Name</span>
                      <strong>{planData.plan_name ?? "N/A"}</strong>
                    </div>
                    <div>
                      <span>Method</span>
                      <strong>{planData.algorithm_used ?? "N/A"}</strong>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span>Objective</span>
                      <strong>{planData.objective ?? "N/A"}</strong>
                    </div>
                  </div>

                  <motion.div className="details-card optimizer-subcard" {...resultReveal}>
                    <h4>Planning Notes</h4>
                    {planData.planning_notes?.length ? (
                      <ul className="optimizer-notes-list">
                        {planData.planning_notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state">No planning notes available.</div>
                    )}
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Expansion Section */}
          <div className="prediction-section">
            <div className="prediction-section-header">
              <h2>Expansion Planning</h2>
              <p>Simulate road expansion scenarios and evaluate the resulting network plan.</p>
            </div>

            <div className="prediction-layout">
              <motion.form
                className="form-card prediction-form-card"
                onSubmit={handleRunExpansion}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3>Planning Inputs</h3>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    name="use_potential_roads"
                    checked={expansionForm.use_potential_roads}
                    onChange={handleExpansionChange}
                  />
                  Use Potential Roads
                </label>

                <label>
                  Cost Per KM
                  <input
                    type="number"
                    name="cost_per_km"
                    value={expansionForm.cost_per_km}
                    onChange={handleExpansionChange}
                  />
                </label>

                <label>
                  Priority
                  <select
                    name="priority"
                    value={expansionForm.priority}
                    onChange={handleExpansionChange}
                  >
                    <option value="cost">Cost</option>
                    <option value="distance">Distance</option>
                  </select>
                </label>

                <div className="button-row">
                  <motion.button {...buttonMotion} type="submit" disabled={loadingExpansion}>
                    {loadingExpansion ? "Optimizing..." : "Run Expansion Plan"}
                  </motion.button>
                </div>
              </motion.form>

              <motion.div className="result-card prediction-result-card" {...resultReveal}>
                <h3>Planning Result</h3>
                {!expansionResult ? (
                  <div className="empty-state prediction-empty-state">
                    Run an expansion plan to review selected roads and connectivity.
                  </div>
                ) : (
                  <>
                    <SummaryGrid items={expansionSummaryItems} />
                    <EdgeList
                      title="Selected Roads"
                      edges={expansionResult.result?.selected_edges || []}
                      mode="expansion"
                    />
                  </>
                )}
              </motion.div>
            </div>
          </div>

          {/* Maintenance Section */}
          <div className="prediction-section">
            <div className="prediction-section-header">
              <h2>Maintenance Planning</h2>
              <p>Generate a maintenance plan based on available budget and priority scoring.</p>
            </div>

            <div className="prediction-layout">
              <motion.form
                className="form-card prediction-form-card"
                onSubmit={handleRunMaintenance}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3>Maintenance Parameters</h3>
                <label>
                  Budget
                  <input
                    type="number"
                    name="budget"
                    value={maintenanceForm.budget}
                    onChange={handleMaintenanceChange}
                  />
                </label>

                <div className="button-row">
                  <motion.button {...buttonMotion} type="submit" disabled={loadingMaintenance}>
                    {loadingMaintenance ? "Generating..." : "Generate Maintenance Plan"}
                  </motion.button>
                </div>
              </motion.form>

              <motion.div className="result-card prediction-result-card" {...resultReveal}>
                <h3>Maintenance Result</h3>
                {!maintenanceResult ? (
                  <div className="empty-state prediction-empty-state">
                    Run maintenance planning to review selected projects and benefit scores.
                  </div>
                ) : (
                  <>
                    <div className="result-grid optimizer-summary-grid">
                      <div className="full-span">
                        <span>Method</span>
                        <strong>{maintenanceResult.algorithm ?? "N/A"}</strong>
                      </div>
                      <div>
                        <span>Selected Projects</span>
                        <strong>{maintenanceResult.selected_projects_count ?? 0}</strong>
                      </div>
                      <div>
                        <span>Total Cost</span>
                        <strong>{formatCurrency(maintenanceResult.total_cost)}</strong>
                      </div>
                      <div>
                        <span>Remaining Budget</span>
                        <strong>{formatCurrency(maintenanceResult.remaining_budget)}</strong>
                      </div>
                      <div>
                        <span>Total Benefit</span>
                        <strong>{maintenanceResult.total_benefit_score ?? 0}</strong>
                      </div>
                    </div>
                    <EdgeList
                      title="Selected Maintenance Projects"
                      edges={maintenanceProjects}
                      mode="maintenance"
                    />
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}