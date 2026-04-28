# Inertia.edu — Proof-of-Thought at Every Push

> **Inertia intercepts `git push` — the exact moment a student ships code — and blocks it until they prove they understand what they just wrote.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://inertia-tau.vercel.app)
[![API Status](https://img.shields.io/badge/API-railway-blue)](https://inertia-production-e090.up.railway.app/health)
[![Install](https://img.shields.io/badge/pipx-inertia--edu-3775A9?logo=pypi&logoColor=white)](https://pypi.org/project/inertia-edu/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](./LICENSE)

---

## My Role

**Backend Developer & Systems Engineer** — I took this project from a working prototype to a production-ready, cross-platform system. I was responsible for the entire backend architecture refactor, AI provider migration, CLI packaging, cross-platform compatibility, CI/CD pipeline, and 10+ bug fixes.

Original team repo: [sazid-alam/Inertia](https://github.com/sazid-alam/Inertia)

---

## What I Built — Highlighted Contributions

### 🏗️ Project-Scoped Architecture Redesign
**~900 lines changed across 20+ files** — the largest single contribution.

The original system had a flat global student namespace. I redesigned the entire data model so teachers create projects with join codes and all data is isolated per project — making real classroom use possible.

- New `/projects` router with 8 endpoints (create, list, lookup, join, dashboard, students, commits, student detail)
- All storage keys refactored to `project:{id}:student:{sid}` scoping
- `store.py` extended with `create_project`, `load_project_by_join_code`, `save_student_profile`, `record_project_commit`
- All lockout functions now accept `project_id`
- New `commit_classifier.py` — classifies diffs into BACKEND / UI / DATABASE / TESTING / INFRA / OTHER with percentage normalization
- 4 new frontend pages: `ProjectListPage`, `NewProjectPage`, `ProjectDetailPage`, `StudentDetailPage`
- CLI `inertia init` now validates join code, checks repo has zero commits, writes scoped config

---

### 📦 CLI Packaging & Production Hardening
**1,615 lines added in a single commit**

Turned a loose script into a proper installable Python tool:

- `pyproject.toml` with `inertia = "inertia_cli.inertia:main"` entry point → `pipx install inertia-edu` works
- New commands: `inertia repair`, `inertia update`, `inertia status`, `inertia doctor`
- OS detection: writes Python hook (`pre-push.py`) on Windows, bash hook on macOS/Linux
- Config versioning (`INERTIA_VERSION=1`) for future migration support
- `OFFLINE_POLICY=allow` — students are never blocked by infrastructure failure
- Overwrite prompt before replacing existing hooks, with `--yes` flag for automation

---

### 🤖 AI Provider Migration + Semantic Answer Evaluation

Replaced Anthropic Claude with Google Gemini 2.5 Pro across the entire backend:

- Rewrote `puzzle_factory.py` to use `google-genai` async SDK
- Replaced exact string matching for answers with Gemini-powered **semantic evaluation** — `"5 and 3"` / `"5,3"` / `"5 and three"` all accepted correctly
- Fixed a critical bug: Gemini 2.5 Pro (thinking model) injects reasoning into `response.text`, causing the old `"yes" in response.text.lower()` check to match thinking content and produce false positives/negatives
- Added `_parse_binary_verdict()` with strict parsing: accepts only JSON `{"verdict":"YES"}`, exact `YES`/`NO`, or `VERDICT: YES/NO` — returns `None` for ambiguous text, falls back to exact match
- Added unit tests covering all three parsing paths

---

### 🌐 Browser-Based Puzzle Flow (Replaced Terminal)

The original hook printed puzzles in the terminal and read answers with `read -r`. I replaced this entirely:

- Hook calls `POST /puzzle` → gets `token_id` → opens browser URL
- Hook polls `GET /puzzle/{token_id}/status` every 3 seconds
- Student solves in browser → backend marks token verified → hook detects `verified` → push proceeds
- Gives teachers a URL-timestamped record of every solve — impossible in a terminal

---

### 🔍 GitHub Commit Reconciliation

A new integrity feature that lets teachers detect students who bypassed Inertia and pushed directly to GitHub:

- New service `commit_reconciliation.py` — fetches GitHub commits via API, cross-references against Inertia-verified hashes
- New endpoint: `GET /projects/{project_id}/students/{student_id}/commit-reconciliation`
- Returns per-commit breakdown: `INERTIA_VERIFIED` vs `GITHUB_ONLY` with direct links
- Frontend panel in `StudentDetailPage` surfaces unverified pushes with timestamps

---

### 🧪 GitHub Actions CI Matrix

Full cross-platform CI covering:

```
OS:     ubuntu-latest × macos-latest × windows-latest
Python: 3.11 × 3.12
```

Jobs: `backend-test` · `cli-unit` · `cli-install` (smoke test) · `frontend-lint` · `frontend-build` · `e2e`

Release workflow gates on the full matrix before publishing to PyPI.

---

## Other Contributions

<details>
<summary><b>🐛 Bug Fixes (10+)</b></summary>

| Fix | Commit |
|---|---|
| Failed counter not resetting on successful solve — accumulating across sessions | `766c3d1` |
| `concept: str` missing from `AttemptLogEntry` — Pydantic silently dropped it | `7d72baa` |
| `was_correct: bool` missing from `StudentStatus` — frontend type didn't declare it | `7d72baa` |
| `clearLockout` return type mismatch — backend returned `{message}`, frontend expected `{cleared}` | `766c3d1` |
| SSE reconnect had no backoff — added exponential (2s → 4s → 8s… 30s cap) | `766c3d1` |
| Live lockout timer broken in `StudentDrawer.tsx` — fixed with `useCountdown` hook | `766c3d1` |
| `curl -sf` hid 423 lockout responses — changed to `curl -s`, added JSON error extraction | `793bfc2` |
| Lockout escalation had no upper bound — capped at 2 minutes max | `f7b93b0` |

</details>

<details>
<summary><b>🖥️ Cross-Platform Compatibility</b></summary>

**Python detection** (`5bc1628`, `02089c4`):
- `detect_python()` tries: `python3` → `python` (with v3 version check) → `py -3` (Windows Launcher)
- Resolved `PYTHON_BIN` written to `.inertia/config` at init time
- Graceful degradation: push allowed with clear install instructions if Python not found

**CRLF line ending bug** (`e4b678a`):
- Bash hook saved with CRLF caused `\` continuations to break on Windows Git Bash
- Added `.gitattributes` enforcing LF for all `.py`, `.sh`, and hook files
- All config and hook writes now use `encoding="utf-8", newline="\n"` explicitly

</details>

<details>
<summary><b>🧪 Tests Added</b></summary>

- `tests/test_puzzle_factory.py` — unit tests for all three Gemini verdict parsing paths
- `tests/cli/test_smoke.py` — validates LF endings, config version string, zero-commit enforcement, Windows hook selection
- `tests/e2e/test_student_flow.py` — full automated journey: create project → `inertia init` → commit → audit → puzzle → verify → status polling

</details>

---

## How It Works

```
Student types: git push
       │
       ▼
pre-push git hook  (inertia-cli)
reads the diff from stdin
       │  POST /audit
       ▼
Inertia Backend  (FastAPI)
Friction Coefficient: Fc = L + 2R + N
       │
  Fc > threshold?
      YES
       │  POST /puzzle
       ▼
Gemini 2.5 Pro generates a variable-trace
puzzle from the student's own diff
       │
Hook prints browser URL, polls for status
       │
Student solves in browser → POST /verify
       │
Gemini evaluates semantically
       │
✅ Correct → JWT issued → push proceeds
❌ Wrong   → reflection period (lockout)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12 · FastAPI · Uvicorn · PyJWT |
| AI | Google Gemini 2.5 Pro (`google-genai` async SDK) |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| Real-time | Server-Sent Events (SSE) |
| Git integration | Bash `pre-push` hook + Python CLI (`inertia-edu` on PyPI) |
| Backend hosting | Railway |
| Frontend hosting | Vercel |

---

## Quick Start

```bash
# Install CLI
pipx install inertia-edu

# In your assignment repo
inertia init
# Enter join code from your instructor

# Work normally — Inertia activates only on complex pushes
git add . && git commit -m "implement BFS" && git push
```

**Diagnostics:**
```bash
inertia status    # show current repo config
inertia doctor    # check hook + config
inertia repair    # reinstall hook if corrupted
inertia update    # upgrade CLI
```

---

## Live Demos

| | URL |
|---|---|
| 👩‍🏫 Instructor dashboard | [inertia-tau.vercel.app/dashboard](https://inertia-tau.vercel.app/dashboard) |
| 🔌 API health | [inertia-production-e090.up.railway.app/health](https://inertia-production-e090.up.railway.app/health) |
| 📖 Interactive API docs | [inertia-production-e090.up.railway.app/docs](https://inertia-production-e090.up.railway.app/docs) |

---

## License

MIT — see [LICENSE](./LICENSE)
