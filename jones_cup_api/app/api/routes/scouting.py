from fastapi import APIRouter
from app.services.scouting import process_all_teams

router = APIRouter()


@router.post("/scouting/generate")
async def generate_scouting_data():
    return process_all_teams()
