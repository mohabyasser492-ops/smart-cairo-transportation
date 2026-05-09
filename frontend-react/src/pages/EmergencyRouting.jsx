import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { dataApi, routingApi } from "../api/client";
import RealMap from "../components/RealMap";
import {
  buildLocationCollections,
  buildRoutePolylineFromPath,
  normalizeRoads,
} from "../utils/mapAdapters";
import { pageTransition, resultReveal, buttonMotion } from "../ui/motion";

const SERVICE_OPTIONS = [
  {
    value: "ambulance",
    label: "Ambulance",
    badgeClass: "ambulance",
    description: "Critical medical response with highest urgency.",
  },
  {
    value: "police",
    label: "Police",
    badgeClass: "police",
    description: "Rapid security response and route enforcement support.",
  },
  {
    value: "fire_truck",
    label: "Fire Truck",
    badgeClass: "fire",
    description: "Heavy emergency dispatch for fire and rescue scenarios.",
  },
];

function formatDecisionBasis(value) {
  if (!value) return "N/A";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ServiceMetric({ label, value }) {
  return (
    <div className="dispatch-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ServiceResultCard({ service, item, active, onActivate }) {
  const summary = item?.result?.comparison?.summary ?? {};
  const metrics = item?.result?.decision_metrics ?? {};
  const currentMetrics = metrics?.[item?.result?.chosen_algorithm] ?? {};

  return (
    <motion.button
      type="button"
      className={`service-result-card ${service.badgeClass} ${active ? "active" : ""}`}
      onClick={onActivate}
      {...buttonMotion}
    >
      <div className="service-result-head">
        <div className="service-result-title-group">
          <span className={`service-badge ${service.badgeClass}`}>{service.label}</span>
          <h3>{item?.result?.recommended_action ?? `Dispatch ${service.label}`}</h3>
        </div>

        <div className="service-result-algo">
          <span>Chosen Algorithm</span>
          <strong>{String(item?.result?.chosen_algorithm ?? "N/A").toUpperCase()}</strong>
        </div>
      </div>

      <p className="service-result-description">
        {item?.result?.selection_reason ?? "No selection reason returned."}
      </p>

      <div className="service-result-metrics">
        <ServiceMetric
          label="ETA"
          value={
            item?.result?.estimated_time_min != null
              ? `${item.result.estimated_time_min} min`
              : "N/A"
          }
        />
        <ServiceMetric
          label="Distance"
          value={
            item?.result?.total_cost != null ? `${item.result.total_cost} km` : "N/A"
          }
        />
        <ServiceMetric
          label="Visited Nodes"
          value={currentMetrics?.visited_nodes_count ?? "N/A"}
        />
        <ServiceMetric
          label="Runtime"
          value={
            currentMetrics?.runtime_ms != null
              ? `${currentMetrics.runtime_ms} ms`
              : "N/A"
          }
        />
      </div>

      <div className="service-result-footer">
        <span>
          Decision Basis: <strong>{formatDecisionBasis(summary?.decision_basis)}</strong>
        </span>
        <span>
          Runtime Gap:{" "}
          <strong>
            {summary?.runtime_difference_ms != null
              ? `${summary.runtime_difference_ms} ms`
              : "N/A"}
          </strong>
        </span>
        <span>
          Search Gap:{" "}
          <strong>
            {summary?.visited_nodes_difference != null
              ? summary.visited_nodes_difference
              : "N/A"}
          </strong>
        </span>
      </div>
    </motion.button>
  );
}

export default function EmergencyRouting() {
  const [neighborhoodsRaw, setNeighborhoodsRaw] = useState([]);
  const [facilitiesRaw, setFacilitiesRaw] = useState([]);
  const [existingRoadsRaw, setExistingRoadsRaw] = useState([]);

  const [form, setForm] = useState({
    source: "",
    destination: "",
  });

  const [serviceSelection, setServiceSelection] = useState({
    ambulance: true,
    police: true,
    fire_truck: false,
  });

  const [results, setResults] = useState([]);
  const [activeService, setActiveService] = useState("ambulance");

  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadEmergencyData() {
      setLoadingLocations(true);
      setError("");

      try {
        const [neighborhoods, facilities, roads] = await Promise.all([
          dataApi.getNeighborhoods(),
          dataApi.getFacilities(),
          dataApi.getExistingRoads(),
        ]);

        if (!mounted) return;

        setNeighborhoodsRaw(Array.isArray(neighborhoods) ? neighborhoods : []);
        setFacilitiesRaw(Array.isArray(facilities) ? facilities : []);
        setExistingRoadsRaw(Array.isArray(roads) ? roads : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Could not load emergency routing data.");
      } finally {
        if (mounted) setLoadingLocations(false);
      }
    }

    loadEmergencyData();

    return () => {
      mounted = false;
    };
  }, []);

  const locationCollections = useMemo(() => {
    return buildLocationCollections(neighborhoodsRaw, facilitiesRaw);
  }, [neighborhoodsRaw, facilitiesRaw]);

  const locationOptions = useMemo(() => {
    return locationCollections.allLocations
      .map((item) => item?.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [locationCollections.allLocations]);

  useEffect(() => {
    if (!locationOptions.length) return;

    setForm((previous) => ({
      source: previous.source || locationOptions[0] || "",
      destination:
        previous.destination || locationOptions[1] || locationOptions[0] || "",
    }));
  }, [locationOptions]);

  const normalizedExistingRoads = useMemo(() => {
    return normalizeRoads(existingRoadsRaw, locationCollections.idLookup);
  }, [existingRoadsRaw, locationCollections.idLookup]);

  const enabledServices = useMemo(() => {
    return SERVICE_OPTIONS.filter((item) => serviceSelection[item.value]);
  }, [serviceSelection]);

  const emergencyRoutes = useMemo(() => {
    return results
      .map((item) => ({
        ...item,
        points: buildRoutePolylineFromPath(
          item?.result?.path ?? [],
          locationCollections.nameLookup
        ),
      }))
      .filter((item) => Array.isArray(item.points) && item.points.length > 0);
  }, [results, locationCollections.nameLookup]);

  const activeResult = useMemo(() => {
    return results.find((item) => item.type === activeService) ?? results[0] ?? null;
  }, [activeService, results]);

  function handleChange(event) {
  const { name, value } = event.target;
  setForm((previous) => ({
    ...previous,
    value,
  }));
}

  function toggleService(type) {
    setServiceSelection((previous) => ({
      ...previous,
      [type]: !previous[type],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!enabledServices.length) {
      setError("Select at least one emergency service to dispatch.");
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const settled = await Promise.allSettled(
        enabledServices.map(async (service) => {
          const data = await routingApi.emergencyRoute({
            source: form.source,
            destination: form.destination,
            emergency_type: service.value,
          });

          return {
            type: service.value,
            result: data,
          };
        })
      );

      const successful = settled
        .filter((item) => item.status === "fulfilled")
        .map((item) => item.value);

      const failed = settled
        .filter((item) => item.status === "rejected")
        .map((item) => item.reason?.message || "Emergency route request failed.");

      if (!successful.length) {
        throw new Error(failed.join(" | ") || "Could not load emergency routes.");
      }

      setResults(successful);
      setActiveService(successful[0]?.type ?? "ambulance");

      if (failed.length) {
        setError(`Some services failed to load: ${failed.join(" | ")}`);
      }
    } catch (err) {
      setError(err.message || "Could not load emergency routes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div className="page-enter" {...pageTransition}>
      <div className="page-header emergency-hero">
        <p className="eyebrow">Emergency Operations</p>
        <h1>Emergency Routing</h1>
        <p>
          Dispatch multiple emergency services on the same live map, compare
          algorithm decisions per service, and inspect route quality, ETA, and
          search efficiency in one operational screen.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Response Types</span>
          <strong>{SERVICE_OPTIONS.length}</strong>
          <p>Ambulance, fire response, and police routing supported.</p>
        </div>

        <div className="stat-card">
          <span>Decision Mode</span>
          <strong>Auto</strong>
          <p>
            The backend compares Dijkstra and A* and selects the better route
            for each emergency dispatch.
          </p>
        </div>

        <div className="stat-card">
          <span>Locations</span>
          <strong>{loadingLocations ? "..." : locationOptions.length}</strong>
          <p>Origins and destinations loaded dynamically from backend data.</p>
        </div>

        <div className="stat-card">
          <span>Live Dispatch</span>
          <strong>{results.length}</strong>
          <p>Emergency services currently rendered on the same operational map.</p>
        </div>
      </div>

      {(error || loadingLocations) && (
        <>
          {loadingLocations && (
            <div className="placeholder-panel">Loading emergency routing data...</div>
          )}
          {error && <div className="error-box">{error}</div>}
        </>
      )}

      <div className="emergency-layout">
        <div className="emergency-sidebar">
          <div className="form-card dispatch-form-card">
            <h3>Dispatch Inputs</h3>

            <form onSubmit={handleSubmit}>
              <label>
                Source
                <select
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  disabled={loadingLocations || !locationOptions.length}
                >
                  {locationOptions.map((location) => (
                    <option key={`source-${location}`} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Destination
                <select
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  disabled={loadingLocations || !locationOptions.length}
                >
                  {locationOptions.map((location) => (
                    <option key={`destination-${location}`} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </label>

              <div className="dispatch-service-section">
                <span className="dispatch-service-label">Emergency Services</span>

                <div className="service-toggle-grid">
                  {SERVICE_OPTIONS.map((service) => {
                    const active = serviceSelection[service.value];

                    return (
                      <button
                        key={service.value}
                        type="button"
                        className={`service-chip ${service.badgeClass} ${active ? "active" : ""}`}
                        onClick={() => toggleService(service.value)}
                      >
                        <span>{service.label}</span>
                        <small>{service.description}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="button-row">
                <motion.button type="submit" disabled={loading || loadingLocations} {...buttonMotion}>
                  {loading ? "Dispatching & Comparing..." : "Dispatch Selected Services"}
                </motion.button>
              </div>
            </form>
          </div>

          <div className="details-card dispatch-context-card">
            <h3>Dispatch Summary</h3>

            {!results.length ? (
              <div className="empty-state">
                Run emergency routing to dispatch ambulance and police on the same map.
              </div>
            ) : (
              <div className="result-grid">
                <div>
                  <span>Active Services</span>
                  <strong>{results.length}</strong>
                </div>
                <div>
                  <span>Source</span>
                  <strong>{form.source || "N/A"}</strong>
                </div>
                <div>
                  <span>Destination</span>
                  <strong>{form.destination || "N/A"}</strong>
                </div>
                <div>
                  <span>Focused Service</span>
                  <strong>{activeResult?.type?.replace("_", " ") ?? "N/A"}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="emergency-main">
          <div className="emergency-map-panel">
            <RealMap
              neighborhoods={locationCollections.neighborhoods}
              facilities={locationCollections.facilities}
              roads={normalizedExistingRoads}
              trafficLookup={new Map()}
              selectedTime="morning_peak"
              selectedElement={null}
              onSelectNode={() => {}}
              onSelectRoad={() => {}}
              extraRoutes={emergencyRoutes}
            />
          </div>

          <div className="service-results-grid">
            {!results.length ? (
              <div className="empty-state">
                Compare and dispatch selected services to see route decisions,
                ETA, selected algorithm, and operational recommendations.
              </div>
            ) : (
              results.map((item) => {
                const service =
                  SERVICE_OPTIONS.find((option) => option.value === item.type) ??
                  SERVICE_OPTIONS[0];

                return (
                  <ServiceResultCard
                    key={item.type}
                    service={service}
                    item={item}
                    active={activeService === item.type}
                    onActivate={() => setActiveService(item.type)}
                  />
                );
              })
            )}
          </div>

          {activeResult && (
            <motion.div className="details-card active-dispatch-details" {...resultReveal}>
              <h3>Focused Dispatch Details</h3>

              <div className="result-grid">
                <div>
                  <span>Service</span>
                  <strong>{activeResult.result?.emergency_type ?? "N/A"}</strong>
                </div>
                <div>
                  <span>Priority</span>
                  <strong>{activeResult.result?.priority ?? "N/A"}</strong>
                </div>
                <div>
                  <span>Chosen Algorithm</span>
                  <strong>{activeResult.result?.chosen_algorithm ?? "N/A"}</strong>
                </div>
                <div>
                  <span>Path</span>
                  <strong>
                    {(activeResult.result?.path ?? []).join(" → ") || "N/A"}
                  </strong>
                </div>
                <div>
                  <span>Estimated Time</span>
                  <strong>
                    {activeResult.result?.estimated_time_min != null
                      ? `${activeResult.result.estimated_time_min} min`
                      : "N/A"}
                  </strong>
                </div>
                <div>
                  <span>Route Cost / Distance</span>
                  <strong>
                    {activeResult.result?.total_cost != null
                      ? `${activeResult.result.total_cost} km`
                      : "N/A"}
                  </strong>
                </div>
                <div className="full-span">
                  <span>Selection Reason</span>
                  <strong>{activeResult.result?.selection_reason ?? "N/A"}</strong>
                </div>
                <div className="full-span">
                  <span>Recommended Action</span>
                  <strong>{activeResult.result?.recommended_action ?? "N/A"}</strong>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}