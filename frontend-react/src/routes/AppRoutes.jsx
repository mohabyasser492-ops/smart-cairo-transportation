import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import NetworkMap from "../pages/NetworkMap";
import RoutePlanner from "../pages/RoutePlanner";
import EmergencyRouting from "../pages/EmergencyRouting";
import InfrastructureOptimizer from "../pages/InfrastructureOptimizer";
import PublicTransit from "../pages/PublicTransit";
import TrafficSignals from "../pages/TrafficSignals";
import AlgorithmRace from "../pages/AlgorithmRace";
import TrafficPrediction from "../pages/TrafficPrediction";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/network-map" element={<NetworkMap />} />
      <Route path="/route-planner" element={<RoutePlanner />} />
      <Route path="/emergency-routing" element={<EmergencyRouting />} />
      <Route path="/infrastructure-optimizer" element={<InfrastructureOptimizer />} />
      <Route path="/public-transit" element={<PublicTransit />} />
      <Route path="/traffic-signals" element={<TrafficSignals />} />
      <Route path="/algorithm-race" element={<AlgorithmRace />} />
      <Route path="/traffic-prediction" element={<TrafficPrediction />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
