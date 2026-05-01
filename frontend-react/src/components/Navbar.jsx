import { NavLink } from "react-router-dom";

const links = [
  { path: "/", label: "Dashboard" },
  { path: "/network-map", label: "Network Map" },
  { path: "/route-planner", label: "Route Planner" },
  { path: "/emergency-routing", label: "Emergency Routing" },
  { path: "/infrastructure-optimizer", label: "Infrastructure" },
  { path: "/public-transit", label: "Public Transit" },
  { path: "/traffic-signals", label: "Traffic Signals" },
  { path: "/algorithm-race", label: "Algorithm Race" },
  { path: "/traffic-prediction", label: "Traffic Prediction" },
];

export default function Navbar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Smart Cairo</h2>
        <p>Transportation Optimizer</p>
      </div>

      <nav className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}