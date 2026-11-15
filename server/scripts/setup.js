// Membuat / mengganti password admin dan menulis server/.env
// Pemakaian:  npm run setup
// Mengganti password otomatis mengeluarkan semua perangkat yang sedang login.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { Writable } from 'node:stream';
import { parseEnv } from 'node:util';
import bcrypt from 'bcryptjs';

const MIN_LENGTH = 12;
const envPath = path.resolve(import.meta.dirname, '../.env');

/** Tanya password tanpa menampilkan ketikan di layar. */
async function askHidden(question) {
  let muted = false;
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk);
      callback();
    },
  });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  process.stdout.write(question);
  muted = true;
  const answer = await rl.question('');
  muted = false;
  process.stdout.write('\n');
  rl.close();
  return answer;
}

function checkStrength(password) {
  if (password.length < MIN_LENGTH) return `Password minimal ${MIN_LENGTH} karakter.`;
  if (new Set(password).size < 5) return 'Password terlalu mudah ditebak (terlalu banyak karakter berulang).';
  return null;
}

// Argumen langsung hanya untuk pengujian otomatis; untuk pemakaian biasa,
// jangan ketik password sebagai argumen karena tersimpan di riwayat terminal.
let password = process.argv[2];
if (!password) {
  console.log(`🔑 Buat password admin (min. ${MIN_LENGTH} karakter, ketikan tidak akan terlihat).`);
  console.log('   Tips: gabungan beberapa kata acak, mis. "kopi-hujan-sepatu-27".\n');
  password = await askHidden('Password       : ');
  const confirm = await askHidden('Ulangi password: ');
  if (password !== confirm) {
    console.error('❌ Password tidak sama. Coba lagi.');
    process.exit(1);
  }
}

const problem = checkStrength(password);
if (problem) {
  console.error(`❌ ${problem}`);
  process.exit(1);
}

const current = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, 'utf8')) : {};
delete current.JWT_SECRET; // sudah tidak dipakai (diganti sesi di database)

const next = {
  PORT: '3001',
  ...current,
  ADMIN_PASSWORD_HASH: await bcrypt.hash(password, 12),
};

const content = Object.entries(next)
  .map(([key, value]) => `${key}='${value}'`)
  .join('\n');

fs.writeFileSync(envPath, content + '\n');
console.log(`✅ Password admin tersimpan di ${path.relative(process.cwd(), envPath)}`);
console.log('   Semua perangkat yang sedang login akan otomatis keluar.');
