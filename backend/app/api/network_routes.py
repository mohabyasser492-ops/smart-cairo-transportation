from fastapi import APIRouter

router = APIRouter()

@router.get('/placeholder')
def placeholder():
    return {'message': 'TODO: implement endpoint'}
