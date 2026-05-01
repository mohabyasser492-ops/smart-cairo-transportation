from pydantic import BaseModel

class RouteRequest(BaseModel):
    start: str
    target: str
    time_period: str | None = None
