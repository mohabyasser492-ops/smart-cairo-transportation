from typing import Any, Dict, List


def optimize_bus_allocation(
    routes: List[Dict[str, Any]],
    available_buses: int,
) -> Dict[str, Any]:
    if available_buses <= 0:
        raise ValueError("available_buses must be greater than zero")

    if not routes:
        raise ValueError("No routes provided for bus allocation")

    route_options = []

    for route in routes:
        route_id = str(route.get("id") or route.get("route_id") or route.get("name"))
        route_name = str(route.get("name") or route_id)

        demand = int(
            route.get("daily_passengers")
            or route.get("demand")
            or route.get("passenger_demand")
            or 0
        )

        min_buses = int(route.get("min_buses") or 1)
        max_buses = int(route.get("max_buses") or max(min_buses, available_buses))

        route_options.append(
            {
                "route_id": route_id,
                "route_name": route_name,
                "demand": demand,
                "min_buses": min_buses,
                "max_buses": max_buses,
            }
        )

    n = len(route_options)

    dp = [[0 for _ in range(available_buses + 1)] for _ in range(n + 1)]
    choice = [[0 for _ in range(available_buses + 1)] for _ in range(n + 1)]

    for i in range(1, n + 1):
        route = route_options[i - 1]

        for buses_used in range(available_buses + 1):
            best_value = dp[i - 1][buses_used]
            best_buses_for_route = 0

            for buses_for_current_route in range(
                route["min_buses"],
                min(route["max_buses"], buses_used) + 1,
            ):
                covered_demand = _calculate_covered_demand(
                    demand=route["demand"],
                    buses_allocated=buses_for_current_route,
                )

                candidate_value = (
                    dp[i - 1][buses_used - buses_for_current_route]
                    + covered_demand
                )

                if candidate_value > best_value:
                    best_value = candidate_value
                    best_buses_for_route = buses_for_current_route

            dp[i][buses_used] = best_value
            choice[i][buses_used] = best_buses_for_route

    allocation = {}
    remaining_buses = available_buses

    for i in range(n, 0, -1):
        buses_for_route = choice[i][remaining_buses]
        route = route_options[i - 1]

        allocation[route["route_id"]] = {
            "route_name": route["route_name"],
            "allocated_buses": buses_for_route,
            "route_demand": route["demand"],
            "covered_demand": _calculate_covered_demand(
                demand=route["demand"],
                buses_allocated=buses_for_route,
            ),
        }

        remaining_buses -= buses_for_route

    allocation = dict(reversed(list(allocation.items())))

    total_demand = sum(route["demand"] for route in route_options)
    covered_demand = dp[n][available_buses]

    covered_percentage = 0
    if total_demand > 0:
        covered_percentage = (covered_demand / total_demand) * 100

    return {
        "algorithm": "dynamic_programming_bus_allocation",
        "available_buses": available_buses,
        "routes_count": n,
        "allocation": allocation,
        "total_demand": total_demand,
        "covered_demand": covered_demand,
        "covered_demand_percentage": round(covered_percentage, 2),
        "unused_buses": remaining_buses,
    }


def _calculate_covered_demand(
    demand: int,
    buses_allocated: int,
    average_capacity_per_bus: int = 800,
) -> int:
    return min(demand, buses_allocated * average_capacity_per_bus)