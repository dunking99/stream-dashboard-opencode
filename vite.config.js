import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// API_PORT lets a second copy of the dashboard talk to a second backend
const api = `http://localhost:${process.env.API_PORT || 3005}`

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: api,
        changeOrigin: true,
      },
      '/proxy': {
        target: api,
        changeOrigin: true,
      }
    }
  }
})
