export const config = {
    runtime: 'edge',
};

// Unified contract used by all callers in this app.
// Request body: { systemPrompt: string, messages: [{role, content}], model?: string, temperature?: number, response_format?: { type: "json_object" } }
// Response: SSE stream forwarded from OpenAI (data: {...}\n\n ... data: [DONE])
//
// Errors: JSON {error: string} with appropriate HTTP status.
export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return jsonError('Method not allowed', 405);
    }

    // @ts-ignore (process.env is provided by Vercel Edge runtime)
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        return jsonError(
            'OPENAI_API_KEY is not configured. Set it in the Vercel project Environment Variables.',
            503,
        );
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return jsonError('Invalid JSON body', 400);
    }

    const systemPrompt: string = body.systemPrompt || '';
    const incomingMessages: any[] = Array.isArray(body.messages) ? body.messages : [];

    if (incomingMessages.length === 0) {
        return jsonError('`messages` must be a non-empty array', 400);
    }

    // Default to a fast, broadly available model. Override per-call via body.model.
    const model: string = typeof body.model === 'string' && body.model.trim() ? body.model : 'gpt-4o-mini';
    const temperature: number = typeof body.temperature === 'number' ? body.temperature : 0.7;

    const messages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...incomingMessages]
        : incomingMessages;

    const openaiBody: Record<string, unknown> = {
        model,
        messages,
        stream: true,
        temperature,
    };

    if (body.response_format && typeof body.response_format === 'object') {
        openaiBody.response_format = body.response_format;
    }

    let upstream: Response;
    try {
        upstream = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify(openaiBody),
        });
    } catch (err: any) {
        return jsonError(`Network error reaching OpenAI: ${err?.message || 'unknown'}`, 502);
    }

    if (!upstream.ok || !upstream.body) {
        const errPayload: any = await upstream.json().catch(() => ({}));
        const upstreamMsg: string =
            errPayload?.error?.message || `HTTP ${upstream.status} from OpenAI`;

        const friendly = friendlyMessageForStatus(upstream.status, upstreamMsg);
        return jsonError(friendly, upstream.status);
    }

    return new Response(upstream.body, {
        status: 200,
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        },
    });
}

function jsonError(message: string, status: number): Response {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function friendlyMessageForStatus(status: number, fallback: string): string {
    if (status === 401) return 'Invalid OpenAI API key. Check OPENAI_API_KEY in Vercel.';
    if (status === 429) return 'Rate limit or quota exceeded on OpenAI. Please retry in a moment.';
    if (status === 400) return `Bad request to OpenAI: ${fallback}`;
    if (status >= 500) return `OpenAI is having issues (status ${status}). Please retry.`;
    return fallback;
}
