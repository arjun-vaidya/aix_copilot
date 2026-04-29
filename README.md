# AI4Numerics

## Problem Statement
Across disciplines, students increasingly use Large Language Models (LLMs) to generate code and technical outputs for numerical tasks, such as engineering problem-solving, financial modeling, and statistical analysis. While this is becoming the norm and is not inherently negative, several core issues persist:
- LLMs can easily provide code solutions for small, well-defined tasks, but as projects scale, outputs predictably break or become inconsistent.
- Students often lack debugging, reasoning, and conceptual linkage skills, leading them to blindly trust AI outputs without verifying physical or mathematical correctness.
- Faculty struggle to assess students' genuine understanding of the code, the underlying problem, and the outputs, defaulting mostly to grading the final result.

## Opportunity
There is a profound opportunity to formally teach students best practices for **AI-assisted work** while actively reinforcing their analytical thinking ability, debugging skills, and independent reasoning—shifting them from "AI consumers" back to "Engineers/Scientists utilizing AI."

## Approach & Product
**AI4Numerics** is a cross-disciplinary resource toolkit and platform engineered to fulfill this vision. It includes:
1. **Concise, transferable guidelines** for AI-assisted numerical work.
2. **Interactive tutorials and exemplar assignments** that rigidly enforce these guidelines in practice.
3. **Instructor tools**, including automated reasoning rubrics, class insights, verification tests, and interactive dashboards.

### Core Guidelines for AI-Assisted Work
Whether producing code for a project with or without an AI tool, students are expected to explicitly document their reasoning. **Using an AI tool does not absolve students of their responsibility to understand, explain, and validate the final solution.** 

The platform enforces four major sequential steps for problem resolution:
1. **Formulate an objective:** What specific physical/numerical goal do you want to accomplish?
2. **Outline an approach:** How will you methodically attempt this goal?
3. **Implement a solution:** Either write the code yourself or use an AI tool. In either case, you are fully responsible for understanding the implementation script.
4. **Validate the solution:** How can you ensure the results are correct and physically meaningful? This involves testing limiting behavior, checking expected trends, and matching against physical intuition.

---

## Key Features & Platform Workflow

### 1. Student View
The student interface acts as a guardrailed IDE that fundamentally changes the interaction dynamics between the student and the code output.

**Initial Setup (The Gatekeeper Phase)**
Before interacting with the AI Co-Pilot or editing code, students must unlock the workspace by explicitly defining the simulation premise:
- **Objective:** Describe the physical property or metric being calculated (e.g., "Simulate the motion of a damped pendulum").
- **Constraints:** List precise physical checks that the logic must adhere to (e.g., "Energy must be strictly conserved," or "Time step must be < 0.01s").

**AI Co-Pilot & Implementation**
- **Interface:** Students can chat with a specialized AI to receive logic suggestions or ask physics questions. They generate Python simulation code within the editor and execute it entirely in the browser.

**The Evaluation Loop**
When students click **Run Simulation**, they enter one of two mandated workflows:
- **Scenario A: The Code Failed (Manual Audit)**
  - **Highlight:** Select the specific line(s) causing the traceback in the editor.
  - **Tagging:** Classify the root cause of the AI's failure using predefined tags: `[Syntax Error]`, `[Hallucination]`, `[Logic Error]`, or `[Unit Mismatch]`.
  - **Diagnosis:** Provide a brief student-written explanation of *why* the AI failed (e.g., "Wrong formula used for entropy"). This prevents mindless brute-forcing of prompts.
- **Scenario B: The Code Worked (Verification Phase)**
  - **Reasoning Log:** Write a few sentences explaining *why* the structure of the simulation output makes physical sense.
  - **Constraint Tests:** Manually verify that the output satisfies the constraints locked in during the Gatekeeper Phase.
  - **Limit Check:** Describe the system's behavior at physical boundaries or limits (e.g., as damping coefficient approaches zero).

**Student Dashboard**
Tracks personal progression, average iterations (retries) taken per problem, overall "AI dependency score", and progression on active problem sets.

### 2. Instructor View
The instructor portal provides deep telemetry on how students use the AI, ensuring instructors can grade for reasoning rather than simply output.

**Class Insights & Actionable Dashboards**
- **Global Metrics:** Tracks class-wide success rates, average reasoning scores (a calculated metric), and the average number of tries required to achieve a successful simulation.
- **Error Heatmap (Problem Analysis):** Visualizes which concepts or simulation parts caused the most `Logic`, `Unit`, or `Syntax` errors across the cohort (e.g., "Under-damping coefficient sign error").
- **At-Risk Tracking (The "Lazy Flag"):** Highlights students with a high number of simulation iterations but consistently poor / empty reasoning logs.
- **Student Activity Log:** Inspect step-by-step histories of student interactions. View "Efficiency Scores" (Reasoning Quality / Number of Steps).
- **Golden Prompts:** Aggregates the most structurally effective prompts used by successful students, which the instructor can share as examples.

---

## Implementation Details & Technical Stack

The repository is a decoupled web app: a Vite + React frontend, a Vercel Edge function for AI streaming, and a FastAPI backend backed by Supabase.

### 1. Frontend Client
- **Framework:** React 19 + Vite (TypeScript). React Router for client-side routing across `/login`, `/dashboard`, `/workspace`, and `/instructor`.
- **UI & Styling:** Tailwind CSS v4 with `lucide-react` icons. No component library — components live under `frontend/src/components/{dashboard,workspace,instructor,layout}`.
- **Editor:** Monaco Editor (`@monaco-editor/react`) for Python syntax highlighting and line selection used by the Manual Audit flow.
- **Markdown / math:** `react-markdown` + `remark-math` + `rehype-katex` for the Co-Pilot chat rendering.

### 2. Code Execution Layer
- **Client-Side Python (Pyodide):** All student code runs in a Pyodide Web Worker (`frontend/src/lib/pyodideWorker.ts`) — execution is fully isolated to the student's browser tab, with `numpy`/`pandas`/`matplotlib` available without server-side sandboxing.

### 3. Backend & Data Layer
- **Platform API:** FastAPI (`backend/src/`) for telemetry persistence and JWT verification. Endpoints under `/api/telemetry`, `/api/audits`, `/api/auth`.
- **Database & Auth:** Supabase (Postgres + Auth). Backend uses the Supabase Python client with the **service role key** to bypass RLS for server-side inserts; the frontend uses the **anon key** so RLS enforces per-student isolation. Schema lives in `backend/supabase_schema.sql`.

### 4. AI Engine Middleware
- The Co-Pilot calls a custom Vercel Edge function at `/api/openai-chat` (`frontend/api/openai-chat.ts`) which proxies streaming requests to OpenAI's Chat Completions API. The Edge function holds the `OPENAI_API_KEY` so it never touches the browser.
- A unified `LLMProvider` interface (`frontend/src/lib/llm/`) lets the workspace copilot, code generator, quiz panel, and test generator share one client. Switch providers by editing `DEFAULT_PROVIDER` in `factory.ts`.
- Reasoning quality scoring and "Golden Prompts" aggregation are described below under *Future Considerations* — not yet implemented.

---

## Future Considerations for Developers
- **Automating the Reasoning Quality / Efficiency Score:** Developing an optimized context window that passes student logs, AI chats, and final error tags to a grading LLM to define the 1-10 "Reasoning Score."
- **Cheating & Plagiarism Mitigation:** Building logic to detect if students are copy-pasting reasoning text generated by third-party chatbots externally rather than writing it themselves.
- **LMS Integration:** Wrap authentication in LTI 1.3 standards to synchronize rosters and final grades natively with university portals like Canvas or Blackboard.
- **Physical "Sanity" Interfaces:** Constructing robust abstract interfaces that forcefully throw custom Exceptions if boundary constraints are violated in simulation outputs to prevent students from passing verification checks falsely.
