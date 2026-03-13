export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    // DEBUG: See exactly what Vercel is loading
    // @ts-ignore
    console.log("ALL VERCEL ENV KEYS:", Object.keys(process.env));

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
        const model = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}`;

        // Pass the request transparently to Google's streaming API
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errData = await response.json();
            return new Response(JSON.stringify({
                error: errData?.error?.message || `HTTP ${response.status} Error from Gemini API`
            }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Pass the streaming response directly back to the client
        return new Response(response.body, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json',
                'Transfer-Encoding': 'chunked'
            }
        });
    } catch (error: any) {
        console.error("Gemini Edge API Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Failed to communicate with LLM provider." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
