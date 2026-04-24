from fastapi import APIRouter, HTTPException

from app.models import DifficultyLevel, PuzzleRequest, PuzzleResponse
from app.services.ast_parser import get_difficulty, get_timer_seconds
from app.services.puzzle_factory import generate_puzzle
from app.storage.store import is_locked_out

router = APIRouter(prefix="/puzzle", tags=["puzzle"])


@router.post("", response_model=PuzzleResponse)
async def request_puzzle(req: PuzzleRequest) -> PuzzleResponse:
    locked, remaining = is_locked_out(req.student_id)
    if locked:
        raise HTTPException(
            status_code=423,
            detail=f"Student is in reflection period. {remaining}s remaining.",
        )

    expected_difficulty = get_difficulty(req.fc_score)
    if req.difficulty != expected_difficulty:
        raise HTTPException(
            status_code=400,
            detail=f"Difficulty mismatch: expected {expected_difficulty.value} for fc_score={req.fc_score}.",
        )

    if req.difficulty == DifficultyLevel.TRIVIAL:
        raise HTTPException(
            status_code=400,
            detail="Trivial commits do not require a puzzle.",
        )

    token_id, puzzle_data = await generate_puzzle(
        req.diff,
        req.fc_score,
        req.difficulty,
        req.student_id,
    )

    return PuzzleResponse(
        token_id=token_id,
        question=puzzle_data["question"],
        setup=puzzle_data["setup"],
        function_name=puzzle_data["function_name"],
        timer_seconds=get_timer_seconds(req.difficulty),
    )
