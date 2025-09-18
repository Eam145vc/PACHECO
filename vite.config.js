import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['c67727416176.ngrok-free.app'],
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/communal-objectives': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3002',
        changeOrigin: true
      },
      '/gift-triggers': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3002',
        changeOrigin: true
      },
      '/tiktok-live-status': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3002',
        changeOrigin: true
      }
    }
  },
  define: {
    'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:3002')
  }
})
