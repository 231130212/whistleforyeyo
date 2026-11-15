// Menjalankan server biasa (laptop / VPS). Di Vercel, file ini tidak dipakai.
import { app, dbReady } from './app.js';
import { config } from './config.js';
import { dbLocation } from './db.js';
import { telegramEnabled } from './services/telegram.js';

try {
  await dbReady;
} catch (error) {
  console.error('❌ Gagal terhubung ke database:', error.message);
  process.exit(1);
}

app.listen(config.port, (error) => {
  if (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${config.port} sudah dipakai. Mungkin server ini sudah jalan di terminal lain?`,
      );
    } else {
      console.error('❌ Server gagal dijalankan:', error);
    }
    process.exit(1);
  }
  console.log(`🤫 whistleforyeyo server jalan di http://localhost:${config.port}`);
  console.log(`🗄️  Database: ${dbLocation}`);
  console.log(
    telegramEnabled
      ? '📨 Notifikasi Telegram: aktif'
      : '📭 Notifikasi Telegram: belum diatur (jalankan `npm run setup:telegram`)',
  );
});
