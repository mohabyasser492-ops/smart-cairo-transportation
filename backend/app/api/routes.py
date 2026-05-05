from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "success": True,
        "message": "Smart Cairo Transportation API is running",
        "data": {
            "status": "healthy"
        }
    }