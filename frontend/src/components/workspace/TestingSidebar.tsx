import { useState, useRef } from "react";
import { Plus, Sparkles, FlaskConical, Trash2, AlertCircle, ArrowLeft } from "lucide-react";
import { collectOpenAIStream } from "../../lib/llm/streamUtils";

export type TestFile = {
    id: string;
    name: string;
    code: string;
};

const DEFAULT_TEST_TEMPLATE = `import pytest
import numpy as np

# TODO: Define your test logic here

def test_example():
    """Basic sanity check."""
    assert 1 + 1 == 2
`;

let blankFileCounter = 0;

async function generateTestWithAI(
    userPrompt: string,
    mainCode: string,
): Promise<{ fileName: string; code: string }> {
    const systemPrompt = `You are a Python test generation assistant. Given the student's code and a test description, generate a complete pytest test file.

Respond with a JSON object containing exactly two keys:
- "fileName": a descriptive Python test file name (e.g. "test_energy_conservation.py")
- "code": the complete, runnable pytest file content

Rules for the code:
- Write a complete, runnable pytest file
- Import from "main" to test the student's code
- Use numpy and pytest where appropriate
- Include docstrings for each test function

Respond with ONLY a single valid JSON object. No prose, no markdown.`;

    const userContent = `Student code:
${mainCode || "# No code written yet"}

Write a pytest file for: ${userPrompt}`;

    const response = await fetch("/api/openai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemPrompt,
            messages: [{ role: "user", content: userContent }],
            response_format: { type: "json_object" },
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any)?.error || `API returned status ${response.status}`);
    }

    const fullText = await collectOpenAIStream(response);

    let jsonStr = fullText.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    let result: any;
    try {
        result = JSON.parse(jsonStr);
    } catch (e: any) {
        throw new Error(`AI returned malformed JSON: ${e?.message || "parse error"}`);
    }

    if (!result?.fileName || !result?.code) {
        throw new Error("AI response missing required fields ('fileName', 'code').");
    }
    return { fileName: result.fileName, code: result.code };
}

export default function TestingSidebar({
    mainCode,
    testFiles,
    setTestFiles,
    activeFileId,
    setActiveFileId,
    isLocked = false,
    onBack,
}: {
    mainCode: string;
    testFiles: TestFile[];
    setTestFiles: React.Dispatch<React.SetStateAction<TestFile[]>>;
    activeFileId: string | null;
    setActiveFileId: (id: string | null) => void;
    isLocked?: boolean;
    onBack?: () => void;
}) {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const promptRef = useRef<HTMLTextAreaElement>(null);

    const handleCreateTest = async () => {
        if (!prompt.trim() || isGenerating || isLocked) return;
        setIsGenerating(true);
        setError(null);
        try {
            const { fileName, code } = await generateTestWithAI(prompt, mainCode);
            const newFile: TestFile = {
                id: `test-${Date.now()}`,
                name: fileName,
                code,
            };
            setTestFiles((prev) => [...prev, newFile]);
            setActiveFileId(newFile.id);
            setPrompt("");
        } catch (err: any) {
            setError(err.message || "Failed to generate test.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddBlankTest = () => {
        if (isLocked) return;
        blankFileCounter++;
        const newFile: TestFile = {
            id: `test-${Date.now()}-${blankFileCounter}`,
            name: `test_${blankFileCounter}.py`,
            code: DEFAULT_TEST_TEMPLATE,
        };
        setTestFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
    };

    const handleDeleteFile = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTestFiles((prev) => prev.filter((f) => f.id !== id));
        if (activeFileId === id) {
            const remaining = testFiles.filter((f) => f.id !== id);
            setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleCreateTest();
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white shrink-0">
                <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                        Test Workbench
                    </h2>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Describe a behavior to verify. Each generation creates a new file you can edit and run alongside your code.
                </p>
            </div>

            {/* Prompt input */}
            <div className="px-5 py-4 border-b border-slate-200 shrink-0">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                    Test Prompt
                </label>
                <textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. check that the output matches expected values for the given inputs"
                    rows={3}
                    disabled={isLocked || isGenerating}
                    className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all resize-none font-sans leading-relaxed disabled:bg-slate-100 disabled:text-slate-400"
                />
                <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wide">
                        Cmd+Enter to generate
                    </span>
                </div>
                {error && (
                    <div className="mt-2 text-xs font-medium text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span className="flex-1 leading-relaxed">{error}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                    <button
                        onClick={handleCreateTest}
                        disabled={!prompt.trim() || isGenerating || isLocked}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-md shadow-sm transition-all"
                    >
                        <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                        {isGenerating ? "Generating…" : "Generate Test"}
                    </button>
                    <button
                        onClick={handleAddBlankTest}
                        disabled={isLocked || isGenerating}
                        title="Add blank test file"
                        className="flex items-center gap-1 px-2.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 font-bold text-xs rounded-md transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Test file list */}
            <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
                <div className="px-2 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    <span>Test Files</span>
                    <span>{testFiles.length}</span>
                </div>

                {testFiles.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                            <FlaskConical className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-xs font-medium text-slate-400 leading-relaxed">
                            No tests yet. Generate one above or click <span className="font-bold text-slate-500">+</span> for a blank file.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {testFiles.map((file) => {
                            const isActive = activeFileId === file.id;
                            return (
                                <button
                                    key={file.id}
                                    onClick={() => setActiveFileId(file.id)}
                                    className={`group w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-all border ${
                                        isActive
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                            : "border-transparent hover:bg-slate-50 text-slate-700"
                                    }`}
                                >
                                    <FlaskConical className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-500" : "text-slate-400"}`} />
                                    <span className="flex-1 text-xs font-mono font-bold truncate">{file.name}</span>
                                    <span
                                        onClick={(e) => handleDeleteFile(file.id, e)}
                                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                        role="button"
                                        aria-label={`Delete ${file.name}`}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Back button */}
            <div className="px-5 py-4 border-t border-slate-200 bg-white shrink-0">
                <button
                    onClick={onBack}
                    className="w-full py-3 flex items-center justify-center gap-2 bg-white hover:bg-white border-2 border-slate-300 hover:border-slate-500 text-slate-700 text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Edit Objective & Constraints
                </button>
            </div>
        </div>
    );
}
