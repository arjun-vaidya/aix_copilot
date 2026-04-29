import type { LLMProvider } from "./types";
import type { ChatMessage } from "../aiService";

export class OpenAIProvider implements LLMProvider {
    async streamChat(
        systemPrompt: string,
        chatHistory: ChatMessage[],
        onChunkReceived: (chunk: string) => void
    ): Promise<void> {
        try {
            const messages = chatHistory.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content,
            }));

            const response = await fetch('/api/openai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, messages }),
            });

            if (!response.ok) {
                const friendly = await extractFriendlyError(response);
                throw new Error(friendly);
            }

            if (!response.body) throw new Error('No response body from /api/openai-chat.');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // SSE frames are separated by \n\n
                let sepIndex: number;
                while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
                    const frame = buffer.slice(0, sepIndex);
                    buffer = buffer.slice(sepIndex + 2);
                    handleFrame(frame, onChunkReceived);
                }
            }

            // Flush any trailing frame
            if (buffer.trim()) handleFrame(buffer, onChunkReceived);
        } catch (error: any) {
            console.error('OpenAI stream failed', error);
            onChunkReceived(`@@ERROR@@${error.message || 'OpenAI stream failed.'}`);
        }
    }
}

function handleFrame(frame: string, onChunk: (chunk: string) => void) {
    for (const rawLine of frame.split('\n')) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
            const parsed = JSON.parse(data);
            const text = parsed?.choices?.[0]?.delta?.content;
            if (text) onChunk(text);
        } catch {
            // skip malformed chunk
        }
    }
}

async function extractFriendlyError(response: Response): Promise<string> {
    const text = await response.text();
    try {
        const j = JSON.parse(text);
        if (j?.error && typeof j.error === 'string') return j.error;
        if (j?.error?.message) return j.error.message;
    } catch { /* fall through */ }
    return `OpenAI request failed (HTTP ${response.status}).`;
}
