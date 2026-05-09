const SERVICE_OPTIONS = [
  {
    value: "ambulance",
    label: "Ambulance",
    badgeClass: "ambulance",
    icon: "🚑",
    description: "Critical medical response with highest urgency.",
  },
  {
    value: "police",
    label: "Police",
    badgeClass: "police",
    icon: "🚓",
    description: "Rapid security response and route enforcement support.",
  },
  {
    value: "fire_truck",
    label: "Fire Truck",
    badgeClass: "fire_truck",
    icon: "🚒",
    description: "Heavy emergency dispatch for fire and rescue scenarios.",
  },
];

function EmergencyMetric({ label, value }) {
  return (
    <div className="result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ServiceToggle({ service, active, onClick }) {
  return (
    <button
      type="button"
      className={`service-chip ${active ? "active" : ""} ${service.badgeClass}`}
      onClick={onClick}
    >
      <span className="service-chip-icon">{service.icon}</span>

      <span className="service-chip-content">
        <strong>{service.label}</strong>
        <small>{service.description}</small>
      </span>
    </button>
  );
}

function ServiceResultCard({ item, active, onClick }) {
  const result = item?.result ?? {};
  const type = item?.type ?? "service";

  const label =
    SERVICE_OPTIONS.find((service) => service.value === type)?.label ?? type;

  return (
    <button
      type="button"
      className={`service-result-card ${type} ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="service-result-head">
        <span className={`service-badge ${type}`}>{label}</span>
        <strong>{result.chosen_algorithm ?? result.algorithm ?? "Route"}</strong>
      </div>

      <div className="result-grid">
        <EmergencyMetric
          label="ETA"
          value={`${result.estimated_time_min ?? "N/A"} min`}
        />
        <EmergencyMetric
          label="Visited"
          value={result.visited_nodes_count ?? "N/A"}
        />
        <EmergencyMetric
          label="Cost"
          value={result.total_cost ?? result.total_distance ?? "N/A"}
        />
        <EmergencyMetric
          label="Path Nodes"
          value={(result.path ?? []).length}
        />
      </div>

      <p className="route-path">
        {(result.path ?? []).join(" → ") || "No path available"}
      </p>
    </button>
  );
}

export default function EmergencyDispatchPanel({
  form,
  locationOptions,
  onChange,
  serviceSelection,
  toggleService,
  onSubmit,
  loading,
  results,
  activeService,
  setActiveService,
  error,
}) {
  const selectedServices = SERVICE_OPTIONS.filter(
    (service) => serviceSelection[service.value]
  );

  const activeResult =
    results.find((item) => item.type === activeService) ?? results[0] ?? null;

  return (
    <div className="workspace-panel-stack">
      <section className="details-card hero-panel emergency-hero-panel">
        <p className="eyebrow">Emergency Operations</p>
        <h1 className="workspace-panel-title">Emergency Dispatch</h1>
        <p className="workspace-panel-copy">
          Dispatch ambulance, police, and fire truck routes directly on the live
          Cairo transport network.
        </p>
      </section>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="details-card">
        <h3>Dispatch Request</h3>

        <form className="smart-form" onSubmit={onSubmit}>
          <label>
            Source
            <select
              name="source"
              value={form.source}
              onChange={onChange}
              disabled={loading}
            >
              {locationOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
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
              disabled={loading}
            >
              {locationOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="service-toggle-grid">
            {SERVICE_OPTIONS.map((service) => (
              <ServiceToggle
                key={service.value}
                service={service}
                active={serviceSelection[service.value]}
                onClick={() => toggleService(service.value)}
              />
            ))}
          </div>

          <button type="submit" disabled={loading || !selectedServices.length}>
            {loading ? "Dispatching..." : "Dispatch Selected Services"}
          </button>
        </form>
      </section>

      <section className="details-card">
        <h3>Dispatch Results</h3>

        {!results.length ? (
          <p className="workspace-panel-copy">
            Run an emergency dispatch to compare response routes and visualize
            them on the map.
          </p>
        ) : (
          <div className="service-results-stack">
            {results.map((item) => (
              <ServiceResultCard
                key={item.type}
                item={item}
                active={activeResult?.type === item.type}
                onClick={() => setActiveService(item.type)}
              />
            ))}
          </div>
        )}
      </section>

      {activeResult ? (
        <section className="details-card">
          <h3>Active Route</h3>

          <div className="highlight-box emergency-highlight">
            <span>Selected service</span>
            <strong>
              {
                SERVICE_OPTIONS.find(
                  (service) => service.value === activeResult.type
                )?.label
              }
            </strong>
            <p>
              The selected emergency route is highlighted on the map. Other
              dispatched services remain visible as supporting overlays.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}