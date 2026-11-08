import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vercel serves from the domain root; GitHub Pages serves from /AGRI-GRID/.
const base = process.env.VERCEL ? '/' : (process.env.BASE_PATH || '/AGRI-GRID/')

export default defineConfig({
  base,
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 },
})
