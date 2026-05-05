import heapq
from typing import Any, Dict

from app.graph.graph import Graph
from app.utils.cost_utils import estimate_travel_time_minutes, get_traffic_multiplier


def time_dependent_shortest_path(
    graph: Graph,
    source: str,
    destination: str,
    departure_time: str,
    day_type: str = "weekday",
) -> Dict[str, Any]:
    if not graph.has_node(source):
        raise ValueError(f"Source node does not exist: {source}")

    if not graph.has_node(destination):
        raise ValueError(f"Destination node does not exist: {destination}")

    traffic_multiplier = get_traffic_multiplier(
        departure_time=departure_time,
        day_type=day_type,
    )

    travel_times = {node: float("inf") for node in graph.get_nodes()}
    previous_nodes = {node: None for node in graph.get_nodes()}

    travel_times[source] = 0

    priority_queue = [(0, source)]
    visited = set()

    while priority_queue:
        current_time, current_node = heapq.heappop(priority_queue)

        if current_node in visited:
            continue

        visited.add(current_node)

        if current_node == destination:
            break

        for edge in graph.get_neighbors(current_node):
            neighbor = edge["to"]
            distance = float(edge.get("distance", 1))

            edge_travel_time = estimate_travel_time_minutes(
                distance_km=distance,
                traffic_multiplier=traffic_multiplier,
            )

            new_time = current_time + edge_travel_time

            if new_time < travel_times[neighbor]:
                travel_times[neighbor] = new_time
                previous_nodes[neighbor] = current_node
                heapq.heappush(priority_queue, (new_time, neighbor))

    if travel_times[destination] == float("inf"):
        raise ValueError(f"No path found from {source} to {destination}")

    path = _reconstruct_path(previous_nodes, source, destination)

    return {
        "algorithm": "time_dependent_dijkstra",
        "source": source,
        "destination": destination,
        "path": path,
        "departure_time": departure_time,
        "day_type": day_type,
        "traffic_multiplier": traffic_multiplier,
        "estimated_time_min": round(travel_times[destination], 2),
        "visited_nodes_count": len(visited),
    }


def _reconstruct_path(
    previous_nodes: Dict[str, str | None],
    source: str,
    destination: str,
) -> list[str]:
    path = []
    current_node = destination

    while current_node is not None:
        path.append(current_node)

        if current_node == source:
            break

        current_node = previous_nodes[current_node]

    path.reverse()
    return path