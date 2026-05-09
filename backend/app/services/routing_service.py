from app.algorithms.astar import astar_shortest_path
from app.algorithms.dijkstra import dijkstra_shortest_path
from app.algorithms.time_dependent_routing import time_dependent_shortest_path
from app.graph.build_graph import build_road_graph
from app.services.data_service import data_service
from app.services.transit_routing_service import transit_routing_service
from app.utils.map_geometry import path_to_route_geometry


class RoutingService:
    def _attach_route_geometry(self, result: dict):
        if not result:
            return result

        path = result.get("path", [])
        result["route_geometry"] = path_to_route_geometry(path)
        return result

    def find_shortest_path(self, source: str, destination: str, weight: str = "distance"):
        graph = build_road_graph()
        result = dijkstra_shortest_path(
            graph=graph,
            source=source,
            destination=destination,
            weight=weight,
        )
        return self._attach_route_geometry(result)

    def find_astar_path(self, source: str, destination: str, weight: str = "distance"):
        graph = build_road_graph()
        coordinates = self._get_all_node_coordinates()
        result = astar_shortest_path(
            graph=graph,
            source=source,
            destination=destination,
            coordinates=coordinates,
            weight=weight,
        )
        return self._attach_route_geometry(result)

    def find_emergency_route(self, source: str, destination: str, emergency_type: str = "ambulance"):
        dijkstra_result = self.find_shortest_path(source=source, destination=destination, weight="distance")
        astar_result = self.find_astar_path(source=source, destination=destination, weight="distance")

        dijkstra_cost = self._extract_total_cost(dijkstra_result)
        astar_cost = self._extract_total_cost(astar_result)
        dijkstra_runtime = float(dijkstra_result.get("runtime_ms", 0))
        astar_runtime = float(astar_result.get("runtime_ms", 0))
        dijkstra_visited = int(dijkstra_result.get("visited_nodes_count", 0))
        astar_visited = int(astar_result.get("visited_nodes_count", 0))

        emergency_priority = self._get_emergency_priority(emergency_type)
        decision = self._choose_best_emergency_algorithm(
            dijkstra_result=dijkstra_result,
            astar_result=astar_result,
            emergency_type=emergency_type,
        )

        chosen_algorithm = decision["winner"]
        chosen_base = astar_result if chosen_algorithm == "astar" else dijkstra_result

        estimated_time_min = self._estimate_emergency_time_minutes(
            total_distance_km=self._extract_total_cost(chosen_base),
            emergency_type=emergency_type,
        )

        result = {
            **chosen_base,
            "emergency_type": emergency_type,
            "priority": emergency_priority,
            "recommended_action": self._build_recommended_action(
                emergency_type=emergency_type,
                chosen_algorithm=chosen_algorithm,
                estimated_time_min=estimated_time_min,
            ),
            "chosen_algorithm": chosen_algorithm,
            "selection_reason": decision["winner_reason"],
            "estimated_time_min": estimated_time_min,
            "comparison": {
                "dijkstra": dict(dijkstra_result),
                "astar": dict(astar_result),
                "summary": {
                    "winner": decision["winner"],
                    "winner_reason": decision["winner_reason"],
                    "cost_difference": round(abs(dijkstra_cost - astar_cost), 2),
                    "runtime_difference_ms": round(abs(dijkstra_runtime - astar_runtime), 3),
                    "visited_nodes_difference": abs(dijkstra_visited - astar_visited),
                    "decision_basis": decision["decision_basis"],
                },
            },
            "decision_metrics": {
                "dijkstra": {
                    "total_cost": dijkstra_cost,
                    "runtime_ms": dijkstra_runtime,
                    "visited_nodes_count": dijkstra_visited,
                },
                "astar": {
                    "total_cost": astar_cost,
                    "runtime_ms": astar_runtime,
                    "visited_nodes_count": astar_visited,
                },
            },
        }

        return self._attach_route_geometry(result)

    def find_public_transit_route(self, source: str, destination: str, preference: str = "fastest"):
        result = transit_routing_service.find_route(
            source=source,
            destination=destination,
            preference=preference,
        )
        return self._attach_route_geometry(result)

    def compare_dijkstra_and_astar(self, source: str, destination: str, weight: str = "distance"):
        dijkstra_result = self.find_shortest_path(source=source, destination=destination, weight=weight)
        astar_result = self.find_astar_path(source=source, destination=destination, weight=weight)

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
                winner_reason = "Both algorithms had equal total cost, so A* wins because it visited fewer nodes."
            elif dijkstra_visited < astar_visited:
                winner = "dijkstra"
                winner_reason = "Both algorithms had equal total cost, so Dijkstra wins because it visited fewer nodes."
            else:
                winner = "tie"
                winner_reason = "Both algorithms had equal total cost and visited the same number of nodes."

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
                "astar_more_efficient": astar_result["visited_nodes_count"] <= dijkstra_result["visited_nodes_count"],
                "max_exploration_steps": max(
                    len(dijkstra_result.get("exploration_order", [])),
                    len(astar_result.get("exploration_order", [])),
                ),
            },
        }

    def find_time_dependent_route(self, source: str, destination: str, departure_time: str, day_type: str = "weekday"):
        graph = build_road_graph()
        result = time_dependent_shortest_path(
            graph=graph,
            source=source,
            destination=destination,
            departure_time=departure_time,
            day_type=day_type,
        )
        return self._attach_route_geometry(result)

    def find_best_route_by_time(self, source: str, destination: str, departure_time: str, day_type: str = "weekday"):
        normal_route = self.find_shortest_path(source=source, destination=destination, weight="distance")
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

    def _get_all_node_coordinates(self):
        coordinates = {}
        all_nodes = data_service.get_neighborhoods() + data_service.get_facilities()

        for node in all_nodes:
            name = node.get("name")
            x = node.get("x")
            y = node.get("y")

            if name is not None and x is not None and y is not None:
                coordinates[name] = {
                    "x": float(x),
                    "y": float(y),
                }

        return coordinates

    def _extract_total_cost(self, result):
        if result is None:
            return float("inf")
        if "total_cost" in result and result["total_cost"] is not None:
            return float(result["total_cost"])
        if "cost" in result and result["cost"] is not None:
            return float(result["cost"])
        return float("inf")

    def _estimate_emergency_time_minutes(self, total_distance_km: float, emergency_type: str):
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

    def _get_emergency_priority(self, emergency_type: str) -> str:
        priority_lookup = {
            "ambulance": "critical",
            "fire_truck": "critical",
            "police": "high",
        }
        return priority_lookup.get(emergency_type, "high")

    def _build_recommended_action(self, emergency_type: str, chosen_algorithm: str, estimated_time_min):
        eta_text = f" ETA: {estimated_time_min} min." if estimated_time_min is not None else ""
        return (
            f"Dispatch the {emergency_type.replace('_', ' ')} unit immediately "
            f"using the {chosen_algorithm.upper()} route.{eta_text}"
        )

    def _choose_best_emergency_algorithm(self, dijkstra_result: dict, astar_result: dict, emergency_type: str):
        dijkstra_cost = self._extract_total_cost(dijkstra_result)
        astar_cost = self._extract_total_cost(astar_result)
        dijkstra_runtime = float(dijkstra_result.get("runtime_ms", 0))
        astar_runtime = float(astar_result.get("runtime_ms", 0))
        dijkstra_visited = int(dijkstra_result.get("visited_nodes_count", 0))
        astar_visited = int(astar_result.get("visited_nodes_count", 0))

        emergency_type = (emergency_type or "").strip().lower()
        runtime_gap = abs(dijkstra_runtime - astar_runtime)
        prefer_runtime = emergency_type in {"ambulance", "fire_truck"} and runtime_gap >= 0.5

        if astar_cost < dijkstra_cost:
            return {
                "winner": "astar",
                "winner_reason": "A* was selected because it produced the lower route cost for emergency dispatch.",
                "decision_basis": "lowest_total_cost",
            }

        if dijkstra_cost < astar_cost:
            return {
                "winner": "dijkstra",
                "winner_reason": "Dijkstra was selected because it produced the lower route cost for emergency dispatch.",
                "decision_basis": "lowest_total_cost",
            }

        if astar_visited < dijkstra_visited:
            return {
                "winner": "astar",
                "winner_reason": "Both routes had the same cost, so A* was selected because it explored fewer nodes.",
                "decision_basis": "fewest_visited_nodes",
            }

        if dijkstra_visited < astar_visited:
            return {
                "winner": "dijkstra",
                "winner_reason": "Both routes had the same cost, so Dijkstra was selected because it explored fewer nodes.",
                "decision_basis": "fewest_visited_nodes",
            }

        if prefer_runtime and astar_runtime < dijkstra_runtime:
            return {
                "winner": "astar",
                "winner_reason": "Both routes had the same cost and similar search effort, so A* was selected because it finished meaningfully faster for a critical emergency type.",
                "decision_basis": "lowest_runtime_ms",
            }

        if prefer_runtime and dijkstra_runtime < astar_runtime:
            return {
                "winner": "dijkstra",
                "winner_reason": "Both routes had the same cost and similar search effort, so Dijkstra was selected because it finished meaningfully faster for a critical emergency type.",
                "decision_basis": "lowest_runtime_ms",
            }

        fallback_winner = "astar" if astar_runtime <= dijkstra_runtime else "dijkstra"
        return {
            "winner": fallback_winner,
            "winner_reason": "Both routes were effectively identical in cost and search effort, so runtime was used as the final tiebreaker.",
            "decision_basis": "final_runtime_tiebreak",
        }


routing_service = RoutingService()