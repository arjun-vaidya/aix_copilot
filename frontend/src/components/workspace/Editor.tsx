import { Play, Code2, Lock } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import type { ProblemSet } from "../../lib/problems_mock";
import type { WorkspaceState } from "../../pages/Workspace";

export default function Editor({
    problem,
    state,
    evaluationResult,
    executionMode,
    onRun,
    onRunTests,
    code,
    setCode
}: {
    problem: ProblemSet;
    state: WorkspaceState;
    evaluationResult?: "pass" | "fail" | null;
    executionMode?: "simulation" | "test" | null;
    onRun: () => void;
    onRunTests?: () => void;
    code: string;
    setCode: (val: string) => void;
}) {
    const isLocked = state === "GATEKEEPER" || state === "LOCKED" || (state === "EVALUATION" && evaluationResult === "fail" && executionMode === "test");

    const handleRun = () => {
        if (isLocked) return;
        onRun();
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Editor Header Bar */}
            <div className="h-11 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-2 shrink-0">
                <div className="flex items-center">
                    <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-md border-b-transparent shadow-[0_1px_0_white] translate-y-[1px] flex items-center gap-2 z-10">
                        <Code2 className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-mono font-bold text-slate-700">main.py</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {problem.unitTestPath && (
                        <button
                            onClick={() => !isLocked && state !== "EXECUTION" && onRunTests?.()}
                            disabled={isLocked || state === "EXECUTION"}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-md text-xs font-bold transition-colors shadow-sm"
                        >
                            <Code2 className="w-3.5 h-3.5" />
                            Run Tests
                        </button>
                    )}
                    <button
                        onClick={handleRun}
                        disabled={isLocked || state === "EXECUTION"}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-md text-xs font-bold transition-colors shadow-sm"
                    >
                        <Play className="w-3.5 h-3.5" />
                        {state === "EXECUTION" ? "Running..." : "Run Simulation"}
                    </button>
                </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 relative">
                {isLocked && (
                    <div className="absolute inset-0 z-20 bg-slate-100/80 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="bg-white px-6 py-4 rounded-xl shadow border border-slate-200 flex flex-col items-center gap-2 text-center max-w-xs transition-all animate-in fade-in zoom-in-95 duration-200">
                            <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                                <Lock className="w-5 h-5 text-slate-400" />
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">
                                {state === "EVALUATION" ? "Editor Locked for Audit" : "Workspace Locked"}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                {state === "EVALUATION"
                                    ? "Complete the failure analysis in the sidebar to resume your work."
                                    : "Complete the Gatekeeper objective and constraints on the left to edit code."}
                            </p>
                        </div>
                    </div>
                )}
                <MonacoEditor
                    height="100%"
                    language="python"
                    theme="light"
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineHeight: 22,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        readOnly: isLocked,
                        padding: { top: 16 }
                    }}
                />
            </div>
        </div>
    );
}
