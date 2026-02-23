import { useParams } from "react-router-dom";
import { useState } from "react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { MOCK_PROBLEMS } from "../lib/problems_mock";
import GatekeeperPanel from "../components/workspace/GatekeeperPanel";
import Editor from "../components/workspace/Editor";
import OutputConsole, { type LogEntry } from "../components/workspace/OutputConsole";
import CoPilotChat from "../components/workspace/CoPilotChat";
import { useRef } from "react";

export type WorkspaceState = "LOCKED" | "GATEKEEPER" | "UNLOCKED" | "EXECUTION" | "EVALUATION";

export default function Workspace() {
  const { id } = useParams();
  const problem = id && MOCK_PROBLEMS[id] ? MOCK_PROBLEMS[id] : null;

  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>("GATEKEEPER");
  const [logs, setLogs] = useState<LogEntry[]>([{ type: "system", text: "Pyodide Kernel Waiting..." }]);
  const workerRef = useRef<Worker | null>(null);

  const getWorker = () => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../lib/pyodideWorker.ts', import.meta.url));
      workerRef.current.onmessage = (e) => {
        const data = e.data;
        if (data.type === 'stdout' || data.type === 'stderr' || data.type === 'system') {
          setLogs(l => [...l, { type: data.type, text: data.text }]);
        } else if (data.type === 'success') {
          setLogs(l => [...l, { type: "success", text: `\n[Simulation Completed] Return Output: ${data.result}` }]);
          setWorkspaceState("EVALUATION");
        } else if (data.type === 'error') {
          setLogs(l => [...l, { type: "error", text: `\n[Exception] ${data.error}` }]);
          setWorkspaceState("EVALUATION");
        }
      }
    }
    return workerRef.current;
  }

  const handleRunSimulation = (code: string) => {
    setWorkspaceState("EXECUTION");
    setLogs(l => [...l, { type: "system", text: "\n> Executing main.py..." }]);
    const worker = getWorker();
    worker.postMessage({ code, id: Date.now() });
  }

  if (!problem) {
    return <div className="p-8 text-center text-slate-500">Problem not found.</div>;
  }

  return (
    <div className="h-full w-full bg-[#f8f9fa] flex flex-col font-sans overflow-hidden">
      {/* Workspace Header Info */}
      <header className="h-[60px] bg-white border-b border-slate-200 flex items-center px-6 shrink-0 justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            {problem.id}
          </div>
          <h1 className="font-bold text-slate-900">{problem.title}</h1>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
            {problem.difficulty}
          </span>
          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs font-semibold rounded-md border border-slate-200">
            {problem.topic}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className={`w-2 h-2 rounded-full ${workspaceState === "EXECUTION" ? "bg-amber-500 animate-pulse" : workspaceState === "UNLOCKED" ? "bg-green-500" : "bg-blue-500"}`}></span>
            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{workspaceState}</span>
          </div>
        </div>
      </header>

      {/* Main Panels */}
      <PanelGroup orientation="horizontal" className="flex-1">

        {/* LEFT PANEL: Gatekeeper */}
        <Panel defaultSize={20} minSize={15} className="bg-white flex flex-col border-r border-slate-200 z-0">
          <GatekeeperPanel problem={problem} state={workspaceState} onUnlock={() => setWorkspaceState("UNLOCKED")} />
        </Panel>

        <PanelResizeHandle className="w-1.5 bg-slate-100 hover:bg-blue-200 transition-colors cursor-col-resize flex flex-col justify-center items-center z-10 border-r border-slate-200">
          <div className="w-0.5 h-8 bg-slate-300 rounded-full"></div>
        </PanelResizeHandle>

        {/* CENTER PANEL: Editor & Output */}
        <Panel defaultSize={55} minSize={30} className="flex flex-col bg-white">
          <PanelGroup orientation="vertical">
            <Panel defaultSize={70} minSize={30} className="flex flex-col">
              <Editor problem={problem} state={workspaceState} onRun={handleRunSimulation} onExecutionFinished={(pass) => setWorkspaceState(pass ? "EVALUATION" : "LOCKED")} />
            </Panel>
            <PanelResizeHandle className="h-1.5 bg-slate-100 border-y border-slate-200 hover:bg-blue-200 transition-colors cursor-row-resize flex justify-center items-center z-10">
              <div className="w-8 h-0.5 bg-slate-300 rounded-full"></div>
            </PanelResizeHandle>
            <Panel defaultSize={30} minSize={10} className="flex flex-col bg-[#0d1117] relative">
              <OutputConsole logs={logs} />
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-1.5 bg-slate-100 hover:bg-blue-200 transition-colors cursor-col-resize flex flex-col justify-center items-center z-10 border-l border-slate-200">
          <div className="w-0.5 h-8 bg-slate-300 rounded-full"></div>
        </PanelResizeHandle>

        {/* RIGHT PANEL: Co-Pilot */}
        <Panel defaultSize={25} minSize={20} className="bg-white flex flex-col z-0">
          <CoPilotChat state={workspaceState} />
        </Panel>

      </PanelGroup>
    </div>
  );
}
