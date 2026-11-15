// Aplikasi Express. Dipakai oleh:
// - server/src/index.js  -> server biasa di laptop (npm run dev / npm start)
// - api/index.js          -> fungsi serverless di Vercel
import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { initDb } from './db.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import { noStore, sameOriginOnly } from './security.js';

export const app = express();

// Tabel dibuat sekali per proses. Setiap request menunggu sampai siap.
export const dbReady = initDb();

if (config.trustProxy) app.set('trust proxy', config.trustProxy);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'data:', 'https://*.mzstatic.com'],
        'media-src': ["'self'", 'https://*.apple.com', 'https://*.mzstatic.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }),
);
app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (error) {
    next(error);
  }
});
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// API
app.use('/api', sameOriginOnly);
app.use('/api/auth', noStore, authRoutes);
app.use('/api/admin', noStore, adminRoutes);
app.use('/api', publicRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));

// Frontend hasil build (untuk `npm start`; di Vercel disajikan langsung oleh Vercel)
const clientDist = path.resolve(import.meta.dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Penanganan error terakhir
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Format data tidak valid.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Datanya kebesaran.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Server lagi bermasalah. Coba lagi nanti ya.' });
});
