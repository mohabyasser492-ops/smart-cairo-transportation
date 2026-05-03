from fastapi import APIRouter, HTTPException

from app.models.request_models import InfrastructureOptimizationRequest
from app.models.response_models import error_response, success_response
from app.services.network_service import network_service


router = APIRouter(prefix="/network", tags=["Network Optimization"])


@router.get("/minimum-spanning-tree")
def get_minimum_spanning_tree():
    try:
        result = network_service.get_minimum_spanning_tree()

        return success_response(
            data=result,
            message="Minimum spanning tree calculated successfully",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected MST error: {str(error)}"),
        )


@router.get("/infrastructure-plan")
def get_infrastructure_plan():
    try:
        result = network_service.get_infrastructure_plan()

        return success_response(
            data=result,
            message="Infrastructure plan generated successfully",
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected infrastructure planning error: {str(error)}"),
        )


@router.post("/optimize-expansion")
def optimize_expansion(request: InfrastructureOptimizationRequest):
    try:
        result = network_service.optimize_expansion(
            use_potential_roads=request.use_potential_roads,
            cost_per_km=request.cost_per_km,
            priority=request.priority,
        )

        return success_response(
            data=result,
            message="Infrastructure expansion optimized successfully",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected expansion optimization error: {str(error)}"),
        )