import { NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const links = [
  { path: "/", label: "Overview" },
  { path: "/network-map", label: "Network" },
  { path: "/route-planner", label: "Routing" },
  { path: "/emergency-routing", label: "Emergency" },
  { path: "/traffic-prediction", label: "Traffic AI" },
  { path: "/traffic-signals", label: "Signals" },
  { path: "/infrastructure-optimizer", label: "Infrastructure" },
  { path: "/public-transit", label: "Transit" },
  { path: "/algorithm-race", label: "Performance" },
];

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="topbar-shell">
      <NavLink to="/" className="topbar-brand" aria-label="Smart Cairo Home">
        <div className="topbar-brand-icon">SC</div>

        <div className="topbar-brand-copy">
          <h2>Smart Cairo</h2>
          <p>Urban mobility intelligence platform</p>
        </div>
      </NavLink>

      <nav className="topbar-nav" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/"}
            className={({ isActive }) =>
              `topbar-link ${isActive ? "active" : ""}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="topbar-actions">
        <div className="topbar-status">
          <span className="status-dot" />
          <div className="topbar-status-copy">
            <small>System</small>
            <strong>Online</strong>
          </div>
        </div>

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isDark ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>
    </header>
  );
}
