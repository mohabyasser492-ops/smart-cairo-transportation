from fastapi import APIRouter
from app.api import data_routes, routing_routes, network_routes, transit_routes, traffic_routes, prediction_routes

router = APIRouter()
router.include_router(data_routes.router, prefix='/data', tags=['Data'])
router.include_router(routing_routes.router, prefix='/routing', tags=['Routing'])
router.include_router(network_routes.router, prefix='/network', tags=['Network'])
router.include_router(transit_routes.router, prefix='/transit', tags=['Transit'])
router.include_router(traffic_routes.router, prefix='/traffic', tags=['Traffic'])
router.include_router(prediction_routes.router, prefix='/prediction', tags=['Prediction'])

@router.get('/health')
def health():
    return {'status': 'ok'}
