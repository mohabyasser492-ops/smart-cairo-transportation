import csv
import json
import random
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ROADS_PATH = PROJECT_ROOT / "backend" / "app" / "data" / "existing_roads.json"
TRAFFIC_FLOW_PATH = PROJECT_ROOT / "backend" / "app" / "data" / "traffic_flow.json"
OUTPUT_PATH = PROJECT_ROOT / "ml" / "data" / "training_data.csv"

DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

WEATHERS = [
    "clear",
    "cloudy",
    "rain",
    "fog",
]


def load_json(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def get_hour_factor(hour: int) -> float:
    # Morning rush
    if 7 <= hour <= 10:
        return 1.35

    # Afternoon/evening rush
    if 15 <= hour <= 19:
        return 1.30

    # Late night / early morning
    if 0 <= hour <= 5:
        return 0.60

    # Normal daytime
    return 1.00


def get_day_factor(day: str) -> float:
    if day in {"Friday", "Saturday"}:
        return 0.90

    return 1.00


def get_weather_factor(weather: str) -> float:
    if weather == "clear":
        return 1.00
    if weather == "cloudy":
        return 1.05
    if weather == "fog":
        return 1.10
    if weather == "rain":
        return 1.20

    return 1.00


def get_holiday_factor(is_holiday: bool) -> float:
    return 0.80 if is_holiday else 1.00


def estimate_speed_kmh(
    road_capacity: float,
    historical_flow: float,
    weather: str,
    hour: int,
) -> float:
    base_speed = 55.0

    congestion_ratio = historical_flow / max(road_capacity, 1)

    # Congestion reduces speed
    speed = base_speed - (congestion_ratio * 25)

    # Rush hours reduce speed further
    if 7 <= hour <= 10:
        speed -= 6
    elif 15 <= hour <= 19:
        speed -= 5

    # Weather penalties
    if weather == "rain":
        speed -= 6
    elif weather == "fog":
        speed -= 4
    elif weather == "cloudy":
        speed -= 1

    # Add slight randomness
    speed += random.uniform(-3, 3)

    # Clamp to realistic range
    speed = max(8, min(speed, 80))

    return round(speed, 2)


def build_traffic_lookup(traffic_data):
    lookup = {}

    for item in traffic_data:
        road_id = str(item.get("road_id") or item.get("id"))
        vehicles_per_hour = (
            item.get("vehicles_per_hour")
            or item.get("traffic_volume")
            or item.get("flow")
            or item.get("historical_flow")
            or 0
        )

        lookup[road_id] = float(vehicles_per_hour)

    return lookup


def main():
    roads = load_json(ROADS_PATH)
    traffic_flow = load_json(TRAFFIC_FLOW_PATH)

    traffic_lookup = build_traffic_lookup(traffic_flow)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    rows = []

    for road in roads:
        road_id = str(road.get("id") or road.get("road_id"))
        road_capacity = float(
            road.get("capacity_vehicles_per_hour")
            or road.get("road_capacity")
            or 1000
        )
        road_length_km = float(
            road.get("distance_km")
            or road.get("length_km")
            or road.get("distance")
            or 1
        )

        base_flow = traffic_lookup.get(road_id, road_capacity * 0.75)

        # Generate multiple rows per road
        for _ in range(120):
            hour = random.randint(0, 23)
            day_of_week = random.choice(DAYS_OF_WEEK)
            weather = random.choice(WEATHERS)
            is_holiday = random.choice([False, False, False, True])

            flow_factor = (
                get_hour_factor(hour)
                * get_day_factor(day_of_week)
                * get_weather_factor(weather)
                * get_holiday_factor(is_holiday)
            )

            historical_flow = base_flow * flow_factor

            # Add noise
            historical_flow += random.uniform(-150, 150)
            historical_flow = max(100, historical_flow)

            avg_speed_kmh = estimate_speed_kmh(
                road_capacity=road_capacity,
                historical_flow=historical_flow,
                weather=weather,
                hour=hour,
            )

            rows.append(
                {
                    "road_id": road_id,
                    "hour": hour,
                    "day_of_week": day_of_week,
                    "weather": weather,
                    "is_holiday": int(is_holiday),
                    "road_capacity": round(road_capacity, 2),
                    "road_length_km": round(road_length_km, 2),
                    "historical_flow": round(historical_flow, 2),
                    "avg_speed_kmh": avg_speed_kmh,
                }
            )

    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as csvfile:
        fieldnames = [
            "road_id",
            "hour",
            "day_of_week",
            "weather",
            "is_holiday",
            "road_capacity",
            "road_length_km",
            "historical_flow",
            "avg_speed_kmh",
        ]

        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Training dataset generated successfully: {OUTPUT_PATH}")
    print(f"Total rows: {len(rows)}")


if __name__ == "__main__":
    main()