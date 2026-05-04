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
import { dataApi, transitApi } from "../api/client";

function formatNumber(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "N/A";
  return new Intl.NumberFormat("en-US").format(numeric);
}

function resolveNodeLabel(id, lookup) {
  return lookup[String(id)] || String(id);
}

export default function PublicTransit() {
  const [metroLines, setMetroLines] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  const [demandRecords, setDemandRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [facilities, setFacilities] = useState([]);

  const [allocationForm, setAllocationForm] = useState({
    available_buses: 100,
  });

  const [allocationResult, setAllocationResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingAllocation, setLoadingAllocation] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTransitData() {
      setLoading(true);
      setError("");

      try {
        const [
          metroData,
          busData,
          demandData,
          summaryData,
          neighborhoodsData,
          facilitiesData,
        ] = await Promise.all([
          dataApi.getMetroLines(),
          dataApi.getBusRoutes(),
          dataApi.getPublicTransportDemand(),
          dataApi.getSummary(),
          dataApi.getNeighborhoods(),
          dataApi.getFacilities(),
        ]);

        setMetroLines(metroData || []);
        setBusRoutes(busData || []);
        setDemandRecords(demandData || []);
        setSummary(summaryData || null);
        setNeighborhoods(neighborhoodsData || []);
        setFacilities(facilitiesData || []);
      } catch (err) {
        setError(err.message || "Could not load public transit dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadTransitData();
  }, []);

  function handleAllocationChange(event) {
    const { name, value } = event.target;

    setAllocationForm((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  }

  async function handleAllocateBuses(event) {
    event.preventDefault();

    setLoadingAllocation(true);
    setError("");
    setAllocationResult(null);

    try {
      const data = await transitApi.allocateBuses(allocationForm);
      setAllocationResult(data);
    } catch (err) {
      setError(err.message || "Could not allocate buses.");
    } finally {
      setLoadingAllocation(false);
    }
  }

  const nodeLookup = useMemo(() => {
    const lookup = {};

    neighborhoods.forEach((item) => {
      lookup[String(item.id)] = item.name;
    });

    facilities.forEach((item) => {
      lookup[String(item.id)] = item.name;
    });

    return lookup;
  }, [neighborhoods, facilities]);

  const totalMetroPassengers = useMemo(() => {
    return metroLines.reduce((sum, line) => sum + Number(line.daily_passengers || 0), 0);
  }, [metroLines]);

  const totalBusPassengers = useMemo(() => {
    return busRoutes.reduce((sum, route) => sum + Number(route.daily_passengers || 0), 0);
  }, [busRoutes]);

  const totalDemandPassengers = useMemo(() => {
    return demandRecords.reduce((sum, item) => sum + Number(item.daily_passengers || 0), 0);
  }, [demandRecords]);

  const busiestMetroLine = useMemo(() => {
    if (!metroLines.length) return null;
    return [...metroLines].sort(
      (a, b) => Number(b.daily_passengers || 0) - Number(a.daily_passengers || 0)
    )[0];
  }, [metroLines]);

  const busiestBusRoute = useMemo(() => {
    if (!busRoutes.length) return null;
    return [...busRoutes].sort(
      (a, b) => Number(b.daily_passengers || 0) - Number(a.daily_passengers || 0)
    )[0];
  }, [busRoutes]);

  const busiestDemandCorridor = useMemo(() => {
    if (!demandRecords.length) return null;
    return [...demandRecords].sort(
      (a, b) => Number(b.daily_passengers || 0) - Number(a.daily_passengers || 0)
    )[0];
  }, [demandRecords]);

  const metroChartData = useMemo(() => {
    return metroLines.map((line) => ({
      line: line.line_id,
      passengers: Number(line.daily_passengers || 0),
    }));
  }, [metroLines]);

  const busChartData = useMemo(() => {
    return busRoutes.map((route) => ({
      route: route.route_id,
      passengers: Number(route.daily_passengers || 0),
      buses: Number(route.buses_assigned || 0),
    }));
  }, [busRoutes]);

  const topDemandData = useMemo(() => {
    return [...demandRecords]
      .sort((a, b) => Number(b.daily_passengers || 0) - Number(a.daily_passengers || 0))
      .slice(0, 8)
      .map((item) => ({
        corridor: `${resolveNodeLabel(item.from, nodeLookup)} → ${resolveNodeLabel(
          item.to,
          nodeLookup
        )}`,
        passengers: Number(item.daily_passengers || 0),
      }));
  }, [demandRecords, nodeLookup]);

  const allocationRows = useMemo(() => {
    if (!allocationResult?.allocation) return [];

    return Object.entries(allocationResult.allocation).map(([routeId, routeData]) => ({
      route_id: routeId,
      ...routeData,
    }));
  }, [allocationResult]);

  const allocationChartData = useMemo(() => {
    return allocationRows.map((row) => ({
      route: row.route_id,
      allocated: Number(row.allocated_buses || 0),
      covered: Number(row.covered_demand || 0),
    }));
  }, [allocationRows]);

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">Transit Operations</p>
        <h1>Public Transit Dashboard</h1>
        <p>
          Explore metro lines, bus routes, public transport demand, and optimize
          bus allocation based on available fleet resources.
        </p>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading public transit dashboard data...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Metro Lines</span>
              <strong>{summary?.metro_lines_count ?? metroLines.length}</strong>
              <p>Urban rail corridors currently available in the dataset</p>
            </div>

            <div className="stat-card">
              <span>Bus Routes</span>
              <strong>{summary?.bus_routes_count ?? busRoutes.length}</strong>
              <p>Bus network routes included in the dashboard</p>
            </div>

            <div className="stat-card">
              <span>Total Metro Passengers</span>
              <strong>{formatNumber(totalMetroPassengers)}</strong>
              <p>Combined daily passenger volume across all metro lines</p>
            </div>

            <div className="stat-card">
              <span>Total Bus Passengers</span>
              <strong>{formatNumber(totalBusPassengers)}</strong>
              <p>Combined daily passenger volume across all bus routes</p>
            </div>
          </div>

          <div className="prediction-section">
            <div className="prediction-section-header">
              <h2>Metro Overview</h2>
              <p>Review metro line capacity, station sequences, and daily passenger load.</p>
            </div>

            <div className="comparison-grid" style={{ marginBottom: "24px" }}>
              <div className="result-card">
                <h3>Metro Summary</h3>

                <div className="result-grid">
                  <div>
                    <span>Total Lines</span>
                    <strong>{metroLines.length}</strong>
                  </div>

                  <div>
                    <span>Total Daily Passengers</span>
                    <strong>{formatNumber(totalMetroPassengers)}</strong>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <span>Busiest Metro Line</span>
                    <strong>
                      {busiestMetroLine
                        ? `${busiestMetroLine.line_id} — ${busiestMetroLine.name} (${formatNumber(
                            busiestMetroLine.daily_passengers
                          )})`
                        : "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="transit-list" style={{ marginTop: "18px" }}>
                  {metroLines.map((line) => (
                    <div key={line.line_id} className="transit-item">
                      <div>
                        <strong>{line.name}</strong>
                        <div className="segment-subtext">
                          {line.line_id} • {(line.stations || []).length} stations
                        </div>
                      </div>

                      <div className="transit-metrics">
                        <span>{formatNumber(line.daily_passengers)} / day</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-card">
                <h3>Metro Daily Passengers</h3>

                {metroChartData.length ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={metroChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="line" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="passengers" name="Daily Passengers" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">No metro chart data available.</div>
                )}
              </div>
            </div>
          </div>

          <div className="prediction-section">
            <div className="prediction-section-header">
              <h2>Bus Routes Overview</h2>
              <p>Compare bus route usage, assigned fleet size, and route stop coverage.</p>
            </div>

            <div className="comparison-grid" style={{ marginBottom: "24px" }}>
              <div className="result-card">
                <h3>Bus Summary</h3>

                <div className="result-grid">
                  <div>
                    <span>Total Routes</span>
                    <strong>{busRoutes.length}</strong>
                  </div>

                  <div>
                    <span>Total Daily Passengers</span>
                    <strong>{formatNumber(totalBusPassengers)}</strong>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <span>Busiest Bus Route</span>
                    <strong>
                      {busiestBusRoute
                        ? `${busiestBusRoute.route_id} (${formatNumber(
                            busiestBusRoute.daily_passengers
                          )})`
                        : "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="transit-list" style={{ marginTop: "18px" }}>
                  {busRoutes.map((route) => (
                    <div key={route.route_id} className="transit-item">
                      <div>
                        <strong>{route.route_id}</strong>
                        <div className="segment-subtext">
                          {(route.stops || []).length} stops • {route.buses_assigned} buses
                        </div>
                      </div>

                      <div className="transit-metrics">
                        <span>{formatNumber(route.daily_passengers)} / day</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-card">
                <h3>Bus Route Demand</h3>

                {busChartData.length ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={busChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="route" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="passengers" name="Daily Passengers" />
                      <Bar dataKey="buses" name="Buses Assigned" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">No bus chart data available.</div>
                )}
              </div>
            </div>

            <div className="result-card" style={{ marginBottom: "24px" }}>
              <h3>Bus Route Details</h3>

              <div className="transit-grid">
                {busRoutes.map((route) => (
                  <div key={route.route_id} className="details-card">
                    <h4>{route.route_id}</h4>

                    <div className="result-grid">
                      <div>
                        <span>Buses Assigned</span>
                        <strong>{route.buses_assigned}</strong>
                      </div>

                      <div>
                        <span>Stops Count</span>
                        <strong>{(route.stops || []).length}</strong>
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <span>Daily Passengers</span>
                        <strong>{formatNumber(route.daily_passengers)}</strong>
                      </div>
                    </div>

                    <div className="feature-names-box" style={{ marginTop: "16px" }}>
                      {(route.stops || []).map((stopId) => (
                        <span key={`${route.route_id}-${stopId}`} className="feature-chip">
                          {resolveNodeLabel(stopId, nodeLookup)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="prediction-section">
            <div className="prediction-section-header">
              <h2>Public Transport Demand Insights</h2>
              <p>
                Inspect the busiest travel corridors and understand where daily transit
                demand is concentrated.
              </p>
            </div>

            <div className="comparison-grid" style={{ marginBottom: "24px" }}>
              <div className="result-card">
                <h3>Demand Summary</h3>

                <div className="result-grid">
                  <div>
                    <span>Demand Records</span>
                    <strong>
                      {summary?.public_transport_demand_records_count ?? demandRecords.length}
                    </strong>
                  </div>

                  <div>
                    <span>Total Demand Passengers</span>
                    <strong>{formatNumber(totalDemandPassengers)}</strong>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <span>Busiest Corridor</span>
                    <strong>
                      {busiestDemandCorridor
                        ? `${resolveNodeLabel(
                            busiestDemandCorridor.from,
                            nodeLookup
                          )} → ${resolveNodeLabel(
                            busiestDemandCorridor.to,
                            nodeLookup
                          )} (${formatNumber(busiestDemandCorridor.daily_passengers)})`
                        : "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="transit-list" style={{ marginTop: "18px" }}>
                  {[...demandRecords]
                    .sort((a, b) => Number(b.daily_passengers || 0) - Number(a.daily_passengers || 0))
                    .slice(0, 10)
                    .map((item, index) => (
                      <div key={`${item.from}-${item.to}-${index}`} className="transit-item">
                        <div>
                          <strong>
                            {resolveNodeLabel(item.from, nodeLookup)} →{" "}
                            {resolveNodeLabel(item.to, nodeLookup)}
                          </strong>
                          <div className="segment-subtext">
                            Origin-Destination demand pair
                          </div>
                        </div>

                        <div className="transit-metrics">
                          <span>{formatNumber(item.daily_passengers)} / day</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="result-card">
                <h3>Top Demand Corridors</h3>

                {topDemandData.length ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={topDemandData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="corridor" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="passengers" name="Daily Passengers" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">No demand chart data available.</div>
                )}
              </div>
            </div>
          </div>

          <div className="prediction-section">
            <div className="prediction-section-header">
              <h2>Bus Allocation Optimizer</h2>
              <p>
                Allocate available buses across routes using dynamic programming to
                maximize covered demand.
              </p>
            </div>

            <div className="prediction-layout">
              <form className="form-card prediction-form-card" onSubmit={handleAllocateBuses}>
                <h3>Allocation Inputs</h3>

                <label>
                  Available Buses
                  <input
                    type="number"
                    name="available_buses"
                    value={allocationForm.available_buses}
                    onChange={handleAllocationChange}
                  />
                </label>

                <div className="button-row">
                  <button type="submit" disabled={loadingAllocation}>
                    {loadingAllocation ? "Allocating..." : "Optimize Bus Allocation"}
                  </button>
                </div>
              </form>

              <div className="result-card prediction-result-card">
                <h3>Allocation Result</h3>

                {!allocationResult ? (
                  <div className="empty-state prediction-empty-state">
                    Run bus allocation to see how the available fleet should be
                    distributed across routes.
                  </div>
                ) : (
                  <>
                    <div className="result-grid">
                      <div>
                        <span>Algorithm</span>
                        <strong>{allocationResult.algorithm ?? "N/A"}</strong>
                      </div>

                      <div>
                        <span>Available Buses</span>
                        <strong>{allocationResult.available_buses ?? "N/A"}</strong>
                      </div>

                      <div>
                        <span>Routes Count</span>
                        <strong>{allocationResult.routes_count ?? "N/A"}</strong>
                      </div>

                      <div>
                        <span>Total Demand</span>
                        <strong>{formatNumber(allocationResult.total_demand)}</strong>
                      </div>

                      <div>
                        <span>Covered Demand</span>
                        <strong>{formatNumber(allocationResult.covered_demand)}</strong>
                      </div>

                      <div>
                        <span>Covered Demand %</span>
                        <strong>{allocationResult.covered_demand_percentage ?? "N/A"}%</strong>
                      </div>

                      <div>
                        <span>Unused Buses</span>
                        <strong>{allocationResult.unused_buses ?? "N/A"}</strong>
                      </div>
                    </div>

                    <div className="details-card prediction-subcard">
                      <h4>Allocation Chart</h4>

                      {allocationChartData.length ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={allocationChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="route" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="allocated" name="Allocated Buses" />
                            <Bar dataKey="covered" name="Covered Demand" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="empty-state">No allocation chart data available.</div>
                      )}
                    </div>

                    <div className="details-card prediction-subcard">
                      <h4>Per-Route Allocation</h4>

                      {!allocationRows.length ? (
                        <div className="empty-state">No allocation rows available.</div>
                      ) : (
                        <div className="transit-list">
                          {allocationRows.map((row) => (
                            <div key={row.route_id} className="transit-item">
                              <div>
                                <strong>{row.route_id}</strong>
                                <div className="segment-subtext">
                                  {row.route_name || row.route_id}
                                </div>
                              </div>

                              <div className="transit-metrics">
                                <span>Allocated: {row.allocated_buses}</span>
                                <span>Demand: {formatNumber(row.route_demand)}</span>
                                <span>Covered: {formatNumber(row.covered_demand)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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