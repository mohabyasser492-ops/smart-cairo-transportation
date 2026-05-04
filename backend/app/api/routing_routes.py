from fastapi import APIRouter, HTTPException

from app.models.request_models import (
    EmergencyRoutingRequest,
    PublicTransitRouteRequest,
    ShortestPathRequest,
    TimeDependentRoutingRequest,
)
from app.models.response_models import error_response, success_response
from app.services.routing_service import routing_service

router = APIRouter(prefix="/routing", tags=["Routing"])


def _bad_request(error: Exception):
    raise HTTPException(status_code=400, detail=error_response(str(error)))


def _server_error(prefix: str, error: Exception):
    raise HTTPException(
        status_code=500,
        detail=error_response(f"{prefix}: {str(error)}"),
    )


@router.post("/shortest-path")
def get_shortest_path(request: ShortestPathRequest):
    try:
        result = routing_service.find_shortest_path(
            request.source,
            request.destination,
            request.weight,
        )
        return success_response(data=result, message="Shortest path calculated successfully")
    except ValueError as error:
        _bad_request(error)
    except Exception as error:
        _server_error("Unexpected routing error", error)


@router.post("/astar")
def get_astar_path(request: ShortestPathRequest):
    try:
        result = routing_service.find_astar_path(
            request.source,
            request.destination,
            request.weight,
        )
        return success_response(data=result, message="A* path calculated successfully")
    except ValueError as error:
        _bad_request(error)
    except Exception as error:
        _server_error("Unexpected A* routing error", error)


@router.post("/emergency")
def get_emergency_route(request: EmergencyRoutingRequest):
    try:
        result = routing_service.find_emergency_route(
            request.source,
            request.destination,
            request.emergency_type,
        )
        return success_response(data=result, message="Emergency route calculated successfully")
    except ValueError as error:
        _bad_request(error)
    except Exception as error:
        _server_error("Unexpected emergency routing error", error)


@router.post("/compare/dijkstra-vs-astar")
def compare_dijkstra_vs_astar(request: ShortestPathRequest):
    try:
        result = routing_service.compare_dijkstra_and_astar(
            request.source,
            request.destination,
            request.weight,
        )
        return success_response(
            data=result,
            message="Dijkstra and A* comparison completed successfully",
        )
    except ValueError as error:
        _bad_request(error)
    except Exception as error:
        _server_error("Unexpected comparison error", error)


@router.post("/time-dependent")
def get_time_dependent_route(request: TimeDependentRoutingRequest):
    try:
        result = routing_service.find_time_dependent_route(
            request.source,
            request.destination,
            request.departure_time,
            request.day_type,
        )
        return success_response(data=result, message="Time-dependent route calculated successfully")
    except ValueError as error:
        _bad_request(error)
    except Exception as error:
        _server_error("Unexpected time-dependent routing error", error)


@router.post("/best-route-by-time")
def get_best_route_by_time(request: TimeDependentRoutingRequest):
    try:
        result = routing_service.find_best_route_by_time(
            request.source,
            request.destination,
            request.departure_time,
            request.day_type,
        )
        return success_response(data=result, message="Best route by time calculated successfully")
    except ValueError as error:
        _bad_request(error)
    except Exception as error:
        _server_error("Unexpected best-route-by-time error", error)


@router.post("/public-transit")
def get_public_transit_route(request: PublicTransitRouteRequest):
    try:
        result = routing_service.find_public_transit_route(
            request.source,
            request.destination,
            request.preference,
        )
        return success_response(
            data=result,
            message="Public transit route calculated successfully",
        )
    except ValueError as error:
        _bad_request(error)
    except Exception as error:
        _server_error("Unexpected public transit routing error", error)