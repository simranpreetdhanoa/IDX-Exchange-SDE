import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,         // Week 5: the assignment asks for port 3000 (Vite's default is 5173)
    strictPort: true,   // if 3000 is taken, stop with an error instead of quietly using another port
    proxy: {
      '/api': 'http://localhost:5000',  // forward /api/* requests to the Express backend
    },
  },
})
