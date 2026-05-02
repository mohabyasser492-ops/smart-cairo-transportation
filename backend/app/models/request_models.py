from pydantic import BaseModel, Field


class ShortestPathRequest(BaseModel):
    source: str = Field(..., example="Nasr City")
    destination: str = Field(..., example="Downtown")
    weight: str = Field(default="distance", example="distance")

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