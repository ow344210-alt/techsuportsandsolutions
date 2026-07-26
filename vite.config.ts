import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Splits heavy dependencies into separate chunks so the initial page load
// only downloads what's needed for the public site — recharts (only used in
// the admin dashboard) no longer bloats the customer-facing bundle.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2020",
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