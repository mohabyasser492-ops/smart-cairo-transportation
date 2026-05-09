import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dataApi, networkApi, trafficApi } from "../api/client";
import {
  buildLocationCollections,
  normalizeRoads,
} from "../utils/mapAdapters";

const MapDataContext = createContext(null);

export function MapDataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [neighborhoodsRaw, setNeighborhoodsRaw] = useState([]);
  const [facilitiesRaw, setFacilitiesRaw] = useState([]);
  const [existingRoadsRaw, setExistingRoadsRaw] = useState([]);
  const [potentialRoadsRaw, setPotentialRoadsRaw] = useState([]);
  const [trafficFlow, setTrafficFlow] = useState([]);

  const [mstData, setMstData] = useState(null);
  const [signalStatuses, setSignalStatuses] = useState(null);
  const [hotspots, setHotspots] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setLoading(true);
      setError("");

      try {
        const [
          neighborhoods,
          facilities,
          existingRoads,
          potentialRoads,
          traffic,
          mst,
          statuses,
          congestionHotspots,
        ] = await Promise.allSettled([
          dataApi.getNeighborhoods(),
          dataApi.getFacilities(),
          dataApi.getExistingRoads(),
          dataApi.getPotentialRoads(),
          dataApi.getTrafficFlow(),
          networkApi.getMinimumSpanningTree(),
          trafficApi.getIntersectionsStatus(),
          trafficApi.getCongestionHotspots(),
        ]);

        if (!active) return;

        setNeighborhoodsRaw(
          neighborhoods.status === "fulfilled" ? neighborhoods.value ?? [] : []
        );

        setFacilitiesRaw(
          facilities.status === "fulfilled" ? facilities.value ?? [] : []
        );

        setExistingRoadsRaw(
          existingRoads.status === "fulfilled" ? existingRoads.value ?? [] : []
        );

        setPotentialRoadsRaw(
          potentialRoads.status === "fulfilled" ? potentialRoads.value ?? [] : []
        );

        setTrafficFlow(
          traffic.status === "fulfilled" ? traffic.value ?? [] : []
        );

        setMstData(mst.status === "fulfilled" ? mst.value : null);
        setSignalStatuses(
          statuses.status === "fulfilled" ? statuses.value : null
        );
        setHotspots(
          congestionHotspots.status === "fulfilled"
            ? congestionHotspots.value
            : null
        );
      } catch (err) {
        if (!active) return;
        setError(err.message || "Could not load map data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  const locations = useMemo(() => {
    return buildLocationCollections(neighborhoodsRaw, facilitiesRaw);
  }, [neighborhoodsRaw, facilitiesRaw]);

  const existingRoads = useMemo(() => {
    return normalizeRoads(existingRoadsRaw, locations.idLookup);
  }, [existingRoadsRaw, locations.idLookup]);

  const potentialRoads = useMemo(() => {
    return normalizeRoads(potentialRoadsRaw, locations.idLookup);
  }, [potentialRoadsRaw, locations.idLookup]);

  const trafficLookup = useMemo(() => {
    const lookup = new Map();

    trafficFlow.forEach((record) => {
      lookup.set(String(record.road_id ?? record.id ?? ""), record);
    });

    return lookup;
  }, [trafficFlow]);

  const value = useMemo(
    () => ({
      loading,
      error,

      neighborhoodsRaw,
      facilitiesRaw,
      existingRoadsRaw,
      potentialRoadsRaw,
      trafficFlow,

      locations,
      existingRoads,
      potentialRoads,
      trafficLookup,

      mstData,
      signalStatuses,
      hotspots,
    }),
    [
      loading,
      error,
      neighborhoodsRaw,
      facilitiesRaw,
      existingRoadsRaw,
      potentialRoadsRaw,
      trafficFlow,
      locations,
      existingRoads,
      potentialRoads,
      trafficLookup,
      mstData,
      signalStatuses,
      hotspots,
    ]
  );

  return (
    <MapDataContext.Provider value={value}>
      {children}
    </MapDataContext.Provider>
  );
}

export function useMapData() {
  const context = useContext(MapDataContext);

  if (!context) {
    throw new Error("useMapData must be used inside MapDataProvider");
  }

  return context;
}