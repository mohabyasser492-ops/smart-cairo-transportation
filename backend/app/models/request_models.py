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