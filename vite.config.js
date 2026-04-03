import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const path = require('path')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
