import { useEffect, useMemo, useState } from "react";
import { dataApi } from "../api/client";

function toOption(item, category) {
  return {
    value: item.name,
    label: item.name,
    category,
    original: item,
  };
}

export function useLocationOptions({ includeFacilities = false } = {}) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const requests = [dataApi.getNeighborhoods()];
        if (includeFacilities) {
          requests.push(dataApi.getFacilities());
        }

        const [neighborhoodRows, facilityRows = []] = await Promise.all(requests);

        if (!active) return;
        setNeighborhoods(Array.isArray(neighborhoodRows) ? neighborhoodRows : []);
        setFacilities(Array.isArray(facilityRows) ? facilityRows : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Could not load locations.");
        setNeighborhoods([]);
        setFacilities([]);
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
  }, [includeFacilities]);

  const options = useMemo(() => {
    const base = neighborhoods.map((item) => toOption(item, "Neighborhood"));
    const extras = includeFacilities
      ? facilities.map((item) => toOption(item, "Facility"))
      : [];

    return [...base, ...extras].sort((a, b) => a.label.localeCompare(b.label));
  }, [facilities, includeFacilities, neighborhoods]);

  return {
    options,
    loading,
    error,
  };
}