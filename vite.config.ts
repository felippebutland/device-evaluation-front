import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    open: true
  }
  ,
  preview: {
    // allow the preview server to accept requests for this host (needed when previewing behind a proxy or specific hostname)
    allowedHosts: [
      'device-evaluation.domusduo.space'
    ]
  }
})
