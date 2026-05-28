import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Use root path for dev, /nstp-system/ for production
  base: process.env.NODE_ENV === 'production' ? '/nstp-system/' : '/',
  plugins: [
    react(), 
    tailwindcss()
  ],
})
