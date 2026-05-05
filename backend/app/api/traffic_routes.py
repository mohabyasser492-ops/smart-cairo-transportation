from fastapi import APIRouter, HTTPException

from app.models.request_models import TrafficSignalOptimizationRequest
from app.models.response_models import error_response, success_response
from app.services.signal_service import signal_service


router = APIRouter(prefix="/traffic", tags=["Traffic Signals"])


@router.post("/signals/optimize")
def optimize_traffic_signals(request: TrafficSignalOptimizationRequest):
    try:
        result = signal_service.optimize_signals(
            total_cycle_time=request.total_cycle_time,
            min_green_time=request.min_green_time,
            max_green_time=request.max_green_time,
        )

        return success_response(
            data=result,
            message="Traffic signals optimized successfully",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected traffic signal optimization error: {str(error)}"),
        )


@router.get("/congestion-hotspots")
def get_congestion_hotspots():
    try:
        result = signal_service.get_congestion_hotspots()

        return success_response(
            data=result,
            message="Congestion hotspots retrieved successfully",
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected congestion hotspot error: {str(error)}"),
        )


@router.get("/intersections/status")
def get_intersections_status():
    try:
        result = signal_service.get_intersections_status()

        return success_response(
            data=result,
            message="Intersection statuses retrieved successfully",
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected intersection status error: {str(error)}"),
        )