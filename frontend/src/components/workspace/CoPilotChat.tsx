import { Bot, Send, User, AlertTriangle } from "lucide-react";
import type { WorkspaceState, AuditRecord } from "../../pages/Workspace";
import type { LogEntry } from "./OutputConsole";
import type { ProblemSet } from "../../lib/problemLoader";
import { useState, useRef, useEffect } from "react";
import { simulateStreamingCoPilot, type ChatMessage } from "../../lib/aiService";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function CoPilotChat({
    state,
    problem,
    objective,
    constraints,
    approach,
    code,
    logs,
    audits,
    messages,
    setMessages
}: {
    state: WorkspaceState;
    problem: ProblemSet;
    objective: string;
    constraints: string;
    approach: string;
    code: string;
    logs: LogEntry[];
    audits: AuditRecord[];
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}) {
    const isLocked = state === "GATEKEEPER" || state === "LOCKED";

    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLocked || isTyping) return;

        const userMsg: ChatMessage = { role: "user", content: inputValue.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        const currentHistory = [...messages, userMsg];

        // Add a temporary empty assistant message for streaming
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);

        const context = { problem, objective, constraints, approach, code, logs, audits };

        await simulateStreamingCoPilot(currentHistory, context, (chunk) => {
            setMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                newMessages[lastIdx] = {
                    ...newMessages[lastIdx],
                    content: newMessages[lastIdx].content + chunk
                };
                return newMessages;
            });
        });

        setIsTyping(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
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

                {/* Chat History */}
                <div className="flex flex-col gap-4">
                    {messages.map((msg, idx) => {
                        const isError = msg.role === 'assistant' && msg.content.startsWith('@@ERROR@@');
                        const errorText = isError ? msg.content.replace('@@ERROR@@', '') : '';

                        // Hide empty assistant placeholder messages
                        if (msg.role === 'assistant' && msg.content === '') return null;

                        // Render error card
                        if (isError) {
                            return (
                                <div key={idx} className="flex gap-3">
                                    <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="p-3 rounded-xl rounded-tl-none shadow-sm text-sm bg-amber-50 border border-amber-200 text-amber-800 max-w-[85%]">
                                        <p className="font-bold text-amber-900 mb-1 text-xs uppercase tracking-wide">Connection Error</p>
                                        <p className="text-[13px] leading-relaxed">{errorText}</p>
                                        <p className="text-[11px] text-red-700 font-semibold mt-2">Contact your instructor if this issue persists.</p>
                                    </div>
                                </div>
                            );
                        }

                        // Render normal message
                        return (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-blue-600'}`}>
                                    {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <div className={`p-3 rounded-xl shadow-sm text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none prose prose-sm max-w-none'}`}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                            code: ({ node, ...props }) => <code className="bg-slate-100 text-slate-800 font-mono px-1.5 py-0.5 rounded text-[13px] border border-slate-200" {...props} />,
                                            pre: ({ node, ...props }) => <pre className="bg-slate-800 text-slate-200 p-2 rounded text-xs my-2 overflow-x-auto" {...props} />
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        );
                    })}
                    {isTyping && messages[messages.length - 1]?.content === "" && (
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none shadow-sm flex gap-1 items-center h-[42px]">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Box */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <div className="relative">
                    <textarea
                        disabled={isLocked || isTyping}
                        rows={2}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isLocked ? "Chat locked..." : isTyping ? "TA is evaluating..." : "Ask physics logic questions..."}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 resize-none transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLocked || isTyping || !inputValue.trim()}
                        className="absolute bottom-2 right-2 w-7 h-7 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                    >
                        <Send className="w-3.5 h-3.5 text-white ml-px" />
                    </button>
                </div>
            </div>
        </div>
    );
}
