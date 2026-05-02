from fastapi import APIRouter, HTTPException

from app.models.request_models import EmergencyRoutingRequest, ShortestPathRequest
from app.models.response_models import error_response, success_response
from app.services.routing_service import routing_service


router = APIRouter(prefix="/routing", tags=["Routing"])


@router.post("/shortest-path")
def get_shortest_path(request: ShortestPathRequest):
    try:
        result = routing_service.find_shortest_path(
            source=request.source,
            destination=request.destination,
            weight=request.weight,
        )

        return success_response(
            data=result,
            message="Shortest path calculated successfully",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected routing error: {str(error)}"),
        )


@router.post("/astar")
def get_astar_path(request: ShortestPathRequest):
    try:
        result = routing_service.find_astar_path(
            source=request.source,
            destination=request.destination,
            weight=request.weight,
        )

        return success_response(
            data=result,
            message="A* path calculated successfully",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected A* routing error: {str(error)}"),
        )


@router.post("/emergency")
def get_emergency_route(request: EmergencyRoutingRequest):
    try:
        result = routing_service.find_emergency_route(
            source=request.source,
            destination=request.destination,
            emergency_type=request.emergency_type,
        )

        return success_response(
            data=result,
            message="Emergency route calculated successfully",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected emergency routing error: {str(error)}"),
        )


@router.post("/compare/dijkstra-vs-astar")
def compare_dijkstra_vs_astar(request: ShortestPathRequest):
    try:
        result = routing_service.compare_dijkstra_and_astar(
            source=request.source,
            destination=request.destination,
            weight=request.weight,
        )

        return success_response(
            data=result,
            message="Dijkstra and A* comparison completed successfully",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected comparison error: {str(error)}"),
        )