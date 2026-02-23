import { Terminal } from "lucide-react";
import { useRef, useEffect } from "react";

export type LogEntry = { type: "stdout" | "stderr" | "system" | "error" | "success"; text: string };

export default function OutputConsole({ logs }: { logs: LogEntry[] }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);
    return (
        <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-slate-300 font-mono text-sm relative">
            {/* Console Header */}
            <div className="h-9 px-3 bg-[#161b22] border-b border-[#30363d] flex items-center gap-2 shrink-0">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-400">Terminal Output</span>
            </div>

            {/* Output Area */}
            <div className="flex-1 p-3 overflow-y-auto whitespace-pre-wrap">
                {logs.map((log, i) => (
                    <p key={i} className={`text-[13px] mb-1 font-mono tracking-tight ${log.type === "stderr" || log.type === "error" ? "text-red-400" : log.type === "system" ? "text-slate-500" : log.type === "success" ? "text-green-400" : "text-slate-300"}`}>
                        {log.text}
                    </p>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
