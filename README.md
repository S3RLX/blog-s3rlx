# Pixel Dreamer — Webcore Blog + Admin (Supabase)

## Setup
1. Buat project di https://supabase.com → SQL Editor → jalankan seluruh `supabase/schema.sql`
   (aman dijalankan ulang; WAJIB dijalankan ulang jika memperbarui dari versi lama — menambah kolom `meta`).
2. Authentication → Users → buat user, lalu jalankan:
   insert into public.admins(user_id) select id from auth.users where email='EMAILMU';
3. Authentication → matikan "Allow new users to sign up".
4. Buka `admin.html`. Isi Project URL + anon key di layar setup (tersimpan di browser),
   atau edit `js/config.js`. Layar setup menampilkan diagnosis persis jika koneksi gagal.
5. Untuk hosting: unduh `config.js` dari layar setup lalu timpa `js/config.js`, unggah seluruh folder.

## Halaman
index.html / post.html / page.html — situs publik
admin.html — panel admin · adjust.html — Adjustment Studio (tersembunyi: 404 bagi non-admin, tidak ditautkan, noindex)
Opsional: isi `adminKey` di config.js agar admin.html juga tampil 404 kecuali dibuka dengan `admin.html#k=KUNCI`.

## Offline SDK
Jika CDN diblokir, unduh supabase.js (UMD) ke `js/vendor/supabase.js`.
