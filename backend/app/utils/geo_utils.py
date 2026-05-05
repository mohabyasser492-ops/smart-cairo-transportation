import math


def euclidean_distance(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
) -> float:
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def estimate_geo_distance_km(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
) -> float:
    degrees_distance = euclidean_distance(x1, y1, x2, y2)

    # Approximate conversion from coordinate degrees to kilometers.
    return degrees_distance * 111