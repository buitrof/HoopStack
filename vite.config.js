import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/HoopStack/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/espn-api': {
        target: 'https://site.web.api.espn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/espn-api/, '')
      }
    }
  }
})
