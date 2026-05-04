import { useEffect, useMemo, useState } from "react";
import { dataApi, networkApi } from "../api/client";
import GraphMap from "../components/GraphMap";

export default function NetworkMap() {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [existingRoads, setExistingRoads] = useState([]);
  const [potentialRoads, setPotentialRoads] = useState([]);
  const [trafficFlow, setTrafficFlow] = useState([]);
  const [mstData, setMstData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTime, setSelectedTime] = useState("morning_peak");
  const [selectedElement, setSelectedElement] = useState(null);

  const [showNeighborhoods, setShowNeighborhoods] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showExistingRoads, setShowExistingRoads] = useState(true);
  const [showPotentialRoads, setShowPotentialRoads] = useState(false);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);
  const [showMstOverlay, setShowMstOverlay] = useState(false);

  useEffect(() => {
    async function loadMapData() {
      setLoading(true);
      setError("");

      try {
        const [
          neighborhoodsData,
          facilitiesData,
          existingRoadsData,
          potentialRoadsData,
          trafficFlowData,
        ] = await Promise.all([
          dataApi.getNeighborhoods(),
          dataApi.getFacilities(),
          dataApi.getExistingRoads(),
          dataApi.getPotentialRoads(),
          dataApi.getTrafficFlow(),
        ]);

        setNeighborhoods(neighborhoodsData || []);
        setFacilities(facilitiesData || []);
        setExistingRoads(existingRoadsData || []);
        setPotentialRoads(potentialRoadsData || []);
        setTrafficFlow(trafficFlowData || []);

        try {
          const mst = await networkApi.getMinimumSpanningTree();
          setMstData(mst);
        } catch (mstError) {
          console.warn("MST overlay could not be loaded:", mstError.message);
          setMstData(null);
        }
      } catch (err) {
        setError(err.message || "Could not load network map data.");
      } finally {
        setLoading(false);
      }
    }

    loadMapData();
  }, []);

  const trafficLookup = useMemo(() => {
    const lookup = {};

    trafficFlow.forEach((record) => {
      lookup[record.road_id] = record;
    });

    return lookup;
  }, [trafficFlow]);

  const busiestRoad = useMemo(() => {
    if (!trafficFlow.length) return null;

    let best = null;

    trafficFlow.forEach((record) => {
      const value = Number(record[selectedTime] ?? 0);

      if (!best || value > best.value) {
        best = {
          roadId: record.road_id,
          value,
        };
      }
    });

    return best;
  }, [trafficFlow, selectedTime]);

  const stats = useMemo(() => {
    return {
      neighborhoodsCount: neighborhoods.length,
      facilitiesCount: facilities.length,
      existingRoadsCount: existingRoads.length,
      potentialRoadsCount: potentialRoads.length,
      mstEdgesCount: mstData?.selected_edges_count ?? 0,
      mstTotalDistance: mstData?.total_distance_km ?? "N/A",
    };
  }, [neighborhoods, facilities, existingRoads, potentialRoads, mstData]);

  function renderSelectedDetails() {
    if (!selectedElement) {
      return (
        <div className="empty-state">
          Click a node or road on the map to see its details here.
        </div>
      );
    }

    if (selectedElement.kind === "node") {
      const node = selectedElement.data;

      return (
        <div className="details-card">
          <h3>Node Details</h3>

          <div className="result-grid">
            <div>
              <span>Name</span>
              <strong>{node.name}</strong>
            </div>

            <div>
              <span>Type</span>
              <strong>{node.type ?? "N/A"}</strong>
            </div>

            <div>
              <span>Category</span>
              <strong>{node.category ?? "N/A"}</strong>
            </div>

            <div>
              <span>Population</span>
              <strong>{node.population ?? "N/A"}</strong>
            </div>

            <div>
              <span>X Coordinate</span>
              <strong>{node.x}</strong>
            </div>

            <div>
              <span>Y Coordinate</span>
              <strong>{node.y}</strong>
            </div>
          </div>
        </div>
      );
    }

    if (selectedElement.kind === "edge") {
      const edge = selectedElement.data;
      const selectedTraffic =
        edge.roadCategory === "existing"
          ? trafficLookup[edge.id]?.[selectedTime]
          : null;

      return (
        <div className="details-card">
          <h3>Road Details</h3>

          <div className="result-grid">
            <div>
              <span>Road ID</span>
              <strong>{edge.id ?? edge.road_id ?? "N/A"}</strong>
            </div>

            <div>
              <span>Road Category</span>
              <strong>{edge.roadCategory ?? "N/A"}</strong>
            </div>

            <div>
              <span>From</span>
              <strong>{edge.fromNode?.name ?? "N/A"}</strong>
            </div>

            <div>
              <span>To</span>
              <strong>{edge.toNode?.name ?? "N/A"}</strong>
            </div>

            <div>
              <span>Distance</span>
              <strong>{edge.distance_km ?? "N/A"} km</strong>
            </div>

            <div>
              <span>Condition</span>
              <strong>{edge.condition ?? "N/A"}</strong>
            </div>

            <div>
              <span>Capacity</span>
              <strong>
                {edge.capacity_vehicles_per_hour ??
                  edge.estimated_capacity_vehicles_per_hour ??
                  "N/A"}
              </strong>
            </div>

            <div>
              <span>Traffic ({selectedTime})</span>
              <strong>{selectedTraffic ?? "N/A"}</strong>
            </div>

            <div>
              <span>Construction Cost</span>
              <strong>
                {edge.construction_cost_million_egp ?? "N/A"}
                {edge.construction_cost_million_egp != null
                  ? " million EGP"
                  : ""}
              </strong>
            </div>

            <div>
              <span>MST Edge</span>
              <strong>{edge.isMstEdge ? "Yes" : "No"}</strong>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">Visualization</p>
        <h1>Network Map</h1>
        <p>
          Explore Cairo neighborhoods, facilities, existing roads, potential
          roads, traffic intensity, and the minimum spanning tree overlay in one
          interactive map.
        </p>
      </div>

      {loading ? (
        <div className="empty-state">Loading network map data...</div>
      ) : error ? (
        <div className="error-box">{error}</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Neighborhoods</span>
              <strong>{stats.neighborhoodsCount}</strong>
              <p>Residential, mixed, business, industrial, and government areas</p>
            </div>

            <div className="stat-card">
              <span>Facilities</span>
              <strong>{stats.facilitiesCount}</strong>
              <p>Airport, hospitals, transit hubs, education, and more</p>
            </div>

            <div className="stat-card">
              <span>Existing Roads</span>
              <strong>{stats.existingRoadsCount}</strong>
              <p>Current transportation network links</p>
            </div>

            <div className="stat-card">
              <span>Potential Roads</span>
              <strong>{stats.potentialRoadsCount}</strong>
              <p>Possible future expansion links</p>
            </div>
          </div>

          <div className="map-controls-grid">
            <div className="form-card">
              <h3>Map Layers</h3>

              <div className="toggle-list">
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={showNeighborhoods}
                    onChange={() => setShowNeighborhoods((prev) => !prev)}
                  />
                  Neighborhoods
                </label>

                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={showFacilities}
                    onChange={() => setShowFacilities((prev) => !prev)}
                  />
                  Facilities
                </label>

                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={showExistingRoads}
                    onChange={() => setShowExistingRoads((prev) => !prev)}
                  />
                  Existing Roads
                </label>

                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={showPotentialRoads}
                    onChange={() => setShowPotentialRoads((prev) => !prev)}
                  />
                  Potential Roads
                </label>

                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={showTrafficOverlay}
                    onChange={() => setShowTrafficOverlay((prev) => !prev)}
                  />
                  Traffic Overlay
                </label>

                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={showMstOverlay}
                    onChange={() => setShowMstOverlay((prev) => !prev)}
                  />
                  MST Overlay
                </label>
              </div>
            </div>

            <div className="form-card">
              <h3>Traffic Time Period</h3>

              <label>
                Select Time Period
                <select
                  value={selectedTime}
                  onChange={(event) => setSelectedTime(event.target.value)}
                >
                  <option value="morning_peak">Morning Peak</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening_peak">Evening Peak</option>
                  <option value="night">Night</option>
                </select>
              </label>

              <div className="traffic-highlight-box">
                <span>Busiest Road</span>
                <strong>{busiestRoad?.roadId ?? "N/A"}</strong>
                <p>
                  {busiestRoad
                    ? `${busiestRoad.value} vehicles/hour during ${selectedTime.replace(
                        "_",
                        " "
                      )}`
                    : "No traffic data available."}
                </p>
              </div>
            </div>

            <div className="form-card">
              <h3>Legend</h3>

              <div className="legend-list">
                <div className="legend-item">
                  <span
                    className="legend-swatch"
                    style={{ background: "#2563eb" }}
                  />
                  Residential Neighborhood
                </div>

                <div className="legend-item">
                  <span
                    className="legend-swatch"
                    style={{ background: "#16a34a" }}
                  />
                  Mixed Neighborhood
                </div>

                <div className="legend-item">
                  <span
                    className="legend-swatch"
                    style={{ background: "#7c3aed" }}
                  />
                  Business / Education / Business Facility
                </div>

                <div className="legend-item">
                  <span
                    className="legend-swatch"
                    style={{ background: "#dc2626" }}
                  />
                  Government
                </div>

                <div className="legend-item">
                  <span
                    className="legend-swatch"
                    style={{ background: "#ec4899" }}
                  />
                  Medical Facility
                </div>

                <div className="legend-item">
                  <span className="legend-line existing" />
                  Existing Road
                </div>

                <div className="legend-item">
                  <span className="legend-line potential" />
                  Potential Road
                </div>

                <div className="legend-item">
                  <span className="legend-line mst" />
                  MST Overlay
                </div>
              </div>
            </div>
          </div>

          <div className="network-map-layout">
            <div className="map-panel">
              <GraphMap
                neighborhoods={neighborhoods}
                facilities={facilities}
                existingRoads={existingRoads}
                potentialRoads={potentialRoads}
                trafficFlow={trafficFlow}
                mstData={mstData}
                selectedTime={selectedTime}
                showNeighborhoods={showNeighborhoods}
                showFacilities={showFacilities}
                showExistingRoads={showExistingRoads}
                showPotentialRoads={showPotentialRoads}
                showTrafficOverlay={showTrafficOverlay}
                showMstOverlay={showMstOverlay}
                selectedElement={selectedElement}
                onSelectNode={(node) =>
                  setSelectedElement({ kind: "node", data: node })
                }
                onSelectEdge={(edge) =>
                  setSelectedElement({ kind: "edge", data: edge })
                }
              />
            </div>

            <div className="details-panel">
              {renderSelectedDetails()}

              <div className="details-card">
                <h3>MST Summary</h3>

                {!mstData ? (
                  <div className="empty-state">
                    MST data is not available right now.
                  </div>
                ) : (
                  <div className="result-grid">
                    <div>
                      <span>Connected</span>
                      <strong>{mstData.connected ? "Yes" : "No"}</strong>
                    </div>

                    <div>
                      <span>Nodes Count</span>
                      <strong>{mstData.nodes_count ?? "N/A"}</strong>
                    </div>

                    <div>
                      <span>Selected Edges</span>
                      <strong>{mstData.selected_edges_count ?? "N/A"}</strong>
                    </div>

                    <div>
                      <span>Total Distance</span>
                      <strong>
                        {mstData.total_distance_km ?? "N/A"}
                        {mstData.total_distance_km != null ? " km" : ""}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}