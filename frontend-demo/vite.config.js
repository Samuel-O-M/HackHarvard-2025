import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/HackHarvard-2025/',
  server: {
    port: 3000
  }
})

