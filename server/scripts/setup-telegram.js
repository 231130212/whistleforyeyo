// Menghubungkan bot Telegram pribadi untuk notifikasi bisikan baru.
// Pemakaian: npm run setup:telegram

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { parseEnv } from 'node:util';

const envPath = path.resolve(import.meta.dirname, '../.env');
const api = (token, method, params = {}) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(40000),
  }).then((r) => r.json());

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(`
📨 Setup notifikasi Telegram
────────────────────────────
1. Buka Telegram, cari  @BotFather  (yang ada centang biru).
2. Kirim  /newbot , beri nama bebas (mis. "Telinga Yeyo"),
   lalu username yang berakhiran "bot" (mis. telingayeyo_bot).
3. BotFather akan memberi TOKEN seperti  123456789:AAH...xyz
`);

const token = (await rl.question('Tempel token bot di sini: ')).trim();
if (!/^\d+:[\w-]{30,}$/.test(token)) {
  console.error('❌ Format token tidak valid. Salin ulang dari BotFather ya.');
  process.exit(1);
}

const me = await api(token, 'getMe').catch(() => null);
if (!me?.ok) {
  console.error('❌ Token ditolak Telegram. Pastikan disalin lengkap.');
  process.exit(1);
}

console.log(`\n✅ Bot ditemukan: @${me.result.username}`);
console.log(`\n4. Sekarang buka  https://t.me/${me.result.username}  lalu tekan START`);
console.log('   (atau kirim pesan apa saja ke bot itu). Aku tunggu sampai 2 menit…\n');

// Abaikan pesan lama, tunggu pesan baru dari pemilik.
const old = await api(token, 'getUpdates', { timeout: 0 });
let offset = old.ok && old.result.length ? old.result.at(-1).update_id + 1 : 0;

let chat = null;
const deadline = Date.now() + 2 * 60 * 1000;
while (!chat && Date.now() < deadline) {
  const res = await api(token, 'getUpdates', { offset, timeout: 25 }).catch(() => null);
  for (const update of res?.result ?? []) {
    offset = update.update_id + 1;
    const c = update.message?.chat;
    if (c?.type === 'private') chat = c;
  }
}
// Tandai pesan sudah dibaca supaya tidak terambil lagi.
await api(token, 'getUpdates', { offset, timeout: 0 }).catch(() => {});

if (!chat) {
  console.error('❌ Tidak ada pesan masuk ke bot. Jalankan ulang dan tekan START di bot-nya.');
  process.exit(1);
}

const who = [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username;
const ok = (await rl.question(`Pesan diterima dari "${who}". Itu kamu? (y/n) `)).trim().toLowerCase();
rl.close();
if (ok !== 'y') {
  console.error('❌ Dibatalkan. Jalankan ulang, dan pastikan hanya kamu yang mengirim pesan ke bot.');
  process.exit(1);
}

const current = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, 'utf8')) : {};
const next = { ...current, TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: String(chat.id) };
fs.writeFileSync(
  envPath,
  Object.entries(next).map(([k, v]) => `${k}='${v}'`).join('\n') + '\n',
);

await api(token, 'sendMessage', {
  chat_id: chat.id,
  text: '🤫 Halo! Mulai sekarang, setiap bisikan baru di whistleforyeyo akan dikabarkan ke sini.',
});

console.log('\n✅ Tersambung! Cek Telegram-mu, harusnya ada pesan percobaan.');
console.log('   Restart server (Ctrl + C lalu npm run dev) supaya notifikasi aktif.');
