import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="result-card" style={{ maxWidth: 720, margin: "48px auto" }}>
      <p className="eyebrow">Navigation</p>
      <h1 style={{ marginTop: 0 }}>Page Not Found</h1>
      <p>
        The requested route does not exist. Return to the dashboard to continue
        exploring the Smart Cairo platform.
      </p>
      <Link to="/">
        <button type="button">Go to Overview</button>
      </Link>
    </div>
  );
}