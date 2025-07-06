from fastapi import APIRouter

from app.api.routes import scouting

api_router = APIRouter()
api_router.include_router(scouting.router)
