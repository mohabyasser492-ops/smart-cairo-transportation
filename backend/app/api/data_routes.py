from fastapi import APIRouter, HTTPException

from app.services.data_service import data_service

router = APIRouter(prefix="/data", tags=["Data"])


def success_response(data, message: str = "Data retrieved successfully"):
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def handle_data_error(error: Exception):
    raise HTTPException(
        status_code=500,
        detail={
            "success": False,
            "message": str(error),
            "data": None,
        },
    )


@router.get("/neighborhoods")
def get_neighborhoods():
    try:
        data = data_service.get_neighborhoods()
        return success_response(data, "Neighborhoods retrieved successfully")
    except Exception as error:
        handle_data_error(error)


@router.get("/facilities")
def get_facilities():
    try:
        data = data_service.get_facilities()
        return success_response(data, "Facilities retrieved successfully")
    except Exception as error:
        handle_data_error(error)


@router.get("/roads/existing")
def get_existing_roads():
    try:
        data = data_service.get_existing_roads()
        return success_response(data, "Existing roads retrieved successfully")
    except Exception as error:
        handle_data_error(error)


@router.get("/roads/potential")
def get_potential_roads():
    try:
        data = data_service.get_potential_roads()
        return success_response(data, "Potential roads retrieved successfully")
    except Exception as error:
        handle_data_error(error)


@router.get("/traffic-flow")
def get_traffic_flow():
    try:
        data = data_service.get_traffic_flow()
        return success_response(data, "Traffic flow data retrieved successfully")
    except Exception as error:
        handle_data_error(error)


@router.get("/metro-lines")
def get_metro_lines():
    try:
        data = data_service.get_metro_lines()
        return success_response(data, "Metro lines retrieved successfully")
    except Exception as error:
        handle_data_error(error)


@router.get("/bus-routes")
def get_bus_routes():
    try:
        data = data_service.get_bus_routes()
        return success_response(data, "Bus routes retrieved successfully")
    except Exception as error:
        handle_data_error(error)


@router.get("/public-transport-demand")
def get_public_transport_demand():
    try:
        data = data_service.get_public_transport_demand()
        return success_response(data, "Public transport demand retrieved successfully")
    except Exception as error:
        handle_data_error(error)


@router.get("/summary")
def get_data_summary():
    try:
        data = data_service.get_summary()
        return success_response(data, "Data summary retrieved successfully")
    except Exception as error:
        handle_data_error(error)