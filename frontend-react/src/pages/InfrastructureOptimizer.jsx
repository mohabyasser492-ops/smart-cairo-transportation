import { useEffect, useMemo, useState } from "react";
import { networkApi } from "../api/client";

function formatCurrency(value) {
  const numeric = Number(value);

  if (Number.isNaN(numeric)) return "N/A";

  return new Intl.NumberFormat("en-US").format(numeric);
}

function SummaryGrid({ items = [] }) {
  if (!items.length) {
    return <div className="empty-state">No summary data available.</div>;
  }

  return (
    <div className="result-grid">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function EdgeList({ title, edges = [], mode = "expansion" }) {
  return (
    <div className="details-card optimizer-subcard">
      <h4>{title}</h4>

      {!edges.length ? (
        <div className="empty-state">No roads available.</div>
      ) : (
        <div className="optimizer-road-list">
          {edges.map((edge, index) => {
            const key = `${edge.road_id || edge.id || edge.source}-${edge.destination}-${index}`;

            return (
              <div key={key} className="optimizer-road-item">
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function InfrastructureOptimizer() {
  const [mstData, setMstData] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [expansionResult, setExpansionResult] = useState(null);
  const [maintenanceResult, setMaintenanceResult] = useState(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingExpansion, setLoadingExpansion] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  const [error, setError] = useState("");

  const [expansionForm, setExpansionForm] = useState({
    use_potential_roads: true,
    cost_per_km: 10000000,
    priority: "cost",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    budget: 50000000,
  });

  useEffect(() => {
    async function loadInitialData() {
      setLoadingInitial(true);
      setError("");

      try {
        const [mst, plan] = await Promise.all([
          networkApi.getMinimumSpanningTree(),
          networkApi.getInfrastructurePlan(),
        ]);

        setMstData(mst);
        setPlanData(plan);
      } catch (err) {
        setError(err.message || "Could not load infrastructure optimization data.");
      } finally {
        setLoadingInitial(false);
      }
    }

    loadInitialData();
  }, []);

  function handleExpansionChange(event) {
    const { name, value, type, checked } = event.target;

    setExpansionForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "cost_per_km"
          ? Number(value)
          : value,
    }));
  }

  function handleMaintenanceChange(event) {
    const { name, value } = event.target;

    setMaintenanceForm((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  }

  async function handleRunExpansion(event) {
    event.preventDefault();

    setLoadingExpansion(true);
    setError("");
    setExpansionResult(null);

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
    setMaintenanceResult(null);

    try {
      const data = await networkApi.createMaintenancePlan(maintenanceForm);
      setMaintenanceResult(data);
    } catch (err) {
      setError(err.message || "Could not create maintenance plan.");
    } finally {
      setLoadingMaintenance(false);
    }
  }

  const mstSummaryItems = useMemo(() => {
    if (!mstData) return [];

    return [
      {
        label: "Connected",
        value: mstData.connected ? "Yes" : "No",
      },
      {
        label: "Nodes Count",
        value: mstData.nodes_count ?? "N/A",
      },
      {
        label: "Selected Edges",
        value: mstData.selected_edges_count ?? "N/A",
      },
      {
        label: "Total Distance",
        value:
          mstData.total_distance_km != null
            ? `${mstData.total_distance_km} km`
            : "N/A",
      },
      {
        label: "Total Cost",
        value: mstData.total_cost != null ? `${mstData.total_cost}` : "N/A",
      },
      {
        label: "Algorithm",
        value: mstData.algorithm ?? "N/A",
      },
    ];
  }, [mstData]);

  const expansionSummaryItems = useMemo(() => {
    if (!expansionResult?.summary) return [];

    return [
      {
        label: "Selected Roads",
        value: expansionResult.summary.selected_roads ?? "N/A",
      },
      {
        label: "Total Distance",
        value:
          expansionResult.summary.total_distance_km != null
            ? `${expansionResult.summary.total_distance_km} km`
            : "N/A",
      },
      {
        label: "Total Construction Cost",
        value:
          expansionResult.summary.estimated_total_cost != null
            ? formatCurrency(expansionResult.summary.estimated_total_cost)
            : "N/A",
      },
      {
        label: "Network Connected",
        value: expansionResult.summary.network_connected ? "Yes" : "No",
      },
    ];
  }, [expansionResult]);

  const maintenanceProjects = useMemo(() => {
    return maintenanceResult?.selected_projects || [];
  }, [maintenanceResult]);

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">Network Planning</p>
        <h1>Infrastructure Optimizer</h1>
        <p>
          Analyze the minimum spanning tree, inspect the infrastructure plan,
          optimize road expansion, and generate maintenance plans using the
          network optimization backend.
        </p>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loadingInitial ? (
        <div className="empty-state">
          Loading infrastructure optimization data...
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>MST Connected</span>
              <strong>{mstData?.connected ? "Yes" : "No"}</strong>
              <p>Shows whether the neighborhood network is fully connected</p>
            </div>

            <div className="stat-card">
              <span>MST Edges</span>
              <strong>{mstData?.selected_edges_count ?? "N/A"}</strong>
              <p>Roads selected by the minimum spanning tree</p>
            </div>

            <div className="stat-card">
              <span>Total Distance</span>
              <strong>
                {mstData?.total_distance_km != null
                  ? `${mstData.total_distance_km}`
                  : "N/A"}
              </strong>
              <p>Minimum total road distance for full connectivity</p>
            </div>

            <div className="stat-card">
              <span>Algorithm</span>
              <strong>{mstData?.algorithm ?? "N/A"}</strong>
              <p>Current infrastructure core plan uses Kruskal MST</p>
            </div>
          </div>

          <div className="comparison-grid" style={{ marginBottom: "24px" }}>
            <div className="result-card">
              <h3>Minimum Spanning Tree</h3>
              <SummaryGrid items={mstSummaryItems} />
            </div>

            <div className="result-card">
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
                      <span>Algorithm Used</span>
                      <strong>{planData.algorithm_used ?? "N/A"}</strong>
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <span>Objective</span>
                      <strong>{planData.objective ?? "N/A"}</strong>
                    </div>
                  </div>

                  <div className="details-card optimizer-subcard">
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
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="prediction-section">
            <div className="prediction-section-header">
              <h2>Expansion Optimizer</h2>
              <p>
                Simulate road expansion with or without potential roads, choose
                a priority, and optimize the selected infrastructure network.
              </p>
            </div>

            <div className="prediction-layout">
              <form
                className="form-card prediction-form-card"
                onSubmit={handleRunExpansion}
              >
                <h3>Expansion Inputs</h3>

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
                  <button type="submit" disabled={loadingExpansion}>
                    {loadingExpansion
                      ? "Optimizing..."
                      : "Run Expansion Optimization"}
                  </button>
                </div>
              </form>

              <div className="result-card prediction-result-card">
                <h3>Expansion Result</h3>

                {!expansionResult ? (
                  <div className="empty-state prediction-empty-state">
                    Run the expansion optimizer to see selected roads, total
                    distance, total cost, and connectivity.
                  </div>
                ) : (
                  <>
                    <SummaryGrid items={expansionSummaryItems} />

                    <div className="details-card optimizer-subcard">
                      <h4>Configuration Used</h4>
                      <div className="result-grid">
                        <div>
                          <span>Use Potential Roads</span>
                          <strong>
                            {expansionResult.use_potential_roads ? "Yes" : "No"}
                          </strong>
                        </div>

                        <div>
                          <span>Priority</span>
                          <strong>{expansionResult.priority ?? "N/A"}</strong>
                        </div>

                        <div>
                          <span>Cost Per KM</span>
                          <strong>
                            {formatCurrency(expansionResult.cost_per_km)}
                          </strong>
                        </div>

                        <div>
                          <span>Optimization Type</span>
                          <strong>
                            {expansionResult.optimization_type ?? "N/A"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <EdgeList
                      title="Selected Roads"
                      edges={expansionResult.result?.selected_edges || []}
                      mode="expansion"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="prediction-section">
            <div className="prediction-section-header">
              <h2>Maintenance Plan</h2>
              <p>
                Generate a maintenance plan based on the available budget and
                inspect the selected projects returned by the dynamic programming
                optimizer.
              </p>
            </div>

            <div className="prediction-layout">
              <form
                className="form-card prediction-form-card"
                onSubmit={handleRunMaintenance}
              >
                <h3>Maintenance Inputs</h3>

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
                  <button type="submit" disabled={loadingMaintenance}>
                    {loadingMaintenance
                      ? "Generating..."
                      : "Generate Maintenance Plan"}
                  </button>
                </div>
              </form>

              <div className="result-card prediction-result-card">
                <h3>Maintenance Result</h3>

                {!maintenanceResult ? (
                  <div className="empty-state prediction-empty-state">
                    Run the maintenance planner to see optimized maintenance
                    projects, total cost, remaining budget, and benefit score.
                  </div>
                ) : (
                  <>
                    <div className="result-grid optimizer-summary-grid">
                      <div className="full-span">
                        <span>Algorithm</span>
                        <strong>{maintenanceResult.algorithm ?? "N/A"}</strong>
                      </div>

                      <div>
                        <span>Budget</span>
                        <strong>
                          {maintenanceResult.budget != null
                            ? formatCurrency(maintenanceResult.budget)
                            : "N/A"}
                        </strong>
                      </div>

                      <div>
                        <span>Selected Projects</span>
                        <strong>
                          {maintenanceResult.selected_projects_count ?? "N/A"}
                        </strong>
                      </div>

                      <div>
                        <span>Total Cost</span>
                        <strong>
                          {maintenanceResult.total_cost != null
                            ? formatCurrency(maintenanceResult.total_cost)
                            : "N/A"}
                        </strong>
                      </div>

                      <div>
                        <span>Remaining Budget</span>
                        <strong>
                          {maintenanceResult.remaining_budget != null
                            ? formatCurrency(maintenanceResult.remaining_budget)
                            : "N/A"}
                        </strong>
                      </div>

                      <div>
                        <span>Total Benefit Score</span>
                        <strong>
                          {maintenanceResult.total_benefit_score ?? "N/A"}
                        </strong>
                      </div>
                    </div>

                    <EdgeList
                      title="Selected Maintenance Projects"
                      edges={maintenanceProjects}
                      mode="maintenance"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}