import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Pane,
  Polyline,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { getMapBoundsPoints } from "../utils/mapAdapters";

const DEFAULT_CENTER = [30.0444, 31.2357];

const NODE_COLORS = {
  Residential: "#2563eb",
  Mixed: "#16a34a",
  Business: "#7c3aed",
  Government: "#dc2626",
  Industrial: "#ea580c",
  Airport: "#eab308",
  "Transit Hub": "#0f766e",
  Education: "#9333ea",
  Tourism: "#f59e0b",
  Sports: "#f97316",
  Commercial: "#0891b2",
  Medical: "#ec4899",
};

const DEFAULT_NODE_COLOR = "#2563eb";

function FitToData({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const bounds = L.latLngBounds(points);

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [42, 42],
        maxZoom: 13,
      });
    }
  }, [map, points]);

  return null;
}

function createMarkerIcon(type = "generic", label = "•") {
  return L.divIcon({
    className: "dispatch-marker",
    html: `<div class="dispatch-marker-inner ${type}">${label}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function getTrafficStyle(road, trafficLookup, selectedTime, isSelected = false) {
  const roadId = String(road.id ?? road.road_id ?? "");

  const record =
    trafficLookup?.get?.(roadId) ??
    trafficLookup?.[roadId] ??
    null;

  const flow = Number(record?.[selectedTime] ?? 0);

  const capacity = Number(
    road.capacity_vehicles_per_hour ??
      road.estimated_capacity_vehicles_per_hour ??
      0
  );

  let style = {
    color: "#94a3b8",
    weight: 4,
    opacity: 0.72,
  };

  if (capacity > 0 && flow > 0) {
    const ratio = flow / capacity;

    if (ratio >= 1) {
      style = {
        color: "#dc2626",
        weight: 6,
        opacity: 0.95,
      };
    } else if (ratio >= 0.8) {
      style = {
        color: "#f97316",
        weight: 5,
        opacity: 0.9,
      };
    } else if (ratio >= 0.6) {
      style = {
        color: "#eab308",
        weight: 5,
        opacity: 0.88,
      };
    } else {
      style = {
        color: "#16a34a",
        weight: 4,
        opacity: 0.82,
      };
    }
  }

  if (isSelected) {
    return {
      ...style,
      weight: style.weight + 3,
      opacity: 1,
    };
  }

  return style;
}

function getOverlayStyle(type = "route") {
  switch (type) {
    case "ambulance":
      return { color: "#06b6d4", weight: 8, opacity: 0.96 };

    case "police":
      return {
        color: "#6366f1",
        weight: 8,
        opacity: 0.96,
        dashArray: "12 8",
      };

    case "fire_truck":
      return { color: "#ef4444", weight: 8, opacity: 0.96 };

    case "best-route":
      return { color: "#0ea5e9", weight: 8, opacity: 0.95 };

    case "normal-route":
      return {
        color: "#64748b",
        weight: 6,
        opacity: 0.8,
        dashArray: "10 8",
      };

    case "transit":
      return { color: "#8b5cf6", weight: 7, opacity: 0.92 };

    case "predicted-route":
      return { color: "#14b8a6", weight: 7, opacity: 0.92 };

    case "dijkstra":
      return { color: "#f97316", weight: 7, opacity: 0.94 };

    case "astar":
      return { color: "#22c55e", weight: 7, opacity: 0.94 };

    case "dijkstra-search":
      return {
        color: "#f97316",
        weight: 4,
        opacity: 0.86,
        dashArray: "6 7",
      };

    case "astar-search":
      return {
        color: "#22c55e",
        weight: 4,
        opacity: 0.86,
        dashArray: "6 7",
      };

    case "mst":
      return { color: "#10b981", weight: 7, opacity: 0.94 };

    case "expansion":
      return {
        color: "#fb923c",
        weight: 7,
        opacity: 0.92,
        dashArray: "14 8",
      };

    case "maintenance":
      return {
        color: "#0ea5e9",
        weight: 7,
        opacity: 0.9,
        dashArray: "4 7",
      };

    default:
      return { color: "#2563eb", weight: 7, opacity: 0.92 };
  }
}

function getNodeLabel(node) {
  return node.name ?? node.label ?? `Node ${node.id ?? ""}`;
}

function getNodeType(node) {
  return node.type ?? node.category ?? node.kind ?? "Location";
}

export default function RealMap({
  neighborhoods = [],
  facilities = [],
  roads = [],
  trafficLookup = new Map(),
  selectedTime = "morning_peak",
  selectedElement = null,
  onSelectNode,
  onSelectRoad,
  extraRoutes = [],
  extraMarkers = [],
}) {
  const boundsPoints = useMemo(() => {
    return getMapBoundsPoints({
      neighborhoods,
      facilities,
      roads,
      extraRoutes,
      extraMarkers,
    });
  }, [neighborhoods, facilities, roads, extraRoutes, extraMarkers]);

  const allNodes = useMemo(() => {
    return [...neighborhoods, ...facilities].filter(
      (node) => node.mapReady && node.mapPosition
    );
  }, [neighborhoods, facilities]);

  const selectedRoadId =
    selectedElement?.kind === "edge"
      ? String(selectedElement?.data?.id ?? selectedElement?.data?.road_id ?? "")
      : "";

  return (
    <div className="real-map-shell">
      <MapContainer
        className="real-map"
        center={DEFAULT_CENTER}
        zoom={11}
        zoomControl={false}
        scrollWheelZoom
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToData points={boundsPoints} />

        <Pane name="roads-pane" style={{ zIndex: 410 }}>
          {roads.map((road) => {
            const id = String(road.id ?? road.road_id ?? "");
            const isSelected = selectedRoadId === id;

            return (
              <Polyline
                key={id}
                positions={road.polyline}
                pathOptions={getTrafficStyle(
                  road,
                  trafficLookup,
                  selectedTime,
                  isSelected
                )}
                eventHandlers={{
                  click: () => onSelectRoad?.(road),
                }}
              >
                <Popup>
                  <strong>
                    {road.name ??
                      `${road.fromNode?.name ?? "Unknown"} → ${
                        road.toNode?.name ?? "Unknown"
                      }`}
                  </strong>
                  <br />
                  Capacity:{" "}
                  {road.capacity_vehicles_per_hour ??
                    road.estimated_capacity_vehicles_per_hour ??
                    "N/A"}
                  <br />
                  Distance: {road.distance_km ?? road.length_km ?? "N/A"} km
                </Popup>
              </Polyline>
            );
          })}
        </Pane>

        <Pane name="routes-pane" style={{ zIndex: 430 }}>
          {extraRoutes.map((route, index) => {
            if (!Array.isArray(route.points) || route.points.length < 2) {
              return null;
            }

            return (
              <Polyline
                key={`${route.type ?? "route"}-${index}`}
                positions={route.points}
                pathOptions={getOverlayStyle(route.type)}
              >
                <Popup>
                  <strong>{route.label ?? "Route"}</strong>
                  {route.description ? (
                    <>
                      <br />
                      {route.description}
                    </>
                  ) : null}
                </Popup>
              </Polyline>
            );
          })}
        </Pane>

        <Pane name="nodes-pane" style={{ zIndex: 450 }}>
          {allNodes.map((node) => {
            const label = getNodeLabel(node);
            const type = getNodeType(node);
            const color = NODE_COLORS[type] ?? DEFAULT_NODE_COLOR;
            const radius = node.kind === "facility" ? 7 : 8;

            return (
              <CircleMarker
                key={`${node.kind}-${node.id ?? label}`}
                center={node.mapPosition}
                radius={radius}
                pathOptions={{
                  color: "#ffffff",
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.92,
                  opacity: 1,
                }}
                eventHandlers={{
                  click: () => onSelectNode?.(node),
                }}
              >
                <Popup>
                  <strong>{label}</strong>
                  <br />
                  Type: {type}
                  <br />
                  ID: {node.id ?? "N/A"}
                </Popup>
              </CircleMarker>
            );
          })}
        </Pane>

        <Pane name="markers-pane" style={{ zIndex: 470 }}>
          {extraMarkers.map((marker, index) => {
            if (!marker.position) return null;

            return (
              <Marker
                key={`${marker.type ?? "marker"}-${index}`}
                position={marker.position}
                icon={createMarkerIcon(marker.type, marker.label ?? "•")}
              >
                <Popup>
                  <strong>{marker.title ?? "Marker"}</strong>
                  {marker.description ? (
                    <>
                      <br />
                      {marker.description}
                    </>
                  ) : null}
                </Popup>
              </Marker>
            );
          })}
        </Pane>
      </MapContainer>
    </div>
  );
}
