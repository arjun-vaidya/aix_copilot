import { useState } from "react";
import { Play, Code2, Lock, Sparkles, FlaskConical, Brain, Check, X, Loader2 } from "lucide-react";
import MonacoEditor, { DiffEditor } from "@monaco-editor/react";
import type { ProblemSet } from "../../lib/problemLoader";
import type { WorkspaceState } from "../../pages/Workspace";
import { type TestFile } from "./TestingSidebar";
import QuizPanel, { type QuizQuestion } from "./QuizPanel";

// "main" -> main.py, "quizzes" -> Quizzes panel.
// Test files are tracked separately via `activeTestFileId` (lifted to Workspace).
type EditorTab = "main" | "quizzes";
type GenerationStatus = "streaming" | "complete" | "error";

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
    generatedCode,
    generationStatus,
    onAcceptGeneratedCode,
    onRejectGeneratedCode,
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
    generatedCode?: string | null;
    generationStatus?: GenerationStatus;
    onAcceptGeneratedCode?: () => void;
    onRejectGeneratedCode?: () => void;
    testFiles: TestFile[];
    setTestFiles: React.Dispatch<React.SetStateAction<TestFile[]>>;
    activeTestFileId: string | null;
    setActiveTestFileId: React.Dispatch<React.SetStateAction<string | null>>;
    quizQuestions: QuizQuestion[];
    setQuizQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>;
}) {
    const [activeTab, setActiveTab] = useState<EditorTab>("main");

    const activeTestFile = testFiles.find((f) => f.id === activeTestFileId) || null;
    const isMainActive = activeTestFileId == null && activeTab === "main";
    const isQuizzesActive = activeTestFileId == null && activeTab === "quizzes";
    const isTestActive = activeTestFile !== null;

    // Diff view is shown only after generation completes — never during streaming.
    const isDiffOpen =
        generationStatus === "complete" &&
        typeof generatedCode === "string" &&
        generatedCode.length > 0 &&
        isMainActive;

    const isLocked =
        state === "GATEKEEPER" ||
        state === "LOCKED" ||
        (state === "EVALUATION" && evaluationResult === "fail" && executionMode === "test");

    const handleRun = () => {
        if (isLocked) return;
        onRun();
    };

    const goToMain = () => {
        setActiveTestFileId(null);
        setActiveTab("main");
    };
    const goToQuizzes = () => {
        setActiveTestFileId(null);
        setActiveTab("quizzes");
    };

    const handleCloseTestTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTestFiles((prev) => prev.filter((f) => f.id !== id));
        if (activeTestFileId === id) setActiveTestFileId(null);
    };

    const handleTestCodeChange = (newCode: string | undefined) => {
        if (!activeTestFileId || newCode === undefined) return;
        setTestFiles((prev) =>
            prev.map((f) => (f.id === activeTestFileId ? { ...f, code: newCode } : f))
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Top tabs: main.py | <test files> | Quizzes */}
            <div className="h-11 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-2 shrink-0 gap-2">
                <div className="flex items-center min-w-0 flex-1 overflow-x-auto">
                    {/* main.py */}
                    <button
                        onClick={goToMain}
                        className={`shrink-0 px-4 py-1.5 flex items-center gap-2 rounded-md border transition-all ${
                            isMainActive
                                ? "bg-white border-slate-200 shadow-[0_1px_0_white] translate-y-[1px] border-b-transparent z-10"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                        }`}
                    >
                        <Code2 className={`w-4 h-4 ${isMainActive ? "text-blue-500" : "text-slate-400"}`} />
                        <span className={`text-xs font-mono font-bold ${isMainActive ? "text-slate-700" : "text-slate-500"}`}>main.py</span>
                    </button>

                    {/* Test file tabs (one per file) */}
                    {testFiles.map((file) => {
                        const isActive = activeTestFileId === file.id;
                        return (
                            <button
                                key={file.id}
                                onClick={() => setActiveTestFileId(file.id)}
                                className={`group shrink-0 px-3 py-1.5 flex items-center gap-1.5 rounded-md border transition-all ${
                                    isActive
                                        ? "bg-white border-slate-200 shadow-[0_1px_0_white] translate-y-[1px] border-b-transparent z-10"
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                                }`}
                            >
                                <FlaskConical className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-500" : "text-slate-400"}`} />
                                <span className={`text-xs font-mono font-bold ${isActive ? "text-slate-700" : "text-slate-500"}`}>
                                    {file.name}
                                </span>
                                <span
                                    onClick={(e) => handleCloseTestTab(file.id, e)}
                                    role="button"
                                    aria-label={`Close ${file.name}`}
                                    className="ml-1 w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </span>
                            </button>
                        );
                    })}

                    {/* Quizzes — pinned to the end */}
                    <button
                        onClick={goToQuizzes}
                        className={`shrink-0 px-4 py-1.5 flex items-center gap-2 rounded-md border transition-all ${
                            isQuizzesActive
                                ? "bg-white border-slate-200 shadow-[0_1px_0_white] translate-y-[1px] border-b-transparent z-10"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                        }`}
                    >
                        <Brain className={`w-4 h-4 ${isQuizzesActive ? "text-violet-500" : "text-slate-400"}`} />
                        <span className={`text-xs font-bold ${isQuizzesActive ? "text-slate-700" : "text-slate-500"}`}>
                            Quizzes{quizQuestions.length > 0 ? ` (${quizQuestions.length})` : ""}
                        </span>
                    </button>
                </div>

                {/* Action buttons. Generate Code only on main.py; Run buttons on main.py and test files. */}
                {!isQuizzesActive && (
                    <div className="flex items-center gap-2 shrink-0">
                        {isMainActive && onGenerateCode && (
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
            {isMainActive ? (
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
                    {isDiffOpen ? (
                        <DiffEditor
                            height="100%"
                            language="python"
                            theme="light"
                            original={code}
                            modified={generatedCode || ""}
                            options={{
                                readOnly: true,
                                renderSideBySide: false,
                                originalEditable: false,
                                renderOverviewRuler: false,
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineHeight: 22,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                scrollBeyondLastLine: false,
                                smoothScrolling: true,
                                padding: { top: 16 },
                            }}
                        />
                    ) : (
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
                    )}

                    {/* In-flight indicator while generation is running (editor stays unchanged) */}
                    {isGeneratingCode && !isDiffOpen && (
                        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full shadow-md text-[11px] font-bold text-slate-700">
                            <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />
                            Generating code…
                        </div>
                    )}

                    {/* Floating Accept / Reject pill — only when the diff is ready */}
                    {isDiffOpen && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-1.5 py-1.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <span className="flex items-center gap-1.5 px-3 text-[11px] font-bold text-slate-600">
                                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                Review AI changes
                            </span>
                            <div className="w-px h-5 bg-slate-200" />
                            <button
                                onClick={onAcceptGeneratedCode}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-sm"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Accept
                            </button>
                            <button
                                onClick={onRejectGeneratedCode}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-600 rounded-full text-xs font-bold transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                                Reject
                            </button>
                        </div>
                    )}
                </div>
            ) : isTestActive ? (
                <div className="flex-1 relative">
                    <MonacoEditor
                        height="100%"
                        language="python"
                        theme="light"
                        value={activeTestFile.code}
                        onChange={handleTestCodeChange}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            lineHeight: 22,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            scrollBeyondLastLine: false,
                            smoothScrolling: true,
                            cursorBlinking: "smooth",
                            readOnly: isLocked,
                            padding: { top: 16 },
                        }}
                    />
                </div>
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
