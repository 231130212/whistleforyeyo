import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        // Teruskan header Host asli (localhost:5173) supaya pengecekan Origin
        // di server cocok dengan halaman yang membuka API.
        changeOrigin: false,
      },
    },
  },
});
