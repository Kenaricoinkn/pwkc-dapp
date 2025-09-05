import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // ini penting untuk Netlify
  build: {
    outDir: 'dist',
  },
})
