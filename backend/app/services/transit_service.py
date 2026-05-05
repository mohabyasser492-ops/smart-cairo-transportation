from typing import Any, Dict, List

from app.algorithms.dp_bus_allocation import optimize_bus_allocation
from app.services.data_service import data_service


class TransitService:
    def allocate_buses(self, available_buses: int) -> Dict[str, Any]:
        routes_data = data_service.get_bus_routes()
        demand_data = data_service.get_public_transport_demand()

        routes = self._extract_list(
            routes_data,
            possible_keys=["routes", "bus_routes", "data", "items", "records"],
        )

        demand_records = self._extract_list(
            demand_data,
            possible_keys=["demand", "public_transport_demand", "data", "items", "records"],
        )

        enriched_routes = self._merge_routes_with_demand(
            routes=routes,
            demand_records=demand_records,
        )

        return optimize_bus_allocation(
            routes=enriched_routes,
            available_buses=available_buses,
        )

    def _merge_routes_with_demand(
        self,
        routes: List[Dict[str, Any]],
        demand_records: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        demand_lookup = {}

        for record in demand_records:
            route_id = str(record.get("route_id") or record.get("id"))
            demand_value = (
                record.get("daily_passengers")
                or record.get("demand")
                or record.get("passenger_demand")
                or 0
            )

            demand_lookup[route_id] = int(demand_value)

        enriched_routes = []

        for route in routes:
            route_id = str(route.get("id") or route.get("route_id") or route.get("name"))

            enriched_route = dict(route)
            enriched_route["daily_passengers"] = int(
                route.get("daily_passengers")
                or route.get("demand")
                or demand_lookup.get(route_id, 0)
            )

            enriched_route["min_buses"] = int(route.get("min_buses") or 1)
            enriched_route["max_buses"] = int(route.get("max_buses") or 40)

            enriched_routes.append(enriched_route)

        return enriched_routes

    @staticmethod
    def _extract_list(data, possible_keys):
        if isinstance(data, list):
            return data

        if isinstance(data, dict):
            for key in possible_keys:
                if key in data and isinstance(data[key], list):
                    return data[key]

        return []


transit_service = TransitService()