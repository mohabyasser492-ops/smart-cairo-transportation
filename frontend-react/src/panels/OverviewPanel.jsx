import { NavLink } from "react-router-dom";
import { useMapData } from "../context/MapDataContext";

const modules = [
  {
    path: "/network-map",
    title: "Network Map",
    description: "Inspect neighborhoods, facilities, roads, and traffic flow.",
    icon: "🗺️",
  },
  {
    path: "/route-planner",
    title: "Route Planner",
    description: "Plan traffic-aware routes across Cairo.",
    icon: "🧭",
  },
  {
    path: "/emergency-routing",
    title: "Emergency Dispatch",
    description: "Compare ambulance, police, and fire-truck response routes.",
    icon: "🚨",
  },
  {
    path: "/traffic-prediction",
    title: "Traffic AI",
    description: "Predict road and route congestion conditions.",
    icon: "🤖",
  },
  {
    path: "/traffic-signals",
    title: "Signals",
    description: "Optimize intersections and review congestion hotspots.",
    icon: "🚦",
  },
  {
    path: "/infrastructure-optimizer",
    title: "Infrastructure",
    description: "Plan expansion and maintenance decisions.",
    icon: "🏗️",
  },
  {
    path: "/public-transit",
    title: "Public Transit",
    description: "Plan multimodal trips and bus allocation.",
    icon: "🚌",
  },
  {
    path: "/algorithm-race",
    title: "Performance",
    description: "Compare Dijkstra and A* routing performance.",
    icon: "⚡",
  },
];

function MiniStat({ label, value }) {
  return (
    <div className="mini-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function OverviewPanel() {
  const {
    neighborhoodsRaw,
    facilitiesRaw,
    existingRoadsRaw,
    potentialRoadsRaw,
    trafficFlow,
    mstData,
  } = useMapData();

  return (
    <div className="workspace-panel-stack">
      <section className="details-card hero-panel">
        <p className="eyebrow">Operations Overview</p>
        <h1 className="workspace-panel-title">Smart Cairo Workspace</h1>
        <p className="workspace-panel-copy">
          A modern map-first control center for routing, traffic intelligence,
          emergency dispatch, infrastructure planning, and public transit.
        </p>
      </section>

      <section className="details-card">
        <h3>Live Network Summary</h3>

        <div className="mini-stats-grid">
          <MiniStat label="Neighborhoods" value={neighborhoodsRaw.length} />
          <MiniStat label="Facilities" value={facilitiesRaw.length} />
          <MiniStat label="Existing Roads" value={existingRoadsRaw.length} />
          <MiniStat label="Potential Roads" value={potentialRoadsRaw.length} />
          <MiniStat label="Traffic Records" value={trafficFlow.length} />
          <MiniStat
            label="MST Edges"
            value={mstData?.selected_edges_count ?? "—"}
          />
        </div>
      </section>

      <section className="details-card">
        <h3>Modules</h3>

        <div className="module-list">
          {modules.map((module) => (
            <NavLink key={module.path} to={module.path} className="module-row">
              <div className="module-icon">{module.icon}</div>

              <div>
                <strong>{module.title}</strong>
                <span>{module.description}</span>
              </div>
            </NavLink>
          ))}
        </div>
      </section>
    </div>
  );
}