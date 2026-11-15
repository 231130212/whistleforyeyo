// Notifikasi bisikan baru ke Telegram pribadi pemilik.
// Aktif hanya kalau TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID ada di server/.env
// (jalankan `npm run setup:telegram` untuk mengisinya).

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ADMIN_URL = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL.replace(/\/$/, '')}/admin` : null;

export const telegramEnabled = Boolean(TOKEN && CHAT_ID);

const MAX_PREVIEW = 600;

function formatWhisper({ name, body, song }) {
  const text = body.length > MAX_PREVIEW ? `${body.slice(0, MAX_PREVIEW)}…` : body;
  const lines = [
    '🤫 Ada bisikan baru!',
    '',
    `Dari: ${name || 'Anonim'}`,
    '',
    text,
  ];
  if (song) lines.push('', `🎵 ${song.title} — ${song.artist}`);
  if (ADMIN_URL) lines.push('', `Balas di: ${ADMIN_URL}`);
  return lines.join('\n');
}

export async function sendTelegram(text) {
  // Dikirim sebagai teks biasa (tanpa parse_mode), jadi isi bisikan
  // tidak bisa menyisipkan format/link aneh ke pesan Telegram.
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Telegram API ${res.status}`);
}

/** Kirim notifikasi tanpa menunggu & tanpa pernah menggagalkan pengiriman bisikan. */
export function notifyNewWhisper(whisper) {
  if (!telegramEnabled) return;
  sendTelegram(formatWhisper(whisper)).catch((err) => {
    console.warn(`[telegram] notifikasi gagal: ${err.message}`);
  });
}
