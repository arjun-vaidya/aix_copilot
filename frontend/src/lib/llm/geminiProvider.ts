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

                    // If the error comes directly from our Vercel Edge function
                    if (errJson.error && typeof errJson.error === 'string') {
                        friendlyMsg = errJson.error;
                    }
                    // Otherwise try to extract from Google's deep JSON schema
                    else {
                        const apiMsg = errJson?.error?.message || errJson?.[0]?.error?.message;
                        if (apiMsg) {
                            friendlyMsg = apiMsg.split('\n')[0];
                        }
                    }

                    if (response.status === 429) {
                        friendlyMsg = "Rate limit exceeded. Please wait a moment before sending another message.";
                    } else if (response.status === 403) {
                        friendlyMsg = errJson.error || "Invalid API key. Please check the GEMINI_API_KEY environment variable in Vercel.";
                    } else if (response.status === 400) {
                        friendlyMsg = "Bad request. The prompt may be too long or contain invalid content.";
                    }
                } catch (_) { /* keep the generic message */ }
                throw new Error(friendlyMsg);
            }

            if (!response.body) throw new Error("No response body.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Gemini streaming returns SSE format when &alt=sse is in the URL
            let buffer = "";
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                // keep the last line in buffer in case it's incomplete
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (!dataStr) continue;

                        try {
                            const chunkJson = JSON.parse(dataStr);
                            const text = chunkJson?.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                onChunkReceived(text);
                            }
                        } catch (e) {
                            console.error("Error parsing Gemini SSE chunk:", e);
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error("Gemini stream failed", error);
            // Prefix with @@ERROR@@ so the UI can detect and style it as an error card
            onChunkReceived(`@@ERROR@@${error.message}`);
        }
    }
}
