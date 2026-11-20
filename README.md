# Pixel Dreamer — Webcore / Anime Blog + Admin (Supabase) — khusus pemilik

## Setup
1. Supabase → SQL Editor → jalankan SELURUH `supabase/schema.sql` (aman diulang; WAJIB diulang saat memperbarui:
   menambah tabel `tracks`, kolom `meta`, dan membatasi tabel `admins` menjadi SATU admin).
2. Authentication → Users → buat user (kamu), lalu jalankan:
   insert into public.admins(user_id) select id from auth.users where email='EMAILMU';
3. Authentication → matikan "Allow new users to sign up".
4. Buka `admin.html` di komputermu (mode lokal). Isi URL, anon key, dan KUNCI ADMIN di layar setup, lalu unduh `config.js`
   dan timpa `js/config.js`.
5. Unggah seluruh folder ke hosting (HTTPS). Di hosting, `admin.html` hanya terbuka lewat `admin.html#k=KUNCIMU`;
   tanpa kunci semua orang melihat 404. `adjust.html` selalu 404 kecuali admin yang sedang login.

## Halaman
index.html / post.html / page.html — situs · admin.html — panel · adjust.html — Adjustment Studio (tersembunyi)

## Fitur utama
Gaya Webcore / Anime / Minimal · wallpaper (gradien, gambar/GIF, video, pola, warna dinamis) · partikel (sakura, salju, bintang…)
Pemutar musik nightcore (sampul, ID3 otomatis, visualizer, speed+pitch, reverb, bass, lirik LRC) · profil (foto GIF) ·
mode perawatan (hitung mundur, progress) · thumbnail + lampiran + galeri · font kustom · realtime preview.

## Offline SDK
Jika CDN diblokir, taruh supabase.js (UMD) di `js/vendor/supabase.js`.
