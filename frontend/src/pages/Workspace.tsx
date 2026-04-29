import { useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { loadProblemById, type ProblemSet } from "../lib/problemLoader";
import GatekeeperPanel from "../components/workspace/GatekeeperPanel";
import Editor from "../components/workspace/Editor";
import TestingSidebar, { type TestFile } from "../components/workspace/TestingSidebar";
import { type QuizQuestion } from "../components/workspace/QuizPanel";
import OutputConsole, { type LogEntry } from "../components/workspace/OutputConsole";
import CoPilotChat from "../components/workspace/CoPilotChat";
import AuditPanel from "../components/workspace/AuditPanel";
import SuccessPanel from "../components/workspace/SuccessPanel";
import { type ChatMessage, reviewAndGenerateCode } from "../lib/aiService";
import { useAuth } from "../contexts/AuthContext";
import { ListTodo, Code2, Bot, Lock, PanelRightOpen, PanelRightClose, AlertTriangle, FlaskConical } from "lucide-react";

export type WorkspaceState = "LOCKED" | "GATEKEEPER" | "UNLOCKED" | "EXECUTION" | "EVALUATION";
export type AuditRecord = { category: string; rationale: string; };
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Check on initial mount
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export default function Workspace() {
  const { id } = useParams();
  const [problem, setProblem] = useState<ProblemSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    setIsLoading(true);
    loadProblemById(id).then((loadedProblem) => {
      setProblem(loadedProblem);
      setIsLoading(false);
    });
  }, [id]);

  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>("GATEKEEPER");
  const [evaluationResult, setEvaluationResult] = useState<"pass" | "fail" | null>(null);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const { session } = useAuth();
  const iterationCountRef = useRef(0);
  const lastFailedIterationIdRef = useRef<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I'm here to help you reason through your numerical simulation. How can we start forming the solution according to your constraints?" }
  ]);

  // Use a ref for executionMode so the Pyodide WebWorker's stale closure can always access the freshest value
  const executionModeRef = useRef<"simulation" | "test" | null>(null);
  const [executionModeState, setExecutionModeState] = useState<"simulation" | "test" | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([{ type: "system", text: "Pyodide Kernel Waiting..." }]);
  const workerRef = useRef<Worker | null>(null);

  // Gatekeeper input states
  const [objective, setObjective] = useState("");
  const [constraints, setConstraints] = useState("");
  const [approach, setApproach] = useState("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Editor Code State
  const [editorCode, setEditorCode] = useState<string>("");

  // AI code-generation preview state
  // generatedCode === null means the preview is hidden.
  type GenerationStatus = "streaming" | "complete" | "error";
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("streaming");

  // Test file state (shared between TestingSidebar and Editor tabs)
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [activeTestFileId, setActiveTestFileId] = useState<string | null>(null);

  // Quiz state (lifted so it survives tab switches)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Sync editor code when problem loads from YAML
  useEffect(() => {
    if (problem?.initialCode) {
      setEditorCode(problem.initialCode);
    }
  }, [problem]);

  // Layout states
  const [isCopilotVisible, setIsCopilotVisible] = useState(true);

  // Mobile responsiveness
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"gatekeeper" | "editor" | "copilot">("gatekeeper");

  // Force tab to editor when unlocked from gatekeeper on mobile
  const handleUnlock = () => {
    setWorkspaceState("UNLOCKED");
    if (isMobile) {
      setActiveTab("editor");
    }
  };

  const postTelemetry = async (status: "PASS" | "FAIL", output?: string, errorStr?: string): Promise<string | null> => {
    if (!session?.access_token || !problem) return null;
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    try {
      iterationCountRef.current += 1;
      const res = await fetch(`${apiBase}/api/telemetry/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          problem_id: problem.id,
          iteration_number: iterationCountRef.current,
          code_snapshot: editorCode,
          objective_text: objective,
          constraint_text: constraints,
          approach_text: approach,
          execution_mode: executionModeRef.current || "simulation",
          execution_status: status,
          stdout: output || "",
          stderr: errorStr || ""
        })
      });
      const json = await res.json();
      // Return the created iteration's DB id for linking audits
      return json?.data?.[0]?.id || null;
    } catch (e) {
      console.error("Telemetry sync failed", e);
      return null;
    }
  };

  const getWorker = () => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../lib/pyodideWorker.ts', import.meta.url));
      workerRef.current.onmessage = (e) => {
        const data = e.data;
        if (data.type === 'stdout' || data.type === 'stderr' || data.type === 'system') {
          setLogs(l => [...l, { type: data.type, text: data.text }]);
        } else if (data.type === 'success') {
          const isTest = executionModeRef.current === "test";
          setLogs(l => [...l, { type: "success", text: `\n[${isTest ? "Tests" : "Simulation"} Completed] Return Output: ${data.result}` }]);
          if (isTest) {
            setEvaluationResult("pass");
            setWorkspaceState("EVALUATION");
            if (isMobile) setActiveTab("copilot");
          } else {
            setWorkspaceState("UNLOCKED");
          }
          postTelemetry("PASS", data.result, undefined);
        } else if (data.type === 'error') {
          setLogs(l => [...l, { type: "error", text: `\n[Exception] ${data.error}` }]);

          if (executionModeRef.current === "test") {
            setEvaluationResult("fail");
            setWorkspaceState("EVALUATION");
            if (isMobile) setActiveTab("copilot"); // Force switch to audit panel on mobile
          } else {
            // Basic simulation runs don't lock the editor on failure
            setWorkspaceState("UNLOCKED");
          }
          postTelemetry("FAIL", undefined, data.error).then(iterationId => {
            lastFailedIterationIdRef.current = iterationId;
          });
        }
      }
    }
    return workerRef.current;
  }

  const handleRunSimulation = () => {
    setWorkspaceState("EXECUTION");
    executionModeRef.current = "simulation";
    setExecutionModeState("simulation");
    setLogs(l => [...l, { type: "system", text: "\n> Executing main.py..." }]);
    const worker = getWorker();
    worker.postMessage({ code: editorCode, id: Date.now() });
  }

  const handleRunTests = () => {
    if (!problem?.unitTestPath && testFiles.length === 0) return;
    setWorkspaceState("EXECUTION");
    executionModeRef.current = "test";
    setExecutionModeState("test");

    const testCount = testFiles.length + (problem?.unitTestPath ? 1 : 0);
    setLogs(l => [...l, { type: "system", text: `\n> Running ${testCount} test suite(s)...` }]);

    const worker = getWorker();
    worker.postMessage({
      code: editorCode,
      id: Date.now(),
      testPath: problem?.unitTestPath || undefined,
      testFiles: testFiles.map(f => ({ name: f.name, code: f.code })),
    });
  }

  const handleBackToGatekeeper = () => {
    setWorkspaceState("GATEKEEPER");
  };

  const handleSuccessSubmit = async (explanation: string, quizAnswers: Record<string, number>) => {
    if (!session?.access_token || !problem) return;
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    try {
      iterationCountRef.current += 1;
      await fetch(`${apiBase}/api/telemetry/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          problem_id: problem.id,
          iteration_number: iterationCountRef.current,
          code_snapshot: editorCode,
          objective_text: objective,
          constraint_text: constraints,
          approach_text: approach,
          execution_mode: executionModeRef.current || "test",
          execution_status: "PASS",
          success_explanation: explanation,
          quiz_answers: quizAnswers,
          stdout: "",
          stderr: ""
        })
      });
    } catch (e) {
      console.error("Success telemetry sync failed", e);
    }
    // Don't reset state here — let the SuccessPanel show the completion animation.
    // Navigation back to dashboard is handled by the panel itself.
  };

  const handleAuditSubmit = async (category: string | null, rationale: string) => {
    if (category) {
      setAudits(prev => [...prev, { category, rationale }]);

      // Persist audit to Supabase
      if (lastFailedIterationIdRef.current && session?.access_token) {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        try {
          await fetch(`${apiBase}/api/audits/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              iteration_id: lastFailedIterationIdRef.current,
              category,
              student_rationale: rationale
            })
          });
        } catch (e) {
          console.error("Audit sync failed", e);
        }
      }
    }
    setEvaluationResult(null);
    setWorkspaceState("UNLOCKED");
    lastFailedIterationIdRef.current = null;
    if (isMobile) setActiveTab("editor");
  }

  const handleGenerateCode = async () => {
    if (!problem || isGeneratingCode) return;
    setIsGeneratingCode(true);
    setGeneratedCode(null);  // make sure no stale diff is shown
    setLogs(l => [...l, { type: "system", text: "\n> Reviewing your specification before generating..." }]);

    try {
      const result = await reviewAndGenerateCode({
        problem,
        objective,
        constraints,
        approach,
        code: editorCode,
        logs,
        audits,
      });

      if (result.approved) {
        setGeneratedCode(result.code);
        setGenerationStatus("complete");
        setLogs(l => [...l, { type: "success", text: "\n[Specification approved — review the proposed changes in the editor]" }]);
      } else {
        // Reject: surface the reviewer's feedback in the terminal and do NOT open the diff view.
        setGeneratedCode(null);
        setLogs(l => [
          ...l,
          { type: "error",  text: "\n[Specification rejected by reviewer]" },
          { type: "stderr", text: result.reason },
          { type: "system", text: "\n> Refine your Objective, Constraints, and Approach, then click Generate Code again." },
        ]);
      }
    } catch (err: any) {
      setGeneratedCode(null);
      setLogs(l => [...l, { type: "error", text: `\n[Generation Error] ${err.message}` }]);
    } finally {
      setIsGeneratingCode(false);
    }
  }

  const handleAcceptGeneratedCode = () => {
    if (generatedCode != null) {
      setEditorCode(generatedCode);
      setLogs(l => [...l, { type: "system", text: "\n> Generated code applied to main.py." }]);
    }
    setGeneratedCode(null);
  }

  const handleRejectGeneratedCode = () => {
    setGeneratedCode(null);
    setLogs(l => [...l, { type: "system", text: "\n> Generated code discarded." }]);
  }

  if (isLoading) {
    return <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm font-medium">Loading problem...</div>;
  }

  if (!problem) {
    return <div className="p-8 text-center text-slate-500">Problem not found.</div>;
  }

  return (
    <div className="h-full w-full bg-[#f8f9fa] flex flex-col font-sans overflow-hidden">
      {/* Workspace Header Info */}
      <header className="min-h-[60px] bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center px-4 md:px-6 py-3 md:py-0 shrink-0 justify-between shadow-sm z-10 gap-3 md:gap-0 relative relative">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 pr-24 md:pr-0">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-100 flex shrink-0 items-center justify-center text-blue-700 font-bold text-xs md:text-sm mt-0.5 md:mt-0">
              {problem.id}
            </div>
            <h1 className="font-bold text-slate-900 text-sm md:text-base leading-snug">
              {problem.title}
            </h1>
          </div>
          <div className="flex items-center flex-wrap gap-2 ml-10 md:ml-0">
            <span className="px-2 md:px-2.5 py-0.5 md:py-1 bg-slate-100 text-slate-600 text-[10px] md:text-xs font-semibold rounded-md border border-slate-200 whitespace-nowrap">
              {problem.difficulty}
            </span>
            <span className="px-2 md:px-2.5 py-0.5 md:py-1 bg-slate-50 text-slate-500 text-[10px] md:text-xs font-semibold rounded-md border border-slate-200 whitespace-nowrap">
              {problem.topic}
            </span>
          </div>
        </div>
        <div className="absolute top-3 right-4 md:static md:mt-0 flex items-center shrink-0">
          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-slate-50 rounded-lg border border-slate-200 shadow-sm md:shadow-none mr-2 md:mr-4">
            <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${workspaceState === "EXECUTION" ? "bg-amber-500 animate-pulse" : workspaceState === "UNLOCKED" ? "bg-green-500" : "bg-blue-500"}`}></span>
            <span className="text-[9px] md:text-[11px] font-black text-slate-600 uppercase tracking-widest">{workspaceState}</span>
          </div>

          {/* Co-Pilot Toggle Button (Desktop Only) */}
          {!isMobile && (
            <button
              onClick={() => setIsCopilotVisible(!isCopilotVisible)}
              className="p-1.5 md:p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-colors flex items-center justify-center bg-white shadow-sm"
              title={isCopilotVisible ? "Hide Co-Pilot" : "Show Co-Pilot"}
            >
              {isCopilotVisible ? <PanelRightClose className="w-4 h-4 md:w-5 md:h-5" /> : <PanelRightOpen className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Container - Conditional Rendering based on screen size */}
      {!isMobile ? (
        // --- DESKTOP VIEW: 3-Column Resizable Panels ---
        <PanelGroup orientation="horizontal" className="flex-1">

          {/* LEFT PANEL: Gatekeeper while locked, Testing workbench once unlocked */}
          <Panel defaultSize={20} minSize={15} className="bg-white flex flex-col border-r border-slate-200 z-0">
            {(workspaceState === "GATEKEEPER" || workspaceState === "LOCKED") ? (
              <GatekeeperPanel
                problem={problem}
                state={workspaceState}
                onUnlock={handleUnlock}
                objective={objective}
                setObjective={setObjective}
                constraints={constraints}
                setConstraints={setConstraints}
                approach={approach}
                setApproach={setApproach}
              />
            ) : (
              <TestingSidebar
                mainCode={editorCode}
                testFiles={testFiles}
                setTestFiles={setTestFiles}
                activeFileId={activeTestFileId}
                setActiveFileId={setActiveTestFileId}
                isLocked={workspaceState === "EVALUATION" && evaluationResult === "fail" && executionModeState === "test"}
                onBack={handleBackToGatekeeper}
              />
            )}
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-slate-100 hover:bg-blue-200 transition-colors cursor-col-resize flex flex-col justify-center items-center z-10 border-r border-slate-200">
            <div className="w-0.5 h-8 bg-slate-300 rounded-full"></div>
          </PanelResizeHandle>

          {/* CENTER PANEL: Editor & Output */}
          <Panel defaultSize={55} minSize={30} className="flex flex-col bg-white">
            <PanelGroup orientation="vertical">
              <Panel defaultSize={70} minSize={30} className="flex flex-col">
                <Editor
                  problem={problem}
                  state={workspaceState}
                  evaluationResult={evaluationResult}
                  executionMode={executionModeState}
                  onRun={handleRunSimulation}
                  onRunTests={handleRunTests}
                  code={editorCode}
                  setCode={setEditorCode}
                  onGenerateCode={handleGenerateCode}
                  isGeneratingCode={isGeneratingCode}
                  generatedCode={generatedCode}
                  generationStatus={generationStatus}
                  onAcceptGeneratedCode={handleAcceptGeneratedCode}
                  onRejectGeneratedCode={handleRejectGeneratedCode}
                  testFiles={testFiles}
                  setTestFiles={setTestFiles}
                  activeTestFileId={activeTestFileId}
                  setActiveTestFileId={setActiveTestFileId}
                  quizQuestions={quizQuestions}
                  setQuizQuestions={setQuizQuestions}
                />
              </Panel>
              <PanelResizeHandle className="h-1.5 bg-slate-100 border-y border-slate-200 hover:bg-blue-200 transition-colors cursor-row-resize flex justify-center items-center z-10">
                <div className="w-8 h-0.5 bg-slate-300 rounded-full"></div>
              </PanelResizeHandle>
              <Panel defaultSize={30} minSize={10} className="flex flex-col bg-[#0d1117] relative">
                <OutputConsole logs={logs} />
              </Panel>
            </PanelGroup>
          </Panel>

          {/* Conditional Co-Pilot Rendering */}
          {isCopilotVisible && (
            <>
              <PanelResizeHandle className="w-1.5 bg-slate-100 hover:bg-blue-200 transition-colors cursor-col-resize flex flex-col justify-center items-center z-10 border-l border-slate-200">
                <div className="w-0.5 h-8 bg-slate-300 rounded-full"></div>
              </PanelResizeHandle>

              {/* RIGHT PANEL: Co-Pilot, Audit, or Success */}
              <Panel defaultSize={25} minSize={20} className="bg-white flex flex-col z-0">
                {workspaceState === "EVALUATION" && evaluationResult === "fail" && executionModeState === "test" ? (
                  <AuditPanel
                    rawErrorLog={logs.filter(l => l.type === 'error').pop()?.text || ""}
                    onSubmitAudit={handleAuditSubmit}
                  />
                ) : workspaceState === "EVALUATION" && evaluationResult === "pass" ? (
                  <SuccessPanel
                    quizPath={problem?.quizPath}
                    onSubmitSuccess={handleSuccessSubmit}
                  />
                ) : (
                  <CoPilotChat
                    state={workspaceState}
                    problem={problem}
                    objective={objective}
                    constraints={constraints}
                    approach={approach}
                    code={editorCode}
                    logs={logs}
                    audits={audits}
                    messages={chatMessages}
                    setMessages={setChatMessages}
                  />
                )}
              </Panel>
            </>
          )}

        </PanelGroup>
      ) : (
        // --- MOBILE VIEW: Single Full-Screen Panel + Bottom Tab Bar ---
        <div className="flex-1 flex flex-col h-full bg-white pb-[68px]">
          {/* Main content area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === "gatekeeper" && (
              (workspaceState === "GATEKEEPER" || workspaceState === "LOCKED") ? (
                <GatekeeperPanel
                  problem={problem}
                  state={workspaceState}
                  onUnlock={handleUnlock}
                  objective={objective}
                  setObjective={setObjective}
                  constraints={constraints}
                  setConstraints={setConstraints}
                  approach={approach}
                  setApproach={setApproach}
                />
              ) : (
                <TestingSidebar
                  mainCode={editorCode}
                  testFiles={testFiles}
                  setTestFiles={setTestFiles}
                  activeFileId={activeTestFileId}
                  setActiveFileId={(id) => {
                    setActiveTestFileId(id);
                    if (id != null) setActiveTab("editor");
                  }}
                  isLocked={workspaceState === "EVALUATION" && evaluationResult === "fail" && executionModeState === "test"}
                  onBack={handleBackToGatekeeper}
                />
              )
            )}
            {activeTab === "editor" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-3/5 border-b border-slate-200">
                  <Editor
                    problem={problem}
                    state={workspaceState}
                    evaluationResult={evaluationResult}
                    executionMode={executionModeState}
                    onRun={handleRunSimulation}
                    code={editorCode}
                    setCode={setEditorCode}
                    onGenerateCode={handleGenerateCode}
                    isGeneratingCode={isGeneratingCode}
                    testFiles={testFiles}
                    setTestFiles={setTestFiles}
                    activeTestFileId={activeTestFileId}
                    setActiveTestFileId={setActiveTestFileId}
                    quizQuestions={quizQuestions}
                    setQuizQuestions={setQuizQuestions}
                  />
                </div>
                <div className="h-2/5 flex flex-col bg-[#0d1117] relative">
                  <OutputConsole logs={logs} />
                </div>
              </div>
            )}
            {activeTab === "copilot" && (
              workspaceState === "EVALUATION" && evaluationResult === "fail" && executionModeState === "test" ? (
                <AuditPanel
                  rawErrorLog={logs.filter(l => l.type === 'error').pop()?.text || ""}
                  onSubmitAudit={handleAuditSubmit}
                />
              ) : (
                <CoPilotChat
                  state={workspaceState}
                  problem={problem}
                  objective={objective}
                  constraints={constraints}
                  approach={approach}
                  code={editorCode}
                  logs={logs}
                  audits={audits}
                  messages={chatMessages}
                  setMessages={setChatMessages}
                />
              )
            )}
          </div>

          {/* Floating Bottom Tab Bar for Mobile */}
          <div className="fixed bottom-0 left-0 right-0 h-[68px] bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgb(0,0,0,0.05)] z-50 flex items-center justify-around px-2">

            <button
              onClick={() => setActiveTab("gatekeeper")}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeTab === "gatekeeper" ? "text-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              {(workspaceState === "GATEKEEPER" || workspaceState === "LOCKED") ? (
                <>
                  <ListTodo className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Gatekeeper</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Tests</span>
                </>
              )}
            </button>

            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <button
                onClick={() => { if (workspaceState !== "LOCKED" && workspaceState !== "GATEKEEPER") setActiveTab("editor"); }}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-colors relative ${activeTab === "editor" ? "text-blue-600" : "text-slate-500 hover:text-slate-900"} ${(workspaceState === "LOCKED" || workspaceState === "GATEKEEPER") ? "opacity-30" : ""}`}
              >
                <Code2 className="w-5 h-5" />
                {workspaceState === "EXECUTION" && (
                  <span className="absolute top-2 right-10 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
                <span className="text-[10px] font-bold">Editor</span>
              </button>
              {(workspaceState === "LOCKED" || workspaceState === "GATEKEEPER") && (
                <div className="absolute inset-x-0 bottom-2 top-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10 cursor-not-allowed">
                  <div className="bg-slate-800 text-white rounded-full p-1.5 shadow-md">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>

            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <button
                onClick={() => { if (workspaceState !== "LOCKED" && workspaceState !== "GATEKEEPER") setActiveTab("copilot"); }}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-colors ${(workspaceState === "LOCKED" || workspaceState === "GATEKEEPER") ? "opacity-30" : ""} ${activeTab === "copilot" ? (workspaceState === "EVALUATION" && evaluationResult === "fail" && executionModeState === "test" ? "text-red-600" : "text-blue-600") : "text-slate-500 hover:text-slate-900"}`}
              >
                {workspaceState === "EVALUATION" && evaluationResult === "fail" && executionModeState === "test" ? (
                  <>
                    <div className="relative">
                      <AlertTriangle className="w-5 h-5 absolute inset-0 animate-ping text-red-400 opacity-50" />
                      <AlertTriangle className="w-5 h-5 relative z-10 text-red-600" />
                    </div>
                    <span className="text-[10px] font-bold">Audit</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Co-Pilot</span>
                  </>
                )}
              </button>
              {(workspaceState === "LOCKED" || workspaceState === "GATEKEEPER") && (
                <div className="absolute inset-x-0 bottom-2 top-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10 cursor-not-allowed">
                  <div className="bg-slate-800 text-white rounded-full p-1.5 shadow-md">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
