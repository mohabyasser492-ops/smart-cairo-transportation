from fastapi import APIRouter, HTTPException

from app.models.request_models import (
    RouteTrafficPredictionRequest,
    TrafficPredictionRequest,
)
from app.models.response_models import error_response, success_response
from app.services.prediction_service import prediction_service


router = APIRouter(prefix="/prediction", tags=["Traffic Prediction"])


@router.post("/traffic")
def predict_traffic(request: TrafficPredictionRequest):
    try:
        result = prediction_service.predict_traffic(
            road_id=request.road_id,
            hour=request.hour,
            day_of_week=request.day_of_week,
            weather=request.weather,
            is_holiday=request.is_holiday,
        )

        return success_response(
            data=result,
            message="Traffic prediction generated successfully",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=error_response(str(error)),
        )

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected prediction error: {str(error)}"),
        )


@router.get("/model-metrics")
def get_model_metrics():
    try:
        result = prediction_service.get_model_metrics()

        return success_response(
            data=result,
            message="Model metrics retrieved successfully",
        )

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected metrics error: {str(error)}"),
        )


@router.post("/route-traffic")
def predict_route_traffic(request: RouteTrafficPredictionRequest):
    try:
        result = prediction_service.predict_route_traffic(
            source=request.source,
            destination=request.destination,
            hour=request.hour,
            day_of_week=request.day_of_week,
            weather=request.weather,
            is_holiday=request.is_holiday,
            weight=request.weight,
        )

        return success_response(
            data=result,
            message="Route traffic prediction generated successfully",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=error_response(str(error)),
        )

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected route prediction error: {str(error)}"),
        )