import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the site from /<repo>/
const base = '/driver-test-am/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Վարորդական տեսական թեստեր',
        short_name: 'Վարորդական թեստ',
        description: 'ABC կարգեր · տեսական հարցաշար',
        lang: 'hy',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        theme_color: '#1d4f91',
        background_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // question images are cached on first view (or all at once from Settings)
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,json}'],
        globIgnores: ['img/**'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/img/'),
            handler: 'CacheFirst',
            options: { cacheName: 'question-images' },
          },
        ],
      },
    }),
  ],
})
