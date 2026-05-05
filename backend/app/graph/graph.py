from collections import defaultdict
from typing import Any, Dict, List


class Graph:
    def __init__(self):
        self.adjacency_list: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    def add_node(self, node: str) -> None:
        if node not in self.adjacency_list:
            self.adjacency_list[node] = []

    def add_edge(
        self,
        source: str,
        destination: str,
        distance: float,
        travel_time: float | None = None,
        road_id: str | None = None,
        capacity: int | None = None,
        condition: int | None = None,
        bidirectional: bool = True,
    ) -> None:
        self.add_node(source)
        self.add_node(destination)

        edge = {
            "to": destination,
            "distance": distance,
            "travel_time": travel_time if travel_time is not None else distance,
            "road_id": road_id,
            "capacity": capacity,
            "condition": condition,
        }

        self.adjacency_list[source].append(edge)

        if bidirectional:
            reverse_edge = {
                "to": source,
                "distance": distance,
                "travel_time": travel_time if travel_time is not None else distance,
                "road_id": road_id,
                "capacity": capacity,
                "condition": condition,
            }

            self.adjacency_list[destination].append(reverse_edge)

    def get_neighbors(self, node: str) -> List[Dict[str, Any]]:
        return self.adjacency_list.get(node, [])

    def has_node(self, node: str) -> bool:
        return node in self.adjacency_list

    def get_nodes(self) -> List[str]:
        return list(self.adjacency_list.keys())