import type { ProblemSet } from "./problemLoader";
import type { LogEntry } from "../components/workspace/OutputConsole";
import { LLMFactory } from "./llm/factory";

export type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
};

export type CoPilotContext = {
    problem: ProblemSet;
    objective: string;
    constraints: string;
    approach: string;
    code: string;
    logs: LogEntry[];
    audits: { category: string; rationale: string; }[];
};

export async function simulateStreamingCoPilot(
    chatHistory: ChatMessage[],
    workspaceContext: CoPilotContext,
    onChunkReceived: (chunk: string) => void
): Promise<void> {

    // ----------------------------------------------------------------------
    // System prompt: Socratic TA. Critical guardrails:
    //  * NEVER restate / paraphrase / summarise the student's own gatekeeper
    //    fields (Objective, Constraints, Approach). Those are context only.
    //  * NEVER hand them the algorithm, methodology, or working code.
    //  * Always reply with questions, conceptual nudges, or pointers to
    //    what THEY should reason through.
    // ----------------------------------------------------------------------
    const audits =
        workspaceContext.audits.length === 0
            ? "None"
            : workspaceContext.audits
                  .map((a, i) => `Audit ${i + 1}:\n  Category: ${a.category}\n  Student Rationale: "${a.rationale}"`)
                  .join("\n\n");

    const systemPrompt = `You are a sharp, experienced Teaching Assistant for AI4Numerics, a course on AI-assisted scientific computing. Think of yourself as the kind of TA who actually helps — someone who reads a student's work, tells them what they see, names the concepts at play, and pushes their reasoning when it matters. You are NOT a Socratic chatbot that deflects every question with another question.

# WHAT YOU MUST NOT DO (these are firm)
1. Do not write the full solution code, the complete algorithm, or a step-by-step recipe that solves the assigned problem.
2. Do not compute numerical answers the student is meant to compute themselves.
3. Do not summarize the student's Objective / Constraints / Approach as if those summaries were a response to their question. (Quoting a specific phrase to critique it is fine. Restating the whole thing back as filler is not.)
4. Do not deflect every question with "what do YOU think?" — that's lazy. Deflection is only valid when probing genuine reasoning.

# WHAT YOU SHOULD DO
- **Engage with what they wrote.** If they ask "is my objective good?", actually evaluate it: name a specific strength, name a specific weakness, and tie the critique to *this* problem (e.g., "your objective names what you're computing but doesn't say what the output should look like — a single scalar? a time-series? a field on a grid?"). Be concrete.
- **Use the precise technical vocabulary appropriate to THIS problem's domain.** Read the problem title and description above and use the terminology of that subfield — whether that's numerical linear algebra, ODE/PDE simulation, statistical learning, optimization, signal processing, control, etc. Do NOT default to a fixed set of buzzwords. If a term is likely unfamiliar to the student, define it in one line on first use.
- **Point out pitfalls relevant to this specific problem** — the kind a domain expert would flag for the student's particular method. Always anchor the warning to *why* it matters here, not in the abstract.
- **Show 2-3 lines of isolated syntax** when they're stuck on language mechanics rather than methodology — and only when it's clearly a syntax issue, not a solution-step issue.
- **Ask probing questions when reasoning is genuinely called for** — about edge cases, units, limits, expected behavior, boundary conditions — not as a default response. One real question is worth more than three vague ones.
- When they share a traceback, point at the line and say what's wrong in plain language. You can hint at the fix without writing the fix.

# TONE
- Direct, warm, brief. Aim for 2-5 sentences usually.
- It's fine to say "this looks solid" or "this is too vague" — students need honest signal.
- Avoid throat-clearing ("Great question!", "As your TA…").
- Markdown allowed for emphasis, inline code, short lists.

# CONTEXT (for your awareness — do NOT regurgitate)
Problem title: ${workspaceContext.problem.title}
Problem description: ${workspaceContext.problem.description}

Student's declared Objective: ${workspaceContext.objective}
Student's declared Constraints: ${workspaceContext.constraints}
Student's declared Approach: ${workspaceContext.approach}

Student's current code:
\`\`\`python
${workspaceContext.code}
\`\`\`

Recent terminal output:
${workspaceContext.logs.map(l => l.text).join('\n')}

Past failed-iteration audits (where the student diagnosed why the AI failed):
${audits}`;

    // Instantiate modular provider through the unified factory (defaults to OpenAI).
    const provider = LLMFactory.getProvider();

    console.log("[LLM via FACTORY] Streaming chat. System prompt length:", systemPrompt.length, "history size:", chatHistory.length);

    await provider.streamChat(systemPrompt, chatHistory, onChunkReceived);
}

/**
 * Result returned by `reviewAndGenerateCode`.
 *
 * The reviewer model gates code generation: if the student's specification
 * is too vague, it returns `{ approved: false, reason }`. Otherwise it
 * returns `{ approved: true, code }` containing the runnable Python source.
 */
export type CodeGenResult =
    | { approved: true; code: string }
    | { approved: false; reason: string };

/**
 * Single-call gate: a strict reviewer first decides whether the student's
 * objective/constraints/approach is detailed enough to write meaningful code.
 *
 * - If approved, the same call returns the generated Python script.
 * - If rejected, returns concrete, actionable feedback for the student.
 *
 * Uses OpenAI JSON-mode for a reliable structured response. This is a
 * non-streaming call from the UI's perspective — the editor stays untouched
 * until a complete result is available, then a diff view is shown.
 */
export async function reviewAndGenerateCode(workspaceContext: CoPilotContext): Promise<CodeGenResult> {
    const systemPrompt = `You are a STRICT senior reviewer for an AI-assisted scientific computing curriculum.

A student has filled in three fields — Objective, Constraints, Approach — and is asking you to generate code from them. Before writing any code, you must judge whether their specification is detailed enough that a competent engineer could implement it without guessing the student's intent.

REJECT the request when ANY of the following apply:
- A field contains placeholder text such as "testing", "tbd", "n/a", "do it", a single word, or only punctuation.
- A field is empty or whitespace-only.
- The Objective lacks a concrete physical, mathematical, or numerical goal (what is being computed? on what data? what is the expected output shape?).
- The Constraints are not testable (e.g., no measurable invariant, no numerical bound, no tolerance).
- The Approach lacks an actual methodology (no algorithm name, no data structure, no loop/iterative scheme, no library choice).

When rejecting, be SPECIFIC: identify which field is too vague and what kind of detail is missing. Be encouraging but firm. Keep the reason under ~4 short sentences. Do not generate any code on rejection.

When approving, output a complete, runnable Python script that follows the student's stated approach as closely as possible. Use numpy / pandas / matplotlib as needed. Include short inline comments at key steps. The code must be directly executable in a Pyodide environment. Do NOT wrap the code in markdown fences.

--- PROBLEM CONTEXT (for your judgement only):
Title: ${workspaceContext.problem.title}
Description: ${workspaceContext.problem.description}

Respond with ONLY a single valid JSON object. Schema:
- On rejection: { "approved": false, "reason": "<specific feedback>" }
- On approval: { "approved": true, "code": "<full Python source>" }
No prose, no markdown.`;

    const userContent = `--- STUDENT'S DECLARED OBJECTIVE:
${workspaceContext.objective}

--- STUDENT'S STRICT CONSTRAINTS:
${workspaceContext.constraints}

--- STUDENT'S APPROACH/STRATEGY:
${workspaceContext.approach}

--- STUDENT'S CURRENT CODE (for reference only):
\`\`\`python
${workspaceContext.code}
\`\`\``;

    const response = await fetch("/api/openai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemPrompt,
            messages: [{ role: "user", content: userContent }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any)?.error || `Code review failed (HTTP ${response.status})`);
    }

    const fullText = await collectOpenAIStream(response);

    let jsonStr = fullText.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    let parsed: any;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (e: any) {
        throw new Error(`Reviewer returned malformed JSON: ${e?.message || "parse error"}`);
    }

    if (parsed?.approved === true && typeof parsed.code === "string" && parsed.code.trim()) {
        return { approved: true, code: parsed.code };
    }
    if (parsed?.approved === false && typeof parsed.reason === "string" && parsed.reason.trim()) {
        return { approved: false, reason: parsed.reason };
    }
    throw new Error("Reviewer returned an unexpected JSON shape.");
}

/**
 * Drains an OpenAI SSE chat-completions stream from /api/openai-chat
 * and returns the concatenated assistant text.
 */
async function collectOpenAIStream(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response stream.");

    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sepIndex: number;
        while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sepIndex);
            buffer = buffer.slice(sepIndex + 2);
            for (const rawLine of frame.split("\n")) {
                const line = rawLine.trim();
                if (!line.startsWith("data:")) continue;
                const data = line.slice(5).trim();
                if (!data || data === "[DONE]") continue;
                try {
                    const parsed = JSON.parse(data);
                    const text = parsed?.choices?.[0]?.delta?.content;
                    if (text) fullText += text;
                } catch { /* skip malformed chunk */ }
            }
        }
    }
    return fullText;
}
