from pydantic import BaseModel, Field


class ShortestPathRequest(BaseModel):
    source: str = Field(..., example="Nasr City")
    destination: str = Field(..., example="Downtown")
    weight: str = Field(default="distance", example="distance")
class EmergencyRoutingRequest(BaseModel):
    source: str = Field(..., example="Nasr City")
    destination: str = Field(..., example="Downtown Cairo")
    emergency_type: str = Field(default="ambulance", example="ambulance")

class TimeDependentRoutingRequest(BaseModel):
    source: str = Field(..., example="Nasr City")
    destination: str = Field(..., example="Downtown Cairo")
    departure_time: str = Field(default="08:30", example="08:30")
    day_type: str = Field(default="weekday", example="weekday")

class InfrastructureOptimizationRequest(BaseModel):
    use_potential_roads: bool = Field(default=True, example=True)
    cost_per_km: float = Field(default=10_000_000, example=10000000)
    priority: str = Field(default="cost", example="cost")

class BusAllocationRequest(BaseModel):
    available_buses: int = Field(default=100, example=100)


class MaintenancePlanRequest(BaseModel):
    budget: float = Field(default=50000000, example=50000000)

class TrafficSignalOptimizationRequest(BaseModel):
    total_cycle_time: int = Field(default=120, example=120)
    min_green_time: int = Field(default=20, example=20)
    max_green_time: int = Field(default=90, example=90)

 
def success_response(data, message: str):
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def error_response(message: str):
    return {
        "success": False,
        "message": message,
        "data": None,
    }