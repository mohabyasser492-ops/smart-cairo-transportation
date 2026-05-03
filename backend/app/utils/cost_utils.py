from datetime import datetime


def get_traffic_multiplier(
    departure_time: str,
    day_type: str = "weekday",
) -> float:
    hour = _extract_hour(departure_time)

    if day_type == "weekend":
        return _weekend_multiplier(hour)

    return _weekday_multiplier(hour)


def estimate_travel_time_minutes(
    distance_km: float,
    base_speed_kmh: float = 40,
    traffic_multiplier: float = 1.0,
) -> float:
    if base_speed_kmh <= 0:
        raise ValueError("Base speed must be greater than zero")

    base_time_hours = distance_km / base_speed_kmh
    base_time_minutes = base_time_hours * 60

    return base_time_minutes * traffic_multiplier


def _extract_hour(departure_time: str) -> int:
    try:
        parsed_time = datetime.strptime(departure_time, "%H:%M")
        return parsed_time.hour
    except ValueError:
        raise ValueError("departure_time must be in HH:MM format, example: 08:30")


def _weekday_multiplier(hour: int) -> float:
    # Morning rush hour
    if 7 <= hour <= 10:
        return 2.0

    # Afternoon/evening rush hour
    if 15 <= hour <= 19:
        return 1.8

    # Late night
    if 0 <= hour <= 5:
        return 0.8

    # Normal daytime traffic
    return 1.2


def _weekend_multiplier(hour: int) -> float:
    # Weekend evenings can be busy
    if 17 <= hour <= 22:
        return 1.5

    # Weekend mornings are usually lighter
    if 6 <= hour <= 11:
        return 0.9

    return 1.1