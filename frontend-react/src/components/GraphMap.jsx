import { useMemo, useState } from "react";

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

const DEFAULT_NODE_COLOR = "#475569";

function normalizeRoadKey(a, b) {
  return [String(a), String(b)].sort().join("::");
}

function getTrafficStyle(road, trafficLookup, selectedTime) {
  const traffic = trafficLookup[String(road.id)];
  const flow = traffic?.[selectedTime];
  const capacity = Number(road.capacity_vehicles_per_hour || 0);

  if (flow == null || !capacity) {
    return { stroke: "#94a3b8", width: 2, opacity: 0.7 };
  }

  const ratio = flow / capacity;

  if (ratio >= 1.0) return { stroke: "#dc2626", width: 5, opacity: 0.95 };
  if (ratio >= 0.8) return { stroke: "#f97316", width: 4, opacity: 0.92 };
  if (ratio >= 0.6) return { stroke: "#eab308", width: 3.5, opacity: 0.9 };

  return { stroke: "#16a34a", width: 3, opacity: 0.85 };
}

function shortenLabel(name) {
  if (!name) return "";
  if (name.length <= 14) return name;
  return `${name.slice(0, 13)}…`;
}

export default function GraphMap({
  neighborhoods = [],
  facilities = [],
  existingRoads = [],
  potentialRoads = [],
  trafficFlow = [],
  mstData = null,
  selectedTime = "morning_peak",
  showNeighborhoods = true,
  showFacilities = true,
  showExistingRoads = true,
  showPotentialRoads = false,
  showTrafficOverlay = true,
  showMstOverlay = false,
  selectedElement = null,
  onSelectNode,
  onSelectEdge,
}) {
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState(null);

  const width = 1060;
  const height = 700;
  const padding = 72;

  const nodeLookup = useMemo(() => {
    const lookup = {};

    neighborhoods.forEach((item) => {
      lookup[String(item.id)] = {
        ...item,
        nodeCategory: "neighborhood",
      };
    });

    facilities.forEach((item) => {
      lookup[String(item.id)] = {
        ...item,
        nodeCategory: "facility",
      };
    });

    return lookup;
  }, [neighborhoods, facilities]);

  const trafficLookup = useMemo(() => {
    const lookup = {};
    trafficFlow.forEach((record) => {
      lookup[String(record.road_id || record.id || "")] = record;
    });
    return lookup;
  }, [trafficFlow]);

  const mstLookup = useMemo(() => {
    const lookup = {};
    if (!mstData?.selected_edges) return lookup;

    mstData.selected_edges.forEach((edge) => {
      if (edge.source && edge.destination) {
        lookup[normalizeRoadKey(edge.source, edge.destination)] = true;
      }
    });

    return lookup;
  }, [mstData]);

  const allNodes = [
    ...(showNeighborhoods ? neighborhoods : []),
    ...(showFacilities ? facilities : []),
  ];

  if (!allNodes.length) {
    return <div className="empty-state">No nodes available to display.</div>;
  }

  const xs = allNodes.map((node) => Number(node.x));
  const ys = allNodes.map((node) => Number(node.y));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  function mapPoint(x, y) {
    const normalizedX =
      (Number(x) - minX) / Math.max(maxX - minX, 0.000001);
    const normalizedY =
      (Number(y) - minY) / Math.max(maxY - minY, 0.000001);

    return {
      x: padding + normalizedX * (width - padding * 2),
      y: height - padding - normalizedY * (height - padding * 2),
    };
  }

  function getNodeRadius(node) {
    if (node.nodeCategory === "facility") return 8;

    const population = Number(node.population || 0);

    if (population >= 500000) return 11;
    if (population >= 300000) return 10;
    if (population >= 150000) return 9;

    return 8;
  }

  function shouldShowLabel(node, isSelected, isHovered) {
    if (isSelected || isHovered) return true;
    if (node.nodeCategory === "facility") return true;

    const population = Number(node.population || 0);
    return population >= 400000;
  }

  function resolveRoadEndpoints(road) {
    const fromNode = nodeLookup[String(road.from)];
    const toNode = nodeLookup[String(road.to)];

    if (!fromNode || !toNode) return null;

    return {
      fromNode,
      toNode,
      fromPoint: mapPoint(fromNode.x, fromNode.y),
      toPoint: mapPoint(toNode.x, toNode.y),
    };
  }

  const renderedExistingRoads = showExistingRoads
    ? existingRoads
        .map((road) => {
          const resolved = resolveRoadEndpoints(road);
          if (!resolved) return null;

          const roadKey = normalizeRoadKey(
            resolved.fromNode.name,
            resolved.toNode.name
          );

          const isMstEdge = Boolean(mstLookup[roadKey]);

          let style = { stroke: "#94a3b8", width: 2, opacity: 0.7 };

          if (showTrafficOverlay) {
            style = getTrafficStyle(road, trafficLookup, selectedTime);
          }

          if (showMstOverlay) {
            if (isMstEdge) {
              style = { stroke: "#10b981", width: 5, opacity: 1 };
            } else {
              style = { ...style, opacity: 0.22 };
            }
          }

          return {
            ...road,
            ...resolved,
            style,
            isMstEdge,
          };
        })
        .filter(Boolean)
    : [];

  const renderedPotentialRoads = showPotentialRoads
    ? potentialRoads
        .map((road) => {
          const resolved = resolveRoadEndpoints(road);
          if (!resolved) return null;

          return {
            ...road,
            ...resolved,
          };
        })
        .filter(Boolean)
    : [];

  return (
    <div className="graph-map-wrapper">
      <svg
        className="graph-map-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Network map"
      >
        {Array.from({ length: 10 }).map((_, index) => {
          const x = padding + (index * (width - padding * 2)) / 9;

          return (
            <line
              key={`grid-x-${index}`}
              x1={x}
              y1={padding}
              x2={x}
              y2={height - padding}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {Array.from({ length: 8 }).map((_, index) => {
          const y = padding + (index * (height - padding * 2)) / 7;

          return (
            <line
              key={`grid-y-${index}`}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          );
        })}

        {renderedExistingRoads.map((road) => {
          const isSelected =
            selectedElement?.kind === "edge" &&
            selectedElement?.data?.id === road.id;

          const isHovered = hoveredEdgeId === road.id;

          return (
            <g key={`existing-${road.id}`}>
              <line
                x1={road.fromPoint.x}
                y1={road.fromPoint.y}
                x2={road.toPoint.x}
                y2={road.toPoint.y}
                stroke={road.style.stroke}
                strokeWidth={
                  isSelected || isHovered ? road.style.width + 1 : road.style.width
                }
                opacity={road.style.opacity}
                className="map-edge"
              />

              <line
                x1={road.fromPoint.x}
                y1={road.fromPoint.y}
                x2={road.toPoint.x}
                y2={road.toPoint.y}
                stroke="transparent"
                strokeWidth="14"
                className="map-edge-hitbox"
                onMouseEnter={() => setHoveredEdgeId(road.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
                onClick={() =>
                  onSelectEdge?.({
                    ...road,
                    roadCategory: "existing",
                    flow: trafficLookup[String(road.id)]?.[selectedTime] ?? null,
                  })
                }
              />
            </g>
          );
        })}

        {renderedPotentialRoads.map((road) => {
          const isSelected =
            selectedElement?.kind === "edge" &&
            selectedElement?.data?.id === road.id;

          const isHovered = hoveredEdgeId === road.id;

          return (
            <g key={`potential-${road.id || `${road.from}-${road.to}`}`}>
              <line
                x1={road.fromPoint.x}
                y1={road.fromPoint.y}
                x2={road.toPoint.x}
                y2={road.toPoint.y}
                stroke="#fb923c"
                strokeDasharray="8 6"
                strokeWidth={isSelected || isHovered ? 4 : 3}
                opacity={0.9}
                className="map-edge"
              />

              <line
                x1={road.fromPoint.x}
                y1={road.fromPoint.y}
                x2={road.toPoint.x}
                y2={road.toPoint.y}
                stroke="transparent"
                strokeWidth="14"
                className="map-edge-hitbox"
                onMouseEnter={() => setHoveredEdgeId(road.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
                onClick={() =>
                  onSelectEdge?.({
                    ...road,
                    roadCategory: "potential",
                  })
                }
              />
            </g>
          );
        })}

        {allNodes.map((node) => {
          const nodeData = nodeLookup[String(node.id)] || node;
          const point = mapPoint(node.x, node.y);
          const fill = NODE_COLORS[node.type] || DEFAULT_NODE_COLOR;
          const radius = getNodeRadius(nodeData);

          const isSelected =
            selectedElement?.kind === "node" &&
            selectedElement?.data?.id === node.id;

          const isHovered = hoveredNodeId === node.id;
          const labelVisible = shouldShowLabel(nodeData, isSelected, isHovered);
          const labelText =
            isSelected || isHovered ? node.name : shortenLabel(node.name);

          return (
            <g
              key={`node-${node.id}`}
              className="map-node"
              onClick={() => onSelectNode?.(nodeData)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={isSelected || isHovered ? radius + 1.5 : radius}
                fill={fill}
                stroke="#ffffff"
                strokeWidth="3"
              />

              {labelVisible && (
                <text
                  x={point.x}
                  y={point.y - (radius + 10)}
                  textAnchor="middle"
                  className={`map-node-label ${
                    isSelected ? "selected" : isHovered ? "hovered" : ""
                  }`}
                >
                  {labelText}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}