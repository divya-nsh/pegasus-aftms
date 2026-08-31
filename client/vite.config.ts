import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import path from "node:path";
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
  ],
  server: {
    host: '0.0.0.0', // allow external access
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:6001',
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, "node_modules"),
      ],
    },
  },
  build: {
    outDir: '../server/client',
    emptyOutDir: true,
  },
})

export default config
