import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Two HTML entries. The homepage is the app shell; /privacy is its own document
// so that its <link rel="canonical"> lives in the raw HTML instead of being
// injected by JavaScript (Search Console was filing /privacy as an "alternate
// page" because it inherited the homepage's canonical through shared HTML).
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  build: {
    // The SSR build (src/entry-server.jsx, used by scripts/prerender.mjs) has its
    // own entry and must not be handed the HTML inputs.
    rollupOptions: isSsrBuild
      ? {}
      : {
          input: {
            main:    fileURLToPath(new URL('./index.html', import.meta.url)),
            privacy: fileURLToPath(new URL('./privacy/index.html', import.meta.url)),
          },
        },
  },
}))
