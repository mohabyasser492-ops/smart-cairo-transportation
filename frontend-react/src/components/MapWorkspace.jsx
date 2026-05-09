import { useMemo } from "react";
import RealMap from "./RealMap";
import { useMapData } from "../context/MapDataContext";

export default function MapWorkspace({
  panel,
  overlayRoutes = [],
  extraMarkers = [],
  selectedTime = "morning_peak",
  showTraffic = true,
  showExistingRoads = true,
  showPotentialRoads = false,
  selectedElement = null,
  onSelectNode,
  onSelectRoad,
}) {
  const {
    locations,
    existingRoads,
    potentialRoads,
    trafficLookup,
    loading,
    error,
  } = useMapData();

  const roadsToRender = useMemo(() => {
    const roads = [];

    if (showExistingRoads) {
      roads.push(...existingRoads);
    }

    if (showPotentialRoads) {
      roads.push(...potentialRoads);
    }

    return roads;
  }, [existingRoads, potentialRoads, showExistingRoads, showPotentialRoads]);

  return (
    <section className="workspace-layout">
      <div className="workspace-map">
        {error ? (
          <div className="error-box">{error}</div>
        ) : null}

        {loading ? (
          <div className="map-loading-card">
            <div className="map-loading-pulse" />
            <h3>Loading Cairo mobility network...</h3>
            <p>Please wait while the map data is prepared.</p>
          </div>
        ) : (
          <RealMap
            neighborhoods={locations.neighborhoods}
            facilities={locations.facilities}
            roads={roadsToRender}
            trafficLookup={showTraffic ? trafficLookup : new Map()}
            selectedTime={selectedTime}
            selectedElement={selectedElement}
            onSelectNode={onSelectNode}
            onSelectRoad={onSelectRoad}
            extraRoutes={overlayRoutes}
            extraMarkers={extraMarkers}
          />
        )}
      </div>

      <aside className="workspace-panel">
        {panel ?? (
          <div className="details-card">
            <p className="eyebrow">Workspace</p>
            <h2 className="workspace-panel-title">Smart Cairo</h2>
            <p className="workspace-panel-copy">
              Select a tool from the navigation to inspect routing, traffic,
              emergency dispatch, transit, and infrastructure scenarios.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}