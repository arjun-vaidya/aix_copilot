import { Bot, Send } from "lucide-react";
import type { WorkspaceState } from "../../pages/Workspace";

export default function CoPilotChat({ state }: { state: WorkspaceState }) {
    const isLocked = state === "GATEKEEPER" || state === "LOCKED";

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
            <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center">
                        <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">AI Co-Pilot</h3>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto relative">
                {isLocked && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6 text-center">
                        <Bot className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-500 mb-1">Authentication Required</p>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Define the simulation constraints in the Gatekeeper to activate AI assistance.</p>
                    </div>
                )}

                {/* Dummy Chat History */}
                <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none shadow-sm text-sm text-slate-700">
                            Hello! I'm here to help you reason through your numerical simulation. How can we start forming the solution according to your constraints?
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Box */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <div className="relative">
                    <textarea
                        disabled={isLocked}
                        rows={2}
                        placeholder={isLocked ? "Chat locked..." : "Ask physics logic questions..."}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 resize-none transition-all"
                    />
                    <button
                        disabled={isLocked}
                        className="absolute bottom-2 right-2 w-7 h-7 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                    >
                        <Send className="w-3.5 h-3.5 text-white ml-px" />
                    </button>
                </div>
            </div>
        </div>
    );
}
