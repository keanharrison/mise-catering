import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Builds ONLY the standalone setup page (setup.html) into dist-setup. A Vercel project that uses this build
// has no product, sign-in or staff pages in it at all, so those addresses return "not found".
// The submit function (api/submit.ts) is deployed alongside it.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist-setup',
    emptyOutDir: true,
    rollupOptions: { input: { setup: fileURLToPath(new URL('./setup.html', import.meta.url)) } },
  },
})
