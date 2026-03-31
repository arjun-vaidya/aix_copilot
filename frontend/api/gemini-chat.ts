export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }



    // Backend securely reads the token from Vercel's environment variables (no VITE_ prefix needed)
    // @ts-ignore (process.env is provided securely by the Vercel Node runtime)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return new Response(
            JSON.stringify({ error: "API Key is completely undefined in this Edge environment." }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const body = await req.json();


        const model = "gemini-3.1-flash-lite-preview";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

        // Gemini REST API expects 'system_instruction' (snake_case)
        const geminiBody = {
            system_instruction: body.systemInstruction || body.system_instruction,
            contents: body.contents
        };

        // Pass the request transparently to Google's streaming API
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiBody)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));

            const errorMessage = errData?.error?.message ||
                (errData?.[0]?.error?.message) ||
                `HTTP ${response.status} Error from Gemini API`;

            return new Response(JSON.stringify({ error: errorMessage }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Pass the streaming response directly back to the client
        return new Response(response.body, {
            status: response.status,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || "Failed to communicate with LLM provider." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
