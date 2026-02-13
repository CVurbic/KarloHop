import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
