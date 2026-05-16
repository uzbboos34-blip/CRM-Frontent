import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@mui/icons-material'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://crm-backend-l7jq.onrender.com',
        changeOrigin: true,
      },
      '/file': {
        target: 'https://crm-backend-l7jq.onrender.com',
        changeOrigin: true,
      }
    }
  }
})

