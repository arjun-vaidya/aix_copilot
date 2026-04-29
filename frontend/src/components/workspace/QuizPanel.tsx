import { useState } from "react";
import { Sparkles, RefreshCw, CheckCircle2, XCircle, Brain } from "lucide-react";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

/**
 * Calls /api/gemini-chat to generate 3 quiz questions based on the problem and student code.
 */
async function generateQuizQuestions(problemTitle: string, problemDescription: string, mainCode: string): Promise<QuizQuestion[]> {
  const systemPrompt = `You are a quiz generation assistant for a scientific computing education platform. Given a problem statement and the student's code, generate exactly 3 multiple-choice questions that test conceptual understanding of the implementation.

Respond with a JSON array of exactly 3 objects, each with:
- "question": the question text (reference specific code elements like variable names, functions, or constants when relevant)
- "options": array of exactly 3 answer strings
- "correctIndex": index (0-2) of the correct answer
- "explanation": a detailed explanation of why the correct answer is right, referencing the student's code

Respond with ONLY the JSON array. No other text.`;

  const userContent = `Problem: ${problemTitle}
${problemDescription}

Student's code:
${mainCode || "# No code written yet"}

Generate 3 quiz questions:`;

  const response = await fetch("/api/gemini-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error || `API returned status ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6));
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) fullText += text;
        } catch { /* skip */ }
      }
    }
  }

  let jsonStr = fullText.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  const parsed = JSON.parse(jsonStr);
  return parsed.map((q: any, i: number) => ({
    id: `q-${Date.now()}-${i}`,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
}

export default function QuizPanel({
  problemTitle,
  problemDescription,
  mainCode,
  questions,
  setQuestions,
}: {
  problemTitle: string;
  problemDescription: string;
  mainCode: string;
  questions: QuizQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | null>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  const answeredCount = Object.values(revealedAnswers).filter(Boolean).length;
  const correctCount = questions.filter(
    (q) => revealedAnswers[q.id] && selectedAnswers[q.id] === q.correctIndex
  ).length;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const newQuestions = await generateQuizQuestions(problemTitle, problemDescription, mainCode);
      setQuestions((prev) => [...prev, ...newQuestions]);
      // Clear selections for new questions
      const newSelections = { ...selectedAnswers };
      const newRevealed = { ...revealedAnswers };
      newQuestions.forEach((q) => {
        newSelections[q.id] = null;
        newRevealed[q.id] = false;
      });
      setSelectedAnswers(newSelections);
      setRevealedAnswers(newRevealed);
    } catch (err: any) {
      setError(err.message || "Failed to generate questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (revealedAnswers[questionId]) return; // Already answered
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitAnswer = (questionId: string) => {
    if (selectedAnswers[questionId] == null) return;
    setRevealedAnswers((prev) => ({ ...prev, [questionId]: true }));
  };

  // Empty state
  if (questions.length === 0 && !isGenerating) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Brain className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-1.5">
            Ready to test your understanding?
          </h3>
          <p className="text-xs text-slate-400 font-medium max-w-[280px] leading-relaxed mb-5">
            Generate challenge questions based on your current code and the problem statement.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Quizzes
          </button>
          {error && (
            <div className="mt-4 text-xs font-medium text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Brain className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">
            AI-Generated Assessment
          </h2>
          {/* Progress */}
          <div className="flex items-center gap-2 ml-3">
            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: questions.length > 0 ? `${(answeredCount / questions.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {answeredCount}/{questions.length} Complete
            </span>
          </div>
        </div>
        {answeredCount > 0 && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            {correctCount}/{answeredCount} Correct
          </span>
        )}
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {questions.map((q, qIdx) => {
          const isRevealed = revealedAnswers[q.id];
          const selected = selectedAnswers[q.id];
          const isCorrect = selected === q.correctIndex;

          return (
            <div key={q.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Question Header */}
              <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Question {String(qIdx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1.5 leading-relaxed">
                    {q.question}
                  </p>
                </div>
                {isRevealed && (
                  <div className="ml-3 shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="px-5 pb-3 space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selected === optIdx;
                  const isCorrectOption = optIdx === q.correctIndex;

                  let optionClass = "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 cursor-pointer";
                  if (isRevealed) {
                    if (isCorrectOption) {
                      optionClass = "border-emerald-300 bg-emerald-50 text-emerald-800";
                    } else if (isSelected && !isCorrectOption) {
                      optionClass = "border-red-200 bg-red-50 text-red-600";
                    } else {
                      optionClass = "border-slate-100 bg-slate-50 text-slate-400";
                    }
                  } else if (isSelected) {
                    optionClass = "border-blue-400 bg-blue-50 text-blue-800 ring-2 ring-blue-400/20";
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      disabled={isRevealed}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all flex items-center gap-3 ${optionClass}`}
                    >
                      {isRevealed && isCorrectOption && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      {isRevealed && isSelected && !isCorrectOption && (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Submit / Explanation */}
              <div className="px-5 pb-4">
                {!isRevealed && (
                  <button
                    onClick={() => handleSubmitAnswer(q.id)}
                    disabled={selected == null}
                    className="mt-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    Submit Answer
                  </button>
                )}

                {isRevealed && (
                  <div className={`mt-2 rounded-lg px-4 py-3 text-sm font-medium leading-relaxed ${isCorrect ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-blue-50 border border-blue-200 text-blue-800"}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">AI Explanation</span>
                    </div>
                    {q.explanation}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="text-xs font-medium text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Footer: Generate More */}
      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 shrink-0">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "Generating..." : "Generate 3 More Questions"}
        </button>
      </div>
    </div>
  );
}
