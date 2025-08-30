import { defineConfig, splitVendorChunkPlugin } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), splitVendorChunkPlugin()],
  build:{
    emptyOutDir: true,
    manifest: true,
    minify: true,
    polyfillModulePreload: false,
    rollupOptions: {
      output: {
        // Uncomment the following lines to customize the output file names [default is assets/[name]-[hash][extname]]
        // assetFileNames: 'static/[name].[hash][extname]',
        // chunkFileNames: 'static/[name].[hash].js',
        // entryFileNames: 'static/[name].[hash].js',
        // This is used to split the code into chunks
        manualChunks(id:any) {
          if (id.includes('node_modules')) {
            return 'vendor'; // Split vendor libraries
          }
          if (id.includes('src/components/')) {
            return 'components'; // Split components into their own chunk
          }
          if (id.includes('src/hooks/')) {
            return 'hooks'; // Split hooks into their own chunk
          }
          if (id.includes('src/views/')) {
            return 'views'; // Split views into their own chunk
          }
          if (id.includes('src/data/')) {
            return 'data'; // Split data into their own chunk
          }
          if (id.includes('src/favicon.svg')) {
            return 'favicon'; // Split vendor libraries
          }
        },
      },
    },
    sourcemap: false,
  },
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
  server: {
    proxy: {
      "/api": "http://esp-reactle.local",
    },
  },
});
