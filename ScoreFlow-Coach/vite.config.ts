import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'ScoreFlow Coach',
        short_name: 'SF Coach',
        description: 'Coach workspace for ScoreFlow teams, rosters, matches, rotations, and reports.',
        theme_color: '#101827',
        background_color: '#eef2f7',
        display: 'standalone',
        start_url: './',
        scope: './'
      },
      workbox: {
        navigateFallback: 'index.html'
      }
    })
  ]
});
