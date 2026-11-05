import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

// The bare address (/) forwards to the page, so a link without "/setup.html" does not look broken. Everything else stays "not found".
function forwardRoot(): Plugin {
  return {
    name: 'forward-root',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/setup.html"><title>Pearl Island Catering Setup</title><script>location.replace("/setup.html")</script>',
      })
    },
  }
}

// Builds ONLY the standalone setup page (setup.html) into dist-setup. A Vercel project that uses this build
// has no product, sign-in or staff pages in it at all, so those addresses return "not found".
// The submit function (api/submit.ts) is deployed alongside it.
export default defineConfig({
  plugins: [react(), forwardRoot()],
  publicDir: false,
  build: {
    outDir: 'dist-setup',
    emptyOutDir: true,
    rollupOptions: { input: { setup: fileURLToPath(new URL('./setup.html', import.meta.url)) } },
  },
})
