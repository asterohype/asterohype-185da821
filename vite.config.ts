import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api/shopify-admin': {
          target: 'https://e7kzti-96.myshopify.com/admin/api/2025-01',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/shopify-admin/, ''),
          headers: {
            'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN || ''
          }
        }
      }
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
