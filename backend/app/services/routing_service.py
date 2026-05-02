from app.algorithms.dijkstra import dijkstra_shortest_path
from app.graph.build_graph import build_road_graph


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


routing_service = RoutingService()