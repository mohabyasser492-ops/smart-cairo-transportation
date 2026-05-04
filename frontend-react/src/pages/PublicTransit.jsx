import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { routingApi } from "../api/client";
import { useLocationOptions } from "../hooks/useLocationOptions";
import { pageTransition, resultReveal, buttonMotion } from "../ui/motion";

const transitPreferences = [
  { value: "fastest", label: "Fastest Route" },
  { value: "fewest_transfers", label: "Fewest Transfers" },
  { value: "cheapest", label: "Cheapest Fare" },
];

export default function PublicTransit() {
  const { options: locations, loading: loadingLocations, error: locationsError } =
    useLocationOptions({ includeFacilities: true });

  const [form, setForm] = useState({
    source: "",
    destination: "",
    preference: "fastest",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!locations.length) return;
    setForm((previous) => ({
      ...previous,
      source: previous.source || locations[0]?.value || "",
      destination: previous.destination || locations[1]?.value || locations[0]?.value || "",
    }));
  }, [locations]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await routingApi.publicTransitRoute(form);
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not load public transit route.");
    } finally {
      setLoading(false);
    }
  }

  const path = result?.path || [];
  const transfers = result?.transfers ?? "N/A";
  const estimatedTime = result?.estimated_time_min ?? "N/A";
  const estimatedCost = result?.estimated_cost_egp ?? "N/A";
  const mainMode = result?.primary_transit_mode ?? "Mixed";

  return (
    <motion.div {...pageTransition}>
      <div className="page-header">
        <p className="eyebrow">Transit Network</p>
        <h1>Public Transit Routing</h1>
        <p>
          Find the optimal multi-modal public transportation routes across the city network.
        </p>
      </div>

      {(error || locationsError) && <div className="error-box">{error || locationsError}</div>}

      <div className="planner-layout">
        <div className="form-card">
          <h3>Transit Inputs</h3>
          <form onSubmit={handleSubmit}>
            <label>
              Source
              <select name="source" value={form.source} onChange={handleChange} disabled={loadingLocations}>
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
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
                disabled={loadingLocations}
              >
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Routing Preference
              <select name="preference" value={form.preference} onChange={handleChange}>
                {transitPreferences.map((pref) => (
                  <option key={pref.value} value={pref.value}>
                    {pref.label}
                  </option>
                ))}
              </select>
            </label>

            <motion.button {...buttonMotion} type="submit" disabled={loading || loadingLocations}>
              {loading ? "Searching..." : "Find Transit Route"}
            </motion.button>
          </form>
        </div>

        <motion.div className="result-card" {...resultReveal}>
          <h3>Journey Summary</h3>
          {!result ? (
            <div className="empty-state">
              Search for a route to see transit modes, estimated times, and transfer details.
            </div>
          ) : (
            <>
              <div className="result-grid">
                <div>
                  <span>Route</span>
                  <strong>{path.length ? path.join(" → ") : "N/A"}</strong>
                </div>
                <div>
                  <span>Primary Mode</span>
                  <strong>{mainMode}</strong>
                </div>
                <div>
                  <span>Total Transfers</span>
                  <strong>{transfers}</strong>
                </div>
                <div>
                  <span>Estimated Time</span>
                  <strong>{estimatedTime !== "N/A" ? `${estimatedTime} min` : "N/A"}</strong>
                </div>
                <div>
                  <span>Estimated Cost</span>
                  <strong>{estimatedCost !== "N/A" ? `${estimatedCost} EGP` : "N/A"}</strong>
                </div>
                <div>
                  <span>Preference Applied</span>
                  <strong>{result.preference_applied ?? form.preference}</strong>
                </div>
              </div>

              {!!result.services_used?.length && (
                <div className="optimizer-subcard">
                  <h4>Services Used</h4>
                  <div className="segments-list">
                    {result.services_used.map((service) => (
                      <div key={`${service.mode}-${service.service_id}`} className="segment-item">
                        <div>
                          <strong>{service.name}</strong>
                          <div className="segment-subtext">Service ID: {service.service_id}</div>
                        </div>
                        <div className="segment-metrics">
                          <span>{service.mode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}