import { useState } from "react";
import { Play, Code2, Lock, Sparkles, FlaskConical, Brain } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import type { ProblemSet } from "../../lib/problemLoader";
import type { WorkspaceState } from "../../pages/Workspace";
import TestingPanel, { type TestFile } from "./TestingPanel";
import QuizPanel, { type QuizQuestion } from "./QuizPanel";

type EditorTab = "main" | "testing" | "quizzes";

export default function Editor({
    problem,
    state,
    evaluationResult,
    executionMode,
    onRun,
    onRunTests,
    code,
    setCode,
    onGenerateCode,
    isGeneratingCode,
    testFiles,
    setTestFiles,
    activeTestFileId,
    setActiveTestFileId,
    quizQuestions,
    setQuizQuestions,
}: {
    problem: ProblemSet;
    state: WorkspaceState;
    evaluationResult?: "pass" | "fail" | null;
    executionMode?: "simulation" | "test" | null;
    onRun: () => void;
    onRunTests?: () => void;
    code: string;
    setCode: (val: string) => void;
    onGenerateCode?: () => void;
    isGeneratingCode?: boolean;
    testFiles: TestFile[];
    setTestFiles: React.Dispatch<React.SetStateAction<TestFile[]>>;
    activeTestFileId: string | null;
    setActiveTestFileId: React.Dispatch<React.SetStateAction<string | null>>;
    quizQuestions: QuizQuestion[];
    setQuizQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>;
}) {
    const [activeTab, setActiveTab] = useState<EditorTab>("main");

    const isLocked = state === "GATEKEEPER" || state === "LOCKED" || (state === "EVALUATION" && evaluationResult === "fail" && executionMode === "test");

    const handleRun = () => {
        if (isLocked) return;
        onRun();
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Top-level Tabs: main.py | Testing | Quizzes */}
            <div className="h-11 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-2 shrink-0">
                <div className="flex items-center">
                    {/* main.py tab */}
                    <button
                        onClick={() => setActiveTab("main")}
                        className={`px-4 py-1.5 flex items-center gap-2 rounded-md border transition-all ${
                            activeTab === "main"
                                ? "bg-white border-slate-200 shadow-[0_1px_0_white] translate-y-[1px] border-b-transparent z-10"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                        }`}
                    >
                        <Code2 className={`w-4 h-4 ${activeTab === "main" ? "text-blue-500" : "text-slate-400"}`} />
                        <span className={`text-xs font-mono font-bold ${activeTab === "main" ? "text-slate-700" : "text-slate-500"}`}>main.py</span>
                    </button>

                    {/* Testing tab */}
                    <button
                        onClick={() => setActiveTab("testing")}
                        className={`px-4 py-1.5 flex items-center gap-2 rounded-md border transition-all ${
                            activeTab === "testing"
                                ? "bg-white border-slate-200 shadow-[0_1px_0_white] translate-y-[1px] border-b-transparent z-10"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                        }`}
                    >
                        <FlaskConical className={`w-4 h-4 ${activeTab === "testing" ? "text-emerald-500" : "text-slate-400"}`} />
                        <span className={`text-xs font-bold ${activeTab === "testing" ? "text-slate-700" : "text-slate-500"}`}>Testing</span>
                    </button>

                    {/* Quizzes tab */}
                    <button
                        onClick={() => setActiveTab("quizzes")}
                        className={`px-4 py-1.5 flex items-center gap-2 rounded-md border transition-all ${
                            activeTab === "quizzes"
                                ? "bg-white border-slate-200 shadow-[0_1px_0_white] translate-y-[1px] border-b-transparent z-10"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                        }`}
                    >
                        <Brain className={`w-4 h-4 ${activeTab === "quizzes" ? "text-violet-500" : "text-slate-400"}`} />
                        <span className={`text-xs font-bold ${activeTab === "quizzes" ? "text-slate-700" : "text-slate-500"}`}>
                            Quizzes{quizQuestions.length > 0 ? ` (${quizQuestions.length})` : ""}
                        </span>
                    </button>
                </div>

                {/* Action buttons — only visible on main.py tab */}
                {activeTab === "main" && (
                    <div className="flex items-center gap-2">
                        {onGenerateCode && (
                            <button
                                onClick={() => !isLocked && state !== "EXECUTION" && onGenerateCode()}
                                disabled={isLocked || state === "EXECUTION" || isGeneratingCode}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-200 disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-400 text-slate-900 rounded-md text-xs font-bold transition-all shadow-sm"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                {isGeneratingCode ? "Generating..." : "Generate Code"}
                            </button>
                        )}
                        {(problem.unitTestPath || testFiles.length > 0) && (
                            <button
                                onClick={() => !isLocked && state !== "EXECUTION" && onRunTests?.()}
                                disabled={isLocked || state === "EXECUTION"}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-400 text-slate-900 rounded-md text-xs font-bold transition-all shadow-sm"
                            >
                                <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
                                Run Tests{testFiles.length > 0 ? ` (${testFiles.length})` : ""}
                            </button>
                        )}

                        <button
                            onClick={handleRun}
                            disabled={isLocked || state === "EXECUTION"}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-400 text-slate-900 rounded-md text-xs font-bold transition-all shadow-sm"
                        >
                            <Play className="w-3.5 h-3.5 text-emerald-500" />
                            {state === "EXECUTION" ? "Running..." : "Run Simulation"}
                        </button>
                    </div>
                )}
            </div>

            {/* Panel Content */}
            {activeTab === "main" ? (
                /* Monaco Editor for main.py */
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
            ) : activeTab === "testing" ? (
                /* Testing Panel */
                <TestingPanel
                    mainCode={code}
                    testFiles={testFiles}
                    setTestFiles={setTestFiles}
                    activeFileId={activeTestFileId}
                    setActiveFileId={setActiveTestFileId}
                />
            ) : (
                /* Quizzes Panel */
                <QuizPanel
                    problemTitle={problem.title}
                    problemDescription={problem.description}
                    mainCode={code}
                    questions={quizQuestions}
                    setQuestions={setQuizQuestions}
                />
            )}
        </div>
    );
}
