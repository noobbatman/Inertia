import time

from fastapi import APIRouter, HTTPException

from app.models import VerifyRequest, VerifyResponse
from app.services.jwt_service import sign_jwt
from app.storage.store import delete_puzzle, is_locked_out, load_puzzle, record_attempt

router = APIRouter(prefix="/verify", tags=["verify"])


@router.post("", response_model=VerifyResponse)
def verify_answer(req: VerifyRequest) -> VerifyResponse:
    locked, remaining = is_locked_out(req.student_id)
    if locked:
        raise HTTPException(
            status_code=423,
            detail=f"Locked out for {remaining} more seconds.",
        )

    puzzle = load_puzzle(req.token_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle token expired or not found.")

    if puzzle.get("student_id") and puzzle["student_id"] != req.student_id:
        raise HTTPException(
            status_code=403,
            detail="Puzzle token does not belong to this student.",
        )

    solve_time = max(0.0, time.time() - float(puzzle.get("issued_at", time.time())))
    expected_answer = str(puzzle["answer"]).strip().lower()
    submitted_answer = req.answer.strip().lower()
    correct = submitted_answer == expected_answer

    entry = record_attempt(
        req.student_id,
        success=correct,
        fc_score=int(puzzle.get("fc_score", 0)),
        solve_time=solve_time,
    )
    delete_puzzle(req.token_id)

    if correct:
        token = sign_jwt(req.student_id, req.token_id)
        return VerifyResponse(
            success=True,
            jwt_token=token,
            message="Proof-of-Thought verified. Push proceeding.",
        )

    _, remaining = is_locked_out(req.student_id)
    return VerifyResponse(
        success=False,
        lockout_seconds=remaining,
        attempt_number=entry["failed"],
        message=(
            f"Incorrect. Reflection period: {remaining}s. "
            f"Explanation: {puzzle.get('explanation', 'Review your logic.')}"
        ),
    )
