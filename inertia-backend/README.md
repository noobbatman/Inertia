# Inertia.edu Backend

FastAPI service for the Inertia.edu hackathon demo. It audits git diffs, scores complexity, generates Proof-of-Thought puzzles, verifies answers, tracks lockouts, and issues JWTs.

## What is implemented

- `POST /audit` computes the Friction Coefficient (`Fc = L + 2R + N`)
- `POST /puzzle` generates an AI puzzle or falls back to a curated puzzle bank
- `POST /verify` checks answers, records lockouts, and returns a JWT on success
- `GET /dashboard/status`, `/dashboard/lockouts`, `/dashboard/authenticity`, and `/dashboard/stream`
- Bash `pre-push` hook and `setup.sh` installer
- In-memory state by default, with optional Redis backing

## Run locally

1. Create a virtual environment and install dependencies.
2. Copy `.env.example` to `.env` and set `JWT_SECRET`. Add `ANTHROPIC_API_KEY` if you want live Claude puzzles.
3. Start the API from `inertia-backend/`:

```bash
uvicorn app.main:app --reload --port 8000
```

4. Run tests:

```bash
pytest tests -v
```

## Notes

- The service falls back to curated puzzles when the Anthropic SDK is unavailable, the API key is missing, the request times out, or JSON parsing fails.
- The git hook expects the backend to run on `http://localhost:8000` unless `INERTIA_API` is set.
- For the demo, in-memory mode is enough. Redis is optional and controlled with `USE_REDIS=true`.
