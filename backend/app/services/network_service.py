from typing import Any, Dict, List

from app.algorithms.kruskal_mst import kruskal_minimum_spanning_tree
from app.services.data_service import data_service


class NetworkService:
    def get_minimum_spanning_tree(self) -> Dict[str, Any]:
        nodes = self._get_neighborhood_names()
        edges = self._get_existing_road_edges(cost_per_km=1)

        return kruskal_minimum_spanning_tree(
            nodes=nodes,
            edges=edges,
            weight_key="distance_km",
        )

    def get_infrastructure_plan(self) -> Dict[str, Any]:
        mst_result = self.get_minimum_spanning_tree()

        return {
            "plan_name": "Cairo Core Connectivity Plan",
            "objective": "Connect all neighborhoods using minimum total road distance.",
            "algorithm_used": "Kruskal Minimum Spanning Tree",
            "mst": mst_result,
            "planning_notes": [
                "Selected roads minimize total network distance.",
                "The plan avoids unnecessary cycles.",
                "Road condition and traffic capacity can be added as future optimization constraints.",
            ],
        }

    def optimize_expansion(
        self,
        use_potential_roads: bool = True,
        cost_per_km: float = 10_000_000,
        priority: str = "cost",
    ) -> Dict[str, Any]:
        nodes = self._get_neighborhood_names()
        edges = self._get_existing_road_edges(cost_per_km=cost_per_km)

        if use_potential_roads:
            edges.extend(self._get_potential_road_edges(cost_per_km=cost_per_km))

        weight_key = "construction_cost"

        if priority == "distance":
            weight_key = "distance_km"

        mst_result = kruskal_minimum_spanning_tree(
            nodes=nodes,
            edges=edges,
            weight_key=weight_key,
        )

        return {
            "optimization_type": "road_network_expansion",
            "use_potential_roads": use_potential_roads,
            "priority": priority,
            "cost_per_km": cost_per_km,
            "result": mst_result,
            "summary": {
                "selected_roads": mst_result["selected_edges_count"],
                "total_distance_km": mst_result["total_distance_km"],
                "estimated_total_cost": mst_result["total_cost"],
                "network_connected": mst_result["connected"],
            },
        }

    def _get_neighborhood_names(self) -> List[str]:
        neighborhoods_data = data_service.get_neighborhoods()
        neighborhoods = self._extract_list(
            neighborhoods_data,
            possible_keys=["neighborhoods", "data", "items", "records"],
        )

        return [
            neighborhood["name"]
            for neighborhood in neighborhoods
            if neighborhood.get("id") is not None and neighborhood.get("name") is not None
        ]

    def _get_existing_road_edges(self, cost_per_km: float) -> List[Dict[str, Any]]:
        roads_data = data_service.get_existing_roads()

        roads = self._extract_list(
            roads_data,
            possible_keys=["roads", "existing_roads", "data", "items", "records"],
        )

        return self._convert_roads_to_edges(
            roads=roads,
            cost_per_km=cost_per_km,
            road_type="existing",
        )

    def _get_potential_road_edges(self, cost_per_km: float) -> List[Dict[str, Any]]:
        roads_data = data_service.get_potential_roads()

        roads = self._extract_list(
            roads_data,
            possible_keys=["roads", "potential_roads", "data", "items", "records"],
        )

        return self._convert_roads_to_edges(
            roads=roads,
            cost_per_km=cost_per_km,
            road_type="potential",
        )

    def _convert_roads_to_edges(
        self,
        roads: List[Dict[str, Any]],
        cost_per_km: float,
        road_type: str,
    ) -> List[Dict[str, Any]]:
        node_lookup = self._build_node_lookup()
        edges = []

        for road in roads:
            raw_source = str(road.get("from") or road.get("source"))
            raw_destination = str(road.get("to") or road.get("destination"))

            source = node_lookup.get(raw_source, raw_source)
            destination = node_lookup.get(raw_destination, raw_destination)

            distance_km = float(
                road.get("distance_km")
                or road.get("distance")
                or road.get("length_km")
                or 1
            )

            construction_cost = float(
                road.get("construction_cost")
                or road.get("cost")
                or distance_km * cost_per_km
            )

            edges.append(
                {
                    "road_id": road.get("id") or road.get("road_id"),
                    "source": source,
                    "destination": destination,
                    "distance_km": distance_km,
                    "construction_cost": construction_cost,
                    "capacity_vehicles_per_hour": road.get("capacity_vehicles_per_hour"),
                    "condition": road.get("condition"),
                    "road_type": road_type,
                }
            )

        return edges

    def _build_node_lookup(self) -> Dict[str, str]:
        neighborhoods_data = data_service.get_neighborhoods()
        neighborhoods = self._extract_list(
            neighborhoods_data,
            possible_keys=["neighborhoods", "data", "items", "records"],
        )

        lookup = {}

        for neighborhood in neighborhoods:
            node_id = neighborhood.get("id")
            node_name = neighborhood.get("name")

            if node_id is not None and node_name is not None:
                lookup[str(node_id)] = node_name

        return lookup

    @staticmethod
    def _extract_list(data, possible_keys):
        if isinstance(data, list):
            return data

        if isinstance(data, dict):
            for key in possible_keys:
                if key in data and isinstance(data[key], list):
                    return data[key]

        return []


network_service = NetworkService()