import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { dataApi, networkApi } from "../api/client";
import RealMap from "../components/RealMap";
import {
  buildLocationCollections,
  normalizeRoads,
} from "../utils/mapAdapters";
import { pageTransition, resultReveal } from "../ui/motion";

export default function NetworkMap() {
  const [neighborhoodsRaw, setNeighborhoodsRaw] = useState([]);
  const [facilitiesRaw, setFacilitiesRaw] = useState([]);
  const [existingRoadsRaw, setExistingRoadsRaw] = useState([]);
  const [potentialRoadsRaw, setPotentialRoadsRaw] = useState([]);
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

        setNeighborhoodsRaw(Array.isArray(neighborhoodsData) ? neighborhoodsData : []);
        setFacilitiesRaw(Array.isArray(facilitiesData) ? facilitiesData : []);
        setExistingRoadsRaw(Array.isArray(existingRoadsData) ? existingRoadsData : []);
        setPotentialRoadsRaw(Array.isArray(potentialRoadsData) ? potentialRoadsData : []);
        setTrafficFlow(Array.isArray(trafficFlowData) ? trafficFlowData : []);

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

  const locationCollections = useMemo(() => {
    return buildLocationCollections(neighborhoodsRaw, facilitiesRaw);
  }, [neighborhoodsRaw, facilitiesRaw]);

  const visibleNeighborhoods = useMemo(() => {
    return showNeighborhoods ? locationCollections.neighborhoods : [];
  }, [locationCollections.neighborhoods, showNeighborhoods]);

  const visibleFacilities = useMemo(() => {
    return showFacilities ? locationCollections.facilities : [];
  }, [locationCollections.facilities, showFacilities]);

  const normalizedExistingRoads = useMemo(() => {
    const rows = normalizeRoads(
      existingRoadsRaw,
      locationCollections.idLookup
    );

    return showExistingRoads ? rows : [];
  }, [existingRoadsRaw, locationCollections.idLookup, showExistingRoads]);

  const normalizedPotentialRoads = useMemo(() => {
    const rows = normalizeRoads(
      potentialRoadsRaw,
      locationCollections.idLookup
    );

    return showPotentialRoads ? rows : [];
  }, [potentialRoadsRaw, locationCollections.idLookup, showPotentialRoads]);

  const trafficLookup = useMemo(() => {
    const lookup = new Map();
    trafficFlow.forEach((record) => {
      const key = String(record.road_id ?? record.id ?? "");
      lookup.set(key, record);
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
          roadId: record.road_id ?? record.id,
          value,
        };
      }
    });

    return best;
  }, [trafficFlow, selectedTime]);

  const stats = useMemo(() => {
    return {
      neighborhoodsCount: neighborhoodsRaw.length,
      facilitiesCount: facilitiesRaw.length,
      existingRoadsCount: existingRoadsRaw.length,
      potentialRoadsCount: potentialRoadsRaw.length,
      mstEdgesCount: mstData?.selected_edges_count ?? 0,
      mstTotalDistance: mstData?.total_distance_km ?? "N/A",
    };
  }, [
    neighborhoodsRaw.length,
    facilitiesRaw.length,
    existingRoadsRaw.length,
    potentialRoadsRaw.length,
    mstData,
  ]);

  function renderSelectedDetails() {
    if (!selectedElement) {
      return (
        <div className="empty-state">
          Select a node or road on the map to inspect its details.
        </div>
      );
    }

    if (selectedElement.kind === "node") {
      const node = selectedElement.data;

      return (
        <motion.div className="details-card" {...resultReveal}>
          <h3>Location Details</h3>
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
              <strong>{node.kind ?? node.category ?? "N/A"}</strong>
            </div>
            <div>
              <span>Population</span>
              <strong>{node.population ?? "N/A"}</strong>
            </div>
            <div>
              <span>X Coordinate</span>
              <strong>{node.x ?? "N/A"}</strong>
            </div>
            <div>
              <span>Y Coordinate</span>
              <strong>{node.y ?? "N/A"}</strong>
            </div>
          </div>
        </motion.div>
      );
    }

    if (selectedElement.kind === "edge") {
      const edge = selectedElement.data;
      const edgeId = edge.id ?? edge.road_id;
      const selectedTraffic = trafficLookup.get(String(edgeId))?.[selectedTime] ?? null;

      return (
        <motion.div className="details-card" {...resultReveal}>
          <h3>Road Details</h3>
          <div className="result-grid">
            <div>
              <span>Road ID</span>
              <strong>{edgeId ?? "N/A"}</strong>
            </div>
            <div>
              <span>Road Category</span>
              <strong>{edge.roadCategory ?? "existing"}</strong>
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
              <strong>{edge.distance_km ?? edge.distance ?? "N/A"} km</strong>
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
              <span>Traffic ({selectedTime.replace("_", " ")})</span>
              <strong>{selectedTraffic ?? "N/A"}</strong>
            </div>
            <div>
              <span>Construction Cost</span>
              <strong>
                {edge.construction_cost_million_egp ?? "N/A"}
                {edge.construction_cost_million_egp != null ? " million EGP" : ""}
              </strong>
            </div>
            <div>
              <span>Connectivity Overlay</span>
              <strong>{edge.isMstEdge ? "Included" : "Not included"}</strong>
            </div>
          </div>
        </motion.div>
      );
    }

    return null;
  }

  return (
    <motion.div className="page-enter" {...pageTransition}>
      <div className="page-header">
        <p className="eyebrow">Network Intelligence</p>
        <h1>Network Map</h1>
        <p>
          Explore neighborhoods, facilities, road corridors, traffic conditions,
          and connectivity overlays in one interactive real-map view.
        </p>
      </div>

      {loading ? (
        <div className="placeholder-panel">Loading network intelligence...</div>
      ) : error ? (
        <div className="error-box">{error}</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Neighborhoods</span>
              <strong>{stats.neighborhoodsCount}</strong>
              <p>
                Residential, mixed-use, business, industrial, and civic areas
              </p>
            </div>
            <div className="stat-card">
              <span>Facilities</span>
              <strong>{stats.facilitiesCount}</strong>
              <p>Hospitals, transit hubs, airport, education, and key services</p>
            </div>
            <div className="stat-card">
              <span>Existing Roads</span>
              <strong>{stats.existingRoadsCount}</strong>
              <p>Current road network connections across the platform</p>
            </div>
            <div className="stat-card">
              <span>Potential Roads</span>
              <strong>{stats.potentialRoadsCount}</strong>
              <p>Expansion candidates available for infrastructure planning</p>
            </div>
          </div>

          <div className="map-controls-grid">
            <div className="form-card">
              <h3>Display Layers</h3>
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
                  Connectivity Overlay
                </label>
              </div>
            </div>

            <div className="form-card">
              <h3>Traffic Window</h3>
              <label>
                Select Time Window
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
                <span>Busiest Corridor</span>
                <strong>{busiestRoad?.roadId ?? "N/A"}</strong>
                <p>
                  {busiestRoad
                    ? `${busiestRoad.value} vehicles/hour during ${selectedTime.replace(
                        "_",
                        " "
                      )}`
                    : "No traffic data is available for the selected window."}
                </p>
              </div>
            </div>

            <div className="details-card">
              <h3>Legend</h3>
              <div className="legend-list">
                <div className="legend-item">
                  <span className="legend-swatch" style={{ background: "#2563eb" }} />
                  Residential / Mixed / Civic Nodes
                </div>
                <div className="legend-item">
                  <span className="legend-swatch" style={{ background: "#8b5cf6" }} />
                  Facilities
                </div>
                <div className="legend-item">
                  <span className="legend-line existing"></span>
                  Low Traffic Road
                </div>
                <div className="legend-item">
                  <span className="legend-line" style={{ borderTopColor: "#eab308" }}></span>
                  Medium Traffic Road
                </div>
                <div className="legend-item">
                  <span className="legend-line" style={{ borderTopColor: "#f97316" }}></span>
                  High Traffic Road
                </div>
                <div className="legend-item">
                  <span className="legend-line" style={{ borderTopColor: "#dc2626" }}></span>
                  Severe Traffic Road
                </div>
              </div>
            </div>
          </div>

          <div className="network-map-layout">
            <div className="map-panel">
              <RealMap
                neighborhoods={visibleNeighborhoods}
                facilities={visibleFacilities}
                roads={showTrafficOverlay ? normalizedExistingRoads : normalizedExistingRoads}
                trafficLookup={showTrafficOverlay ? trafficLookup : new Map()}
                selectedTime={selectedTime}
                selectedElement={selectedElement}
                onSelectNode={(node) => setSelectedElement({ kind: "node", data: node })}
                onSelectRoad={(edge) =>
                  setSelectedElement({
                    kind: "edge",
                    data: {
                      ...edge,
                      roadCategory: "existing",
                    },
                  })
                }
                extraRoutes={[]}
              />

              {showPotentialRoads && normalizedPotentialRoads.length > 0 && (
                <div className="details-card">
                  <h3>Potential Roads Loaded</h3>
                  <p>
                    {normalizedPotentialRoads.length} potential road segments were normalized
                    successfully. We are not drawing them yet in this step because we are
                    first stabilizing the real-map renderer for the live network and traffic
                    data.
                  </p>
                </div>
              )}
            </div>

            <div className="details-panel">
              {renderSelectedDetails()}

              <div className="details-card">
                <h3>Connectivity Summary</h3>

                {!mstData ? (
                  <div className="empty-state">
                    Connectivity overlay data is not available right now.
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
    </motion.div>
  );
}