from app.graph.graph import Graph
from app.services.data_service import data_service


def build_road_graph() -> Graph:
    graph = Graph()

    neighborhoods_data = data_service.get_neighborhoods()
    roads_data = data_service.get_existing_roads()
    facilities_data = data_service.get_facilities()

    neighborhoods = _extract_list(
        neighborhoods_data,
        possible_keys=["neighborhoods", "data", "items", "records"],
    )

    roads = _extract_list(
        roads_data,
        possible_keys=["roads", "existing_roads", "data", "items", "records"],
    )

    facilities = _extract_list(
        facilities_data,
        possible_keys=["facilities", "data", "items", "records"],
    )

    node_lookup = {}

    for neighborhood in neighborhoods:
        node_id = str(neighborhood.get("id"))
        node_name = neighborhood.get("name")

        if node_id and node_name:
            node_lookup[node_id] = node_name
            graph.add_node(node_name)

    for facility in facilities:
        facility_id = str(facility.get("id"))
        facility_name = facility.get("name", facility_id)

        if facility_id:
            node_lookup[facility_id] = facility_name
            graph.add_node(facility_name)

    for road in roads:
        raw_source = str(
            _get_first_existing_value(
                road,
                ["source", "from", "start", "start_node", "from_neighborhood"],
            )
        )

        raw_destination = str(
            _get_first_existing_value(
                road,
                ["destination", "to", "end", "end_node", "to_neighborhood"],
            )
        )

        source = node_lookup.get(raw_source, raw_source)
        destination = node_lookup.get(raw_destination, raw_destination)

        distance = _get_first_existing_value(
            road,
            ["distance", "distance_km", "length", "length_km"],
            default=1,
        )

        travel_time = _get_first_existing_value(
            road,
            ["travel_time", "travel_time_min", "time", "time_min"],
            default=None,
        )

        road_id = _get_first_existing_value(
            road,
            ["id", "road_id", "name"],
            default=None,
        )

        capacity = _get_first_existing_value(
            road,
            ["capacity", "capacity_vehicles_per_hour"],
            default=None,
        )

        condition = _get_first_existing_value(
            road,
            ["condition", "road_condition"],
            default=None,
        )

        bidirectional = _get_first_existing_value(
            road,
            ["bidirectional", "two_way", "is_bidirectional"],
            default=True,
        )

        if source and destination:
            graph.add_edge(
                source=source,
                destination=destination,
                distance=float(distance),
                travel_time=float(travel_time) if travel_time is not None else None,
                road_id=str(road_id) if road_id is not None else None,
                capacity=int(capacity) if capacity is not None else None,
                condition=int(condition) if condition is not None else None,
                bidirectional=bool(bidirectional),
            )

    return graph


def _extract_list(data, possible_keys):
    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        for key in possible_keys:
            if key in data and isinstance(data[key], list):
                return data[key]

    return []


def _get_first_existing_value(item: dict, keys: list[str], default=None):
    for key in keys:
        if key in item:
            return item[key]

    return default