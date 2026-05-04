import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { dataApi } from "../api/client";
import { pageTransition, staggerContainer, cardItem } from "../ui/motion";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await dataApi.getSummary();
        if (active) {
          setSummary(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load platform summary.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const modules = [
    {
      title: "Network Map",
      description: "Monitor network structure, traffic overlays, and connectivity in one interactive view.",
    },
    {
      title: "Route Planner",
      description: "Plan efficient journeys using traffic-aware routing and time-based path selection.",
    },
    {
      title: "Emergency Routing",
      description: "Support emergency response movement with priority routing and rapid path evaluation.",
    },
    {
      title: "Infrastructure",
      description: "Evaluate network expansion, connectivity, and maintenance planning across the road system.",
    },
    {
      title: "Public Transit",
      description: "Review metro, bus, and demand insights while optimizing fleet allocation across transit routes.",
    },
    {
      title: "Performance",
      description: "Compare routing behavior and search efficiency across supported pathfinding methods.",
    },
  ];

  const quickHighlights = useMemo(() => {
    return [
      {
        label: "Neighborhoods",
        value: summary?.neighborhoods_count ?? "--",
        description: "Residential, business, mixed-use, and industrial districts available in the dataset",
      },
      {
        label: "Facilities",
        value: summary?.facilities_count ?? "--",
        description: "Transit, airport, education, tourism, medical, and commercial facilities",
      },
      {
        label: "Existing Roads",
        value: summary?.existing_roads_count ?? "--",
        description: "Current road network links with traffic and condition data",
      },
      {
        label: "Potential Roads",
        value: summary?.potential_roads_count ?? "--",
        description: "Expansion candidates available for infrastructure planning",
      },
    ];
  }, [summary]);

  return (
    <motion.div {...pageTransition}>
      <div className="page-header">
        <p className="eyebrow">Operations Overview</p>
        <h1>Smart Cairo Control Center</h1>
        <p>
          A unified mobility operations platform for routing, emergency response,
          traffic intelligence, infrastructure planning, and public transit management.
        </p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <motion.div
        className="stats-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {quickHighlights.map((item) => (
          <motion.div key={item.label} className="stat-card" variants={cardItem}>
            <span>{item.label}</span>
            <strong>{loading ? "..." : item.value}</strong>
            <p>{item.description}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="result-card" style={{ marginBottom: 24 }}>
        <h3>Platform Snapshot</h3>
        <div className="result-grid">
          <div>
            <span>Routing</span>
            <strong>Traffic-aware navigation</strong>
          </div>
          <div>
            <span>Emergency Operations</span>
            <strong>Priority response routing</strong>
          </div>
          <div>
            <span>Infrastructure</span>
            <strong>Expansion and maintenance planning</strong>
          </div>
          <div>
            <span>Transit</span>
            <strong>Metro, bus, and fleet allocation insights</strong>
          </div>
        </div>
      </div>

      <div className="card-grid">
        {modules.map((module) => (
          <div key={module.title} className="module-card">
            <h3>{module.title}</h3>
            <p>{module.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
