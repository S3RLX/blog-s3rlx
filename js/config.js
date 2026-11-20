/* Isi dari Supabase → Project Settings → API. Anon key AMAN dipublikasikan (data dilindungi RLS).
   Alternatif: isi lewat layar setup di admin.html (tersimpan di browser), lalu unduh config.js dari sana. */
window.WC={
  url:'',        // contoh: 'https://abcdxyz.supabase.co'
  key:'',        // anon / publishable key
  idleMin:15,    // auto-logout admin (menit)
  adminKey:''    // opsional: jika diisi, admin.html tampil 404 kecuali dibuka dengan admin.html#k=ISI_KUNCI
};
