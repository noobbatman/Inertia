from enum import Enum

from pydantic import BaseModel, Field


class DifficultyLevel(str, Enum):
    TRIVIAL = "TRIVIAL"
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class AuditRequest(BaseModel):
    diff: str
    student_id: str
    project_id: str
    commit_hash: str = ""
    commit_message: str = ""


class AuditResponse(BaseModel):
    complexity_score: int
    line_delta: int
    recursive_calls: int
    nesting_depth: int
    difficulty: DifficultyLevel
    requires_puzzle: bool
    requires_proof_of_intent: bool


class PuzzleRequest(BaseModel):
    diff: str
    fc_score: int
    difficulty: DifficultyLevel
    student_id: str
    project_id: str
    commit_hash: str = ""
    commit_message: str = ""


class PuzzleResponse(BaseModel):
    token_id: str
    question: str
    setup: str
    function_name: str
    timer_seconds: int


class PublicPuzzleResponse(BaseModel):
    setup: str
    question: str
    function_name: str
    timer_seconds: int
    student_id: str
    project_id: str = ""


class PuzzleStatusResponse(BaseModel):
    status: str
    jwt_token: str | None = None
    message: str | None = None


class VerifyRequest(BaseModel):
    token_id: str
    student_id: str
    answer: str
    project_id: str = ""  # falls back to project_id stored in the puzzle token


class VerifyResponse(BaseModel):
    success: bool
    jwt_token: str | None = None
    lockout_seconds: int | None = None
    attempt_number: int | None = None
    message: str


class AttemptLogEntry(BaseModel):
    timestamp: float
    success: bool
    fc_score: int = 0
    solve_time: float = 0
    concept: str = "OTHER"


class StudentStatus(BaseModel):
    student_id: str
    locked_until: str | None = None
    attempt_count: int
    failed_count: int = 0
    lockout_seconds: int = 0
    last_fc_score: int | None = None
    is_suspicious: bool
    was_correct: bool | None = None
    recent_attempts: list[AttemptLogEntry] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    students: list[StudentStatus]


class ProjectCreateRequest(BaseModel):
    name: str
    teacher_id: str


class ProjectSummary(BaseModel):
    project_id: str
    name: str
    join_code: str
    teacher_id: str
    created_at: float
    student_count: int
    commit_count: int


class ProjectCreateResponse(ProjectSummary):
    pass


class ProjectJoinRequest(BaseModel):
    student_id: str
    repo_url: str | None = None


class ProjectJoinResponse(BaseModel):
    project_id: str
    student_id: str
    joined_at: float


class ProjectLookupResponse(BaseModel):
    project_id: str
    name: str
    teacher_id: str
    join_code: str


class CommitDiffSummary(BaseModel):
    lines_added: int
    lines_removed: int
    files_changed: list[str]


class CommitRecord(BaseModel):
    commit_id: str
    student_id: str
    project_id: str
    timestamp: float
    commit_hash: str
    commit_message: str
    diff_summary: CommitDiffSummary
    categories: dict[str, int]
    fc_score: int
    difficulty: DifficultyLevel
    puzzle_result: str
    solve_time_seconds: float
    flagged: bool
    concept: str = "OTHER"


class StudentPuzzleStats(BaseModel):
    total: int = 0
    passed: int = 0
    failed: int = 0
    avg_solve_time: float = 0.0


class StudentProfile(BaseModel):
    student_id: str
    project_id: str
    joined_at: float
    repo_url: str | None = None
    total_commits: int
    total_lines_added: int
    category_breakdown: dict[str, int]
    puzzle_stats: StudentPuzzleStats
    ever_flagged: bool
    lockout_count: int
    concept_heatmap: dict[str, dict[str, int]]


class ReconciledCommit(BaseModel):
    commit_hash: str
    commit_message: str
    timestamp: float
    source: str
    verified_by_inertia: bool
    html_url: str | None = None


class CommitReconciliationResponse(BaseModel):
    project_id: str
    student_id: str
    repo_url: str
    inertia_commit_count: int
    github_commit_count: int
    missing_inertia_count: int
    commits: list[ReconciledCommit]


class ProjectDashboardResponse(BaseModel):
    project: ProjectSummary
    students: list[StudentProfile]
    commits: list[CommitRecord]
