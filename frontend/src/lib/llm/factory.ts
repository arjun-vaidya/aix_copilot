import type { LLMProvider } from "./types";
import { GeminiProvider } from "./geminiProvider";

export type LLMProviderType = "gemini" | "chatgpt";

export class LLMFactory {
    static getProvider(type: LLMProviderType): LLMProvider {
        switch (type) {
            case "gemini":
                return new GeminiProvider();
            case "chatgpt":
                throw new Error("ChatGPT Provider not implemented yet. modular infrastructure is ready.");
            default:
                throw new Error("Unsupported LLM Provider");
        }
    }
}
