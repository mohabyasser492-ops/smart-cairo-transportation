from typing import Any, Dict, List

from app.algorithms.greedy_traffic import (
    calculate_congestion_score,
    classify_congestion,
    detect_congestion_hotspots,
    optimize_traffic_signals_greedy,
)

from app.services.data_service import data_service
from app.utils.map_geometry import midpoint_of_edge


class SignalService:

    def get_congestion_hotspots(self) -> Dict[str, Any]:
        intersections = self._build_intersection_data()

        hotspots = detect_congestion_hotspots(intersections)

        enriched_hotspots = []

        for hotspot in hotspots.get("hotspots", []):
            hotspot_name = str(hotspot.get("name", ""))

            source = ""
            destination = ""

            if "→" in hotspot_name:
                parts = hotspot_name.split("→", 1)

                source = parts[0].strip()
                destination = parts[1].strip()

            midpoint = midpoint_of_edge(
                source=source,
                destination=destination,
            ) or {}

            enriched_hotspots.append(
                {
                    **hotspot,
                    "latitude": midpoint.get("latitude"),
                    "longitude": midpoint.get("longitude"),
                }
            )

        return {
            **hotspots,
            "hotspots": enriched_hotspots,
        }

    def get_intersections_status(self) -> Dict[str, Any]:
        intersections = self._build_intersection_data()

        status_records = []

        for intersection in intersections:
            incoming_flow = float(intersection.get("incoming_flow", 0))
            capacity = float(intersection.get("capacity", 1))
            average_waiting_time = float(
                intersection.get("average_waiting_time", 0)
            )

            if capacity <= 0:
                capacity = 1

            volume_capacity_ratio = incoming_flow / capacity

            congestion_score = calculate_congestion_score(
                incoming_flow=incoming_flow,
                capacity=capacity,
                waiting_time=average_waiting_time,
            )

            midpoint = midpoint_of_edge(
                source=str(intersection.get("from") or ""),
                destination=str(intersection.get("to") or ""),
            ) or {}

            status_records.append(
                {
                    "intersection_id": str(intersection.get("id")),
                    "name": intersection.get("name"),
                    "from": intersection.get("from"),
                    "to": intersection.get("to"),
                    "incoming_flow": round(incoming_flow, 2),
                    "capacity": round(capacity, 2),
                    "average_waiting_time": round(
                        average_waiting_time,
                        2,
                    ),
                    "volume_capacity_ratio": round(
                        volume_capacity_ratio,
                        2,
                    ),
                    "congestion_score": round(
                        congestion_score,
                        2,
                    ),
                    "status": classify_congestion(
                        congestion_score
                    ),
                    "latitude": midpoint.get("latitude"),
                    "longitude": midpoint.get("longitude"),
                }
            )

        status_records.sort(
            key=lambda item: item["congestion_score"],
            reverse=True,
        )

        return {
            "intersections_count": len(status_records),
            "intersections": status_records,
        }

    def optimize_signals(
        self,
        total_cycle_time: int = 120,
        min_green_time: int = 20,
        max_green_time: int = 90,
    ) -> Dict[str, Any]:

        intersections = self._build_intersection_data()

        return optimize_traffic_signals_greedy(
            intersections=intersections,
            total_cycle_time=total_cycle_time,
            min_green_time=min_green_time,
            max_green_time=max_green_time,
        )

    def _build_intersection_data(self) -> List[Dict[str, Any]]:
        traffic_flow_data = data_service.get_traffic_flow()

        existing_roads_data = data_service.get_existing_roads()

        traffic_records = self._extract_list(
            traffic_flow_data,
            possible_keys=[
                "traffic_flow",
                "traffic",
                "data",
                "items",
                "records",
            ],
        )

        roads = self._extract_list(
            existing_roads_data,
            possible_keys=[
                "roads",
                "existing_roads",
                "data",
                "items",
                "records",
            ],
        )

        road_lookup = self._build_road_lookup(roads)

        intersections = []

        for record in traffic_records:
            road_id = str(
                record.get("road_id") or record.get("id")
            )

            road = road_lookup.get(road_id, {})

            from_node = road.get("from") or record.get("from")
            to_node = road.get("to") or record.get("to")

            name = (
                record.get("name")
                or record.get("intersection_name")
                or f"{from_node} → {to_node}"
            )

            incoming_flow = (
                record.get("vehicles_per_hour")
                or record.get("traffic_volume")
                or record.get("flow")
                or record.get("incoming_flow")
                or record.get("morning_peak")
                or record.get("evening_peak")
                or record.get("afternoon")
                or record.get("night")
                or 0
            )

            capacity = (
                record.get("capacity")
                or record.get("capacity_vehicles_per_hour")
                or road.get("capacity_vehicles_per_hour")
                or 1
            )

            average_waiting_time = (
                record.get("average_waiting_time")
                or record.get("waiting_time")
            )

            if average_waiting_time is None:
                average_waiting_time = self._estimate_waiting_time(
                    incoming_flow=float(incoming_flow),
                    capacity=float(capacity),
                )

            intersections.append(
                {
                    "id": road_id,
                    "name": name,
                    "from": from_node,
                    "to": to_node,
                    "incoming_flow": float(incoming_flow),
                    "capacity": float(capacity),
                    "average_waiting_time": float(
                        average_waiting_time
                    ),
                }
            )

        if intersections:
            return intersections

        return self._fallback_intersections_from_roads(
            roads
        )

    def _build_road_lookup(
        self,
        roads: List[Dict[str, Any]],
    ) -> Dict[str, Dict[str, Any]]:
        lookup = {}

        for road in roads:
            road_id = str(
                road.get("id") or road.get("road_id")
            )

            lookup[road_id] = road

        return lookup

    def _extract_list(
        self,
        payload: Any,
        possible_keys: List[str],
    ) -> List[Dict[str, Any]]:

        if isinstance(payload, list):
            return payload

        if isinstance(payload, dict):
            for key in possible_keys:
                value = payload.get(key)

                if isinstance(value, list):
                    return value

        return []

    def _estimate_waiting_time(
        self,
        incoming_flow: float,
        capacity: float,
    ) -> float:

        if capacity <= 0:
            return 0.0

        ratio = incoming_flow / capacity

        if ratio <= 0.5:
            return 10.0

        if ratio <= 0.8:
            return 25.0

        if ratio <= 1.0:
            return 45.0

        return 70.0

    def _fallback_intersections_from_roads(
        self,
        roads: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:

        intersections = []

        for road in roads:
            capacity = float(
                road.get("capacity_vehicles_per_hour", 1000)
            )

            intersections.append(
                {
                    "id": str(
                        road.get("id")
                        or road.get("road_id")
                    ),
                    "name": f"{road.get('from')} → {road.get('to')}",
                    "from": road.get("from"),
                    "to": road.get("to"),
                    "incoming_flow": capacity * 0.7,
                    "capacity": capacity,
                    "average_waiting_time": 20.0,
                }
            )

        return intersections


signal_service = SignalService()