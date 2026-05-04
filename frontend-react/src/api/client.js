const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

function buildUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (isJson) {
    return response.json();
  }

  const text = await response.text();
  return { message: text };
}

function extractErrorMessage(body, fallbackStatus) {
  return (
    body?.detail?.message ||
    body?.detail?.detail?.message ||
    body?.detail?.detail ||
    body?.detail ||
    body?.message ||
    `Request failed: ${fallbackStatus}`
  );
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const body = await parseResponse(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(body, response.status));
  }

  if (body?.success && body?.data !== undefined) {
    return body.data;
  }

  return body;
}

export function apiGet(path) {
  return request(path);
}

export function apiPost(path, body) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const routingApi = {
  timeDependentRoute(payload) {
    return apiPost("/api/routing/time-dependent", payload);
  },
  bestRouteByTime(payload) {
    return apiPost("/api/routing/best-route-by-time", payload);
  },
  compareDijkstraVsAstar(payload) {
    return apiPost("/api/routing/compare/dijkstra-vs-astar", payload);
  },
  emergencyRoute(payload) {
    return apiPost("/api/routing/emergency", payload);
  },
  publicTransitRoute(payload) {
    return apiPost("/api/routing/public-transit", payload);
  },
};

export const dataApi = {
  getNeighborhoods() {
    return apiGet("/api/data/neighborhoods");
  },
  getFacilities() {
    return apiGet("/api/data/facilities");
  },
  getExistingRoads() {
    return apiGet("/api/data/roads/existing");
  },
  getPotentialRoads() {
    return apiGet("/api/data/roads/potential");
  },
  getTrafficFlow() {
    return apiGet("/api/data/traffic-flow");
  },
  getMetroLines() {
    return apiGet("/api/data/metro-lines");
  },
  getBusRoutes() {
    return apiGet("/api/data/bus-routes");
  },
  getPublicTransportDemand() {
    return apiGet("/api/data/public-transport-demand");
  },
  getSummary() {
    return apiGet("/api/data/summary");
  },
};

export const networkApi = {
  getMinimumSpanningTree() {
    return apiGet("/api/network/minimum-spanning-tree");
  },
  getInfrastructurePlan() {
    return apiGet("/api/network/infrastructure-plan");
  },
  optimizeExpansion(payload) {
    return apiPost("/api/network/optimize-expansion", payload);
  },
  createMaintenancePlan(payload) {
    return apiPost("/api/network/maintenance-plan", payload);
  },
};

export const predictionApi = {
  predictTraffic(payload) {
    return apiPost("/api/prediction/traffic", payload);
  },
  predictRouteTraffic(payload) {
    return apiPost("/api/prediction/route-traffic", payload);
  },
  getModelMetrics() {
    return apiGet("/api/prediction/model-metrics");
  },
};

export const trafficApi = {
  optimizeSignals(payload) {
    return apiPost("/api/traffic/signals/optimize", payload);
  },
  getCongestionHotspots() {
    return apiGet("/api/traffic/congestion-hotspots");
  },
  getIntersectionsStatus() {
    return apiGet("/api/traffic/intersections/status");
  },
};

export const transitApi = {
  allocateBuses(payload) {
    return apiPost("/api/transit/allocate-buses", payload);
  },
};

export { API_BASE_URL };
