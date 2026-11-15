// Pintu masuk fungsi serverless Vercel: semua request /api/* diarahkan ke sini
// (lihat vercel.json), lalu ditangani aplikasi Express yang sama dengan di laptop.
export { app as default } from '../server/src/app.js';
