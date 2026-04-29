import type { LLMProvider } from "./types";
import { OpenAIProvider } from "./openaiProvider";

export type LLMProviderType = "openai";

// Single switch point. To add another provider, implement LLMProvider and extend this switch.
export const DEFAULT_PROVIDER: LLMProviderType = "openai";

export class LLMFactory {
    static getProvider(type: LLMProviderType = DEFAULT_PROVIDER): LLMProvider {
        switch (type) {
            case "openai":
                return new OpenAIProvider();
            default:
                throw new Error(`Unsupported LLM Provider: ${type}`);
        }
    }
}
