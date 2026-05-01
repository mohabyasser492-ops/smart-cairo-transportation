import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import "./styles/index.css";

export default function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <AppRoutes />
    </div>
  );
}
     