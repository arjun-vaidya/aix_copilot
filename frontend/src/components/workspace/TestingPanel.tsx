import { useState, useRef } from "react";
import { Plus, X, Sparkles, FlaskConical } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";

export type TestFile = {
  id: string;
  name: string;
  code: string;
};

const DEFAULT_TEST_TEMPLATE = `import pytest
import numpy as np

# TODO: Define your test logic here

def test_example():
    """Basic sanity check."""
    assert 1 + 1 == 2
`;

let fileCounter = 0;

/**
 * Calls /api/openai-chat and asks the model to return a JSON object
 * with { fileName, code }. Uses OpenAI's JSON-mode for reliable structured output.
 */
async function generateTestWithAI(userPrompt: string, mainCode: string): Promise<{ fileName: string; code: string }> {
  const systemPrompt = `You are a Python test generation assistant. Given the student's code and a test description, generate a complete pytest test file.

Respond with a JSON object containing exactly two keys:
- "fileName": a descriptive Python test file name (e.g. "test_energy_conservation.py")
- "code": the complete, runnable pytest file content

Rules for the code:
- Write a complete, runnable pytest file
- Import from "main" to test the student's code
- Use numpy and pytest where appropriate
- Include docstrings for each test function

Respond with ONLY a single valid JSON object. No prose, no markdown.`;

  const userContent = `Student code:
${mainCode || "# No code written yet"}

Write a pytest file for: ${userPrompt}`;

  const response = await fetch("/api/openai-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt,
      messages: [{ role: "user", content: userContent }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error || `API returned status ${response.status}`);
  }

  const fullText = await collectOpenAIStream(response);

  let jsonStr = fullText.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  let result: any;
  try {
    result = JSON.parse(jsonStr);
  } catch (e: any) {
    throw new Error(`AI returned malformed JSON: ${e?.message || "parse error"}`);
  }

  if (!result?.fileName || !result?.code) {
    throw new Error("AI response missing required fields ('fileName', 'code').");
  }
  return { fileName: result.fileName, code: result.code };
}

async function collectOpenAIStream(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream.");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      for (const rawLine of frame.split("\n")) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.choices?.[0]?.delta?.content;
          if (text) fullText += text;
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
  return fullText;
}


export default function TestingPanel({ mainCode, testFiles, setTestFiles, activeFileId, setActiveFileId }: {
  mainCode: string;
  testFiles: TestFile[];
  setTestFiles: React.Dispatch<React.SetStateAction<TestFile[]>>;
  activeFileId: string | null;
  setActiveFileId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = testFiles.find((f) => f.id === activeFileId) || null;


  const handleCreateTest = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const { fileName, code } = await generateTestWithAI(prompt, mainCode);
      fileCounter++;

      const newFile: TestFile = {
        id: `test-${Date.now()}-${fileCounter}`,
        name: fileName,
        code: code,
      };

      setTestFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFile.id);
      setPrompt("");
    } catch (err: any) {
      setError(err.message || "Failed to generate test.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddBlankTest = () => {
    fileCounter++;
    const newFile: TestFile = {
      id: `test-${Date.now()}-${fileCounter}`,
      name: `test_${fileCounter}.py`,
      code: DEFAULT_TEST_TEMPLATE,
    };
    setTestFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleCloseFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFileId === id) {
      const remaining = testFiles.filter((f) => f.id !== id);
      setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const handleCodeChange = (newCode: string | undefined) => {
    if (!activeFileId || !newCode) return;
    setTestFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, code: newCode } : f))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleCreateTest();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Test Generation Prompt Section */}
      <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-500" />
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">
              Test Generation Prompt
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wide">
            Press Cmd+Enter to generate
          </span>
        </div>

        <div className="relative">
          <textarea
            ref={promptRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the test logic (e.g., Verify energy conservation for N=100 with Barnes-Hut approximation)..."
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all resize-none font-sans leading-relaxed"
          />
          {error && (
            <div className="mt-2 text-xs font-medium text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 mt-2.5">
            <button
              onClick={handleCreateTest}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Generating..." : "Generate Test"}
            </button>
          </div>
        </div>
      </div>

      {/* Test File Tabs */}
      <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-2 shrink-0 gap-0.5 overflow-x-auto">
        {testFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => setActiveFileId(file.id)}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeFileId === file.id
                ? "bg-white border border-slate-200 text-slate-800 shadow-sm border-b-transparent translate-y-[1px] z-10"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
            }`}
          >
            <FlaskConical className="w-3 h-3 text-emerald-500 shrink-0" />
            {file.name}
            <span
              onClick={(e) => handleCloseFile(file.id, e)}
              className="ml-1 w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        ))}

        {/* Add Test Button */}
        <button
          onClick={handleAddBlankTest}
          className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all ml-1 shrink-0"
          title="Add blank test file"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor / Empty State */}
      <div className="flex-1 relative">
        {activeFile ? (
          <MonacoEditor
            height="100%"
            language="python"
            theme="light"
            value={activeFile.code}
            onChange={handleCodeChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineHeight: 22,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              padding: { top: 16 },
            }}
          />
        ) : (
          <div className="flex-1 h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FlaskConical className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1.5">
              No test files yet
            </h3>
            <p className="text-xs text-slate-400 font-medium max-w-[280px] leading-relaxed mb-5">
              Write a prompt above to auto-generate a test, or click the{" "}
              <span className="text-slate-600 font-bold">+</span> button to
              create a blank test file.
            </p>
            <button
              onClick={handleAddBlankTest}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all border border-slate-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Blank Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
