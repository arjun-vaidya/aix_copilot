import { useState, useMemo } from "react";
import { AlertTriangle, Unlock, CheckCircle2, Lock } from "lucide-react";

type ErrorCategory = "Syntax Error" | "Logic Error" | "Hallucination" | "Unit Mismatch" | null;

interface AuditPanelProps {
    rawErrorLog: string;
    onSubmitAudit: (category: ErrorCategory, rationale: string) => void;
}

export default function AuditPanel({ rawErrorLog, onSubmitAudit }: AuditPanelProps) {
    const [selectedCategory, setSelectedCategory] = useState<ErrorCategory>(null);
    const [rationale, setRationale] = useState("");

    // Try to extract the specific file/line that failed from standard Python tracebacks
    const failedSegment = useMemo(() => {
        if (!rawErrorLog) return { line: "?", code: "Unable to parse error segment." };

        const lines = rawErrorLog.split('\n');
        // Find the last file/line mention before the actual error name
        const fileLines = lines.filter(l => l.includes('File "') && l.includes('line '));
        if (fileLines.length > 0) {
            const lastLine = fileLines[fileLines.length - 1];
            // Extract line number
            const match = lastLine.match(/line (\d+)/);
            const lineNum = match ? match[1] : "?";

            // The raw code executing on that line usually follows immediately on the next line
            const codeIndex = lines.indexOf(lastLine) + 1;
            const codeSnippet = lines[codeIndex] ? lines[codeIndex].trim() : "";

            return {
                line: lineNum,
                code: codeSnippet
            };
        }
        return { line: "?", code: "See console for full traceback." };
    }, [rawErrorLog]);

    const isSubmitValid = selectedCategory !== null && rationale.trim().length > 10;

    return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
            {/* Header */}
            <div className="p-6 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0 border border-red-100 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit Required</h2>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                        Classify the failure to unlock the editor.
                    </p>
                </div>
            </div>

            <div className="p-6 flex flex-col gap-8">
                {/* Step 1. Source Analysis */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                        <h3 className="font-bold text-slate-900">Source Analysis</h3>
                    </div>
                    <div className="bg-white border text-sm border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500"></div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Failed Segment (Line {failedSegment.line})</p>
                        <div className="bg-red-50 text-red-900 p-3 rounded-lg border border-red-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                            {failedSegment.code || "Runtime string evaluation failed."}
                        </div>
                    </div>
                </section>

                {/* Step 2. Classification */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                        <h3 className="font-bold text-slate-900">Classify Failure</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { title: "Syntax Error", desc: "Code structure or typo violation", val: "Syntax Error" },
                            { title: "Logic Error", desc: "Mathematical or algorithmic flaw", val: "Logic Error" },
                            { title: "Hallucination", desc: "AI suggested an invalid module or function", val: "Hallucination" },
                            { title: "Unit Mismatch", desc: "Inconsistent physical properties", val: "Unit Mismatch" },
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => setSelectedCategory(opt.val as ErrorCategory)}
                                className={`text-left p-4 rounded-xl border-2 transition-all relative ${selectedCategory === opt.val
                                    ? "border-blue-500 bg-blue-50/50 shadow-md ring-4 ring-blue-500/10"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                {selectedCategory === opt.val && (
                                    <div className="absolute top-3 right-3 text-blue-500">
                                        <CheckCircle2 className="w-5 h-5 fill-blue-50" />
                                    </div>
                                )}
                                <h4 className={`font-bold text-sm ${selectedCategory === opt.val ? "text-blue-900" : "text-slate-800"}`}>{opt.title}</h4>
                                <p className={`text-xs mt-1 ${selectedCategory === opt.val ? "text-blue-700/80" : "text-slate-500"}`}>{opt.desc}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Step 3. Diagnosis Details */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                        <h3 className="font-bold text-slate-900">Diagnosis Details</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-3">Explain the root cause and how you plan to fix it:</p>
                    <textarea
                        value={rationale}
                        onChange={e => setRationale(e.target.value)}
                        placeholder="Why did this line fail? e.g. the dot product dimension arrays are misaligned..."
                        className="w-full h-32 p-4 border border-slate-200 rounded-xl bg-white shadow-sm resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm placeholder:text-slate-400"
                    />
                </section>

            </div>

            {/* Sticky Submit Footer */}
            <div className="p-6 bg-white border-t border-slate-200 mt-auto sticky bottom-0">
                <button
                    disabled={!isSubmitValid}
                    onClick={() => onSubmitAudit(selectedCategory, rationale)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm transition-all animate-in fade-in fill-mode-forwards"
                >
                    {isSubmitValid ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    Submit Audit & Unlock Workspace
                </button>
                {!isSubmitValid && (
                    <p className="text-center text-[11px] text-slate-400 font-medium mt-3">
                        Select a category and provide a brief rationale to continue.
                    </p>
                )}
            </div>
        </div>
    );
}
