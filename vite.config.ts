import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const norm = id.replace(/\\/g, '/')
          if (norm.includes('node_modules/framer-motion')) return 'vendor-motion'
          if (norm.includes('node_modules/html2canvas')) return 'vendor-html2canvas'
          if (norm.includes('node_modules/recharts')) return 'vendor-recharts'
          if (norm.includes('node_modules/qrcode.react')) return 'vendor-qrcode'
          if (norm.includes('node_modules/lucide-react')) return 'vendor-lucide'
          if (norm.includes('node_modules/react-router')) return 'vendor-router'
          if (norm.includes('node_modules/react-dom') || norm.includes('node_modules/react/')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
