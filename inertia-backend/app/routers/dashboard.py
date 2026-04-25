import asyncio
import json

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.models import DashboardResponse
from app.storage.store import (
    clear_lockout,
    get_active_lockouts,
    get_all_statuses,
    get_authenticity_records,
    get_difficulty_matrix,
    get_activity_feed,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/status", response_model=DashboardResponse)
def get_status(project_id: str = Query(default="global")) -> DashboardResponse:
    return DashboardResponse(students=get_all_statuses(project_id=project_id))


@router.get("/lockouts")
def get_lockouts(project_id: str = Query(default="global")) -> dict[str, list[dict]]:
    return {"students": get_active_lockouts(project_id=project_id)}


@router.get("/authenticity")
def get_authenticity(project_id: str = Query(default="global")) -> dict[str, list[dict]]:
    return {"students": get_authenticity_records(project_id=project_id)}


@router.get("/stream")
async def stream_status(project_id: str = Query(default="global")) -> StreamingResponse:
    async def event_generator():
        while True:
            data = {"students": get_all_statuses(project_id=project_id)}
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(30)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/analytics")
def get_analytics_data(project_id: str = Query(default="global")) -> dict:
    return {
        "difficulty_matrix": get_difficulty_matrix(project_id=project_id),
        "activity_feed": get_activity_feed(project_id=project_id)
    }


@router.delete("/lockout/{student_id}")
def clear_student_lockout(
    student_id: str, project_id: str = Query(default="global")
) -> dict[str, str]:
    clear_lockout(student_id, project_id=project_id)
    return {"message": f"Lockout cleared for {student_id}."}
