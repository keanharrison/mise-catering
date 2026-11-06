import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vitest/config'
import { loadEnv } from 'vite'
import { handleSubmit } from './src/setup/submit.js'

/** Serves POST /api/submit during `npm run dev` with the same handler Vercel runs, so the setup page can be tested without the Vercel CLI. */
function setupApi(): Plugin {
  return {
    name: 'setup-api',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '')
      server.middlewares.use('/api/submit', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let raw = ''
        req.on('data', (chunk) => { raw += chunk })
        req.on('end', async () => {
          let body: unknown = null
          try { body = JSON.parse(raw) } catch { /* handled by validation */ }
          const result = await handleSubmit(body, env)
          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result.body))
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), setupApi()],
  build: {
    rollupOptions: {
      // The login page is a second HTML entry; the app stays at index.html.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        'pearl-login': fileURLToPath(new URL('./pearl-login.html', import.meta.url)),
        setup: fileURLToPath(new URL('./setup.html', import.meta.url)),
        landing: fileURLToPath(new URL('./landing.html', import.meta.url)),
      },
    },
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 30000,
  },
})
