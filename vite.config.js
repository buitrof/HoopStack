import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const path = require('path')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/HoopStack/',
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
