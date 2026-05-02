from app.algorithms.astar import astar_shortest_path
from app.algorithms.dijkstra import dijkstra_shortest_path
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
        result = self.find_astar_path(
            source=source,
            destination=destination,
            weight="distance",
        )

        result["emergency_type"] = emergency_type
        result["priority"] = "high"
        result["recommended_action"] = "Dispatch immediately using the fastest available route"

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

        return {
            "source": source,
            "destination": destination,
            "weight_used": weight,
            "dijkstra": dijkstra_result,
            "astar": astar_result,
            "summary": {
                "dijkstra_visited_nodes": dijkstra_result["visited_nodes_count"],
                "astar_visited_nodes": astar_result["visited_nodes_count"],
                "astar_more_efficient": astar_result["visited_nodes_count"]
                <= dijkstra_result["visited_nodes_count"],
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


routing_service = RoutingService()