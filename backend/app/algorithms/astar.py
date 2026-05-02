import heapq
from typing import Any, Dict

from app.graph.graph import Graph
from app.utils.geo_utils import estimate_geo_distance_km


def astar_shortest_path(
    graph: Graph,
    source: str,
    destination: str,
    coordinates: Dict[str, Dict[str, float]],
    weight: str = "distance",
) -> Dict[str, Any]:
    if not graph.has_node(source):
        raise ValueError(f"Source node does not exist: {source}")

    if not graph.has_node(destination):
        raise ValueError(f"Destination node does not exist: {destination}")

    if source not in coordinates:
        raise ValueError(f"Coordinates missing for source node: {source}")

    if destination not in coordinates:
        raise ValueError(f"Coordinates missing for destination node: {destination}")

    actual_costs = {node: float("inf") for node in graph.get_nodes()}
    previous_nodes = {node: None for node in graph.get_nodes()}

    actual_costs[source] = 0

    priority_queue = [
        (
            _heuristic(source, destination, coordinates),
            source,
        )
    ]

    visited = set()

    while priority_queue:
        _, current_node = heapq.heappop(priority_queue)

        if current_node in visited:
            continue

        visited.add(current_node)

        if current_node == destination:
            break

        for edge in graph.get_neighbors(current_node):
            neighbor = edge["to"]
            edge_weight = edge.get(weight)

            if edge_weight is None:
                edge_weight = edge.get("distance", 1)

            new_actual_cost = actual_costs[current_node] + float(edge_weight)

            if new_actual_cost < actual_costs[neighbor]:
                actual_costs[neighbor] = new_actual_cost
                previous_nodes[neighbor] = current_node

                estimated_total_cost = new_actual_cost + _heuristic(
                    neighbor,
                    destination,
                    coordinates,
                )

                heapq.heappush(
                    priority_queue,
                    (estimated_total_cost, neighbor),
                )

    if actual_costs[destination] == float("inf"):
        raise ValueError(f"No path found from {source} to {destination}")

    path = _reconstruct_path(previous_nodes, source, destination)

    return {
        "algorithm": "astar",
        "source": source,
        "destination": destination,
        "path": path,
        "total_cost": round(actual_costs[destination], 2),
        "weight_used": weight,
        "visited_nodes_count": len(visited),
    }


def _heuristic(
    current_node: str,
    destination: str,
    coordinates: Dict[str, Dict[str, float]],
) -> float:
    current_coordinates = coordinates.get(current_node)
    destination_coordinates = coordinates.get(destination)

    if not current_coordinates or not destination_coordinates:
        return 0

    return estimate_geo_distance_km(
        current_coordinates["x"],
        current_coordinates["y"],
        destination_coordinates["x"],
        destination_coordinates["y"],
    )


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