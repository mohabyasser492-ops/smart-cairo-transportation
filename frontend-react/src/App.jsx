import Navbar from "./components/Navbar";
import AppBootLoader from "./components/AppBootLoader";
import AppRoutes from "./routes/AppRoutes";
import { ThemeProvider } from "./context/ThemeContext";
import { MapDataProvider, useMapData } from "./context/MapDataContext";
import "./styles/index.css";

function AppShellInner() {
  const { loading } = useMapData();

  return (
    <div className="app-shell">
      <div className="app-shell-backdrop" />

      <AppBootLoader ready={!loading} />

      <div className="content-container">
        <Navbar />

        <main className="main-content-shell">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MapDataProvider>
        <AppShellInner />
      </MapDataProvider>
    </ThemeProvider>
  );
}
