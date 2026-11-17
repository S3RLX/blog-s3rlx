# Pixel Dreamer — Webcore Blog + Admin (Supabase)

## Setup (±10 menit)
1. Buat project di https://supabase.com
2. SQL Editor → tempel seluruh `supabase/schema.sql` → Run
3. Authentication → Users → Add user (email + password)
4. Jalankan SQL: insert into public.admins(user_id) select id from auth.users where email='EMAILMU';
5. Authentication → matikan "Allow new users to sign up"
6. Isi `js/config.js` (Project URL + anon key dari Settings → API)
7. Buka `admin.html` → login. Situs publik: `index.html`

Tanpa langkah 6 situs tampil dalam mode demo.

## Struktur
index.html / post.html / page.html — situs · admin.html — panel
js/store.js (data+tema) · render.js (situs) · admin.js (panel) · main.js (efek) · config.js
supabase/schema.sql · _headers (CSP & header keamanan untuk Netlify)

## Hosting
Unggah seluruh folder ke hosting statis (Netlify, Vercel, GitHub Pages, Cloudflare Pages).
Gunakan HTTPS. Hanya pakai anon key — jangan pernah service_role key.
