import type { LLMProvider } from "./types";
import type { ChatMessage } from "../aiService";

export class GeminiProvider implements LLMProvider {
    async streamChat(
        systemPrompt: string,
        chatHistory: ChatMessage[],
        onChunkReceived: (chunk: string) => void
    ): Promise<void> {
        try {
            const url = `/api/gemini-chat`;

            // Map standard history roles to Gemini format ("user" | "model")
            const contents = chatHistory.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const body = {
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents
            };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                // Parse the raw JSON error into a clean, human-readable message
                let friendlyMsg = `API returned status ${response.status}.`;
                try {
                    const errJson = JSON.parse(errText);
                    const apiMsg = errJson?.error?.message || errJson?.[0]?.error?.message;
                    if (apiMsg) {
                        // Extract just the first sentence before technical details
                        friendlyMsg = apiMsg.split('\n')[0];
                    }
                    if (response.status === 429) {
                        friendlyMsg = "Rate limit exceeded. Please wait a moment before sending another message.";
                    } else if (response.status === 403) {
                        friendlyMsg = "Invalid API key. Please check your VITE_GEMINI_API_KEY in frontend/.env.local";
                    } else if (response.status === 400) {
                        friendlyMsg = "Bad request. The prompt may be too long or contain invalid content.";
                    }
                } catch (_) { /* keep the generic message */ }
                throw new Error(friendlyMsg);
            }

            if (!response.body) throw new Error("No response body.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Gemini streaming returns SSE-like JSON chunks wrapped in arrays
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunkText = decoder.decode(value, { stream: true });

                // Extremely simple parser for Gemini stream frames
                // Real production logic might need to split by line boundaries for robustness
                try {
                    // Properly match JSON string values taking escape characters into account
                    const matches = chunkText.matchAll(/"text":\s*"((?:[^"\\]|\\.)*)"/g);
                    for (const match of Array.from(matches)) {
                        // Use native JSON.parse to perfectly unescape the matched JSON string segment
                        const rawContent = JSON.parse('"' + match[1] + '"');
                        onChunkReceived(rawContent);
                    }
                } catch (e) {
                    console.error("Error parsing Gemini chunk:", e);
                }
            }
        } catch (error: any) {
            console.error("Gemini stream failed", error);
            // Prefix with @@ERROR@@ so the UI can detect and style it as an error card
            onChunkReceived(`@@ERROR@@${error.message}`);
        }
    }
}
