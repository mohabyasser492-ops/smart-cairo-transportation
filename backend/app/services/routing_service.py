from app.algorithms.astar import astar_shortest_path
from app.algorithms.dijkstra import dijkstra_shortest_path
from app.algorithms.time_dependent_routing import time_dependent_shortest_path
from app.graph.build_graph import build_road_graph
from app.services.data_service import data_service


class RoutingService:
    def find_shortest_path(
        self,
        source: str,
        destination: str,
        weight: str = "distance",
    ):
        graph = build_road_graph()

        return dijkstra_shortest_path(
            graph=graph,
            source=source,
            destination=destination,
            weight=weight,
        )

    def find_astar_path(
        self,
        source: str,
        destination: str,
        weight: str = "distance",
    ):
        graph = build_road_graph()
        coordinates = self._get_neighborhood_coordinates()

        return astar_shortest_path(
            graph=graph,
            source=source,
            destination=destination,
            coordinates=coordinates,
            weight=weight,
        )

    def find_emergency_route(
        self,
        source: str,
        destination: str,
        emergency_type: str = "ambulance",
    ):
        dijkstra_result = self.find_shortest_path(
            source=source,
            destination=destination,
            weight="distance",
        )

        astar_result = self.find_astar_path(
            source=source,
            destination=destination,
            weight="distance",
        )

        dijkstra_cost = self._extract_total_cost(dijkstra_result)
        astar_cost = self._extract_total_cost(astar_result)

        dijkstra_visited = dijkstra_result.get("visited_nodes_count", float("inf"))
        astar_visited = astar_result.get("visited_nodes_count", float("inf"))

        if astar_cost < dijkstra_cost:
            chosen_algorithm = "astar"
            chosen_base = astar_result
            reason = "A* was selected because it produced a lower total route cost."
        elif dijkstra_cost < astar_cost:
            chosen_algorithm = "dijkstra"
            chosen_base = dijkstra_result
            reason = "Dijkstra was selected because it produced a lower total route cost."
        else:
            if astar_visited <= dijkstra_visited:
                chosen_algorithm = "astar"
                chosen_base = astar_result
                reason = (
                    "A* and Dijkstra had equal route cost, so A* was selected "
                    "because it explored fewer or equal nodes."
                )
            else:
                chosen_algorithm = "dijkstra"
                chosen_base = dijkstra_result
                reason = (
                    "A* and Dijkstra had equal route cost, so Dijkstra was selected "
                    "because it explored fewer nodes."
                )

        estimated_time_min = self._estimate_emergency_time_minutes(
            total_distance_km=self._extract_total_cost(chosen_base),
            emergency_type=emergency_type,
        )

        result = {
            **chosen_base,
            "emergency_type": emergency_type,
            "priority": "high",
            "recommended_action": "Dispatch immediately using the fastest available route",
            "chosen_algorithm": chosen_algorithm,
            "selection_reason": reason,
            "estimated_time_min": estimated_time_min,
            "comparison": {
                "dijkstra": dict(dijkstra_result),
                "astar": dict(astar_result),
            },
        }

        return result

    def compare_dijkstra_and_astar(
        self,
        source: str,
        destination: str,
        weight: str = "distance",
    ):
        dijkstra_result = self.find_shortest_path(
            source=source,
            destination=destination,
            weight=weight,
        )

        astar_result = self.find_astar_path(
            source=source,
            destination=destination,
            weight=weight,
        )

        dijkstra_cost = self._extract_total_cost(dijkstra_result)
        astar_cost = self._extract_total_cost(astar_result)

        dijkstra_visited = dijkstra_result.get("visited_nodes_count", float("inf"))
        astar_visited = astar_result.get("visited_nodes_count", float("inf"))

        if astar_cost < dijkstra_cost:
            winner = "astar"
            winner_reason = "A* wins because it produced a lower total route cost."
        elif dijkstra_cost < astar_cost:
            winner = "dijkstra"
            winner_reason = "Dijkstra wins because it produced a lower total route cost."
        else:
            if astar_visited < dijkstra_visited:
                winner = "astar"
                winner_reason = (
                    "Both algorithms had equal total cost, so A* wins because it visited fewer nodes."
                )
            elif dijkstra_visited < astar_visited:
                winner = "dijkstra"
                winner_reason = (
                    "Both algorithms had equal total cost, so Dijkstra wins because it visited fewer nodes."
                )
            else:
                winner = "tie"
                winner_reason = (
                    "Both algorithms had equal total cost and visited the same number of nodes."
                )

        return {
            "source": source,
            "destination": destination,
            "weight_used": weight,
            "dijkstra": dijkstra_result,
            "astar": astar_result,
            "summary": {
                "dijkstra_visited_nodes": dijkstra_result["visited_nodes_count"],
                "astar_visited_nodes": astar_result["visited_nodes_count"],
                "dijkstra_total_cost": dijkstra_result["total_cost"],
                "astar_total_cost": astar_result["total_cost"],
                "dijkstra_runtime_ms": dijkstra_result.get("runtime_ms", 0),
                "astar_runtime_ms": astar_result.get("runtime_ms", 0),
                "winner": winner,
                "winner_reason": winner_reason,
                "astar_more_efficient": astar_result["visited_nodes_count"]
                <= dijkstra_result["visited_nodes_count"],
                "max_exploration_steps": max(
                    len(dijkstra_result.get("exploration_order", [])),
                    len(astar_result.get("exploration_order", [])),
                ),
            },
        }

    def _get_neighborhood_coordinates(self):
        neighborhoods_data = data_service.get_neighborhoods()

        if isinstance(neighborhoods_data, dict):
            neighborhoods = neighborhoods_data.get("neighborhoods", [])
        else:
            neighborhoods = neighborhoods_data

        coordinates = {}

        for neighborhood in neighborhoods:
            name = neighborhood.get("name")
            x = neighborhood.get("x")
            y = neighborhood.get("y")

            if name is not None and x is not None and y is not None:
                coordinates[name] = {
                    "x": float(x),
                    "y": float(y),
                }

        return coordinates

    def find_time_dependent_route(
        self,
        source: str,
        destination: str,
        departure_time: str,
        day_type: str = "weekday",
    ):
        graph = build_road_graph()

        return time_dependent_shortest_path(
            graph=graph,
            source=source,
            destination=destination,
            departure_time=departure_time,
            day_type=day_type,
        )

    def find_best_route_by_time(
        self,
        source: str,
        destination: str,
        departure_time: str,
        day_type: str = "weekday",
    ):
        normal_route = self.find_shortest_path(
            source=source,
            destination=destination,
            weight="distance",
        )

        time_dependent_route = self.find_time_dependent_route(
            source=source,
            destination=destination,
            departure_time=departure_time,
            day_type=day_type,
        )

        return {
            "source": source,
            "destination": destination,
            "departure_time": departure_time,
            "day_type": day_type,
            "normal_shortest_route": normal_route,
            "traffic_aware_route": time_dependent_route,
            "recommendation": {
                "recommended_algorithm": "time_dependent_dijkstra",
                "reason": "This route considers traffic conditions based on departure time.",
            },
        }

    def _extract_total_cost(self, result):
        if result is None:
            return float("inf")

        if "total_cost" in result and result["total_cost"] is not None:
            return float(result["total_cost"])

        if "cost" in result and result["cost"] is not None:
            return float(result["cost"])

        return float("inf")

    def _estimate_emergency_time_minutes(
        self,
        total_distance_km: float,
        emergency_type: str,
    ) -> int | None:
        if total_distance_km == float("inf"):
            return None

        speed_by_type = {
            "ambulance": 80,
            "fire_truck": 70,
            "police": 85,
        }

        speed_kmh = speed_by_type.get(emergency_type, 80)

        if speed_kmh <= 0:
            return None

        return round((float(total_distance_km) / speed_kmh) * 60)


routing_service = RoutingService()