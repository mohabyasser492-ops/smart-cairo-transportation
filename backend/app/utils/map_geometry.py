from __future__ import annotations
from typing import Any, Dict, List, Optional
from app.services.data_service import data_service


def _extract_list(data: Any, possible_keys: List[str]) -> List[Dict[str, Any]]:
    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        for key in possible_keys:
            value = data.get(key)
            if isinstance(value, list):
                return value

    return []


def build_location_lookup() -> Dict[str, Dict[str, Any]]:
    neighborhoods = _extract_list(
        data_service.get_neighborhoods(),
        ["neighborhoods", "data", "items", "records"],
    )
    facilities = _extract_list(
        data_service.get_facilities(),
        ["facilities", "data", "items", "records"],
    )

    lookup: Dict[str, Dict[str, Any]] = {}

    for item in neighborhoods + facilities:
        name = item.get("name")
        if not name:
            continue

        x = item.get("x")
        y = item.get("y")

        if x is None or y is None:
            continue

        # Convention:
        # x = longitude, y = latitude
        lookup[str(name)] = {
            "name": name,
            "longitude": float(x),
            "latitude": float(y),
            "x": float(x),
            "y": float(y),
            "id": item.get("id"),
            "type": item.get("type"),
        }

    return lookup


def path_to_route_geometry(path: List[str]) -> List[List[float]]:
    if not path:
        return []

    lookup = build_location_lookup()
    points: List[List[float]] = []

    for node_name in path:
        node = lookup.get(str(node_name))
        if not node:
            continue

        lat = node["latitude"]
        lng = node["longitude"]
        points.append([lat, lng])

    return points


def edge_to_route_geometry(source: str, destination: str) -> List[List[float]]:
    return path_to_route_geometry([source, destination])


def midpoint_of_edge(source: str, destination: str) -> Optional[Dict[str, float]]:
    geometry = edge_to_route_geometry(source, destination)
    if len(geometry) < 2:
        return None

    lat = (geometry[0][0] + geometry[1][0]) / 2
    lng = (geometry[0][1] + geometry[1][1]) / 2

    return {
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
    }