import time
import uuid

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models import AuditRequest, AuditResponse, DifficultyLevel
from app.services.ast_parser import compute_complexity, get_difficulty
from app.services.commit_classifier import summarize_diff
from app.storage.store import (
    add_student_to_project,
    is_locked_out,
    load_project,
    record_project_commit,
)

router = APIRouter(prefix="/audit", tags=["audit"])


@router.post("", response_model=AuditResponse)
def audit_diff(req: AuditRequest) -> AuditResponse:
    if not load_project(req.project_id):
        raise HTTPException(status_code=404, detail="Project not found.")

    locked, remaining = is_locked_out(req.student_id, req.project_id)
    if locked:
        raise HTTPException(
            status_code=423,
            detail=f"Student is in reflection period. {remaining}s remaining.",
        )

    if not req.diff.strip():
        raise HTTPException(status_code=400, detail="Empty diff - nothing to audit.")

    result = compute_complexity(req.diff)
    difficulty = get_difficulty(result["fc"])

    if difficulty == DifficultyLevel.TRIVIAL and req.commit_hash:
        diff_summary = summarize_diff(req.diff)
        add_student_to_project(req.project_id, req.student_id)
        record_project_commit(
            req.project_id,
            req.student_id,
            {
                "commit_id": str(uuid.uuid4()),
                "student_id": req.student_id,
                "project_id": req.project_id,
                "timestamp": time.time(),
                "commit_hash": req.commit_hash,
                "commit_message": req.commit_message,
                "diff_summary": {
                    "lines_added": int(diff_summary["lines_added"]),
                    "lines_removed": int(diff_summary["lines_removed"]),
                    "files_changed": list(diff_summary["files_changed"]),
                },
                "categories": dict(diff_summary["categories"]),
                "fc_score": result["fc"],
                "difficulty": difficulty.value,
                "puzzle_result": "SKIPPED",
                "solve_time_seconds": 0.0,
                "flagged": False,
                "concept": "OTHER",
            },
        )

    return AuditResponse(
        complexity_score=result["fc"],
        line_delta=result["L"],
        recursive_calls=result["R"],
        nesting_depth=result["N"],
        difficulty=difficulty,
        requires_puzzle=difficulty != DifficultyLevel.TRIVIAL,
        requires_proof_of_intent=result["L"] > settings.MAX_DIFF_LINES,
    )
