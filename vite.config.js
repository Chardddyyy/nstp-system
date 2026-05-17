import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/nstp-system/',
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'html-transform',
      transformIndexHtml(html, ctx) {
        // Replace placeholder paths with actual base paths during build
        return html.replace(/\/nstp-system\//g, ctx.server ? '/nstp-system/' : '/nstp-system/')
      }
    }
  ],
})
