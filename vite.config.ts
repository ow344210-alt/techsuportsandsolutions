import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Splits heavy dependencies into separate chunks so the initial page load
// only downloads what's needed for the public site — recharts (only used in
// the admin dashboard) no longer bloats the customer-facing bundle.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  esbuild: {
    // Production-only: treat console.log/debug/info as pure side-effect-free
    // calls so esbuild drops them during minification (console.error and
    // console.warn are intentionally kept). `pure` only affects build output;
    // development is unaffected.
    pure: ["console.log", "console.debug", "console.info"],
  },
  build: {
    target: "es2020",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Use the function form so TypeScript matches the ManualChunksFunction signature
        manualChunks(id) {
          if (!id) return null;
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) {
            return 'vendor-icons';
          }
          return null;
        },
      },
    },
  },
});