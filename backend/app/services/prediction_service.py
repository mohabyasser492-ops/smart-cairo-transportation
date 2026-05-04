import json
from pathlib import Path
from statistics import mean
from typing import Any, Dict, List, Optional

import joblib
import pandas as pd

from app.services.data_service import data_service
from app.services.routing_service import routing_service

DAY_OF_WEEK_MAP = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}

WEATHER_MAP = {
    "clear": 0,
    "cloudy": 1,
    "rain": 2,
    "storm": 3,
    "fog": 4,
}


class PredictionService:
    def __init__(self):
        project_root = Path(__file__).resolve().parents[3]
        self.model_path = project_root / "ml" / "models" / "traffic_model.pkl"
        self.metrics_path = project_root / "ml" / "models" / "model_metrics.json"
        self._model_bundle = None

    def predict_traffic(
        self,
        road_id: str,
        hour: int,
        day_of_week: str,
        weather: str,
        is_holiday: bool,
    ) -> Dict[str, Any]:
        road_features = self._get_road_features(road_id)
        model_bundle = self._safe_load_model_bundle()

        input_row = {
            "hour": int(hour),
            "day_of_week_encoded": self._encode_day_of_week(day_of_week),
            "weather_encoded": self._encode_weather(weather),
            "is_holiday": int(bool(is_holiday)),
            "road_capacity": float(road_features["road_capacity"]),
            "road_length_km": float(road_features["road_length_km"]),
            "historical_flow": float(road_features["historical_flow"]),
        }

        if model_bundle is not None:
            model = model_bundle["model"]
            feature_names = model_bundle["feature_names"]
            input_df = pd.DataFrame([input_row])[feature_names]
            predicted_speed = float(model.predict(input_df)[0])

            metrics = self.get_model_metrics()
            raw_confidence = float(metrics.get("r2_score", 0.0))
            confidence = max(0.0, min(1.0, raw_confidence))
            prediction_method = "ml_model"
        else:
            predicted_speed = self._heuristic_speed_prediction(
                hour=hour,
                weather=weather,
                is_holiday=is_holiday,
                road_capacity=float(road_features["road_capacity"]),
                historical_flow=float(road_features["historical_flow"]),
            )
            confidence = 0.55
            prediction_method = "fallback_heuristic"

        return {
            "road_id": road_id,
            "predicted_speed_kmh": round(predicted_speed, 2),
            "predicted_traffic_level": self._classify_traffic_level(predicted_speed),
            "confidence": round(confidence, 2),
            "prediction_method": prediction_method,
            "features_used": {
                "hour": hour,
                "day_of_week": day_of_week,
                "weather": weather,
                "is_holiday": is_holiday,
                "road_capacity": road_features["road_capacity"],
                "road_length_km": road_features["road_length_km"],
                "historical_flow": road_features["historical_flow"],
            },
        }

    def predict_route_traffic(
        self,
        source: str,
        destination: str,
        hour: int,
        day_of_week: str,
        weather: str,
        is_holiday: bool,
        weight: str = "distance",
    ) -> Dict[str, Any]:
        route_result = routing_service.find_shortest_path(source, destination, weight)
        path = route_result["path"]

        if len(path) < 2:
            raise ValueError("Route path must contain at least two nodes")

        segment_predictions = []
        speeds = []
        levels = []

        for index in range(len(path) - 1):
            node_a = path[index]
            node_b = path[index + 1]
            road_id = self._find_road_between_nodes(node_a, node_b)
            if road_id is None:
                continue

            prediction = self.predict_traffic(
                road_id=road_id,
                hour=hour,
                day_of_week=day_of_week,
                weather=weather,
                is_holiday=is_holiday,
            )

            segment_predictions.append(
                {
                    "from": node_a,
                    "to": node_b,
                    "road_id": road_id,
                    "predicted_speed_kmh": prediction["predicted_speed_kmh"],
                    "predicted_traffic_level": prediction["predicted_traffic_level"],
                }
            )
            speeds.append(prediction["predicted_speed_kmh"])
            levels.append(prediction["predicted_traffic_level"])

        average_speed = round(sum(speeds) / len(speeds), 2) if speeds else 0.0

        return {
            "source": source,
            "destination": destination,
            "path": path,
            "segments_count": len(segment_predictions),
            "segment_predictions": segment_predictions,
            "average_predicted_speed_kmh": average_speed,
            "overall_predicted_traffic_level": self._combine_traffic_levels(levels),
        }

    def get_model_metrics(self) -> Dict[str, Any]:
        if self.metrics_path.exists():
            with self.metrics_path.open("r", encoding="utf-8") as file:
                return json.load(file)

        return {
            "model_status": "fallback_heuristic",
            "message": "ML model artifacts were not found, so the API is using a deterministic heuristic fallback.",
            "feature_names": [
                "hour",
                "day_of_week_encoded",
                "weather_encoded",
                "is_holiday",
                "road_capacity",
                "road_length_km",
                "historical_flow",
            ],
            "r2_score": 0.55,
        }

    def _safe_load_model_bundle(self):
        if self._model_bundle is not None:
            return self._model_bundle
        if not self.model_path.exists():
            return None
        self._model_bundle = joblib.load(self.model_path)
        return self._model_bundle

    def _get_road_features(self, road_id: str) -> Dict[str, float]:
        roads = self._extract_list(
            data_service.get_existing_roads(),
            ["roads", "existing_roads", "data", "items", "records"],
        )
        traffic_records = self._extract_list(
            data_service.get_traffic_flow(),
            ["traffic_flow", "traffic", "data", "items", "records"],
        )

        road = next(
            (
                item
                for item in roads
                if str(item.get("id") or item.get("road_id")) == str(road_id)
            ),
            None,
        )
        if road is None:
            raise ValueError(f"Road not found for road_id: {road_id}")

        traffic_record = next(
            (
                item
                for item in traffic_records
                if str(item.get("road_id") or item.get("id")) == str(road_id)
            ),
            None,
        )

        road_capacity = road.get("capacity_vehicles_per_hour") or road.get("road_capacity") or 1000
        road_length_km = road.get("distance_km") or road.get("length_km") or road.get("distance") or 1

        historical_flow = 0.0
        if traffic_record is not None:
            bucket_values = [
                traffic_record.get("morning_peak"),
                traffic_record.get("afternoon"),
                traffic_record.get("evening_peak"),
                traffic_record.get("night"),
            ]
            numeric_values = [float(value) for value in bucket_values if value is not None]
            historical_flow = mean(numeric_values) if numeric_values else 0.0

            if historical_flow == 0:
                historical_flow = float(
                    traffic_record.get("vehicles_per_hour")
                    or traffic_record.get("traffic_volume")
                    or traffic_record.get("flow")
                    or traffic_record.get("historical_flow")
                    or 0
                )

        if float(historical_flow) == 0:
            historical_flow = float(road_capacity) * 0.75

        return {
            "road_capacity": float(road_capacity),
            "road_length_km": float(road_length_km),
            "historical_flow": float(historical_flow),
        }

    def _find_road_between_nodes(self, node_a: str, node_b: str) -> Optional[str]:
        roads = self._extract_list(
            data_service.get_existing_roads(),
            ["roads", "existing_roads", "data", "items", "records"],
        )

        sources = self._extract_list(
            data_service.get_neighborhoods(),
            ["neighborhoods", "data", "items", "records"],
        ) + self._extract_list(
            data_service.get_facilities(),
            ["facilities", "data", "items", "records"],
        )

        id_to_name = {
            str(item.get("id")): item.get("name")
            for item in sources
            if item.get("id") is not None and item.get("name") is not None
        }

        for road in roads:
            road_id = str(road.get("id") or road.get("road_id"))
            from_name = id_to_name.get(
                str(road.get("from") or road.get("source")),
                str(road.get("from") or road.get("source")),
            )
            to_name = id_to_name.get(
                str(road.get("to") or road.get("destination")),
                str(road.get("to") or road.get("destination")),
            )

            if (from_name == node_a and to_name == node_b) or (
                from_name == node_b and to_name == node_a
            ):
                return road_id

        return None

    @staticmethod
    def _heuristic_speed_prediction(
        hour: int,
        weather: str,
        is_holiday: bool,
        road_capacity: float,
        historical_flow: float,
    ) -> float:
        utilization = 0.0 if road_capacity <= 0 else historical_flow / road_capacity
        speed = 55.0

        if 7 <= int(hour) <= 10:
            speed -= 12
        elif 15 <= int(hour) <= 19:
            speed -= 10
        elif 0 <= int(hour) <= 5:
            speed += 8

        weather_penalties = {
            "clear": 0,
            "cloudy": 2,
            "rain": 8,
            "storm": 14,
            "fog": 10,
        }
        speed -= weather_penalties.get(str(weather).strip().lower(), 0)

        if is_holiday:
            speed += 4

        speed -= max(utilization - 0.6, 0) * 25
        return max(8.0, min(75.0, speed))

    @staticmethod
    def _encode_day_of_week(day_of_week: str) -> int:
        key = str(day_of_week).strip().lower()
        if key not in DAY_OF_WEEK_MAP:
            raise ValueError(f"Unsupported day_of_week: {day_of_week}")
        return DAY_OF_WEEK_MAP[key]

    @staticmethod
    def _encode_weather(weather: str) -> int:
        key = str(weather).strip().lower()
        if key not in WEATHER_MAP:
            raise ValueError(f"Unsupported weather value: {weather}")
        return WEATHER_MAP[key]

    @staticmethod
    def _classify_traffic_level(predicted_speed_kmh: float) -> str:
        if predicted_speed_kmh < 15:
            return "severe"
        if predicted_speed_kmh < 25:
            return "high"
        if predicted_speed_kmh < 40:
            return "medium"
        return "low"

    @staticmethod
    def _combine_traffic_levels(levels: List[str]) -> str:
        if not levels:
            return "unknown"
        priority = {
            "severe": 4,
            "high": 3,
            "medium": 2,
            "low": 1,
        }
        return max(levels, key=lambda level: priority.get(level, 0))

    @staticmethod
    def _extract_list(data, possible_keys):
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for key in possible_keys:
                if key in data and isinstance(data[key], list):
                    return data[key]
        return []


prediction_service = PredictionService()