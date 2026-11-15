import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_');
  const owner = escapeHtml(env.VITE_OWNER_NAME || 'Yeyo');
  // WhatsApp/Facebook butuh URL gambar yang lengkap (https://domain/og-image.png).
  // Isi VITE_PUBLIC_URL di client/.env saat sudah di-hosting.
  const publicUrl = escapeHtml((env.VITE_PUBLIC_URL || '').replace(/\/$/, ''));

  return {
    plugins: [
      react(),
      {
        name: 'whistle-meta-tags',
        transformIndexHtml: (html) =>
          html.replaceAll('%OWNER%', owner).replaceAll('%PUBLIC_URL%', publicUrl),
      },
    ],
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
  };
});
