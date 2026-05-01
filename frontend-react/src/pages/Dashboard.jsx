export default function Dashboard() {
  const modules = [
    {
      title: "Network Map",
      description: "Visualize Cairo neighborhoods, facilities, and road links.",
    },
    {
      title: "Route Planner",
      description: "Find shortest and traffic-aware routes using graph algorithms.",
    },
    {
      title: "Emergency Routing",
      description: "Use A* search for emergency vehicle routing to hospitals.",
    },
    {
      title: "Infrastructure Optimizer",
      description: "Design cost-efficient road networks using MST algorithms.",
    },
    {
      title: "Public Transit",
      description: "Optimize bus and metro resources using dynamic programming.",
    },
    {
      title: "Algorithm Race",
      description: "Compare Dijkstra and A* side by side for the bonus UI.",
    },
  ];

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">CSE112 Project</p>
        <h1>Smart Cairo Transportation Network Optimization</h1>
        <p>
          A visual system for route planning, emergency response, traffic
          analysis, infrastructure optimization, and public transit planning.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Locations</span>
          <strong>25</strong>
          <p>15 neighborhoods + 10 facilities</p>
        </div>

        <div className="stat-card">
          <span>Existing Roads</span>
          <strong>28</strong>
          <p>Weighted by distance, capacity, and condition</p>
        </div>

        <div className="stat-card">
          <span>Potential Roads</span>
          <strong>15</strong>
          <p>Used for infrastructure optimization</p>
        </div>

        <div className="stat-card">
          <span>Algorithms</span>
          <strong>7+</strong>
          <p>MST, Dijkstra, A*, DP, greedy, ML prediction</p>
        </div>
      </div>

      <div className="card-grid">
        {modules.map((module) => (
          <article className="module-card" key={module.title}>
            <h3>{module.title}</h3>
            <p>{module.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}