import { useState, useEffect } from "react";
import { CheckCircle2, Unlock, Lock, ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

type InstructorQuizQuestion = {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
};

interface SuccessPanelProps {
    quizPath?: string;
    onSubmitSuccess: (explanation: string, quizAnswers: Record<string, number>) => void;
}

export default function SuccessPanel({ quizPath, onSubmitSuccess }: SuccessPanelProps) {
    const navigate = useNavigate();
    const [explanation, setExplanation] = useState("");
    const [quizQuestions, setQuizQuestions] = useState<InstructorQuizQuestion[]>([]);
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
    const [animateIn, setAnimateIn] = useState(false);

    // Fetch instructor quiz questions from the problem's quizPath
    useEffect(() => {
        if (!quizPath) return;
        setIsLoadingQuiz(true);
        fetch(quizPath)
            .then(res => {
                if (!res.ok) throw new Error(`Quiz fetch failed: ${res.status}`);
                return res.json();
            })
            .then((data: InstructorQuizQuestion[]) => setQuizQuestions(data))
            .catch(err => console.error("Failed to load instructor quiz:", err))
            .finally(() => setIsLoadingQuiz(false));
    }, [quizPath]);

    const allQuizzesAnswered = quizQuestions.length === 0 ||
        quizQuestions.every(q => quizAnswers[q.id] !== undefined);
    const isSubmitValid = explanation.trim().length > 10 && allQuizzesAnswered;

    const handleSelectAnswer = (questionId: string, optionIndex: number) => {
        setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleSubmit = () => {
        // Calculate quiz score
        const total = quizQuestions.length;
        const correct = quizQuestions.filter(q => quizAnswers[q.id] === q.correctIndex).length;
        setQuizScore({ correct, total });

        // Fire the parent callback
        onSubmitSuccess(explanation, quizAnswers);

        // Show completion screen with animation
        setIsCompleted(true);
        setTimeout(() => setAnimateIn(true), 50);
    };

    // ── Completion Screen ──
    if (isCompleted) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white px-8">
                <div
                    className={`flex flex-col items-center gap-5 transition-all duration-700 ease-out ${
                        animateIn
                            ? "opacity-100 translate-y-0 scale-100"
                            : "opacity-0 translate-y-6 scale-95"
                    }`}
                >
                    {/* Animated check icon */}
                    <div className={`w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center transition-all duration-700 delay-200 ${
                        animateIn ? "opacity-100 scale-100" : "opacity-0 scale-75"
                    }`}>
                        <Trophy className="w-7 h-7 text-emerald-500" />
                    </div>

                    {/* Title */}
                    <div className={`text-center transition-all duration-700 delay-300 ${
                        animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                    }`}>
                        <h2 className="text-lg font-bold text-emerald-700 tracking-tight">Problem Completed</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">Great work on this problem.</p>
                    </div>

                    {/* Quiz Score */}
                    {quizScore.total > 0 && (
                        <div className={`bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-center transition-all duration-700 delay-500 ${
                            animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                        }`}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quiz Score</p>
                            <p className="text-2xl font-black text-slate-800">
                                {quizScore.correct}
                                <span className="text-sm font-bold text-slate-400 mx-0.5">/</span>
                                {quizScore.total}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                {quizScore.correct === quizScore.total
                                    ? "Perfect score!"
                                    : quizScore.correct >= quizScore.total / 2
                                        ? "Good effort!"
                                        : "Review the concepts and try again."}
                            </p>
                        </div>
                    )}

                    {/* Home button */}
                    <button
                        onClick={() => navigate("/dashboard")}
                        className={`flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-300 hover:border-slate-500 text-slate-700 text-xs font-bold rounded-xl transition-all duration-700 delay-700 cursor-pointer ${
                            animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                        }`}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Dashboard
                    </button>

                    {/* Try again */}
                    {quizScore.total > 0 && (
                        <button
                            onClick={() => {
                                setQuizAnswers({});
                                setExplanation("");
                                setAnimateIn(false);
                                setIsCompleted(false);
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-dashed border-slate-300 hover:border-slate-500 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl transition-all duration-700 delay-[900ms] cursor-pointer ${
                                animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                            }`}
                        >
                            Try Quiz Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Form Screen ──
    return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Validation Complete</h2>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        All tests passed. Explain your solution and complete the quiz.
                    </p>
                </div>
            </div>

            <div className="px-5 py-5 flex flex-col gap-6">
                {/* Step 1. Success Banner */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Solution Summary</h3>
                    </div>
                    <div className="bg-white border border-emerald-200 rounded-lg p-3 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-400"></div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 font-mono">✓ All Tests Passed</p>
                        <p className="text-xs text-slate-600 leading-relaxed">Your code passed all instructor and custom tests. Explain your approach below.</p>
                    </div>
                </section>

                {/* Step 2. Instructor Quiz */}
                {(quizQuestions.length > 0 || isLoadingQuiz) && (
                    <section>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Assessment Quiz</h3>
                        </div>

                        {isLoadingQuiz ? (
                            <div className="text-center py-4 text-[11px] text-slate-400 font-medium">Loading quiz…</div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {quizQuestions.map((question, idx) => {
                                    const selected = quizAnswers[question.id];
                                    return (
                                        <div key={question.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                                            <p className="text-xs font-semibold text-slate-800 mb-2 leading-relaxed">
                                                <span className="text-emerald-600 font-bold mr-1">Q{idx + 1}.</span>
                                                {question.question}
                                            </p>
                                            <div className="flex flex-col gap-1.5">
                                                {question.options.map((option, optIdx) => {
                                                    const isSelected = selected === optIdx;
                                                    return (
                                                        <button
                                                            key={optIdx}
                                                            onClick={() => handleSelectAnswer(question.id, optIdx)}
                                                            className={`w-full text-left px-2.5 py-2 rounded-md border transition-all text-xs font-medium ${
                                                                isSelected
                                                                    ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                                                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-600"
                                                            }`}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${
                                                                    isSelected
                                                                        ? "border-emerald-500 bg-emerald-500"
                                                                        : "border-slate-300"
                                                                }`}>
                                                                    {isSelected && <span className="text-white text-[8px] font-bold">✓</span>}
                                                                </span>
                                                                <span className="leading-snug">{option}</span>
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* Step 3. Explanation */}
                <section>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {quizQuestions.length > 0 ? 3 : 2}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Solution Explanation</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mb-2">Explain why your solution works and what you learned:</p>
                    <textarea
                        value={explanation}
                        onChange={e => setExplanation(e.target.value)}
                        placeholder="e.g. I converted the 2nd-order ODE into two 1st-order ODEs because odeint requires that form..."
                        className="w-full h-28 p-3 border border-slate-200 rounded-lg bg-white shadow-sm resize-none focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs placeholder:text-slate-400 leading-relaxed"
                    />
                </section>
            </div>

            {/* Sticky Submit Footer */}
            <div className="px-5 py-4 bg-white border-t border-slate-200 mt-auto sticky bottom-0">
                <button
                    disabled={!isSubmitValid}
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-white border-2 border-slate-300 hover:border-slate-500 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                    {isSubmitValid ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {isSubmitValid ? "Submit & Unlock Workspace" : "Complete All Fields to Continue"}
                </button>
                {!isSubmitValid && (
                    <p className="text-center text-[10px] text-slate-400 font-medium mt-2">
                        {explanation.trim().length <= 10
                            ? "Provide a detailed explanation (min 10 chars)."
                            : "Answer all quiz questions to proceed."}
                    </p>
                )}
            </div>
        </div>
    );
}
