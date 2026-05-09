function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Backend assumption:
 * x = longitude
 * y = latitude
 *
 * Leaflet expects:
 * [latitude, longitude]
 */
export function getNodeLatLng(item) {
  if (!item) return null;

  const lng =
    toNumber(item.longitude) ??
    toNumber(item.lng) ??
    toNumber(item.lon) ??
    toNumber(item.x);

  const lat =
    toNumber(item.latitude) ??
    toNumber(item.lat) ??
    toNumber(item.y);

  if (lat == null || lng == null) return null;

  return [lat, lng];
}

export function normalizeLocation(item, kind = "node") {
  const mapPosition = getNodeLatLng(item);

  return {
    ...item,
    kind,
    nodeCategory: kind,
    mapPosition,
    mapReady: Boolean(mapPosition),
  };
}

export function buildLocationCollections(neighborhoods = [], facilities = []) {
  const normalizedNeighborhoods = neighborhoods.map((item) =>
    normalizeLocation(item, "neighborhood")
  );

  const normalizedFacilities = facilities.map((item) =>
    normalizeLocation(item, "facility")
  );

  const allLocations = [...normalizedNeighborhoods, ...normalizedFacilities];

  const idLookup = new Map();
  const nameLookup = new Map();

  allLocations.forEach((item) => {
    if (item?.id != null) {
      idLookup.set(String(item.id), item);
    }

    if (item?.name) {
      nameLookup.set(String(item.name), item);
    }
  });

  return {
    neighborhoods: normalizedNeighborhoods,
    facilities: normalizedFacilities,
    allLocations,
    idLookup,
    nameLookup,
  };
}

export function resolveRoadEndpoints(road, idLookup) {
  if (!road || !idLookup) return null;

  const fromId = String(
    road.from ??
      road.source_id ??
      road.source ??
      road.from_node ??
      road.start ??
      ""
  );

  const toId = String(
    road.to ??
      road.destination_id ??
      road.destination ??
      road.to_node ??
      road.end ??
      ""
  );

  const fromNode = idLookup.get(fromId);
  const toNode = idLookup.get(toId);

  if (!fromNode || !toNode) return null;
  if (!fromNode.mapPosition || !toNode.mapPosition) return null;

  return {
    fromNode,
    toNode,
    points: [fromNode.mapPosition, toNode.mapPosition],
  };
}

export function normalizeRoads(roads = [], idLookup) {
  return roads
    .map((road) => {
      const resolved = resolveRoadEndpoints(road, idLookup);

      if (!resolved) return null;

      return {
        ...road,
        id: String(road.id ?? road.road_id ?? `${resolved.fromNode.id}-${resolved.toNode.id}`),
        fromNode: resolved.fromNode,
        toNode: resolved.toNode,
        polyline: resolved.points,
      };
    })
    .filter(Boolean);
}

export function buildRoutePolylineFromPath(path = [], nameLookup) {
  if (!Array.isArray(path) || !path.length || !nameLookup) {
    return [];
  }

  return path
    .map((name) => {
      const node = nameLookup.get(String(name));
      return node?.mapPosition ?? null;
    })
    .filter(Boolean);
}

export function getMapBoundsPoints({
  neighborhoods = [],
  facilities = [],
  roads = [],
  extraRoutes = [],
  extraMarkers = [],
} = {}) {
  const locationPoints = [...neighborhoods, ...facilities]
    .map((item) => item.mapPosition)
    .filter(Boolean);

  const roadPoints = roads.flatMap((road) => road.polyline ?? []);

  const routePoints = extraRoutes.flatMap((route) => route.points ?? []);

  const markerPoints = extraMarkers
    .map((marker) => marker.position)
    .filter(Boolean);

  return [...locationPoints, ...roadPoints, ...routePoints, ...markerPoints];
}