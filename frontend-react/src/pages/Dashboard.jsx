import { motion } from "framer-motion";
import {
  pageTransition,
  staggerContainer,
  cardItem,
  buttonMotion,
} from "../ui/motion";

export default function Dashboard() {
  const modules = [
    {
      title: "Network Map",
      description:
        "Monitor network structure, traffic overlays, and connectivity in one interactive view.",
    },
    {
      title: "Route Planner",
      description:
        "Plan efficient journeys using traffic-aware routing and time-based path selection.",
    },
    {
      title: "Emergency Routing",
      description:
        "Support emergency response movement with priority routing and rapid path evaluation.",
    },
    {
      title: "Infrastructure",
      description:
        "Evaluate network expansion, connectivity, and maintenance planning across the road system.",
    },
    {
      title: "Public Transit",
      description:
        "Review metro, bus, and demand insights while optimizing fleet allocation across transit routes.",
    },
    {
      title: "Performance",
      description:
        "Compare routing behavior and search efficiency across supported pathfinding methods.",
    },
  ];

  const quickHighlights = [
    {
      label: "Locations",
      value: "25",
      description: "15 neighborhoods and 10 major facilities across the network",
    },
    {
      label: "Existing Roads",
      value: "28",
      description: "Current road network links with distance, capacity, and condition data",
    },
    {
      label: "Potential Roads",
      value: "15",
      description: "Expansion candidates available for long-range planning",
    },
    {
      label: "Operational Modules",
      value: "8",
      description:
        "Routing, traffic, transit, infrastructure, and network intelligence workflows",
    },
  ];

  return (
    <motion.section {...pageTransition}>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <p className="eyebrow">Operations Overview</p>
        <h1>Smart Cairo Control Center</h1>
        <p>
          A unified mobility operations platform for routing, emergency response,
          traffic intelligence, infrastructure planning, and public transit management.
        </p>
      </motion.div>

      <motion.div
        className="stats-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {quickHighlights.map((item) => (
          <motion.div
            key={item.label}
            className="stat-card"
            variants={cardItem}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.description}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="comparison-grid"
        style={{ marginBottom: "24px" }}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div
          className="result-card"
          variants={cardItem}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
        >
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
        </motion.div>

        <motion.div
          className="result-card"
          variants={cardItem}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
        >
          <h3>What You Can Do</h3>

          <div className="transit-list">
            <div className="transit-item">
              <div>
                <strong>Plan and compare routes</strong>
                <div className="segment-subtext">
                  Evaluate traffic-aware journeys and emergency response paths
                </div>
              </div>
            </div>

            <div className="transit-item">
              <div>
                <strong>Monitor traffic and network conditions</strong>
                <div className="segment-subtext">
                  Review congestion patterns, network overlays, and map-level insights
                </div>
              </div>
            </div>

            <div className="transit-item">
              <div>
                <strong>Optimize operations</strong>
                <div className="segment-subtext">
                  Improve infrastructure planning, signal timing, and fleet allocation
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="card-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {modules.map((module) => (
          <motion.article
            className="module-card"
            key={module.title}
            variants={cardItem}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.18 }}
          >
            <h3>{module.title}</h3>
            <p>{module.description}</p>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  );
}