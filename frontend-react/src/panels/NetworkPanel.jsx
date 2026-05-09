import { useMemo } from "react";

const timeOptions = [
  { value: "morning_peak", label: "Morning Peak" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening_peak", label: "Evening Peak" },
  { value: "night", label: "Night" },
];

function PanelStat({ label, value }) {
  return (
    <div className="panel-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="switch-row">
      <span>{label}</span>

      <input type="checkbox" checked={checked} onChange={onChange} />

      <i />
    </label>
  );
}

function TrafficLegend() {
  return (
    <div className="traffic-legend">
      <div>
        <span className="legend-line green" />
        <strong>Low</strong>
      </div>

      <div>
        <span className="legend-line yellow" />
        <strong>Medium</strong>
      </div>

      <div>
        <span className="legend-line orange" />
        <strong>High</strong>
      </div>

      <div>
        <span className="legend-line red" />
        <strong>Severe</strong>
      </div>
    </div>
  );
}

export default function NetworkPanel({
  selectedTime,
  onChangeTime,
  showTrafficOverlay,
  setShowTrafficOverlay,
  showExistingRoads,
  setShowExistingRoads,
  showPotentialRoads,
  setShowPotentialRoads,
  selectedElement,
  trafficFlow = [],
  mstData,
}) {
  const busiestRoad = useMemo(() => {
    if (!trafficFlow.length) return null;

    return [...trafficFlow].sort((a, b) => {
      const aValue = Number(a?.[selectedTime] ?? 0);
      const bValue = Number(b?.[selectedTime] ?? 0);

      return bValue - aValue;
    })[0];
  }, [trafficFlow, selectedTime]);

  function renderSelectedDetails() {
    if (!selectedElement) {
      return (
        <p className="workspace-panel-copy">
          Select a node or road on the map to inspect detailed information.
        </p>
      );
    }

    if (selectedElement.kind === "node") {
      const node = selectedElement.data;

      return (
        <div className="selected-details">
          <div>
            <span>Name</span>
            <strong>{node.name ?? "Unknown"}</strong>
          </div>

          <div>
            <span>Type</span>
            <strong>{node.type ?? node.category ?? node.kind ?? "Location"}</strong>
          </div>

          <div>
            <span>ID</span>
            <strong>{node.id ?? "N/A"}</strong>
          </div>

          <div>
            <span>Coordinates</span>
            <strong>
              {node.mapPosition
                ? `${node.mapPosition[0]}, ${node.mapPosition[1]}`
                : "N/A"}
            </strong>
          </div>
        </div>
      );
    }

    if (selectedElement.kind === "edge") {
      const road = selectedElement.data;

      return (
        <div className="selected-details">
          <div>
            <span>Road</span>
            <strong>
              {road.name ??
                `${road.fromNode?.name ?? "Unknown"} → ${
                  road.toNode?.name ?? "Unknown"
                }`}
            </strong>
          </div>

          <div>
            <span>Distance</span>
            <strong>{road.distance_km ?? road.length_km ?? "N/A"} km</strong>
          </div>

          <div>
            <span>Capacity</span>
            <strong>
              {road.capacity_vehicles_per_hour ??
                road.estimated_capacity_vehicles_per_hour ??
                "N/A"}
            </strong>
          </div>

          <div>
            <span>Road ID</span>
            <strong>{road.id ?? road.road_id ?? "N/A"}</strong>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="workspace-panel-stack">
      <section className="details-card hero-panel">
        <p className="eyebrow">Network Intelligence</p>
        <h1 className="workspace-panel-title">Network Map</h1>
        <p className="workspace-panel-copy">
          Control traffic overlays, road layers, and selected map elements from
          one smart panel.
        </p>
      </section>

      <section className="details-card">
        <h3>Map Controls</h3>

        <label className="control-label">
          Traffic Time
          <select value={selectedTime} onChange={onChangeTime}>
            {timeOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="switch-list">
          <ToggleRow
            label="Traffic Overlay"
            checked={showTrafficOverlay}
            onChange={() => setShowTrafficOverlay((value) => !value)}
          />

          <ToggleRow
            label="Existing Roads"
            checked={showExistingRoads}
            onChange={() => setShowExistingRoads((value) => !value)}
          />

          <ToggleRow
            label="Potential Roads"
            checked={showPotentialRoads}
            onChange={() => setShowPotentialRoads((value) => !value)}
          />
        </div>
      </section>

      <section className="details-card">
        <h3>Network Stats</h3>

        <div className="panel-stats-grid">
          <PanelStat label="Traffic Records" value={trafficFlow.length} />
          <PanelStat
            label="MST Edges"
            value={mstData?.selected_edges_count ?? "—"}
          />
          <PanelStat
            label="MST Distance"
            value={
              mstData?.total_distance_km != null
                ? `${mstData.total_distance_km} km`
                : "—"
            }
          />
          <PanelStat
            label="Connected"
            value={mstData?.connected == null ? "—" : mstData.connected ? "Yes" : "No"}
          />
        </div>
      </section>

      <section className="details-card">
        <h3>Traffic Legend</h3>
        <TrafficLegend />

        {busiestRoad ? (
          <div className="highlight-box">
            <span>Busiest road now</span>
            <strong>
              Road {busiestRoad.road_id ?? busiestRoad.id ?? "Unknown"}
            </strong>
            <p>
              Flow at selected time:{" "}
              {busiestRoad?.[selectedTime] ?? "N/A"} vehicles/hour
            </p>
          </div>
        ) : null}
      </section>

      <section className="details-card">
        <h3>Selected Element</h3>
        {renderSelectedDetails()}
      </section>
    </div>
  );
}