import type { ProblemSet } from "./problems_mock";
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
    code: string;
    logs: LogEntry[];
    audits: { category: string; rationale: string; }[];
};

export async function simulateStreamingCoPilot(
    chatHistory: ChatMessage[],
    workspaceContext: CoPilotContext,
    onChunkReceived: (chunk: string) => void
): Promise<void> {

    // Construct the System Prompt
    const systemPrompt = `You are a world-class Physics and Mathematics Teaching Assistant.
Your goal is to guide the student towards solving the following numerical simulation problem WITHOUT directly giving them the code solution. Read their current code state carefully and offer Socratic questioning or hints based on the Pyodide output logs.

--- PROBLEM: ${workspaceContext.problem.title} 
${workspaceContext.problem.description}

--- STUDENT'S DECLARED OBJECTIVE:
${workspaceContext.objective}

--- STUDENT'S STRICT CONSTRAINTS:
${workspaceContext.constraints}

--- STUDENT'S CURRENT CODE:
\`\`\`python
${workspaceContext.code}
\`\`\`

--- TERMINAL OUTPUT LOGS:
${workspaceContext.logs.map(l => l.text).join('\n')}

--- STUDENT EXECUTED MANUAL AUDITS:
If the student failed a structural unit test, they were explicitly locked out of their editor and forced to supply a "Manual Audit" reasoning to continue. Review this carefully—are they misunderstanding the core logic?
${workspaceContext.audits.length === 0 ? "None" : workspaceContext.audits.map((a, i) => `Audit ${i + 1}:\nCategory: ${a.category}\nStudent Rationale: "${a.rationale}"`).join('\n\n')}

INSTRUCTIONS:
You must NOT write blocks of executable code that directly solve their specific objective. However, you are fully encouraged to provide isolated code snippets, syntax examples, and scaffolding if the student is a beginner or encounters compilation errors. Remember, your ultimate goal is to ensure the student learns the core mathematical and physics concepts; mastering the programming syntax is just one stepping stone to getting there.
Keep responses brief, encouraging, and highly academic.`;

    // Instantiate modular provider through the unified factory
    const provider = LLMFactory.getProvider("gemini");

    console.log("[GEMINI via FACTORY] Simulating API request with system prompt length:", systemPrompt.length);
    console.log("Chat history size:", chatHistory.length);

    await provider.streamChat(systemPrompt, chatHistory, onChunkReceived);
}
