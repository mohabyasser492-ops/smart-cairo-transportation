import { useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";

import MapWorkspace from "../components/MapWorkspace";
import OverviewPanel from "../panels/OverviewPanel";
import NetworkPanel from "../panels/NetworkPanel";
import RoutePlannerPanel from "../panels/RoutePlannerPanel";
import EmergencyDispatchPanel from "../panels/EmergencyDispatchPanel";
import TrafficPredictionPanel from "../panels/TrafficPredictionPanel";
import TrafficSignalsPanel from "../panels/TrafficSignalsPanel";
import InfrastructurePanel from "../panels/InfrastructurePanel";
import TransitPanel from "../panels/TransitPanel";
import PerformancePanel from "../panels/PerformancePanel";


import NotFound from "../pages/NotFound";

import { useMapData } from "../context/MapDataContext";
import { routingApi , predictionApi , trafficApi, networkApi, transitApi } from "../api/client";
import { getRenderableRoutePoints } from "../utils/routeGeometry";

function OverviewWorkspace() {
  return <MapWorkspace panel={<OverviewPanel />} />;
}

function NetworkWorkspace() {
  const { trafficFlow, mstData } = useMapData();

  const [selectedTime, setSelectedTime] = useState("morning_peak");
  const [selectedElement, setSelectedElement] = useState(null);

  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);
  const [showExistingRoads, setShowExistingRoads] = useState(true);
  const [showPotentialRoads, setShowPotentialRoads] = useState(false);

  const panel = (
    <NetworkPanel
      selectedTime={selectedTime}
      onChangeTime={(event) => setSelectedTime(event.target.value)}
      showTrafficOverlay={showTrafficOverlay}
      setShowTrafficOverlay={setShowTrafficOverlay}
      showExistingRoads={showExistingRoads}
      setShowExistingRoads={setShowExistingRoads}
      showPotentialRoads={showPotentialRoads}
      setShowPotentialRoads={setShowPotentialRoads}
      selectedElement={selectedElement}
      trafficFlow={trafficFlow}
      mstData={mstData}
    />
  );

  return (
    <MapWorkspace
      panel={panel}
      selectedTime={selectedTime}
      showTraffic={showTrafficOverlay}
      showExistingRoads={showExistingRoads}
      showPotentialRoads={showPotentialRoads}
      selectedElement={selectedElement}
      onSelectNode={(node) =>
        setSelectedElement({
          kind: "node",
          data: node,
        })
      }
      onSelectRoad={(road) =>
        setSelectedElement({
          kind: "edge",
          data: road,
        })
      }
    />
  );
}

function RoutePlannerWorkspace() {
  const { locations } = useMapData();

  const locationOptions = useMemo(() => {
    return locations.allLocations
      .map((item) => ({
        value: item.name,
        label: item.name,
      }))
      .filter((item) => item.value)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [locations.allLocations]);

  const [form, setForm] = useState({
    source: "",
    destination: "",
    departure_time: "08:30",
    day_type: "weekday",
  });

  const [routeResult, setRouteResult] = useState(null);
  const [comparison, setComparison] = useState(null);

  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!locationOptions.length) return;

    setForm((previous) => ({
      ...previous,
      source: previous.source || locationOptions[0]?.value || "",
      destination:
        previous.destination ||
        locationOptions[1]?.value ||
        locationOptions[0]?.value ||
        "",
    }));
  }, [locationOptions]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleRouteSubmit(event) {
    event.preventDefault();

    setError("");
    setRouteResult(null);
    setLoadingRoute(true);

    try {
      const data = await routingApi.timeDependentRoute(form);
      setRouteResult(data);
    } catch (err) {
      setError(err.message || "Could not calculate the route.");
    } finally {
      setLoadingRoute(false);
    }
  }

  async function handleBestRouteSubmit() {
    setError("");
    setRouteResult(null);
    setLoadingRoute(true);

    try {
      const data = await routingApi.bestRouteByTime(form);
      setRouteResult(data);
    } catch (err) {
      setError(err.message || "Could not calculate best route by time.");
    } finally {
      setLoadingRoute(false);
    }
  }

  async function handleCompare() {
    setError("");
    setComparison(null);
    setLoadingComparison(true);

    try {
      const data = await routingApi.compareDijkstraVsAstar({
        source: form.source,
        destination: form.destination,
        weight: "distance",
      });

      setComparison(data);
    } catch (err) {
      setError(err.message || "Could not compare algorithms.");
    } finally {
      setLoadingComparison(false);
    }
  }

  const overlayRoutes = useMemo(() => {
    const routes = [];

    if (routeResult?.normal_shortest_route) {
      const points = getRenderableRoutePoints(
        routeResult.normal_shortest_route,
        locations.nameLookup
      );

      if (points.length > 1) {
        routes.push({
          type: "normal-route",
          label: "Normal Shortest Route",
          points,
        });
      }
    }

    if (routeResult?.traffic_aware_route) {
      const points = getRenderableRoutePoints(
        routeResult.traffic_aware_route,
        locations.nameLookup
      );

      if (points.length > 1) {
        routes.push({
          type: "best-route",
          label: "Traffic-Aware Route",
          points,
        });
      }
    }

    if (routeResult && !routeResult.normal_shortest_route) {
      const points = getRenderableRoutePoints(
        routeResult,
        locations.nameLookup
      );

      if (points.length > 1) {
        routes.push({
          type: "best-route",
          label: "Route Result",
          points,
        });
      }
    }

    if (comparison?.dijkstra) {
      const points = getRenderableRoutePoints(
        comparison.dijkstra,
        locations.nameLookup
      );

      if (points.length > 1) {
        routes.push({
          type: "dijkstra",
          label: "Dijkstra Route",
          points,
        });
      }
    }

    if (comparison?.astar) {
      const points = getRenderableRoutePoints(
        comparison.astar,
        locations.nameLookup
      );

      if (points.length > 1) {
        routes.push({
          type: "astar",
          label: "A* Route",
          points,
        });
      }
    }

    return routes;
  }, [routeResult, comparison, locations.nameLookup]);

  const panel = (
    <RoutePlannerPanel
      form={form}
      locations={locationOptions}
      onChange={handleChange}
      onSubmitRoute={handleRouteSubmit}
      onSubmitBestRoute={handleBestRouteSubmit}
      onCompare={handleCompare}
      loadingRoute={loadingRoute}
      loadingComparison={loadingComparison}
      routeResult={routeResult}
      comparison={comparison}
      error={error}
    />
  );

  return (
    <MapWorkspace
      panel={panel}
      overlayRoutes={overlayRoutes}
      showTraffic
      showExistingRoads
      showPotentialRoads={false}
    />
  );
}

function EmergencyWorkspace() {
  const { locations } = useMapData();

  const locationOptions = useMemo(() => {
    return locations.allLocations
      .map((item) => item.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [locations.allLocations]);

  const [form, setForm] = useState({
    source: "",
    destination: "",
  });

  const [serviceSelection, setServiceSelection] = useState({
    ambulance: true,
    police: true,
    fire_truck: false,
  });

  const [results, setResults] = useState([]);
  const [activeService, setActiveService] = useState("ambulance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!locationOptions.length) return;

    setForm((previous) => ({
      ...previous,
      source: previous.source || locationOptions[0] || "",
      destination:
        previous.destination ||
        locationOptions[1] ||
        locationOptions[0] ||
        "",
    }));
  }, [locationOptions]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function toggleService(type) {
    setServiceSelection((previous) => ({
      ...previous,
      [type]: !previous[type],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const enabledServices = Object.entries(serviceSelection)
      .filter(([, enabled]) => enabled)
      .map(([type]) => type);

    if (!enabledServices.length) {
      setError("Please select at least one emergency service.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const responses = await Promise.all(
        enabledServices.map(async (type) => {
          const result = await routingApi.emergencyRoute({
            source: form.source,
            destination: form.destination,
            emergency_type: type,
            service_type: type,
            vehicle_type: type,
          });

          return {
            type,
            result,
          };
        })
      );

      setResults(responses);
      setActiveService(responses[0]?.type ?? enabledServices[0]);
    } catch (err) {
      setError(err.message || "Could not dispatch emergency services.");
    } finally {
      setLoading(false);
    }
  }

  const overlayRoutes = useMemo(() => {
    return results
      .map((item) => {
        const points = getRenderableRoutePoints(
          item.result,
          locations.nameLookup
        );

        if (points.length < 2) return null;

        return {
          type: item.type,
          label: `${item.type.replace("_", " ")} route`,
          points,
        };
      })
      .filter(Boolean);
  }, [results, locations.nameLookup]);

  const extraMarkers = useMemo(() => {
    const markers = [];

    const sourceNode = locations.nameLookup.get(form.source);
    const destinationNode = locations.nameLookup.get(form.destination);

    if (sourceNode?.mapPosition) {
      markers.push({
        type: "generic",
        label: "S",
        title: "Dispatch Source",
        description: form.source,
        position: sourceNode.mapPosition,
      });
    }

    if (destinationNode?.mapPosition) {
      markers.push({
        type: "hotspot",
        label: "D",
        title: "Emergency Destination",
        description: form.destination,
        position: destinationNode.mapPosition,
      });
    }

    return markers;
  }, [form.source, form.destination, locations.nameLookup]);

  const panel = (
    <EmergencyDispatchPanel
      form={form}
      locationOptions={locationOptions}
      onChange={handleChange}
      serviceSelection={serviceSelection}
      toggleService={toggleService}
      onSubmit={handleSubmit}
      loading={loading}
      results={results}
      activeService={activeService}
      setActiveService={setActiveService}
      error={error}
    />
  );

  return (
    <MapWorkspace
      panel={panel}
      overlayRoutes={overlayRoutes}
      extraMarkers={extraMarkers}
      showTraffic
      showExistingRoads
      showPotentialRoads={false}
    />
  );
}

function TrafficPredictionWorkspace() {
  const { locations, existingRoadsRaw } = useMapData();

  const locationOptions = useMemo(() => {
    return locations.allLocations
      .map((item) => ({
        value: item.name,
        label: item.name,
      }))
      .filter((item) => item.value)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [locations.allLocations]);

  const roadOptions = useMemo(() => {
    return (existingRoadsRaw ?? []).filter(
      (road) => road.id != null || road.road_id != null
    );
  }, [existingRoadsRaw]);

  const [roadForm, setRoadForm] = useState({
    road_id: "",
    hour: 8,
    day_of_week: "Monday",
    weather: "clear",
    is_holiday: false,
  });

  const [routeForm, setRouteForm] = useState({
    source: "",
    destination: "",
    hour: 8,
    day_of_week: "Monday",
    weather: "clear",
    is_holiday: false,
    weight: "distance",
  });

  const [roadPrediction, setRoadPrediction] = useState(null);
  const [routePrediction, setRoutePrediction] = useState(null);

  const [loadingRoad, setLoadingRoad] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!roadOptions.length) return;

    setRoadForm((previous) => ({
      ...previous,
      road_id:
        previous.road_id ||
        String(roadOptions[0]?.id ?? roadOptions[0]?.road_id ?? ""),
    }));
  }, [roadOptions]);

  useEffect(() => {
    if (!locationOptions.length) return;

    setRouteForm((previous) => ({
      ...previous,
      source: previous.source || locationOptions[0]?.value || "",
      destination:
        previous.destination ||
        locationOptions[1]?.value ||
        locationOptions[0]?.value ||
        "",
    }));
  }, [locationOptions]);

  function handleRoadChange(event) {
    const { name, value, type, checked } = event.target;

    setRoadForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : name === "hour"
          ? Number(value)
          : value,
    }));
  }

  function handleRouteChange(event) {
    const { name, value, type, checked } = event.target;

    setRouteForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : name === "hour"
          ? Number(value)
          : value,
    }));
  }

  async function handleRoadSubmit(event) {
    event.preventDefault();

    setLoadingRoad(true);
    setError("");
    setRoadPrediction(null);

    try {
      const data = await predictionApi.predictTraffic(roadForm);

      setRoadPrediction(data);
    } catch (err) {
      setError(err.message || "Could not predict road traffic.");
    } finally {
      setLoadingRoad(false);
    }
  }

  async function handleRouteSubmit(event) {
    event.preventDefault();

    setLoadingRoute(true);
    setError("");
    setRoutePrediction(null);

    try {
      const data = await predictionApi.predictRouteTraffic(routeForm);

      setRoutePrediction(data);
    } catch (err) {
      setError(err.message || "Could not predict route traffic.");
    } finally {
      setLoadingRoute(false);
    }
  }

  const overlayRoutes = useMemo(() => {
    if (!routePrediction) return [];

    const points = getRenderableRoutePoints(
      routePrediction,
      locations.nameLookup
    );

    if (points.length < 2) return [];

    return [
      {
        type: "predicted-route",
        label: "Predicted Traffic Route",
        description: "Predicted route traffic overlay",
        points,
      },
    ];
  }, [routePrediction, locations.nameLookup]);

  const panel = (
    <TrafficPredictionPanel
      roadOptions={roadOptions}
      roadForm={roadForm}
      routeForm={routeForm}
      roadPrediction={roadPrediction}
      routePrediction={routePrediction}
      loadingRoad={loadingRoad}
      loadingRoute={loadingRoute}
      onRoadChange={handleRoadChange}
      onRouteChange={handleRouteChange}
      onRoadSubmit={handleRoadSubmit}
      onRouteSubmit={handleRouteSubmit}
      error={error}
      locations={locationOptions}
    />
  );

  return (
    <MapWorkspace
      panel={panel}
      overlayRoutes={overlayRoutes}
      showTraffic
      showExistingRoads
      showPotentialRoads={false}
    />
  );
}

function getNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getMarkerPositionFromItem(item, locations) {
  if (!item) return null;

  const lat =
    getNumber(item.latitude) ??
    getNumber(item.lat) ??
    getNumber(item.y);

  const lng =
    getNumber(item.longitude) ??
    getNumber(item.lng) ??
    getNumber(item.lon) ??
    getNumber(item.x);

  if (lat != null && lng != null) {
    return [lat, lng];
  }

  const fromName = item.from ?? item.source;
  const toName = item.to ?? item.destination;

  const fromNode = fromName ? locations.nameLookup.get(String(fromName)) : null;
  const toNode = toName ? locations.nameLookup.get(String(toName)) : null;

  if (fromNode?.mapPosition && toNode?.mapPosition) {
    return [
      (fromNode.mapPosition[0] + toNode.mapPosition[0]) / 2,
      (fromNode.mapPosition[1] + toNode.mapPosition[1]) / 2,
    ];
  }

  const nodeName = item.name ?? item.location ?? item.neighborhood;

  if (nodeName) {
    const node = locations.nameLookup.get(String(nodeName));
    return node?.mapPosition ?? null;
  }

  return null;
}



function TrafficSignalsWorkspace() {
  const { signalStatuses, hotspots, locations } = useMapData();

  const [signalForm, setSignalForm] = useState({
    total_cycle_time: 120,
    min_green_time: 20,
    max_green_time: 90,
  });

  const [signalResult, setSignalResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setSignalForm((previous) => ({
      ...previous,
      [name]: value === "" ? "" : Number(value),
    }));
  }

  async function handleOptimize(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSignalResult(null);

    try {
      const data = await trafficApi.optimizeSignals(signalForm);

      setSignalResult(data);
    } catch (err) {
      setError(err.message || "Could not optimize traffic signals.");
    } finally {
      setLoading(false);
    }
  }

  const extraMarkers = useMemo(() => {
    const markers = [];

    const hotspotRows =
      hotspots?.hotspots ??
      hotspots ??
      [];

    const statusRows =
      signalStatuses?.intersections ??
      signalStatuses ??
      [];

    const optimizedRows =
      signalResult?.optimized_signals ??
      signalResult?.signals ??
      [];

    if (Array.isArray(hotspotRows)) {
      hotspotRows.slice(0, 10).forEach((item, index) => {
        const position = getMarkerPositionFromItem(
          item,
          locations
        );

        if (!position) return;

        markers.push({
          type: "hotspot",
          label: "!",
          title:
            item.name ??
            item.intersection_name ??
            item.intersection_id ??
            `Hotspot ${index + 1}`,

          description: `Congestion score: ${
            item.congestion_score ??
            item.score ??
            "N/A"
          }`,

          position,
        });
      });
    }

    if (Array.isArray(statusRows)) {
      statusRows.slice(0, 8).forEach((item, index) => {
        const position = getMarkerPositionFromItem(
          item,
          locations
        );

        if (!position) return;

        markers.push({
          type: "prediction",
          label: "S",

          title:
            item.name ??
            item.intersection_name ??
            item.intersection_id ??
            `Signal ${index + 1}`,

          description: `Status score: ${
            item.congestion_score ??
            item.score ??
            "N/A"
          }`,

          position,
        });
      });
    }

    if (Array.isArray(optimizedRows)) {
      optimizedRows.slice(0, 8).forEach((item, index) => {
        const position = getMarkerPositionFromItem(
          item,
          locations
        );

        if (!position) return;

        markers.push({
          type: "generic",
          label: "O",
          title:
            item.name ??
            item.intersection_name ??
            item.intersection_id ??
            `Optimized Signal ${index + 1}`,
          description: `Green: ${
            item.recommended_green_time_sec ??
            item.green_time ??
            "N/A"
          } sec`,
          position,
        });
      });
    }

    return markers;
  }, [hotspots, signalResult, signalStatuses, locations]);

  const panel = (
    <TrafficSignalsPanel
      signalForm={signalForm}
      signalResult={signalResult}
      statuses={signalStatuses}
      hotspots={hotspots}
      loading={loading}
      error={error}
      onChange={handleChange}
      onOptimize={handleOptimize}
    />
  );

  return (
    <MapWorkspace
      panel={panel}
      extraMarkers={extraMarkers}
      showTraffic={true}
      showExistingRoads={true}
      showPotentialRoads={false}
    />
  );
}


function getEdgeOverlayPoints(edge, locations) {
  if (!edge) return [];

  if (Array.isArray(edge.route_geometry) && edge.route_geometry.length > 1) {
    return edge.route_geometry
      .filter(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          Number.isFinite(Number(point[0])) &&
          Number.isFinite(Number(point[1]))
      )
      .map((point) => [Number(point[0]), Number(point[1])]);
  }

  const source =
    edge.source ??
    edge.from ??
    edge.from_name ??
    edge.source_name ??
    edge.start;

  const destination =
    edge.destination ??
    edge.to ??
    edge.to_name ??
    edge.destination_name ??
    edge.end;

  if (!source || !destination) return [];

  const sourceNode = locations.nameLookup.get(String(source));
  const destinationNode = locations.nameLookup.get(String(destination));

  if (!sourceNode?.mapPosition || !destinationNode?.mapPosition) return [];

  return [sourceNode.mapPosition, destinationNode.mapPosition];
}




function InfrastructureWorkspace() {
  const { mstData, locations } = useMapData();

  const [expansionForm, setExpansionForm] = useState({
    use_potential_roads: true,
    cost_per_km: 10000000,
    priority: "cost",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    budget: 50000000,
  });

  const [expansionResult, setExpansionResult] = useState(null);
  const [maintenanceResult, setMaintenanceResult] = useState(null);

  const [loadingExpansion, setLoadingExpansion] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [error, setError] = useState("");

  function handleExpansionChange(event) {
    const { name, value, type, checked } = event.target;

    setExpansionForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : name === "cost_per_km"
            ? Number(value)
            : value,
    }));
  }

  function handleMaintenanceChange(event) {
    const { name, value } = event.target;

    setMaintenanceForm((previous) => ({
      ...previous,
      [name]: Number(value),
    }));
  }

  async function handleRunExpansion(event) {
    event.preventDefault();

    setLoadingExpansion(true);
    setError("");
    setExpansionResult(null);

    try {
      const data = await networkApi.optimizeExpansion(expansionForm);
      setExpansionResult(data);
    } catch (err) {
      setError(err.message || "Could not optimize infrastructure expansion.");
    } finally {
      setLoadingExpansion(false);
    }
  }

  async function handleRunMaintenance(event) {
    event.preventDefault();

    setLoadingMaintenance(true);
    setError("");
    setMaintenanceResult(null);

    try {
      const data = await networkApi.createMaintenancePlan(maintenanceForm);
      setMaintenanceResult(data);
    } catch (err) {
      setError(err.message || "Could not generate maintenance plan.");
    } finally {
      setLoadingMaintenance(false);
    }
  }

  const overlayRoutes = useMemo(() => {
    const routes = [];

    const mstEdges = mstData?.selected_edges ?? [];

    if (Array.isArray(mstEdges)) {
      mstEdges.forEach((edge, index) => {
        const points = getEdgeOverlayPoints(edge, locations);

        if (points.length < 2) return;

        routes.push({
          type: "mst",
          label: `MST Edge ${index + 1}`,
          description: "Minimum spanning tree connection",
          points,
        });
      });
    }

    const expansionEdges =
      expansionResult?.selected_roads ??
      expansionResult?.selected_edges ??
      expansionResult?.result?.selected_edges ??
      expansionResult?.roads ??
      [];

    if (Array.isArray(expansionEdges)) {
      expansionEdges.forEach((edge, index) => {
        const points = getEdgeOverlayPoints(edge, locations);

        if (points.length < 2) return;

        routes.push({
          type: "expansion",
          label: `Expansion Road ${index + 1}`,
          description: "Optimized expansion candidate",
          points,
        });
      });
    }

    const maintenanceEdges =
      maintenanceResult?.selected_projects ??
      maintenanceResult?.projects ??
      maintenanceResult?.selected_roads ??
      [];

    if (Array.isArray(maintenanceEdges)) {
      maintenanceEdges.forEach((edge, index) => {
        const points = getEdgeOverlayPoints(edge, locations);

        if (points.length < 2) return;

        routes.push({
          type: "maintenance",
          label: `Maintenance Project ${index + 1}`,
          description: "Budget-aware maintenance selection",
          points,
        });
      });
    }

    return routes;
  }, [mstData, expansionResult, maintenanceResult, locations]);

  const panel = (
    <InfrastructurePanel
      mstData={mstData}
      expansionForm={expansionForm}
      maintenanceForm={maintenanceForm}
      expansionResult={expansionResult}
      maintenanceResult={maintenanceResult}
      loadingExpansion={loadingExpansion}
      loadingMaintenance={loadingMaintenance}
      error={error}
      onExpansionChange={handleExpansionChange}
      onMaintenanceChange={handleMaintenanceChange}
      onRunExpansion={handleRunExpansion}
      onRunMaintenance={handleRunMaintenance}
    />
  );

  return (
    <MapWorkspace
      panel={panel}
      overlayRoutes={overlayRoutes}
      showTraffic
      showExistingRoads
      showPotentialRoads={expansionForm.use_potential_roads}
    />
  );
}

function TransitWorkspace() {
  const { locations } = useMapData();

  const locationOptions = useMemo(() => {
    return locations.allLocations
      .map((item) => ({
        value: item.name,
        label: item.name,
      }))
      .filter((item) => item.value)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [locations.allLocations]);

  const [form, setForm] = useState({
    source: "",
    destination: "",
    preference: "fastest",
  });

  const [allocationForm, setAllocationForm] = useState({
    available_buses: 100,
  });

  const [routeResult, setRouteResult] = useState(null);
  const [allocationResult, setAllocationResult] = useState(null);

  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingAllocation, setLoadingAllocation] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!locationOptions.length) return;

    setForm((previous) => ({
      ...previous,
      source: previous.source || locationOptions[0]?.value || "",
      destination:
        previous.destination ||
        locationOptions[1]?.value ||
        locationOptions[0]?.value ||
        "",
    }));
  }, [locationOptions]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleAllocationChange(event) {
    const { name, value } = event.target;

    setAllocationForm((previous) => ({
      ...previous,
      [name]: Number(value),
    }));
  }

  async function handleRouteSubmit(event) {
    event.preventDefault();

    setLoadingRoute(true);
    setError("");
    setRouteResult(null);

    try {
      const data = await routingApi.publicTransitRoute(form);
      setRouteResult(data);
    } catch (err) {
      setError(err.message || "Could not plan public transit route.");
    } finally {
      setLoadingRoute(false);
    }
  }

  async function handleAllocationSubmit(event) {
    event.preventDefault();

    setLoadingAllocation(true);
    setError("");
    setAllocationResult(null);

    try {
      const data = await transitApi.allocateBuses(allocationForm);
      setAllocationResult(data);
    } catch (err) {
      setError(err.message || "Could not optimize bus allocation.");
    } finally {
      setLoadingAllocation(false);
    }
  }

  const overlayRoutes = useMemo(() => {
    if (!routeResult) return [];

    const points = getRenderableRoutePoints(routeResult, locations.nameLookup);

    if (points.length < 2) return [];

    return [
      {
        type: "transit",
        label: "Public Transit Route",
        description: "Optimized public transit route",
        points,
      },
    ];
  }, [routeResult, locations.nameLookup]);

  const extraMarkers = useMemo(() => {
    const markers = [];

    const sourceNode = locations.nameLookup.get(form.source);
    const destinationNode = locations.nameLookup.get(form.destination);

    if (sourceNode?.mapPosition) {
      markers.push({
        type: "transit",
        label: "S",
        title: "Transit Source",
        description: form.source,
        position: sourceNode.mapPosition,
      });
    }

    if (destinationNode?.mapPosition) {
      markers.push({
        type: "transit",
        label: "D",
        title: "Transit Destination",
        description: form.destination,
        position: destinationNode.mapPosition,
      });
    }

    return markers;
  }, [form.source, form.destination, locations.nameLookup]);

  const panel = (
    <TransitPanel
      form={form}
      locations={locationOptions}
      allocationForm={allocationForm}
      routeResult={routeResult}
      allocationResult={allocationResult}
      loadingRoute={loadingRoute}
      loadingAllocation={loadingAllocation}
      onChange={handleChange}
      onAllocationChange={handleAllocationChange}
      onSubmitRoute={handleRouteSubmit}
      onSubmitAllocation={handleAllocationSubmit}
      error={error}
    />
  );

  return (
    <MapWorkspace
      panel={panel}
      overlayRoutes={overlayRoutes}
      extraMarkers={extraMarkers}
      showTraffic
      showExistingRoads
      showPotentialRoads={false}
    />
  );
}


function PerformanceWorkspace() {
  const { locations } = useMapData();

  const locationOptions = useMemo(() => {
    return locations.allLocations
      .map((item) => ({
        value: item.name,
        label: item.name,
      }))
      .filter((item) => item.value)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [locations.allLocations]);

  const [form, setForm] = useState({
    source: "",
    destination: "",
    weight: "distance",
  });

  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [raceStep, setRaceStep] = useState(0);
  const [isRacePlaying, setIsRacePlaying] = useState(false);

  useEffect(() => {
    if (!locationOptions.length) return;

    setForm((previous) => ({
      ...previous,
      source: previous.source || locationOptions[0]?.value || "",
      destination:
        previous.destination ||
        locationOptions[1]?.value ||
        locationOptions[0]?.value ||
        "",
    }));
  }, [locationOptions]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setComparison(null);
    setRaceStep(0);
    setIsRacePlaying(false);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setComparison(null);
    setRaceStep(0);
    setIsRacePlaying(false);

    try {
      const data = await routingApi.compareDijkstraVsAstar({
        source: form.source,
        destination: form.destination,
        weight: form.weight,
      });

      setComparison(data);
      setIsRacePlaying(true);
    } catch (err) {
      setError(err.message || "Could not compare Dijkstra and A*.");
    } finally {
      setLoading(false);
    }
  }

  const dijkstraOrder = comparison?.dijkstra?.exploration_order ?? [];
  const astarOrder = comparison?.astar?.exploration_order ?? [];
  const maxRaceSteps = useMemo(
    () => Math.max(dijkstraOrder.length, astarOrder.length, 1),
    [astarOrder.length, dijkstraOrder.length]
  );

  useEffect(() => {
    if (!comparison || !isRacePlaying) return undefined;

    const interval = window.setInterval(() => {
      setRaceStep((previous) => {
        if (previous >= maxRaceSteps - 1) {
          setIsRacePlaying(false);
          return previous;
        }

        return previous + 1;
      });
    }, 650);

    return () => window.clearInterval(interval);
  }, [comparison, isRacePlaying, maxRaceSteps]);

  function getExplorationPoints(order) {
    return order
      .slice(0, raceStep + 1)
      .map((name) => locations.nameLookup.get(String(name))?.mapPosition ?? null)
      .filter(Boolean);
  }

  function getCurrentExplorationMarker(order, type, label, title) {
    if (!order.length) return null;

    const currentName = order[Math.min(raceStep, order.length - 1)];
    const currentNode = locations.nameLookup.get(String(currentName));

    if (!currentNode?.mapPosition) return null;

    return {
      type,
      label,
      title,
      description: currentName,
      position: currentNode.mapPosition,
    };
  }

  const overlayRoutes = useMemo(() => {
    const routes = [];

    if (comparison?.dijkstra) {
      const points = getRenderableRoutePoints(
        comparison.dijkstra,
        locations.nameLookup
      );

      if (points.length > 1) {
        routes.push({
          type: "dijkstra",
          label: "Dijkstra Route",
          description: "Route generated by Dijkstra algorithm",
          points,
        });
      }
    }

    if (comparison?.astar) {
      const points = getRenderableRoutePoints(
        comparison.astar,
        locations.nameLookup
      );

      if (points.length > 1) {
        routes.push({
          type: "astar",
          label: "A* Route",
          description: "Route generated by A* algorithm",
          points,
        });
      }
    }

    const dijkstraExploration = getExplorationPoints(dijkstraOrder);
    const astarExploration = getExplorationPoints(astarOrder);

    if (dijkstraExploration.length > 1) {
      routes.push({
        type: "dijkstra-search",
        label: "Dijkstra exploration",
        description: "Visited-node race trail",
        points: dijkstraExploration,
      });
    }

    if (astarExploration.length > 1) {
      routes.push({
        type: "astar-search",
        label: "A* exploration",
        description: "Visited-node race trail",
        points: astarExploration,
      });
    }

    return routes;
  }, [astarOrder, comparison, dijkstraOrder, locations.nameLookup, raceStep]);

  const extraMarkers = useMemo(() => {
    const markers = [];

    const sourceNode = locations.nameLookup.get(form.source);
    const destinationNode = locations.nameLookup.get(form.destination);

    if (sourceNode?.mapPosition) {
      markers.push({
        type: "generic",
        label: "S",
        title: "Algorithm Source",
        description: form.source,
        position: sourceNode.mapPosition,
      });
    }

    if (destinationNode?.mapPosition) {
      markers.push({
        type: "prediction",
        label: "D",
        title: "Algorithm Destination",
        description: form.destination,
        position: destinationNode.mapPosition,
      });
    }

    const dijkstraMarker = getCurrentExplorationMarker(
      dijkstraOrder,
      "dijkstra",
      "D",
      "Dijkstra current node"
    );
    const astarMarker = getCurrentExplorationMarker(
      astarOrder,
      "astar",
      "A*",
      "A* current node"
    );

    if (dijkstraMarker) {
      markers.push(dijkstraMarker);
    }

    if (astarMarker) {
      markers.push(astarMarker);
    }

    return markers;
  }, [
    astarOrder,
    dijkstraOrder,
    form.destination,
    form.source,
    locations.nameLookup,
    raceStep,
  ]);

  const panel = (
    <PerformancePanel
      form={form}
      locations={locationOptions}
      loading={loading}
      comparison={comparison}
      locationLookup={locations.nameLookup}
      raceStep={raceStep}
      maxRaceSteps={maxRaceSteps}
      isRacePlaying={isRacePlaying}
      onToggleRace={() => setIsRacePlaying((value) => !value)}
      onRestartRace={() => {
        setRaceStep(0);
        setIsRacePlaying(Boolean(comparison));
      }}
      onStepRace={(step) => {
        setRaceStep(Math.max(0, Math.min(step, maxRaceSteps - 1)));
        setIsRacePlaying(false);
      }}
      onChange={handleChange}
      onSubmit={handleSubmit}
      error={error}
    />
  );

  return (
    <MapWorkspace
      panel={panel}
      overlayRoutes={overlayRoutes}
      extraMarkers={extraMarkers}
      showTraffic
      showExistingRoads
      showPotentialRoads={false}
    />
  );
}





function PlaceholderWorkspace({ title, eyebrow, description }) {
  const panel = (
    <div className="workspace-panel-stack">
      <section className="details-card hero-panel">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="workspace-panel-title">{title}</h1>
        <p className="workspace-panel-copy">{description}</p>
      </section>

      <section className="details-card">
        <h3>Coming Next</h3>
        <p className="workspace-panel-copy">
          This module will be connected after the emergency dispatch module is
          complete.
        </p>
      </section>
    </div>
  );

  return <MapWorkspace panel={panel} />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<OverviewWorkspace />} />

      <Route
        path="/network-map"
        element={<NetworkWorkspace />}
      />

      <Route
        path="/route-planner"
        element={<RoutePlannerWorkspace />}
      />

      <Route
        path="/emergency-routing"
        element={<EmergencyWorkspace />}
      />

      <Route path="/traffic-prediction" element={<TrafficPredictionWorkspace />} />

      <Route path="/traffic-signals" element={<TrafficSignalsWorkspace />} />

      <Route path="/infrastructure-optimizer" element={<InfrastructureWorkspace />} />


      <Route path="/public-transit" element={<TransitWorkspace />} />

     <Route path="/algorithm-race" element={<PerformanceWorkspace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
