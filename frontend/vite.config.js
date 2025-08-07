import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  const DEV_PORT = parseInt(env.VITE_DEV_PORT) || 5173;
  const BACKEND_URL = env.VITE_BACKEND_URL || 'http://localhost:3001';
  
  return {
    plugins: [react()],
    server: {
      port: DEV_PORT,
      host: env.VITE_DEV_HOST || 'localhost',
      strictPort: false,
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          ws: false,
          timeout: 10000,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            // Removed logging for production
            // proxy.on('proxyReq', (proxyReq, req, _res) => {
            //   console.log('Sending Request to the Target:', req.method, req.url);
            // });
            // proxy.on('proxyRes', (proxyRes, req, _res) => {
            //   console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            // });
          }
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
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            socket: ['socket.io-client'],
            ui: ['lucide-react']
          }
        }
      }
    }
  };
});
