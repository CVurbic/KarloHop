import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // instalabilna PWA za /radnik (ikona na pocetnom ekranu, standalone) -> ne dira ostatak sajta
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Hop Hop Napuhanci – Radnik",
        short_name: "HH Radnik",
        description: "Ruta dana i dostave za Hop Hop Napuhanci radnike",
        start_url: "/radnik",
        scope: "/",
        display: "standalone",
        background_color: "#0AA8E0",
        theme_color: "#0AA8E0",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "radix-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
            "@radix-ui/react-popover",
            "@radix-ui/react-separator",
          ],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          "date-utils": ["date-fns", "react-day-picker"],
          "data-fetching": ["@tanstack/react-query", "@supabase/supabase-js"],
          utils: ["clsx", "tailwind-merge", "class-variance-authority", "lucide-react"],
        },
      },
    },
  },
}));
