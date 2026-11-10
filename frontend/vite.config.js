import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy yang sama dipakai `vite dev` dan `vite preview`, supaya build
// produksi yang dites lokal tetap bisa memanggil backend di port 5000.
const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
