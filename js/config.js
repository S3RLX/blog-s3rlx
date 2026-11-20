/* Isi dari Supabase → Project Settings → API. Anon key AMAN dipublikasikan (data dilindungi RLS).
   Alternatif: isi lewat layar setup di admin.html (tersimpan di browser), lalu unduh config.js dari sana. */
window.WC={
  url:'https://phcmhyjeoxtqmdqojxyp.supabase.co',        // contoh: 'https://abcdxyz.supabase.co'
  key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoY21oeWplb3h0cW1kcW9qeHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4NjA3MDUsImV4cCI6MjExMDQzNjcwNX0.3kVd71OIUHiZpc0C3DmYj00TrrDM1WIrm5IZN5VHnaM',        // anon / publishable key
  idleMin:15,    // auto-logout admin (menit)
  adminKey:'Lx9vQ7mK2pR8wN5zT4cH6jF1aB3yD0sE'    // opsional: jika diisi, admin.html tampil 404 kecuali dibuka dengan admin.html#k=ISI_KUNCI
};
