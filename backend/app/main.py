from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as base_router
from app.api.data_routes import router as data_router
from app.api.routing_routes import router as routing_router
from app.core.config import settings


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Smart Cairo Transportation System",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(base_router, prefix=settings.API_PREFIX)
app.include_router(data_router, prefix=settings.API_PREFIX)
app.include_router(routing_router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "Welcome to Smart Cairo Transportation API",
        "data": {
            "docs": "/docs",
            "health": f"{settings.API_PREFIX}/health",
        },
    }