from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from app.services.data_service import data_service


@dataclass
class TransitServiceOption:
    service_id: str
    name: str
    mode: str
    stops: List[str]


class TransitRoutingService:
    VALID_PREFERENCES = {"fastest", "fewest_transfers", "cheapest"}

    def find_route(
        self,
        source: str,
        destination: str,
        preference: str = "fastest",
    ) -> Dict[str, Any]:
        preference = (preference or "fastest").strip().lower()
        if preference not in self.VALID_PREFERENCES:
            raise ValueError(f"Unsupported public transit preference: {preference}")

        lookup = self._build_stop_lookup()

        if source not in lookup.values():
            raise ValueError(f"Source stop is not supported in the transit network: {source}")
        if destination not in lookup.values():
            raise ValueError(f"Destination stop is not supported in the transit network: {destination}")

        services = self._load_services(lookup)

        candidates = self._direct(services, source, destination)
        candidates += self._one_transfer(services, source, destination)

        if not candidates:
            raise ValueError(f"No public transit route found from {source} to {destination}")

        best = min(candidates, key=lambda c: self._sort_key(c, preference))
        best["preference_applied"] = preference
        return best

    def _build_stop_lookup(self):
        lookup = {}
        for item in data_service.get_neighborhoods():
            lookup[str(item.get("id"))] = item.get("name")
        for item in data_service.get_facilities():
            lookup[str(item.get("id"))] = item.get("name")
        return lookup

    def _load_services(self, lookup):
        services = []

        for line in data_service.get_metro_lines():
            services.append(
                TransitServiceOption(
                    service_id=str(line.get("line_id")),
                    name=str(line.get("name") or line.get("line_id")),
                    mode="Metro",
                    stops=[lookup.get(str(stop), str(stop)) for stop in line.get("stations", [])],
                )
            )

        for route in data_service.get_bus_routes():
            services.append(
                TransitServiceOption(
                    service_id=str(route.get("route_id") or route.get("id")),
                    name=str(route.get("name") or route.get("route_id") or route.get("id")),
                    mode="Bus",
                    stops=[lookup.get(str(stop), str(stop)) for stop in route.get("stops", [])],
                )
            )

        return services

    def _slice(self, stops, start_stop, end_stop):
        i = stops.index(start_stop)
        j = stops.index(end_stop)
        s = min(i, j)
        e = max(i, j)
        path = stops[s:e + 1]
        return list(reversed(path)) if i > j else path

    def _build_candidate(self, source, destination, path, segments, transfers):
        estimated_time = 0.0
        estimated_cost = 0.0

        for service, segment_path in segments:
            hops = max(len(segment_path) - 1, 1)
            if service.mode == "Metro":
                estimated_time += hops * 2.5
                estimated_cost += 10 + max(hops - 1, 0) * 2
            else:
                estimated_time += hops * 4.0
                estimated_cost += 6 + max(hops - 1, 0) * 1

        estimated_time += transfers * 8

        modes = {service.mode for service, _ in segments}
        primary_mode = list(modes)[0] if len(modes) == 1 else "Mixed"

        return {
            "source": source,
            "destination": destination,
            "path": path,
            "transfers": transfers,
            "estimated_time_min": round(estimated_time),
            "estimated_cost_egp": round(estimated_cost, 2),
            "primary_transit_mode": primary_mode,
            "services_used": [
                {
                    "service_id": service.service_id,
                    "name": service.name,
                    "mode": service.mode,
                }
                for service, _ in segments
            ],
        }

    def _direct(self, services, source, destination):
        results = []
        for service in services:
            if source in service.stops and destination in service.stops:
                segment_path = self._slice(service.stops, source, destination)
                results.append(
                    self._build_candidate(
                        source=source,
                        destination=destination,
                        path=segment_path,
                        segments=[(service, segment_path)],
                        transfers=0,
                    )
                )
        return results

    def _one_transfer(self, services, source, destination):
        results = []

        first_services = [s for s in services if source in s.stops]
        second_services = [s for s in services if destination in s.stops]

        for service_a in first_services:
            for service_b in second_services:
                if service_a.service_id == service_b.service_id:
                    continue

                transfer_stops = sorted(set(service_a.stops).intersection(service_b.stops))
                for transfer in transfer_stops:
                    if transfer in {source, destination}:
                        continue

                    path_a = self._slice(service_a.stops, source, transfer)
                    path_b = self._slice(service_b.stops, transfer, destination)
                    combined_path = path_a + path_b[1:]

                    results.append(
                        self._build_candidate(
                            source=source,
                            destination=destination,
                            path=combined_path,
                            segments=[(service_a, path_a), (service_b, path_b)],
                            transfers=1,
                        )
                    )

        return results

    def _sort_key(self, candidate, preference):
        if preference == "fewest_transfers":
            return (
                candidate["transfers"],
                candidate["estimated_time_min"],
                candidate["estimated_cost_egp"],
            )
        if preference == "cheapest":
            return (
                candidate["estimated_cost_egp"],
                candidate["transfers"],
                candidate["estimated_time_min"],
            )
        return (
            candidate["estimated_time_min"],
            candidate["transfers"],
            candidate["estimated_cost_egp"],
        )


transit_routing_service = TransitRoutingService()