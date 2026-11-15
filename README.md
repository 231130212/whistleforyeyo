# whistleforyeyo 🤫

> *Psst… ada rahasia yang mau kamu bisikkan?*

**whistleforyeyo** adalah aplikasi pesan anonim bergaya Secreto. Pengunjung bisa membisikkan apa saja (pengakuan, pertanyaan, kritik) tanpa menyebut nama, dan **boleh menyelipkan satu lagu**. Pemilik "telinga" membaca semuanya di inbox privat, menghapus yang tidak ingin disimpan, lalu membalas dan menampilkan bisikan pilihan ke papan publik.

Nama dan konsepnya terinspirasi dari istilah *whistleblower* yang aku pelajari di kelas manajemen: seseorang membisikkan rahasia kantor ke telinga orang lain.

## Fitur

- **Bisikan anonim** dengan nama opsional (maks. 1000 karakter)
- **Selipkan lagu**: cari lagu langsung di aplikasi lewat iTunes Search API, lengkap dengan cover album dan **preview 30 detik**
- **Inbox admin** khusus pemilik: filter *semua / belum dibaca / di papan*, tandai dibaca, hapus
- **Balas & publikasikan**: bisikan pilihan tampil di papan publik bersama balasannya
- **Anti-spam**: rate limit per IP dan honeypot untuk bot
- Tampilan responsif dengan **mode gelap otomatis**

## Teknologi

| Bagian   | Stack |
|----------|-------|
| Frontend | React 19, React Router, Vite, CSS murni (design tokens + dark mode) |
| Backend  | Node.js, Express 5, SQLite bawaan Node (`node:sqlite`) |
| Keamanan | bcrypt, sesi server-side di SQLite, cookie `httpOnly` + `SameSite=Strict`, cek Origin, Helmet (CSP), express-rate-limit |
| Data lagu | iTunes Search API |

### Catatan desain

- **Data lagu tidak dipercaya dari browser.** Klien hanya mengirim `songId`, lalu server mengambil ulang detailnya dari iTunes. Jadi isi kartu lagu tidak bisa dipalsukan.
- **Single-owner auth.** Hanya ada satu akun admin. Password tidak disimpan di kode, melainkan hash bcrypt di `.env` yang dibuat lewat `npm run setup` (input tersembunyi, minimal 12 karakter).
- **Tanpa native dependency.** Database memakai SQLite bawaan Node, jadi tidak perlu compile apa pun di Windows.

## Keamanan

| Ancaman | Perlindungan |
|---------|--------------|
| Tebak password (brute force) | Hash bcrypt (cost 12) + maksimal 10 percobaan gagal per IP per 15 menit, dan setiap login gagal dicatat di log |
| Cookie login dicuri | Sesi disimpan di server (hanya hash token-nya), dicabut saat logout, ada tombol "keluar dari semua perangkat", dan semua sesi otomatis tidak berlaku saat password diganti |
| CSRF (aksi palsu dari situs lain) | Cookie `SameSite=Strict`, API hanya menerima JSON, dan header `Origin` dicek pada setiap permintaan yang mengubah data |
| XSS (menyisipkan skrip) | React meng-escape semua teks, Content-Security-Policy ketat, dan URL lagu hanya `https://` dari iTunes |
| SQL injection | Semua query memakai prepared statement |
| Spam / banjir pesan | Rate limit per IP (5 / 10 menit), batas global (150 / jam), honeypot, dan ukuran body dibatasi 10 KB |
| Clickjacking, sniffing | Header Helmet: `X-Frame-Options`, `nosniff`, HSTS |
| Rahasia bocor ke GitHub | `.env` dan database ada di `.gitignore` |

## Menjalankan secara lokal

Butuh **Node.js 22.13+**.

```bash
npm install          # install semua dependency (root, server, client)
npm run setup        # buat password admin -> server/.env
npm run dev          # server :3001 + client :5173
```

Buka http://localhost:5173. Inbox admin ada di http://localhost:5173/admin.

### Mode production

```bash
npm run build        # build frontend ke client/dist
npm start            # server menyajikan API + frontend di :3001
```

### Konfigurasi

| File | Variabel | Keterangan |
|------|----------|------------|
| `server/.env` | `PORT`, `JWT_SECRET`, `ADMIN_PASSWORD_HASH` | Dibuat otomatis oleh `npm run setup` |
| `server/.env` | `DB_PATH` (opsional) | Lokasi file database, default `server/data/whistle.db` |
| `server/.env` | `TRUST_PROXY` (opsional) | Set `1` saat di-hosting di belakang proxy |
| `client/.env` | `VITE_OWNER_NAME` (opsional) | Nama pemilik telinga, default `Yeyo` |

## API

| Method | Endpoint | Akses | Keterangan |
|--------|----------|-------|------------|
| `POST` | `/api/messages` | publik | Kirim bisikan `{ body, name?, songId? }` |
| `GET`  | `/api/board` | publik | Bisikan yang dipublikasikan |
| `GET`  | `/api/songs/search?q=` | publik | Cari lagu |
| `POST` | `/api/auth/login` · `/logout` | publik | Masuk/keluar admin |
| `GET`  | `/api/admin/messages?filter=all\|unread\|public` | admin | Daftar bisikan + statistik |
| `PATCH` | `/api/admin/messages/:id` | admin | `{ read?, reply?, isPublic? }` |
| `DELETE` | `/api/admin/messages/:id` | admin | Hapus bisikan |

## Struktur

```
whistleforyeyo/
├── client/                 # React + Vite
│   └── src/
│       ├── components/     # WhisperForm, WhisperCard, SongPicker, SongCard
│       ├── pages/          # Home, Admin, AdminLogin
│       ├── api.js          # wrapper fetch ke backend
│       └── styles.css
└── server/                 # Express API
    ├── scripts/setup.js    # pembuat password admin
    └── src/
        ├── routes/         # public, auth, admin
        ├── services/songs.js
        ├── auth.js · db.js · limits.js · config.js
        └── index.js
```

## Riwayat

Versi pertama (semester 3) dibuat dengan Create React App + Firebase Firestore: [231130212/pesan-anonim](https://github.com/231130212/pesan-anonim). Versi ini ditulis ulang dengan backend sendiri, autentikasi admin, dan fitur lagu.
