/**
 * Drains an OpenAI-style SSE chat-completions stream from /api/openai-chat
 * and returns the concatenated assistant text.
 *
 * Used by callers that just need the full response (e.g. JSON-mode generations
 * for quizzes, tests, and the code-review gate) — i.e. anywhere we don't
 * need to stream tokens into the UI as they arrive.
 */
export async function collectOpenAIStream(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response stream.");

    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
        const { value, done } = await reader.read();
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
                } catch { /* skip malformed chunk */ }
            }
        }
    }
    return fullText;
}
