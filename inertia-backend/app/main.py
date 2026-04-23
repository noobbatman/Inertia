from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import audit, dashboard, puzzle, verify

app = FastAPI(title="Inertia.edu API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audit.router)
app.include_router(puzzle.router)
app.include_router(verify.router)
app.include_router(dashboard.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "inertia is running", "version": "2.0"}
