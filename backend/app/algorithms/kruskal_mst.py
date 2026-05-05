from typing import Any, Dict, List


class DisjointSet:
    def __init__(self, nodes: List[str]):
        self.parent = {node: node for node in nodes}
        self.rank = {node: 0 for node in nodes}

    def find(self, node: str) -> str:
        if self.parent[node] != node:
            self.parent[node] = self.find(self.parent[node])

        return self.parent[node]

    def union(self, node_a: str, node_b: str) -> bool:
        root_a = self.find(node_a)
        root_b = self.find(node_b)

        if root_a == root_b:
            return False

        if self.rank[root_a] < self.rank[root_b]:
            self.parent[root_a] = root_b
        elif self.rank[root_a] > self.rank[root_b]:
            self.parent[root_b] = root_a
        else:
            self.parent[root_b] = root_a
            self.rank[root_a] += 1

        return True


def kruskal_minimum_spanning_tree(
    nodes: List[str],
    edges: List[Dict[str, Any]],
    weight_key: str = "cost",
) -> Dict[str, Any]:
    disjoint_set = DisjointSet(nodes)

    sorted_edges = sorted(
        edges,
        key=lambda edge: float(edge.get(weight_key, edge.get("distance_km", 1))),
    )

    selected_edges = []
    total_cost = 0.0
    total_distance = 0.0

    for edge in sorted_edges:
        source = edge["source"]
        destination = edge["destination"]
        edge_cost = float(edge.get(weight_key, edge.get("distance_km", 1)))
        edge_distance = float(edge.get("distance_km", edge_cost))

        if disjoint_set.union(source, destination):
            selected_edges.append(edge)
            total_cost += edge_cost
            total_distance += edge_distance

        if len(selected_edges) == len(nodes) - 1:
            break

    connected = len(selected_edges) == len(nodes) - 1

    return {
        "algorithm": "kruskal_mst",
        "connected": connected,
        "nodes_count": len(nodes),
        "selected_edges_count": len(selected_edges),
        "selected_edges": selected_edges,
        "total_cost": round(total_cost, 2),
        "total_distance_km": round(total_distance, 2),
    }