import heapq
from typing import Any, Dict

from app.graph.graph import Graph


def dijkstra_shortest_path(
    graph: Graph,
    source: str,
    destination: str,
    weight: str = "distance",
) -> Dict[str, Any]:
    if not graph.has_node(source):
        available_nodes = graph.get_nodes()
        raise ValueError(
            f"Source node does not exist: {source}. "
            f"Available nodes: {available_nodes}"
        )

    if not graph.has_node(destination):
        available_nodes = graph.get_nodes()
        raise ValueError(
            f"Destination node does not exist: {destination}. "
            f"Available nodes: {available_nodes}"
        )

    distances = {node: float("inf") for node in graph.get_nodes()}
    previous_nodes = {node: None for node in graph.get_nodes()}

    distances[source] = 0

    priority_queue = [(0, source)]
    visited = set()

    while priority_queue:
        current_distance, current_node = heapq.heappop(priority_queue)

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

            new_distance = current_distance + float(edge_weight)

            if new_distance < distances[neighbor]:
                distances[neighbor] = new_distance
                previous_nodes[neighbor] = current_node
                heapq.heappush(priority_queue, (new_distance, neighbor))

    if distances[destination] == float("inf"):
        raise ValueError(f"No path found from {source} to {destination}")

    path = _reconstruct_path(previous_nodes, source, destination)

    return {
        "algorithm": "dijkstra",
        "source": source,
        "destination": destination,
        "path": path,
        "total_cost": round(distances[destination], 2),
        "weight_used": weight,
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