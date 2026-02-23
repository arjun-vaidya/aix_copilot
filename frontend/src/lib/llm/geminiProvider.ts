import type { LLMProvider } from "./types";
import type { ChatMessage } from "../aiService";

export class GeminiProvider implements LLMProvider {
    private apiKey: string;
    // Standard recommended Gemini model for fast logic tracing
    private model = "gemini-2.5-flash";

    constructor() {
        // Read key from Vite env variables
        this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    }

    async streamChat(
        systemPrompt: string,
        chatHistory: ChatMessage[],
        onChunkReceived: (chunk: string) => void
    ): Promise<void> {
        try {
            if (!this.apiKey || this.apiKey === "your_dummy_gemini_key_here") {
                throw new Error("Missing or Dummy VITE_GEMINI_API_KEY. Please configure your key in frontend/.env.local");
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;

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
                const err = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${err}`);
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
            onChunkReceived(`\n[API Error: ${error.message}]`);
        }
    }
}
