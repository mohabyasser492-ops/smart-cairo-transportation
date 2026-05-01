from typing import Any, Dict

from app.core.constants import DATA_FILES
from app.utils.file_loader import load_json_file


class DataService:
    def get_neighborhoods(self) -> Any:
        return load_json_file(DATA_FILES["neighborhoods"])

    def get_facilities(self) -> Any:
        return load_json_file(DATA_FILES["facilities"])

    def get_existing_roads(self) -> Any:
        return load_json_file(DATA_FILES["existing_roads"])

    def get_potential_roads(self) -> Any:
        return load_json_file(DATA_FILES["potential_roads"])

    def get_traffic_flow(self) -> Any:
        return load_json_file(DATA_FILES["traffic_flow"])

    def get_metro_lines(self) -> Any:
        return load_json_file(DATA_FILES["metro_lines"])

    def get_bus_routes(self) -> Any:
        return load_json_file(DATA_FILES["bus_routes"])

    def get_public_transport_demand(self) -> Any:
        return load_json_file(DATA_FILES["public_transport_demand"])

    def get_summary(self) -> Dict[str, Any]:
        neighborhoods = self.get_neighborhoods()
        facilities = self.get_facilities()
        existing_roads = self.get_existing_roads()
        potential_roads = self.get_potential_roads()
        traffic_flow = self.get_traffic_flow()
        metro_lines = self.get_metro_lines()
        bus_routes = self.get_bus_routes()
        public_transport_demand = self.get_public_transport_demand()

        return {
            "neighborhoods_count": self._safe_count(neighborhoods),
            "facilities_count": self._safe_count(facilities),
            "existing_roads_count": self._safe_count(existing_roads),
            "potential_roads_count": self._safe_count(potential_roads),
            "traffic_flow_records_count": self._safe_count(traffic_flow),
            "metro_lines_count": self._safe_count(metro_lines),
            "bus_routes_count": self._safe_count(bus_routes),
            "public_transport_demand_records_count": self._safe_count(public_transport_demand),
        }

    @staticmethod
    def _safe_count(data: Any) -> int:
        if isinstance(data, list):
            return len(data)

        if isinstance(data, dict):
            for key in ["items", "data", "records", "neighborhoods", "roads", "routes", "lines", "facilities"]:
                if key in data and isinstance(data[key], list):
                    return len(data[key])

            return len(data)

        return 0


data_service = DataService()