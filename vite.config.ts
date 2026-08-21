import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "src",
  publicDir: "public",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      filename: "sw.js",
      injectRegister: false,
      includeAssets: ["scoreflow-logo.png", "icon-180.png", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "ScoreFlow Live",
        short_name: "ScoreFlow",
        description: "Live volleyball scoring with real-time viewer links.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#080b12",
        theme_color: "#080b12",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,woff2}"]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    fs: {
      allow: [projectRoot]
    }
  },
  preview: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true
  }
});
