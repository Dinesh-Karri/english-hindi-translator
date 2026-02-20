import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/translate': 'http://localhost:8000',
      '/tts': 'http://localhost:8000',
      '/speech': 'http://localhost:8000',
      '/evaluate': 'http://localhost:8000',
      '/compare': 'http://localhost:8000',
      '/models': 'http://localhost:8000',
      '/dataset': 'http://localhost:8000',
      '/history': 'http://localhost:8000',
    }
  }
})
