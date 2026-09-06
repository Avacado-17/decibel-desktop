import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
const disableHostedPreviewHmr = {
  name: 'disable-hosted-preview-hmr',
  enforce: 'post' as const,
  transformIndexHtml(html: string) {
    return html.replace(/<script[^>]+src=["']\/@vite\/client["'][^>]*><\/script>/g, '');
  },
};

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    disableHostedPreviewHmr,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        id: '/',
        name: 'Decibel Music',
        short_name: 'Decibel',
        description: 'High fidelity web and mobile music player with live search, lossless audio playback, and customizable themes.',
        theme_color: '#0c0a09',
        background_color: '#0c0a09',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
      },
      // The hosted preview does not provide a Vite HMR WebSocket endpoint.
      // Keep the service worker disabled in development so it cannot cache stale preview assets.
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    allowedHosts: true,
  },
});

