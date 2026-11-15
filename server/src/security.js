/**
 * Tolak permintaan yang mengubah data (POST/PATCH/DELETE) kalau datang dari
 * website lain. Ini lapisan kedua melawan CSRF, di atas cookie SameSite=Strict.
 */
export function sameOriginOnly(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

  const origin = req.get('origin');
  // Browser selalu mengirim Origin untuk permintaan lintas situs.
  // Tanpa Origin = klien non-browser, yang memang tidak membawa cookie korban.
  if (!origin) return next();

  try {
    if (new URL(origin).host === req.get('host')) return next();
  } catch {
    // Origin tidak valid -> tolak
  }
  res.status(403).json({ error: 'Permintaan ditolak.' });
}

/** Jangan biarkan browser/proxy menyimpan respons yang berisi data admin. */
export function noStore(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}
