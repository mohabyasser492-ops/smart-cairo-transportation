from fastapi import APIRouter, HTTPException

from app.models.request_models import ShortestPathRequest
from app.models.response_models import success_response, error_response
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