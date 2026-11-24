import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { type Request, type Response } from 'express'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PORT = Number(process.env.PORT) || 3000

async function startServer() {
  const app = express()
  const httpServer = http.createServer(app)
  app.use(express.json({ limit: '64kb' }))

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true })
  })

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite')
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distDir = path.resolve(__dirname, 'dist')
    app.use(express.static(distDir))
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Maloxie server listening on http://0.0.0.0:${PORT}`)
  })
}

void startServer()
