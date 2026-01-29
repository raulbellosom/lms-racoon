import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwind(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      devOptions: { enabled: false, type: "module" },
      includeAssets: [
        "favicon.svg",
        "web/icon-192.png",
        "web/icon-192-maskable.png",
        "web/icon-512.png",
        "web/icon-512-maskable.png",
        "web/favicon.ico",
        "web/apple-touch-icon.png",
      ],
      manifest: {
        name: "Racoon LMS",
        short_name: "Racoon LMS",
        description: "Plataforma moderna de cursos — mobile-first.",
        theme_color: "#e11d48",
        background_color: "#e11d48",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/web/favicon.ico",
            sizes: "16x16 32x32 48x48",
            type: "image/x-icon",
            purpose: "any",
          },
          {
            src: "/web/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/web/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/web/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/web/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        categories: ["education", "productivity"],
        shortcuts: [
          {
            name: "Mis cursos",
            short_name: "Cursos",
            description: "Ver tus cursos inscritos",
            url: "/app/my-courses",
            icons: [{ src: "/web/icon-192.png", sizes: "192x192" }],
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    watch: {
      ignored: ["**/video-api/**"],
    },
  },
});
