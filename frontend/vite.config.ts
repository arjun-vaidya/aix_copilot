import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

/**
 * Vite plugin that mirrors the Vercel Edge Function for /api/openai-chat
 * so that `npm run dev` works without needing `vercel dev`.
 */
function openaiApiProxy(): Plugin {
  let apiKey = ''

  return {
    name: 'openai-api-proxy',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, '')
      apiKey = env.OPENAI_API_KEY || ''
    },
    configureServer(server) {
      server.middlewares.use('/api/openai-chat', async (req, res) => {
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
          res.writeHead(503, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not set in frontend/.env.local' }))
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk)
        const bodyStr = Buffer.concat(chunks).toString()

        let body: any
        try {
          body = JSON.parse(bodyStr)
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
          return
        }

        const systemPrompt: string = body.systemPrompt || ''
        const incomingMessages: any[] = Array.isArray(body.messages) ? body.messages : []
        if (incomingMessages.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: '`messages` must be a non-empty array' }))
          return
        }

        const model: string =
          typeof body.model === 'string' && body.model.trim() ? body.model : 'gpt-4o-mini'
        const temperature: number =
          typeof body.temperature === 'number' ? body.temperature : 0.7

        const messages = systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...incomingMessages]
          : incomingMessages

        const openaiBody: Record<string, unknown> = {
          model,
          messages,
          stream: true,
          temperature,
        }
        if (body.response_format && typeof body.response_format === 'object') {
          openaiBody.response_format = body.response_format
        }

        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(openaiBody),
          })

          if (!response.ok || !response.body) {
            const errData: any = await response.json().catch(() => ({}))
            const errorMessage =
              errData?.error?.message || `HTTP ${response.status} from OpenAI`
            res.writeHead(response.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: errorMessage }))
            return
          }

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          })

          const reader = response.body.getReader()
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
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: `Network error reaching OpenAI: ${error?.message || 'unknown'}` }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    openaiApiProxy(),
  ],
})
