# Supabase Database & Auth Architecture Plan

Architecture for migrating AI4Numerics to Supabase (PostgreSQL + Auth) to handle 200+ students per semester.

## 1. Backend Folder Structure

### Backend Folder Structure (`backend/src/`)
```text
backend/
├── src/
│   ├── main.py                # FastAPI application entry point
│   ├── core/
│   │   ├── config.py          # Environment variables (Supabase URL, keys)
│   │   └── security.py        # JWT validation middleware for Supabase Auth
│   ├── db/
│   │   └── supabase.py        # Supabase client initialization (service-role)
│   └── api/
│       └── routers/
│           ├── auth.py        # Session verification (/api/auth/me)
│           ├── telemetry.py   # Save student iterations
│           └── audits.py      # Save manual audits for failed runs
├── supabase_schema.sql        # Postgres schema (tables, enums, triggers, RLS)
├── seed.sql                   # Optional seed data
└── requirements.txt
```

> Future routers (instructor analytics, problem CRUD) and services
> (reasoning scorer, telemetry aggregator) will be added when implemented —
> placeholder files were intentionally removed to avoid dead code.

---

## 2. Database Schema

Relational PostgreSQL schema optimized for complex instructor analytics.

### `profiles`
*Mirrors `auth.users`, linked via trigger on signup.*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | References `auth.users.id` |
| `email` | String, Unique | |
| `role` | Enum: `student`, `instructor` | |
| `full_name` | String | |
| `created_at` | Timestamp | |

### `courses`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `name` | String | e.g. "APMA E4300 - Fall 2026" |
| `instructor_id` | UUID, FK → `profiles.id` | |
| `semester` | String | e.g. "Fall 2026" |
| `created_at` | Timestamp | |

### `enrollments`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `student_id` | UUID, FK → `profiles.id` | |
| `course_id` | UUID, FK → `courses.id` | |
| `enrolled_at` | Timestamp | |
| **Unique** | `(student_id, course_id)` | Prevents double enrollment |

### `problem_sets`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `course_id` | UUID, FK → `courses.id` | Ties problems to a specific course |
| `title` | String | |
| `topic` | String | |
| `difficulty` | Enum: `Beginner`, `Intermediate`, `Advanced` | |
| `description` | Text | The full problem statement |
| `objective_placeholder` | String | |
| `constraint_placeholder` | String | |
| `approach_placeholder` | String | |
| `initial_code` | Text | |
| `unit_test_code` | Text, Nullable | Python test script content |

### `iterations`
*Created on every "Run Simulation" or "Run Tests" click.*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `student_id` | UUID, FK → `profiles.id` | |
| `problem_id` | UUID, FK → `problem_sets.id` | |
| `iteration_number` | Integer | Auto-incrementing per student+problem pair |
| `code_snapshot` | Text | The Monaco editor state at time of execution |
| `objective_text` | Text | What the student typed in the Gatekeeper |
| `constraint_text` | Text | |
| `approach_text` | Text | |
| `execution_mode` | Enum: `simulation`, `test` | What button was clicked |
| `execution_status` | Enum: `PASS`, `FAIL` | |
| `stdout` | Text | Captured standard output from Pyodide |
| `stderr` | Text, Nullable | Captured traceback / error output |
| `created_at` | Timestamp | |

### `manual_audits`
*Created on failed iterations (Scenario A).*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `iteration_id` | UUID, FK → `iterations.id` | |
| `category` | Enum: `Syntax`, `Logic`, `UnitMismatch`, `Hallucination` | |
| `student_rationale` | Text | Student's explanation of *why* the AI failed |
| `resolved` | Boolean | Did the next iteration pass? |

### `verification_logs`
*Created on passed iterations (Scenario B).*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `iteration_id` | UUID, FK → `iterations.id` | |
| `reasoning_log` | Text | Student's explanation of why the output is physically correct |
| `constraint_validation` | Text | How the output satisfies the Gatekeeper constraints |
| `limit_check` | Text | Description of behavior at physical boundaries |
| `reasoning_score` | Float, Nullable | LLM-graded score (1-10) from the AI Engine Middleware |

### `copilot_chats`
*AI conversation log. Scoped per student+problem (persists across iterations).*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID, PK | |
| `student_id` | UUID, FK → `profiles.id` | |
| `problem_id` | UUID, FK → `problem_sets.id` | |
| `role` | Enum: `user`, `assistant` | |
| `message` | Text | |
| `created_at` | Timestamp | |

---

## 3. Row Level Security (RLS)

### Students
- `iterations`: `SELECT`, `INSERT` only where `auth.uid() = student_id`
- `manual_audits`: `SELECT`, `INSERT` only where the parent `iteration.student_id = auth.uid()`
- `verification_logs`: Same as `manual_audits`
- `copilot_chats`: `SELECT`, `INSERT` only where `auth.uid() = student_id`
- `problem_sets`: `SELECT` only (all students can read problems for their enrolled courses)
- `profiles`: `SELECT` own row only; `UPDATE` own row only

### Instructors
- `iterations`: `SELECT` all rows for students enrolled in the instructor's courses
- `manual_audits`, `verification_logs`, `copilot_chats`: `SELECT` all for their course students
- `problem_sets`: Full CRUD for their own courses
- `profiles`: `SELECT` for enrolled students
- `courses`: Full CRUD for their own courses

---

## 4. Auth Flow (Supabase + FastAPI)

1. **Frontend Login:** The student logs into the React frontend using the `@supabase/supabase-js` client. This handles Email/Password, Magic Links, or SSO.
2. **Session Token:** Supabase stores a secure JWT (JSON Web Token) in the browser.
3. **API Requests:** When the React app makes a request to the FastAPI backend (e.g., to save telemetry), it attaches the JWT in the `Authorization: Bearer <token>` header.
4. **Backend Validation:** `backend/src/core/security.py` decodes the JWT using the Supabase JWT Secret and verifies identity/role before executing queries.

All credentials injected via `.env`. Tokens stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.

---

## 5. Implementation Steps

1. **Initialize Supabase:** Create a Supabase project via their dashboard. Grab the `URL`, `Anon Key`, and `JWT Secret`.
2. **Setup SQL Schema:** Run the SQL migrations in the Supabase SQL editor to create all 8 tables defined above.
3. **Configure RLS:** Apply the Row Level Security policies from Section 4.
4. **Backend Bootstrapping:** Populate the `backend/src/` directory with the files outlined in Section 1. Install `supabase-py`, `fastapi`, `pyjwt`, and `uvicorn`.
5. **Frontend Wiring:** Install `@supabase/supabase-js` in the `frontend` directory. Replace the current mock login with the Supabase Auth UI. Update `handleRunSimulation` to POST structured telemetry to the FastAPI server.
6. **Instructor Dashboard Endpoints:** Build aggregation queries in `instructor.py` to power the Class Insights dashboard (success rates, error heatmaps, at-risk students).
7. **Reasoning Scorer:** Add a `services/reasoning_scorer.py` that pipes verification logs through the OpenAI API (`/api/openai-chat`) for automated reasoning-quality grading.
