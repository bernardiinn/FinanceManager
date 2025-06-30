import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Controle de Cartões Emprestados',
        short_name: 'Cartões',
        description: 'Gerencie cartões emprestados de forma simples e eficiente',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        lang: 'pt-BR',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        runtimeCaching: [
          {
            urlPattern: /\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      }
    })
  ],
  optimizeDeps: {
    exclude: ['sql.js', 'absurd-sql'],
    include: []
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    fs: {
      allow: ['..']
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'sql-js': ['sql.js'],
          'absurd-sql': ['absurd-sql']
        }
      }
    },
    assetsInlineLimit: 0, // Don't inline WASM files
  },
  worker: {
    format: 'es'
  }
});
