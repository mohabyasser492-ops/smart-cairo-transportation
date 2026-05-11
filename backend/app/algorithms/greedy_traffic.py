from typing import Any, Dict, List

def classify_congestion(congestion_score: float) -> str:
    if congestion_score >= 120:
        return "severe"
    if congestion_score >= 90:
        return "high"
    if congestion_score >= 60:
        return "medium"
    return "low"


def calculate_congestion_score(
    incoming_flow: float,
    capacity: float,
    waiting_time: float,
) -> float:
    if capacity <= 0:
        capacity = 1

    volume_capacity_ratio = incoming_flow / capacity
    score = (volume_capacity_ratio * 70) + (waiting_time * 0.3)

    return max(score, 0)


def estimate_waiting_reduction(
    congestion_score: float,
    green_time: int,
    total_cycle_time: int,
) -> float:
    if total_cycle_time <= 0:
        return 0

    green_ratio = green_time / total_cycle_time
    reduction = congestion_score * green_ratio * 0.6

    return round(min(reduction, 45), 2)


def detect_congestion_hotspots(
    intersections: List[Dict[str, Any]],
    threshold: float = 80,
) -> Dict[str, Any]:
    hotspots = []

    for intersection in intersections:
        incoming_flow = float(
            intersection.get("incoming_flow")
            or intersection.get("traffic_volume")
            or intersection.get("vehicles_per_hour")
            or intersection.get("flow")
            or 0
        )

        capacity = float(
            intersection.get("capacity")
            or intersection.get("capacity_vehicles_per_hour")
            or 1
        )

        average_waiting_time = float(
            intersection.get("average_waiting_time")
            or intersection.get("waiting_time")
            or 0
        )

        congestion_score = calculate_congestion_score(
            incoming_flow=incoming_flow,
            capacity=capacity,
            waiting_time=average_waiting_time,
        )

        if congestion_score >= threshold:
            hotspots.append(
                {
                    "intersection_id": str(
                        intersection.get("id")
                        or intersection.get("intersection_id")
                        or intersection.get("road_id")
                        or "unknown"
                    ),
                    "name": intersection.get("name"),
                    "from": intersection.get("from"),
                    "to": intersection.get("to"),
                    "incoming_flow": round(incoming_flow, 2),
                    "capacity": round(capacity, 2),
                    "average_waiting_time": round(average_waiting_time, 2),
                    "congestion_score": round(congestion_score, 2),
                    "severity": classify_congestion(congestion_score),
                    "congestion_level": classify_congestion(congestion_score),
                }
            )

    hotspots.sort(
        key=lambda item: item["congestion_score"],
        reverse=True,
    )

    return {
        "threshold": threshold,
        "hotspots_count": len(hotspots),
        "hotspots": hotspots,
    }


def optimize_traffic_signals_greedy(
    intersections: List[Dict[str, Any]],
    total_cycle_time: int = 120,
    min_green_time: int = 20,
    max_green_time: int = 90,
) -> Dict[str, Any]:
    if total_cycle_time <= 0:
        raise ValueError("total_cycle_time must be greater than zero")

    if min_green_time <= 0:
        raise ValueError("min_green_time must be greater than zero")

    if max_green_time < min_green_time:
        raise ValueError("max_green_time must be greater than or equal to min_green_time")

    if min_green_time > total_cycle_time:
        raise ValueError("min_green_time cannot be greater than total_cycle_time")

    if not intersections:
        raise ValueError("No intersections provided for traffic signal optimization")

    scored_intersections = []

    for intersection in intersections:
        incoming_flow = float(
            intersection.get("incoming_flow")
            or intersection.get("traffic_volume")
            or intersection.get("vehicles_per_hour")
            or intersection.get("flow")
            or 0
        )

        capacity = float(
            intersection.get("capacity")
            or intersection.get("capacity_vehicles_per_hour")
            or 1
        )

        average_waiting_time = float(
            intersection.get("average_waiting_time")
            or intersection.get("waiting_time")
            or 0
        )

        congestion_score = calculate_congestion_score(
            incoming_flow=incoming_flow,
            capacity=capacity,
            waiting_time=average_waiting_time,
        )

        scored_intersections.append(
            {
                "intersection_id": str(
                    intersection.get("id")
                    or intersection.get("intersection_id")
                    or intersection.get("road_id")
                    or "unknown"
                ),
                "name": intersection.get("name"),
                "from": intersection.get("from"),
                "to": intersection.get("to"),
                "incoming_flow": incoming_flow,
                "capacity": capacity,
                "average_waiting_time": average_waiting_time,
                "congestion_score": congestion_score,
            }
        )

    scored_intersections.sort(
        key=lambda item: item["congestion_score"],
        reverse=True,
    )

    total_score = sum(item["congestion_score"] for item in scored_intersections)

    optimized_signals = []

    for intersection in scored_intersections:
        if total_score <= 0:
            proportional_green_time = min_green_time
        else:
            proportional_green_time = int(
                (intersection["congestion_score"] / total_score) * total_cycle_time
            )

        green_time = max(min_green_time, proportional_green_time)
        green_time = min(max_green_time, green_time)
        green_time = min(total_cycle_time, green_time)

        red_time = max(total_cycle_time - green_time, 0)

        waiting_reduction_percentage = estimate_waiting_reduction(
            congestion_score=intersection["congestion_score"],
            green_time=green_time,
            total_cycle_time=total_cycle_time,
        )

        optimized_signals.append(
            {
                "intersection_id": intersection["intersection_id"],
                "name": intersection["name"],
                "from": intersection.get("from"),
                "to": intersection.get("to"),
                "incoming_flow": round(intersection["incoming_flow"], 2),
                "capacity": round(intersection["capacity"], 2),
                "average_waiting_time": round(intersection["average_waiting_time"], 2),
                "congestion_score": round(intersection["congestion_score"], 2),
                "congestion_level": classify_congestion(intersection["congestion_score"]),
                "recommended_green_time_sec": green_time,
                "recommended_red_time_sec": red_time,
                "total_cycle_time_sec": total_cycle_time,
                "expected_waiting_time_reduction_percentage": waiting_reduction_percentage,
            }
        )

    average_reduction = (
        sum(
            item["expected_waiting_time_reduction_percentage"]
            for item in optimized_signals
        )
        / len(optimized_signals)
        if optimized_signals
        else 0
    )

    return {
        "algorithm": "greedy_traffic_signal_optimization",
        "total_cycle_time_sec": total_cycle_time,
        "min_green_time_sec": min_green_time,
        "max_green_time_sec": max_green_time,
        "optimized_intersections_count": len(optimized_signals),
        "optimized_signals": optimized_signals,
        "summary": {
            "optimized_intersections": len(optimized_signals),
            "average_improvement": round(average_reduction, 2),
        },
    }
