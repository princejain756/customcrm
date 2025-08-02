import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Define environment variables for the client
    'process.env.POSTGRES_HOST': JSON.stringify(process.env.POSTGRES_HOST),
    'process.env.POSTGRES_PORT': JSON.stringify(process.env.POSTGRES_PORT),
    'process.env.POSTGRES_DB': JSON.stringify(process.env.POSTGRES_DB),
    'process.env.POSTGRES_USER': JSON.stringify(process.env.POSTGRES_USER),
    'process.env.POSTGRES_PASSWORD': JSON.stringify(process.env.POSTGRES_PASSWORD),
    'process.env.JWT_SECRET': JSON.stringify(process.env.JWT_SECRET),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
