import type { ChatMessage } from "../aiService";

/**
 * A generalized interface for any LLM Provider (ChatGPT, Gemini, Claude, etc.)
 */
export interface LLMProvider {
    /**
     * Streams the chat response chunk by chunk to the UI.
     * @param systemPrompt The overarching instructions and context.
     * @param chatHistory The conversation messages so far.
     * @param onChunkReceived Callback fired when a new token/string chunk arrives.
     */
    streamChat(
        systemPrompt: string,
        chatHistory: ChatMessage[],
        onChunkReceived: (chunk: string) => void
    ): Promise<void>;
}
