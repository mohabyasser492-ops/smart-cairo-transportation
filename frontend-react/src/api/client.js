const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let body = null;
  if (isJson) {
    body = await response.json();
  } else {
    const text = await response.text();
    body = { message: text };
  }

  if (!response.ok) {
    const message =
      body?.detail?.message ||
      body?.detail?.detail?.message ||
      body?.detail?.detail ||
      body?.detail ||
      body?.message ||
      `Request failed: ${response.status}`;

    throw new Error(message);
  }

  // unwrap backend success response
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
  
};