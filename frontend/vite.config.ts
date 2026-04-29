import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

/**
 * Vite plugin that replicates the Vercel Edge Function for /api/gemini-chat
 * so that `npm run dev` works without needing `vercel dev`.
 */
function geminiApiProxy(): Plugin {
  let apiKey = ''

  return {
    name: 'gemini-api-proxy',
    configResolved(config) {
      // Load env from the frontend directory
      const env = loadEnv(config.mode, config.root, '')
      apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''
    },
    configureServer(server) {
      server.middlewares.use('/api/gemini-chat', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          })
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        if (!apiKey) {
          res.writeHead(403, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not set in .env.local' }))
          return
        }

        // Read request body
        const chunks: Buffer[] = []
        for await (const chunk of req) {
          chunks.push(chunk)
        }
        const bodyStr = Buffer.concat(chunks).toString()

        try {
          const body = JSON.parse(bodyStr)

          const model = 'gemini-2.5-flash'
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`

          const geminiBody = {
            system_instruction: body.systemInstruction || body.system_instruction,
            contents: body.contents,
          }

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
          })

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            const errorMessage =
              (errData as any)?.error?.message ||
              (errData as any)?.[0]?.error?.message ||
              `HTTP ${response.status} Error from Gemini API`

            res.writeHead(response.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: errorMessage }))
            return
          }

          // Stream the response back
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          })

          const reader = response.body?.getReader()
          if (!reader) {
            res.end()
            return
          }

          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              res.write(value)
            }
            res.end()
          }
          pump().catch(() => res.end())
        } catch (error: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: error.message || 'Failed to communicate with LLM provider.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    geminiApiProxy(),
  ],
})
