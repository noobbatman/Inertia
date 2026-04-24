from fastapi import APIRouter, HTTPException, Query

from app.models import (
    ProjectCreateRequest,
    ProjectCreateResponse,
    ProjectDashboardResponse,
    ProjectJoinRequest,
    ProjectJoinResponse,
    ProjectLookupResponse,
    ProjectSummary,
    StudentProfile,
)
from app.storage.store import (
    add_student_to_project,
    create_project,
    get_project_commits,
    get_project_dashboard,
    get_project_students,
    list_projects_by_teacher,
    load_project,
    load_project_by_join_code,
    load_student_profile,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectCreateResponse)
def create_project_endpoint(req: ProjectCreateRequest) -> ProjectCreateResponse:
    project = create_project(req.name, req.teacher_id)
    return ProjectCreateResponse(
        project_id=project["project_id"],
        name=project["name"],
        join_code=project["join_code"],
        teacher_id=project["teacher_id"],
        created_at=float(project["created_at"]),
        student_count=len(project.get("students", [])),
        commit_count=len(project.get("commit_log", [])),
    )


@router.get("", response_model=list[ProjectSummary])
def list_projects_endpoint(teacher_id: str = Query(...)) -> list[ProjectSummary]:
    projects = list_projects_by_teacher(teacher_id)
    return [
        ProjectSummary(
            project_id=project["project_id"],
            name=project["name"],
            join_code=project["join_code"],
            teacher_id=project["teacher_id"],
            created_at=float(project["created_at"]),
            student_count=len(project.get("students", [])),
            commit_count=len(project.get("commit_log", [])),
        )
        for project in projects
    ]


@router.get("/{join_code}", response_model=ProjectLookupResponse)
def validate_join_code(join_code: str) -> ProjectLookupResponse:
    project = load_project_by_join_code(join_code.upper())
    if not project:
        raise HTTPException(status_code=404, detail="Invalid join code.")

    return ProjectLookupResponse(
        project_id=project["project_id"],
        name=project["name"],
        teacher_id=project["teacher_id"],
        join_code=project["join_code"],
    )


@router.post("/{join_code}/join", response_model=ProjectJoinResponse)
def join_project(join_code: str, req: ProjectJoinRequest) -> ProjectJoinResponse:
    project = load_project_by_join_code(join_code.upper())
    if not project:
        raise HTTPException(status_code=404, detail="Invalid join code.")

    profile = add_student_to_project(project["project_id"], req.student_id)
    return ProjectJoinResponse(
        project_id=project["project_id"],
        student_id=req.student_id,
        joined_at=float(profile["joined_at"]),
    )


@router.get("/{project_id}/dashboard", response_model=ProjectDashboardResponse)
def project_dashboard(project_id: str) -> ProjectDashboardResponse:
    payload = get_project_dashboard(project_id)
    if not payload:
        raise HTTPException(status_code=404, detail="Project not found.")
    return ProjectDashboardResponse(**payload)


@router.get("/{project_id}/students", response_model=list[StudentProfile])
def project_students(project_id: str) -> list[StudentProfile]:
    if not load_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found.")
    return [StudentProfile(**profile) for profile in get_project_students(project_id)]


@router.get("/{project_id}/commits")
def project_commits(project_id: str) -> dict[str, list[dict]]:
    if not load_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found.")
    return {"commits": get_project_commits(project_id)}


@router.get("/{project_id}/students/{student_id}", response_model=StudentProfile)
def project_student_detail(project_id: str, student_id: str) -> StudentProfile:
    if not load_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found.")

    profile = load_student_profile(project_id, student_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found in project.")
    return StudentProfile(**profile)
