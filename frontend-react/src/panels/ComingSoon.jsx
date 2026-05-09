import { motion } from "framer-motion";
import { resultReveal } from "../ui/motion";

export default function ComingSoonPanel({ title, description }) {
  return (
    <div className="workspace-panel-stack">
      {/* Header Section */}
      <motion.div {...resultReveal}>
        <p className="eyebrow">Workspace Migration</p>
        <h2 className="workspace-panel-title">{title}</h2>
        <p className="workspace-panel-copy">{description}</p>
      </motion.div>

      {/* Details Card Section */}
      <motion.div className="details-card" {...resultReveal}>
        <h3>What happens next</h3>
        <div className="result-grid">
          <div>
            <span>Status</span>
            <strong>Moving into persistent map workspace</strong>
          </div>
          
          <div>
            <span>Map Behavior</span>
            <strong>The map stays mounted while this module is migrated</strong>
          </div>
          
          <div className="full-span">
            <span>UX Goal</span>
            <strong>
              This module will become a live side panel and overlay instead of a
              full disconnected page.
            </strong>
          </div>
        </div>
      </motion.div>
    </div>
  );
}