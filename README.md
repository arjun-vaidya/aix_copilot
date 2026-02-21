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

To execute the features described above and in the UI layout mockups, the repository leans on a modern, decoupled web architecture:

### 1. Frontend Client
- **Framework:** Next.js (React) to allow smooth client-side routing between workspaces, dashboards, and complex state management across the Evaluation Loop stages.
- **UI & Styling:** Vanilla CSS or Tailwind CSS coupled with a component library (e.g., Radix or shadcn/ui) to replicate the premium, minimalist aesthetic of the platform.
- **Editor Integration:** Monaco Editor (the engine behind VS Code) embedded to provide native Python syntax highlighting, inline tooltips, and line-level selection for the "Manual Audit" phase.
- **Data Visualization:** Recharts (or Chart.js) for plotting instructor dashboards. Real-time plot rendering for physics outputs (like displacement waves and phase space) via Plotly.js or D3.js.

### 2. Code Execution Layer
- **Client-Side Python (Pyodide):** Code execution should ideally utilize **Pyodide** (WebAssembly port of CPython). This isolates execution in the student's browser tab, providing native access to libraries like `numpy` and `matplotlib` without requiring enormous server resources or sandboxing infrastructure for unsafe arbitrary code execution from students.

### 3. Backend & Data Layer
- **Platform API:** Python (FastAPI) to manage high-performance asynchronous state persistence, student telemetry, automated reasoning grading, and authentication. Python is actively chosen here to allow seamless integration with data science libraries and ML models that run closely with the AI Engine Middleware.
- **Database:** A relational database like PostgreSQL using **SQLAlchemy** (or SQLModel) as the ORM. Core models needed: `Users`, `ProblemSets`, `Workspaces` (holding Gatekeeper objectives/constraints), and `AuditLogs` (each containing iterations, tags, reasoning logs, and AI chats).

### 4. AI Engine Middleware
- Rather than directly calling the OpenAI/Anthropic API from the front-end, the Co-Pilot connects to a custom API middleware wrapper.
- **Purpose:** This wrapper injects background context (like Gatekeeper constraints), limits simulation generations if the student hits the "Lazy Flag", maps prompt inputs to extract "Golden Prompts", and uses secondary prompt loops to auto-score the student's "Reasoning Quality" using a semantic evaluation rubric.

---

## Future Considerations for Developers
- **Automating the Reasoning Quality / Efficiency Score:** Developing an optimized context window that passes student logs, AI chats, and final error tags to a grading LLM to define the 1-10 "Reasoning Score."
- **Cheating & Plagiarism Mitigation:** Building logic to detect if students are copy-pasting reasoning text generated by third-party chatbots externally rather than writing it themselves.
- **LMS Integration:** Wrap authentication in LTI 1.3 standards to synchronize rosters and final grades natively with university portals like Canvas or Blackboard.
- **Physical "Sanity" Interfaces:** Constructing robust abstract interfaces that forcefully throw custom Exceptions if boundary constraints are violated in simulation outputs to prevent students from passing verification checks falsely.
