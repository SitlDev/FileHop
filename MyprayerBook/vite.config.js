import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  plugins: [
    react({
      babel: {
        // Explicitly set targets so Babel never walks up looking for browserslist config
        targets: 'last 2 Chrome versions, last 2 Safari versions, last 2 Firefox versions, iOS >= 15',
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
    // Proxy API calls to your backend during local dev.
    // Set VITE_API_BASE_URL in .env.local for production builds.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Capacitor expects the web build in www/ by default,
    // but we'll keep dist/ and configure Capacitor to match.
    outDir: 'dist',
    emptyOutDir: true,
  },
})
