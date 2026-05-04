from math import ceil
from typing import Any, Dict, List


SCALING_UNIT = 1_000_000  # 1 DP unit = 1,000,000 EGP


def optimize_maintenance_plan(
    road_projects: List[Dict[str, Any]],
    budget: float,
) -> Dict[str, Any]:
    if budget <= 0:
        raise ValueError("budget must be greater than zero")

    if not road_projects:
        raise ValueError("No road projects provided for maintenance optimization")

    scaled_budget = _scale_amount(budget)
    projects = []

    for project in road_projects:
        maintenance_cost = int(
            project.get("maintenance_cost")
            or project.get("cost")
            or project.get("estimated_cost")
            or 1
        )

        benefit_score = int(
            project.get("benefit_score")
            or project.get("priority_score")
            or project.get("benefit")
            or 1
        )

        projects.append(
            {
                "road_id": str(project.get("road_id") or project.get("id")),
                "source": project.get("source"),
                "destination": project.get("destination"),
                "maintenance_cost": maintenance_cost,
                "scaled_cost": _scale_amount(maintenance_cost),
                "benefit_score": benefit_score,
                "condition": project.get("condition"),
            }
        )

    n = len(projects)

    dp = [[0 for _ in range(scaled_budget + 1)] for _ in range(n + 1)]

    for i in range(1, n + 1):
        project = projects[i - 1]
        project_cost = project["scaled_cost"]

        for current_budget in range(scaled_budget + 1):
            if project_cost <= current_budget:
                include_project = (
                    dp[i - 1][current_budget - project_cost]
                    + project["benefit_score"]
                )
                exclude_project = dp[i - 1][current_budget]

                dp[i][current_budget] = max(include_project, exclude_project)
            else:
                dp[i][current_budget] = dp[i - 1][current_budget]

    selected_projects = []
    remaining_budget_units = scaled_budget

    for i in range(n, 0, -1):
        if dp[i][remaining_budget_units] != dp[i - 1][remaining_budget_units]:
            project = projects[i - 1]
            selected_projects.append(
                {
                    "road_id": project["road_id"],
                    "source": project["source"],
                    "destination": project["destination"],
                    "maintenance_cost": project["maintenance_cost"],
                    "benefit_score": project["benefit_score"],
                    "condition": project["condition"],
                }
            )
            remaining_budget_units -= project["scaled_cost"]

    selected_projects.reverse()

    total_cost = sum(project["maintenance_cost"] for project in selected_projects)
    total_benefit = sum(project["benefit_score"] for project in selected_projects)

    return {
        "algorithm": "dynamic_programming_maintenance_knapsack",
        "budget": budget,
        "selected_projects_count": len(selected_projects),
        "selected_projects": selected_projects,
        "total_cost": total_cost,
        "remaining_budget": budget - total_cost,
        "total_benefit_score": total_benefit,
        "scaling_unit": SCALING_UNIT,
    }


def _scale_amount(amount: float) -> int:
    """
    Convert large money values into smaller DP units to keep
    the knapsack table computationally feasible.
    """
    scaled = ceil(float(amount) / SCALING_UNIT)
    return max(1, scaled)