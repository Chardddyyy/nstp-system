import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production' || process.env.NODE_ENV === 'production';
  return {
    // Use root path for dev, /nstp-system/ for production
    base: isProd ? '/nstp-system/' : '/',
    server: {
      host: true,
      port: 5173
    },
    plugins: [
      react(), 
      tailwindcss()
    ],
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-xlsx': ['xlsx'],
            'vendor-qr': ['qrcode', 'html5-qrcode'],
            'vendor-media': ['heic2any']
          }
        }
      }
    },
    esbuild: {
      drop: ['console', 'debugger'],
      legalComments: 'none'
    }
  };
});
