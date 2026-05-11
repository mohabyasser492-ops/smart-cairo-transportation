function formatCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function InfraMetric({ label, value }) {
  const displayValue = Array.isArray(value)
    ? value.length
    : value && typeof value === "object"
      ? "N/A"
      : value;

  return (
    <div className="result-metric">
      <span>{label}</span>
      <strong>{displayValue}</strong>
    </div>
  );
}

function RoadList({ title, roads = [], emptyText = "No roads available." }) {
  return (
    <div className="infra-road-section">
      <h4>{title}</h4>

      {!Array.isArray(roads) || !roads.length ? (
        <p className="workspace-panel-copy">{emptyText}</p>
      ) : (
        <div className="infra-road-list">
          {roads.slice(0, 8).map((road, index) => (
            <div className="infra-road-item" key={road.road_id ?? road.id ?? index}>
              <div>
                <strong>
                  {road.name ??
                    `${road.source ?? road.from ?? "Unknown"} → ${
                      road.destination ?? road.to ?? "Unknown"
                    }`}
                </strong>

                <span>
                  Distance: {road.distance_km ?? road.length_km ?? "N/A"} km
                </span>
              </div>

              <strong>
                {road.estimated_cost != null || road.cost != null
                  ? formatCurrency(road.estimated_cost ?? road.cost)
                  : road.maintenance_cost != null
                    ? formatCurrency(road.maintenance_cost)
                    : road.construction_cost != null
                      ? formatCurrency(road.construction_cost)
                      : road.priority_score != null
                        ? `Score ${road.priority_score}`
                    : "—"}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MstSummary({ mstData }) {
  if (!mstData) {
    return (
      <p className="workspace-panel-copy">
        Minimum spanning tree data is not available yet.
      </p>
    );
  }

  return (
    <div className="result-grid">
      <InfraMetric
        label="Connected"
        value={mstData.connected == null ? "N/A" : mstData.connected ? "Yes" : "No"}
      />
      <InfraMetric label="Nodes" value={mstData.nodes_count ?? "N/A"} />
      <InfraMetric
        label="Selected Edges"
        value={mstData.selected_edges_count ?? mstData.selected_edges?.length ?? "N/A"}
      />
      <InfraMetric
        label="Distance"
        value={
          mstData.total_distance_km != null
            ? `${mstData.total_distance_km} km`
            : "N/A"
        }
      />
      <InfraMetric
        label="Cost"
        value={
          mstData.total_cost != null ? formatCurrency(mstData.total_cost) : "N/A"
        }
      />
      <InfraMetric label="Algorithm" value={mstData.algorithm ?? "N/A"} />
    </div>
  );
}

function ExpansionSummary({ expansionResult }) {
  if (!expansionResult) {
    return (
      <p className="workspace-panel-copy">
        Run expansion optimization to identify candidate roads for improving
        connectivity.
      </p>
    );
  }

  const summary = expansionResult.summary ?? expansionResult;
  const selectedRoads =
    expansionResult.selected_roads ??
    expansionResult.selected_edges ??
    expansionResult.result?.selected_edges ??
    expansionResult.roads ??
    [];
  const selectedRoadsCount = Array.isArray(summary.selected_roads)
    ? summary.selected_roads.length
    : summary.selected_roads ?? selectedRoads.length ?? "N/A";

  return (
    <div className="route-result-stack">
      <div className="route-result-card accent">
        <h4>Expansion Summary</h4>

        <div className="result-grid">
          <InfraMetric
            label="Selected Roads"
            value={selectedRoadsCount}
          />
          <InfraMetric
            label="Distance"
            value={
              summary.total_distance_km != null
                ? `${summary.total_distance_km} km`
                : "N/A"
            }
          />
          <InfraMetric
            label="Estimated Cost"
            value={
              summary.estimated_total_cost != null
                ? formatCurrency(summary.estimated_total_cost)
                : summary.total_cost != null
                  ? formatCurrency(summary.total_cost)
                  : "N/A"
            }
          />
          <InfraMetric
            label="Connected"
            value={
              summary.network_connected == null
                ? "N/A"
                : summary.network_connected
                  ? "Yes"
                  : "No"
            }
          />
        </div>
      </div>

      <RoadList
        title="Selected Expansion Roads"
        roads={selectedRoads}
      />
    </div>
  );
}

function MaintenanceSummary({ maintenanceResult }) {
  if (!maintenanceResult) {
    return (
      <p className="workspace-panel-copy">
        Generate a maintenance plan to prioritize road repair and upgrade
        projects within your budget.
      </p>
    );
  }

  const projects =
    maintenanceResult.selected_projects ??
    maintenanceResult.projects ??
    maintenanceResult.selected_roads ??
    [];

  const summary = maintenanceResult.summary ?? maintenanceResult;

  return (
    <div className="route-result-stack">
      <div className="route-result-card accent">
        <h4>Maintenance Summary</h4>

        <div className="result-grid">
          <InfraMetric
            label="Projects"
            value={
              summary.selected_projects_count ??
              summary.selected_projects?.length ??
              projects.length ??
              "N/A"
            }
          />
          <InfraMetric
            label="Budget Used"
            value={
              summary.total_cost != null
                ? formatCurrency(summary.total_cost)
                : summary.budget_used != null
                  ? formatCurrency(summary.budget_used)
                  : "N/A"
            }
          />
          <InfraMetric
            label="Remaining"
            value={
              summary.remaining_budget != null
                ? formatCurrency(summary.remaining_budget)
                : "N/A"
            }
          />
          <InfraMetric
            label="Impact"
            value={
              summary.total_impact ??
              summary.impact_score ??
              summary.total_benefit_score ??
              "N/A"
            }
          />
        </div>
      </div>

      <RoadList
        title="Maintenance Projects"
        roads={projects}
        emptyText="No maintenance projects returned."
      />
    </div>
  );
}

export default function InfrastructurePanel({
  mstData,
  expansionForm,
  maintenanceForm,
  expansionResult,
  maintenanceResult,
  loadingExpansion,
  loadingMaintenance,
  error,
  onExpansionChange,
  onMaintenanceChange,
  onRunExpansion,
  onRunMaintenance,
}) {
  return (
    <div className="workspace-panel-stack">
      <section className="details-card hero-panel infrastructure-hero-panel">
        <p className="eyebrow">Network Planning</p>
        <h1 className="workspace-panel-title">Infrastructure Optimizer</h1>
        <p className="workspace-panel-copy">
          Analyze network connectivity, optimize road expansion, and generate
          budget-aware maintenance plans.
        </p>
      </section>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="details-card">
        <h3>Minimum Spanning Tree</h3>
        <MstSummary mstData={mstData} />
      </section>

      <section className="details-card">
        <h3>Expansion Optimization</h3>

        <form className="smart-form" onSubmit={onRunExpansion}>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="use_potential_roads"
              checked={expansionForm.use_potential_roads}
              onChange={onExpansionChange}
              disabled={loadingExpansion}
            />
            Use potential roads
          </label>

          <label>
            Cost Per KM
            <input
              type="number"
              name="cost_per_km"
              min="1000"
              value={expansionForm.cost_per_km}
              onChange={onExpansionChange}
              disabled={loadingExpansion}
            />
          </label>

          <label>
            Priority
            <select
              name="priority"
              value={expansionForm.priority}
              onChange={onExpansionChange}
              disabled={loadingExpansion}
            >
              <option value="cost">Lowest Cost</option>
              <option value="distance">Shortest Distance</option>
              <option value="connectivity">Connectivity</option>
            </select>
          </label>

          <button type="submit" disabled={loadingExpansion}>
            {loadingExpansion ? "Optimizing..." : "Optimize Expansion"}
          </button>
        </form>
      </section>

      <section className="details-card">
        <h3>Expansion Result</h3>
        <ExpansionSummary expansionResult={expansionResult} />
      </section>

      <section className="details-card">
        <h3>Maintenance Planning</h3>

        <form className="smart-form" onSubmit={onRunMaintenance}>
          <label>
            Budget
            <input
              type="number"
              name="budget"
              min="1000"
              value={maintenanceForm.budget}
              onChange={onMaintenanceChange}
              disabled={loadingMaintenance}
            />
          </label>

          <button type="submit" disabled={loadingMaintenance}>
            {loadingMaintenance ? "Generating..." : "Generate Maintenance Plan"}
          </button>
        </form>
      </section>

      <section className="details-card">
        <h3>Maintenance Result</h3>
        <MaintenanceSummary maintenanceResult={maintenanceResult} />
      </section>
    </div>
  );
}
