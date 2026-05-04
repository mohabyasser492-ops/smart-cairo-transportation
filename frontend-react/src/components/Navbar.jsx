import { NavLink } from "react-router-dom";

const links = [
  { path: "/", label: "Overview" },
  { path: "/network-map", label: "Network Map" },
  { path: "/route-planner", label: "Route Planner" },
  { path: "/emergency-routing", label: "Emergency Routing" },
  { path: "/traffic-prediction", label: "Traffic Prediction" },
  { path: "/traffic-signals", label: "Traffic Signals" },
  { path: "/infrastructure-optimizer", label: "Infrastructure" },
  { path: "/public-transit", label: "Public Transit" },
  { path: "/algorithm-race", label: "Performance" },
];

export default function Navbar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-mark">SC</div>
        <div>
          <h2>Smart Cairo</h2>
          <p>Mobility Operations Platform</p>
        </div>
      </div>

      <nav className="nav-links" aria-label="Primary navigation">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/"}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-link-dot" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-label">System Status</span>
        <strong>Operational</strong>
      </div>
    </aside>
  );
}
