from pydantic import BaseModel

class RouteResponse(BaseModel):
    path: list[str]
    cost: float
