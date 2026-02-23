import { CheckCircle2, Lock } from "lucide-react";
import type { ProblemSet } from "../../lib/problems_mock";
import type { WorkspaceState } from "../../pages/Workspace";

export default function GatekeeperPanel({
    problem,
    state,
    onUnlock,
    objective,
    setObjective,
    constraints,
    setConstraints,
}: {
    problem: ProblemSet;
    state: WorkspaceState;
    onUnlock: () => void;
    objective: string;
    setObjective: (val: string) => void;
    constraints: string;
    setConstraints: (val: string) => void;
}) {

    const isUnlocked = state !== "GATEKEEPER" && state !== "LOCKED";
    const isValid = objective.trim().length > 5 && constraints.trim().length > 5;

    return (
        <div className="flex-1 flex flex-col overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

            <div className="p-5 flex flex-col gap-6 pb-24 md:pb-5">

                {/* Problem Statement Section (Always visible, styled like a heading now) */}
                <div className="flex flex-col mb-2">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1.5">
                        Problem Statement
                    </h2>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        {problem.description}
                    </p>
                </div>

                {/* Gatekeeper Phase Header (Hidden when unlocked) */}
                {!isUnlocked && (
                    <div className="flex flex-col pb-4 border-b border-slate-100 -mt-2">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Lock className="w-4 h-4 text-slate-800" />
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                Gatekeeper Phase
                            </h2>
                        </div>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed relative">
                            You must define your specific simulation objective and explicit physical
                            constraints before the editor and AI unlock.
                        </p>
                    </div>
                )}

                {/* Objective */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700">1. Define Objective</label>
                    <textarea
                        disabled={isUnlocked}
                        placeholder={problem.objectivePlaceholder}
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:opacity-75 disabled:bg-slate-100"
                    />
                </div>

                {/* Constraints */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700">2. Define Constraints</label>
                    <textarea
                        disabled={isUnlocked}
                        placeholder={problem.constraintPlaceholder}
                        value={constraints}
                        onChange={(e) => setConstraints(e.target.value)}
                        className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:opacity-75 disabled:bg-slate-100"
                    />
                </div>

                {/* Dataset Preview */}
                {problem.dataset && problem.dataset.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-700">Dataset Context</label>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <p className="text-xs text-slate-500 mb-3">{problem.dataset[0].description}</p>
                            <div className="flex flex-col gap-2">
                                {problem.dataset[0].fields.map((f, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">{f.name}</span>
                                        <span className="text-slate-400 font-medium">{f.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Unlock Button */}
                {!isUnlocked ? (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onUnlock();
                        }}
                        disabled={!isValid}
                        className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 cursor-pointer"
                    >
                        <Lock className="w-4 h-4" />
                        Unlock Workspace
                    </button>
                ) : (
                    <div className="w-full py-3 mt-4 bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-xl flex justify-center items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Workspace Unlocked
                    </div>
                )}
            </div>
        </div>
    );
}
