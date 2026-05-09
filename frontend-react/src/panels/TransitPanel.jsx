const transitPreferences = [
  { value: "fastest", label: "Fastest Route" },
  { value: "fewest_transfers", label: "Fewest Transfers" },
  { value: "cheapest", label: "Cheapest Fare" },
];

function TransitMetric({ label, value }) {
  return (
    <div className="result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TransitRouteResult({ result }) {
  if (!result) {
    return (
      <p className="workspace-panel-copy">
        Plan a public transit route to inspect travel time, transfers, cost,
        and route path.
      </p>
    );
  }

  const path = result.path ?? [];
  const modes = result.modes ?? result.transit_modes ?? [];

  return (
    <div className="route-result-stack">
      <div className="route-result-card accent">
        <h4>Transit Route</h4>

        <div className="result-grid">
          <TransitMetric
            label="ETA"
            value={`${
              result.estimated_time_min ??
              result.travel_time_min ??
              "N/A"
            } min`}
          />

          <TransitMetric
            label="Transfers"
            value={
              result.transfers ??
              result.transfer_count ??
              "N/A"
            }
          />

          <TransitMetric
            label="Cost"
            value={
              result.estimated_cost_egp != null
                ? `${result.estimated_cost_egp} EGP`
                : result.cost_egp != null
                ? `${result.cost_egp} EGP`
                : "N/A"
            }
          />

          <TransitMetric
            label="Main Mode"
            value={
              result.primary_transit_mode ??
              result.main_mode ??
              result.mode ??
              "Mixed"
            }
          />
        </div>

        <p className="route-path">
          {path.length ? path.join(" → ") : "No path available"}
        </p>
      </div>

      {Array.isArray(modes) && modes.length ? (
        <div className="transit-mode-list">
          {modes.slice(0, 6).map((mode, index) => (
            <div
              className="transit-mode-item"
              key={`${mode}-${index}`}
            >
              <span className="transit-mode-dot" />
              <strong>{String(mode)}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AllocationResult({ result }) {
  if (!result) {
    return (
      <p className="workspace-panel-copy">
        Run bus allocation to distribute fleet capacity across high-demand
        public transit routes.
      </p>
    );
  }

  const allocations =
    result.allocations ??
    result.route_allocations ??
    result.allocated_routes ??
    [];

  const summary = result.summary ?? result;

  return (
    <div className="route-result-stack">
      <div className="route-result-card accent">
        <h4>Allocation Summary</h4>

        <div className="result-grid">
          <TransitMetric
            label="Available Buses"
            value={
              summary.available_buses ??
              summary.total_buses ??
              "N/A"
            }
          />

          <TransitMetric
            label="Allocated"
            value={
              summary.allocated_buses ??
              summary.used_buses ??
              "N/A"
            }
          />

          <TransitMetric
            label="Routes"
            value={
              summary.routes_count ??
              allocations.length ??
              "N/A"
            }
          />

          <TransitMetric
            label="Coverage"
            value={
              summary.coverage_percent != null
                ? `${summary.coverage_percent}%`
                : summary.coverage != null
                ? `${summary.coverage}%`
                : "N/A"
            }
          />
        </div>
      </div>

      {Array.isArray(allocations) && allocations.length ? (
        <div className="transit-allocation-list">
          {allocations.slice(0, 8).map((item, index) => (
            <div
              className="transit-allocation-item"
              key={item.route_id ?? item.id ?? index}
            >
              <div>
                <strong>
                  {item.route_name ??
                    item.name ??
                    `Route ${
                      item.route_id ??
                      item.id ??
                      index + 1
                    }`}
                </strong>

                <span>
                  Demand:{" "}
                  {item.demand ??
                    item.passenger_demand ??
                    "N/A"}
                </span>
              </div>

              <strong>
                {item.allocated_buses ??
                  item.buses ??
                  item.bus_count ??
                  "—"}{" "}
                buses
              </strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function TransitPanel({
  form,
  locations,
  allocationForm,
  routeResult,
  allocationResult,
  loadingRoute,
  loadingAllocation,
  onChange,
  onAllocationChange,
  onSubmitRoute,
  onSubmitAllocation,
  error,
}) {
  const routeDisabled =
    loadingRoute || !locations.length;

  return (
    <div className="workspace-panel-stack">
      <section className="details-card hero-panel transit-hero-panel">
        <p className="eyebrow">Transit Network</p>

        <h1 className="workspace-panel-title">
          Public Transit
        </h1>

        <p className="workspace-panel-copy">
          Plan multimodal public transit routes and optimize
          bus allocation across the city network.
        </p>
      </section>

      {error ? (
        <div className="error-box">{error}</div>
      ) : null}

      <section className="details-card">
        <h3>Transit Route Planner</h3>

        <form
          className="smart-form"
          onSubmit={onSubmitRoute}
        >
          <label>
            Source

            <select
              name="source"
              value={form.source}
              onChange={onChange}
              disabled={routeDisabled}
            >
              {locations.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination

            <select
              name="destination"
              value={form.destination}
              onChange={onChange}
              disabled={routeDisabled}
            >
              {locations.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Preference

            <select
              name="preference"
              value={form.preference}
              onChange={onChange}
              disabled={routeDisabled}
            >
              {transitPreferences.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={routeDisabled}
          >
            {loadingRoute
              ? "Planning route..."
              : "Plan Transit Route"}
          </button>
        </form>
      </section>

      <section className="details-card">
        <h3>Route Result</h3>

        <TransitRouteResult result={routeResult} />
      </section>

      <section className="details-card">
        <h3>Bus Allocation</h3>

        <form
          className="smart-form"
          onSubmit={onSubmitAllocation}
        >
          <label>
            Available Buses

            <input
              type="number"
              name="available_buses"
              min="1"
              value={allocationForm.available_buses}
              onChange={onAllocationChange}
              disabled={loadingAllocation}
            />
          </label>

          <button
            type="submit"
            disabled={loadingAllocation}
          >
            {loadingAllocation
              ? "Allocating..."
              : "Optimize Bus Allocation"}
          </button>
        </form>
      </section>

      <section className="details-card">
        <h3>Allocation Result</h3>

        <AllocationResult result={allocationResult} />
      </section>
    </div>
  );
}