import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base '/AGRI-GRID/' = project-pages subpath. Dev server still serves at '/'.
export default defineConfig({
  base: '/AGRI-GRID/',
  plugins: [react()],
})
