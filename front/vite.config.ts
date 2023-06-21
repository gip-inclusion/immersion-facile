import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "public",
  plugins: [
    react(),
    // Put the Sentry vite plugin after all other plugins
    process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            url: "https://sentry.gip-inclusion.cloud-ed.fr/",
            org: "sentry",
            project: "immersion-facilitee-front",
            // Auth tokens can be obtained from https://sentry.gip-inclusion.cloud-ed.fr/settings/account/api/auth-tokens/
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
