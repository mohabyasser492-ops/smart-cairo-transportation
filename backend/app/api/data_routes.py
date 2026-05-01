from fastapi import APIRouter
from app.services.data_service import load_json

router = APIRouter()

@router.get('/locations')
def locations():
    return {
        'neighborhoods': load_json('neighborhoods.json'),
        'facilities': load_json('facilities.json'),
    }

@router.get('/roads')
def roads():
    return {
        'existing_roads': load_json('existing_roads.json'),
        'potential_roads': load_json('potential_roads.json'),
    }

@router.get('/traffic')
def traffic():
    return load_json('traffic_flow.json')
