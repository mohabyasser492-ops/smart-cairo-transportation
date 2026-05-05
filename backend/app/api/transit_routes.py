from fastapi import APIRouter, HTTPException

from app.models.request_models import BusAllocationRequest
from app.models.response_models import error_response, success_response
from app.services.transit_service import transit_service


router = APIRouter(prefix="/transit", tags=["Public Transit"])


@router.post("/allocate-buses")
def allocate_buses(request: BusAllocationRequest):
    try:
        result = transit_service.allocate_buses(
            available_buses=request.available_buses,
        )

        return success_response(
            data=result,
            message="Bus allocation optimized successfully",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=error_response(str(error)),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=error_response(f"Unexpected bus allocation error: {str(error)}"),
        )