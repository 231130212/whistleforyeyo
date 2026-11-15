import path from 'node:path';

const { ADMIN_PASSWORD_HASH } = process.env;

if (!ADMIN_PASSWORD_HASH) {
  console.error(
    '\n❌ ADMIN_PASSWORD_HASH belum diset.\n' +
      '   Jalankan `npm run setup` dari folder root proyek untuk membuat password admin.\n',
  );
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  // Isi '1' kalau di-hosting di belakang 1 proxy (Render, Railway, Nginx, dll).
  // Wajib benar: dipakai untuk membaca IP asli pengirim (rate limit) dan
  // mendeteksi HTTPS (cookie `secure`).
  trustProxy: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : false,
  adminPasswordHash: ADMIN_PASSWORD_HASH,
  dbPath: path.resolve(import.meta.dirname, '..', process.env.DB_PATH || 'data/whistle.db'),
};

export const LIMITS = {
  body: 1000,
  name: 40,
  reply: 1000,
};
