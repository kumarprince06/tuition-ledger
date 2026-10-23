/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // API_PROXY_TARGET comes from .env.local (see .env.example).
  const target = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET ?? 'http://localhost:8080'
  return {
    plugins: [react()],
    server: {
      proxy: { '/api': target, '/actuator': target },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
