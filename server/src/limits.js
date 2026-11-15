import rateLimit from 'express-rate-limit';
import { DbRateStore } from './rate-store.js';

const limiter = (name, windowMs, limit, error, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error },
    store: new DbRateStore(name),
    ...extra,
  });

export const sendLimiter = limiter(
  'send',
  10 * 60 * 1000,
  5,
  'Pelan-pelan, kamu sudah banyak berbisik. Coba lagi beberapa menit lagi ya.',
);

// Rem darurat: batas total bisikan dari SEMUA pengirim, supaya database tidak
// bisa dibanjiri oleh penyerang yang memakai banyak IP sekaligus.
export const globalSendLimiter = limiter(
  'global',
  60 * 60 * 1000,
  150,
  'Kotak bisikan sedang penuh. Coba lagi nanti ya.',
  { keyGenerator: () => 'all' },
);

export const searchLimiter = limiter(
  'search',
  60 * 1000,
  30,
  'Terlalu banyak pencarian. Tunggu sebentar ya.',
);

export const loginLimiter = limiter(
  'login',
  15 * 60 * 1000,
  10,
  'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.',
  { skipSuccessfulRequests: true },
);
