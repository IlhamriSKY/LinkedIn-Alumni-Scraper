import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from parent directory
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '')
  // Get Flask port from .env FLASK_PORT and expose it as VITE_FLASK_PORT for frontend
  const FLASK_PORT = env.FLASK_PORT || '5000'
  
  return {
    plugins: [vue(), tailwindcss()],
    define: {
      'import.meta.env.VITE_FLASK_PORT': JSON.stringify(FLASK_PORT)
    },
    server: {
      port: 3000,
      host: 'localhost',
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${FLASK_PORT}`,
          changeOrigin: true,
          secure: false,
          ws: false,
          timeout: 10000,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        },
        '/health': {
          target: `http://127.0.0.1:${FLASK_PORT}`,
          changeOrigin: true,
          secure: false,
          timeout: 10000
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'src/main.js')
        }
      }
    }
  }
})
