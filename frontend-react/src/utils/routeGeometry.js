export function getRenderableRoutePoints(routeLike, nameLookup) {
  if (!routeLike) return [];

  if (
    Array.isArray(routeLike.route_geometry) &&
    routeLike.route_geometry.length > 1
  ) {
    return routeLike.route_geometry
      .filter(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          Number.isFinite(Number(point[0])) &&
          Number.isFinite(Number(point[1]))
      )
      .map((point) => [Number(point[0]), Number(point[1])]);
  }

  const path = routeLike.path ?? [];

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

export function edgeGeometryOrFallback(edge, nameLookup) {
  if (!edge) return [];

  if (
    Array.isArray(edge.route_geometry) &&
    edge.route_geometry.length > 1
  ) {
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

  const source = edge?.source;
  const destination = edge?.destination;

  if (!source || !destination || !nameLookup) {
    return [];
  }

  return [source, destination]
    .map((name) => {
      const node = nameLookup.get(String(name));
      return node?.mapPosition ?? null;
    })
    .filter(Boolean);
}