import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";
import { ManifestOptions } from "vite-plugin-pwa";

const manifest: Partial<ManifestOptions> = {
  name: "Immersion Facilitée",
  short_name: "IF",
  description: "Faciliter la réalisation des immersions professionnelles",
  theme_color: "#0091FF",
  lang: "fr",
  icons: [
    {
      src: "/dsfr/favicon/android-chrome-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/dsfr/favicon/android-chrome-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  screenshots: [
    {
      src: "/assets/img/screenshots/narrow.jpg",
      type: "image/jpg",
      sizes: "750x1334",
      form_factor: "narrow",
    },
    {
      src: "/assets/img/screenshots/wide.jpg",
      type: "image/jpg",
      sizes: "1280x800",
      form_factor: "wide",
    },
  ],
};

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "public",
  plugins: [
    react(),
    VitePWA({
      devOptions: {
        enabled: true,
      },
      workbox: {
        cleanupOutdatedCaches: true,
      },
      includeAssets: [
        "/dsfr/favicon/favicon.ico",
        "/dsfr/favicon/apple-touch-icon.png",
      ],
      manifest,
    }),

    // Put the Sentry vite plugin after all other plugins
    process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            url: "https://sentry.gip-inclusion.org/",
            org: "gip-inclusion",
            project: "immersion-facilitee-front",
            // Auth tokens can be obtained from https://sentry.gip-inclusion.org/settings/account/api/auth-tokens/
            // and need `project:releases` and `org:read` scopes
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: process.env.VITE_RELEASE_TAG },
          }),
        ]
      : [],
  ],
  resolve: {
    alias: {
      src: resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
    sourcemap: true,
  },
  optimizeDeps: {
    include: ["react/jsx-runtime"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:1234/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    port: 3000,
  },
  preview: {
    port: 5000,
  },
});
