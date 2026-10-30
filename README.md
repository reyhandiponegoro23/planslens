# PlantLens AI

Next.js 15 (App Router) + OpenAI vision. Ambil/unggah foto tanaman, tanyakan masalahnya, lanjutkan percakapan, dan lihat riwayatnya. Antarmuka dan jawaban AI tersedia dalam **Bahasa Indonesia** (default) dan **English**.

> **Belum memakai database.** Belum ada akun. Riwayat konsultasi (termasuk foto) disimpan di IndexedDB browser, dan pilihan bahasa disimpan di cookie + localStorage perangkat. Skema Supabase untuk tahap berikutnya sudah disiapkan di `supabase/migrations/0001_init.sql`, tetapi belum dipakai aplikasi.

## Setup

1. `npm install`
2. Buat `.env.local` dari `.env.example`, lalu isi `OPENAI_API_KEY` (opsional `OPENAI_MODEL`, default `gpt-4o`). Variabel Supabase belum diperlukan.
3. `npm run dev` (atau `npm run build && npm start`).

## Tampilan

- **HP (< 1024px):** satu kolom dengan navigasi bawah.
- **Laptop (≥ 1024px):** sidebar di kiri, beranda dua kolom (judul dan form), riwayat berbentuk grid kartu , profil dua kolom, dan chat dengan kolom baca di tengah.

Perintah cek: `npm run typecheck`, `npm run check:i18n` (memastikan semua file bahasa punya key yang sama), `npm run build`.

## Multi-bahasa (i18n)

- Library: `next-intl` tanpa prefix URL. Locale ditentukan di `src/i18n/request.ts`.
- **Satu sumber konfigurasi:** `src/i18n/config.ts` (`locales`, `defaultLocale`, label, bendera, nama bahasa untuk AI).
- **Terjemahan:** `messages/id.json` dan `messages/en.json`. `src/global.d.ts` mendaftarkan tipe pesan ke next-intl, sehingga key yang salah atau tidak ada menjadi error TypeScript. `scripts/check-i18n.mjs` memeriksa kelengkapan antar-bahasa.
- Tanggal dan angka diformat dengan `useFormatter`/`getFormatter` sesuai locale (zona waktu Asia/Jakarta).
- Nama merek "PlantLens AI" tidak pernah diterjemahkan.

**Menambah bahasa baru:** tambahkan kode bahasa ke `locales` dan `localeMeta`, lalu buat `messages/<kode>.json`.

### Penyimpanan preferensi & aturan prioritas

1. Cookie `NEXT_LOCALE` (dibaca server saat render).
2. Jika cookie hilang tetapi `localStorage` masih ada, `LocaleSync` memulihkan bahasa dari `localStorage`.
3. Jika tidak ada keduanya, dipakai `id` (Bahasa Indonesia).

Mengganti bahasa di Profil menulis cookie dan localStorage sekaligus, jadi keduanya selalu sama. Saat database ditambahkan nanti, rencananya profil server menang untuk pengguna yang login. Jika profil belum punya preferensi, bahasa perangkat disalin ke profil.

### Bahasa jawaban AI

- `/api/consult` tidak menyimpan apa pun (stateless). Klien mengirim foto, riwayat percakapan, dan pertanyaan baru.
- Konsultasi baru memakai bahasa aktif dari cookie. Bahasa itu disimpan bersama konsultasi di perangkat.
- Pertanyaan lanjutan mengirim bahasa konsultasi tersebut, jadi jawabannya tetap sama bahasanya walaupun antarmuka sudah diganti.
- System prompt (`src/lib/ai-prompt.ts`) melarang AI mengganti bahasa berdasarkan teks di foto atau nama/asal tanaman. Jika pengguna secara eksplisit meminta bahasa lain, AI mengikutinya untuk jawaban itu saja. Nama ilmiah tetap memakai nomenklatur botani.
- Pesan lama ditampilkan apa adanya dan tidak pernah diterjemahkan ulang.

## Uji manual pergantian bahasa

1. Buka di jendela incognito → antarmuka berbahasa Indonesia, chip `ID` di header.
2. Profil → pilih English → seluruh UI (navigasi, form, placeholder, notifikasi) berubah ke English.
3. Buat konsultasi dengan foto → AI menjawab dalam English; lencana "Consultation language: English".
4. Ganti ke Bahasa Indonesia → buat konsultasi baru → jawaban dalam Bahasa Indonesia.
5. Buka konsultasi English lama di Riwayat → isinya tetap English, dan pertanyaan lanjutan dijawab dalam English.
6. Muat ulang atau tutup-buka browser → bahasa terakhir tetap aktif.
