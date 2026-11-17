/* ===== admin.js — panel admin Supabase: realtime preview, kustomisasi, media, font, keamanan ===== */
(async()=>{
const {esc,slug}=Store,sb=Store.sb,$=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)],root=$('#root');
const deb=(f,t)=>{let h;return(...a)=>{clearTimeout(h);h=setTimeout(()=>f(...a),t)}};
function toast(m,bad){const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.classList.add('out'),2400);setTimeout(()=>t.remove(),3000)}
const dl=(n,t,m='application/json')=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)};
const fsz=b=>b>1e6?(b/1e6).toFixed(1)+' MB':Math.max(1,Math.round(b/1e3))+' KB';
const flash=t=>{const e=$('#st');if(e)e.textContent=t};
let D,S,draft=null,cur=null,dirty=false,idleOn=0,autosave=localStorage.wcAuto==='1',pvOn=localStorage.wcPv!=='0',dev=localStorage.wcDev||'desktop';

/* ---------- belum terhubung ---------- */
if(!sb){root.innerHTML=`<div class="login glass" style="width:min(640px,94%)"><div class="win-bar"><b></b><b></b><b></b><span>setup.exe</span></div><div class="win-body"><h1 class="chrome">Hubungkan Supabase</h1><ol class="steps" style="margin:1rem 0 0 1.2rem"><li>Buat project gratis di <b>supabase.com</b>.</li><li>Buka <b>SQL Editor</b>, tempel isi <code>supabase/schema.sql</code>, lalu Run.</li><li><b>Authentication → Users</b>: buat user (email + password).</li><li>Jalankan SQL: <code>insert into public.admins(user_id) select id from auth.users where email='emailmu';</code></li><li>Salin <b>Project URL</b> &amp; <b>anon key</b> (Settings → API) ke <code>js/config.js</code>.</li><li>Muat ulang halaman ini. Pastikan internet aktif.</li></ol></div></div>`;return}

/* ---------- auth ---------- */
function login(msg){root.innerHTML=`<div class="login glass"><div class="win-bar"><b></b><b></b><b></b><span>login.exe</span></div><form class="win-body"><h1 class="chrome">Panel admin</h1><p class="lead" style="margin:.6rem 0 1.2rem">Masuk untuk mengelola blogmu.</p><label>Email<input type="email" id="em" autocomplete="username" required></label><label>Kata sandi<input type="password" id="pw" autocomplete="current-password" required></label><button class="btn" style="width:100%;justify-content:center">Masuk</button><p id="err" class="err">${esc(msg||'')}</p></form></div>`;
 $('form').onsubmit=async e=>{e.preventDefault();const lock=+localStorage.wcL||0;if(Date.now()<lock){$('#err').textContent='Terlalu banyak percobaan. Tunggu '+Math.ceil((lock-Date.now())/1000)+' detik.';return}
  const {error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});
  if(error){const f=(+localStorage.wcF||0)+1;localStorage.wcF=f;if(f>=5)localStorage.wcL=Date.now()+30000*Math.min(40,2**(f-5));$('#err').textContent='Email atau kata sandi salah.'}else{localStorage.wcF=0;boot()}}}
async function mfaPrompt(){const fs=(await sb.auth.mfa.listFactors()).data.totp||[];root.innerHTML=`<div class="login glass"><div class="win-bar"><b></b><b></b><b></b><span>2fa.exe</span></div><form class="win-body"><h1 class="chrome">Verifikasi 2FA</h1><label>Kode 6 digit dari aplikasi autentikator<input type="text" id="cd" inputmode="numeric" maxlength="6" autofocus required></label><button class="btn" style="width:100%;justify-content:center">Verifikasi</button><p id="err" class="err"></p></form></div>`;
 $('form').onsubmit=async e=>{e.preventDefault();const ch=await sb.auth.mfa.challenge({factorId:fs[0].id}),v=await sb.auth.mfa.verify({factorId:fs[0].id,challengeId:ch.data.id,code:$('#cd').value.trim()});v.error?$('#err').textContent='Kode salah.':boot()}}
async function boot(){const {data}=await sb.auth.getSession();if(!data.session)return login();
 const a=(await sb.auth.mfa.getAuthenticatorAssuranceLevel()).data;if(a&&a.nextLevel==='aal2'&&a.currentLevel!=='aal2')return mfaPrompt();
 const adm=await sb.from('admins').select('user_id').maybeSingle();
 if(!adm.data){root.innerHTML=`<div class="login glass"><div class="win-body"><h1 class="chrome">Akses ditolak</h1><p class="lead" style="margin:1rem 0">Akun ini belum terdaftar sebagai admin (tabel <code>admins</code>).</p><button class="btn" id="so">Keluar</button></div></div>`;$('#so').onclick=async()=>{await sb.auth.signOut();login()};return}
 D=await Store.load();S=D.settings;Store.faces(S);startIdle();shell()}
function startIdle(){if(idleOn)return;idleOn=1;let t;const m=+localStorage.wcIdle||(WC.idleMin||15),r=()=>{clearTimeout(t);t=setTimeout(async()=>{await sb.auth.signOut();location.reload()},m*60000)};['pointermove','keydown','click'].forEach(ev=>addEventListener(ev,r,{passive:true}));r()}

/* ---------- preview realtime ---------- */
const DEVW={mobile:390,tablet:768,desktop:1280};
function fit(){const fr=$('#fr'),b=$('#fw');if(!fr||!b)return;const W=DEVW[dev],k=Math.min(1,b.clientWidth/W);fr.style.width=W+'px';fr.style.height=(b.clientHeight/k)+'px';fr.style.transform=`scale(${k})`}
function push(){const fr=$('#fr');if(fr&&fr.contentWindow)fr.contentWindow.postMessage({wc:'state',settings:S,draft,media:D.media},'*')}
const pushD=deb(push,30);
function syncFrame(){const fr=$('#fr');if(!fr)return;const h=location.hash,u=/#\/edit\/post/.test(h)?'post.html?embed=1&draft=1':/#\/edit\/page/.test(h)?'page.html?embed=1&draft=1':'index.html?embed=1';if(fr.dataset.u!==u){fr.dataset.u=u;fr.src=u}else push();fit()}
addEventListener('message',e=>{if(e.data&&e.data.wc==='ready')push()});addEventListener('resize',deb(fit,100));
function live(){pushD();dirty=true;flash(autosave?'Menyimpan…':'Belum disimpan ●');if(autosave)aSave()}
async function saveSettings(msg){flash('Menyimpan…');const {error}=await sb.from('settings').upsert({id:1,data:S,updated_at:new Date().toISOString()});if(error){toast(error.message,1);flash('Gagal ✕')}else{dirty=false;flash('Tersimpan ✓');if(msg)toast(msg)}}
const aSave=deb(()=>saveSettings(),900);
async function reload(){const n=await Store.load();D.entries=n.entries;D.media=n.media;D.gb=n.gb;D.hits=n.hits}
addEventListener('beforeunload',e=>{if(dirty&&!autosave){e.preventDefault();e.returnValue=''}});
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();cur&&cur()}});

/* ---------- shell + router ---------- */
const NAV=[['dash','🏠','Dashboard'],['posts','📝','Artikel'],['pages','📄','Halaman'],['media','🖼️','Media'],['fonts','🔤','Font'],['look','🎨','Tampilan'],['layout','🧩','Layout beranda'],['gen','⚙️','Pengaturan'],['inbox','📬','Kotak masuk'],['security','🔐','Keamanan'],['backup','💾','Backup']];
function shell(){root.innerHTML=`<div class="top glass"><b class="logo chrome">${esc(S.site.name)}</b><span id="st" class="pixel"></span><label class="sw"><input type="checkbox" id="au"> Auto-simpan</label><label class="sw"><input type="checkbox" id="pvt"> Live preview</label><button class="btn sm" id="svb">Simpan</button><a class="btn sm ghost" href="index.html" target="_blank">Situs ↗</a><button class="btn sm ghost" id="out">Keluar</button></div>
<div class="shell${pvOn?' pv-on':''}" id="sh"><aside class="side glass">${NAV.map(n=>`<a href="#/${n[0]}" data-r="${n[0]}">${n[1]} ${n[2]}</a>`).join('')}</aside><main class="view" id="view"></main>
<aside class="pvbox glass" id="pvb"><div class="pvbar"><span class="pixel">live preview</span>${[['mobile','📱'],['tablet','📟'],['desktop','🖥️']].map(d=>`<button class="btn sm ghost" data-dv="${d[0]}">${d[1]}</button>`).join('')}<button class="btn sm ghost" id="rl">↻</button></div><div class="fw" id="fw"><iframe id="fr" title="Preview" sandbox="allow-scripts allow-same-origin"></iframe></div></aside></div>`;
 $('#au').checked=autosave;$('#pvt').checked=pvOn;$('#au').onchange=e=>{autosave=e.target.checked;localStorage.wcAuto=autosave?1:0;if(autosave&&dirty)aSave()};
 $('#pvt').onchange=e=>{pvOn=e.target.checked;localStorage.wcPv=pvOn?1:0;$('#sh').classList.toggle('pv-on',pvOn);setTimeout(fit,50)};
 $('#svb').onclick=()=>cur&&cur();$('#out').onclick=async()=>{await sb.auth.signOut();location.reload()};
 $$('[data-dv]').forEach(b=>b.onclick=()=>{dev=b.dataset.dv;localStorage.wcDev=dev;fit()});$('#rl').onclick=()=>{const f=$('#fr');f.src=f.src};
 onhashchange=go;go()}
function go(){const p=(location.hash.slice(2)||'dash').split('/'),v=$('#view');draft=null;v.oninput=v.onchange=v.onclick=null;cur=()=>saveSettings('Tersimpan ✓');
 $$('.side [data-r]').forEach(a=>a.classList.toggle('on',a.dataset.r===(p[0]==='edit'?(p[1]==='page'?'pages':'posts'):p[0])));
 ({dash,posts:()=>list(v,'post'),pages:()=>list(v,'page'),edit:()=>edit(v,p[1],p[2]),media,fonts,look,layout,gen,inbox,security,backup}[p[0]]||dash)(v);syncFrame();scrollTo(0,0)}

/* ---------- generator form pengaturan ---------- */
const FXL=[['aurora','Aurora latar bergerak'],['glow','Cahaya mengikuti kursor'],['trail','Jejak kilau kursor ✦'],['stars','Latar bintang'],['grain','Efek grain film'],['scan','Garis scan CRT'],['chrome','Teks chrome berkilau'],['marquee','Teks berjalan'],['reveal','Animasi muncul saat scroll'],['transition','Transisi antar halaman'],['tilt','Kartu miring 3D'],['sticker','Stiker hero'],['counter','Penghitung pengunjung'],['search','Kolom pencarian'],['filters','Filter kategori'],['progress','Progress bar baca']];
const SCHEMA={look:[
 ['Warna',[['theme.pink','color','Aksen 1'],['theme.cyan','color','Aksen 2'],['theme.lime','color','Aksen 3'],['theme.violet','color','Aksen 4'],['theme.bg','color','Latar'],['theme.ink','color','Teks'],['theme.mute','color','Teks redup']]],
 ['Tipografi',[['theme.fDisplay','font','Font judul'],['theme.fBody','font','Font isi'],['theme.fPixel','font','Font label'],['theme.base','range','Ukuran dasar',12,22,1,'px'],['theme.lh','range','Tinggi baris',1.2,2.2,.05,''],['theme.hw','range','Berat judul',400,900,100,''],['theme.ls','range','Jarak huruf judul',-.08,.1,.01,'em'],['theme.upper','toggle','Judul HURUF BESAR']]],
 ['Kaca',[['theme.blur','range','Blur',0,60,1,'px'],['theme.glass','range','Ketebalan',0,40,1,'%'],['theme.sat','range','Saturasi',100,300,5,'%'],['theme.border','range','Tepi',5,80,1,'%'],['theme.radius','range','Lengkung sudut',0,48,1,'px'],['theme.shadow','range','Bayangan',0,100,1,'%']]],
 ['Layout',[['theme.width','range','Lebar konten',800,1500,10,'px'],['theme.cardw','range','Lebar kartu minimum',220,420,10,'px'],['theme.layout','select','Gaya daftar',['grid','list']],['theme.heroAlign','select','Rata hero',['left','center']],['theme.heroSize','range','Ukuran judul hero',.5,1.4,.05,'×'],['theme.btn','select','Gaya tombol',['chrome','flat','outline','neon']]]],
 ['Animasi',[['theme.speed','range','Kecepatan animasi',.3,2.5,.1,'×'],['theme.ease','select','Gaya gerak',['smooth','bounce','linear']],['theme.aurora','range','Intensitas aurora',0,100,5,'%']]],
 ['Latar gambar',[['theme.bgImage','media','Gambar latar'],['theme.bgOpacity','range','Opasitas gambar',0,100,5,'%']]],
 ['CSS kustom (lanjutan)',[['theme.css','textarea','Tulis CSS tambahan di sini',6]]]],
gen:[
 ['Identitas',[['site.name','text','Nama situs'],['site.favicon','text','Emoji favicon'],['site.tagline','text','Deskripsi (SEO)'],['site.ogImage','media','Gambar share (OG)'],['site.lang','select','Bahasa',['id','en']],['site.footer','text','Teks footer']]],
 ['Hero',[['site.heroKicker','text','Teks kecil'],['site.heroTitle','textarea','Judul',2],['site.heroSub','textarea','Sub-judul',2],['site.btn1','text','Tombol 1'],['site.btn1Url','text','Link tombol 1'],['site.btn2','text','Tombol 2'],['site.btn2Url','text','Link tombol 2'],['site.sticker','text','Emoji stiker']]],
 ['Beranda',[['site.postsTitle','text','Judul daftar artikel'],['site.postsLimit','number','Jumlah artikel (0 = semua)'],['site.marquee','textarea','Teks berjalan (satu per baris)',4],['site.nlTitle','text','Judul newsletter'],['site.nlSub','text','Deskripsi newsletter'],['site.gbTitle','text','Judul buku tamu'],['site.gbSub','text','Deskripsi buku tamu']]],
 ['Menu & footer',[['site.navExtra','textarea','Menu tambahan — Label|URL, satu per baris',3],['site.social','textarea','Tautan sosial footer — Label|URL, satu per baris',3]]],
 ['Mode perawatan',[['site.maintenance','toggle','Aktifkan mode perawatan (pengunjung melihat pesan saja)'],['site.maintMsg','text','Pesan perawatan']]]]};
const fontOpts=()=>`<optgroup label="Google Fonts">${Object.keys(Store.FONTS).map(f=>`<option>${esc(f)}</option>`).join('')}</optgroup>${S.fonts.length?`<optgroup label="Font unggahan">${S.fonts.map(f=>`<option>${esc(f.name)}</option>`).join('')}</optgroup>`:''}`;
function field(f){const [k,t,l,a,b,c,u]=f;
 if(t==='color')return `<label>${l}<input type="color" data-k="${k}"></label>`;
 if(t==='range')return `<label>${l}<br><input type="range" data-k="${k}" min="${a}" max="${b}" step="${c}"><output data-u="${u}"></output></label>`;
 if(t==='select')return `<label>${l}<select data-k="${k}">${a.map(o=>`<option>${esc(o)}</option>`).join('')}</select></label>`;
 if(t==='font')return `<label>${l}<select data-k="${k}">${fontOpts()}</select></label>`;
 if(t==='toggle')return `<label class="sw"><input type="checkbox" data-k="${k}"> ${l}</label>`;
 if(t==='textarea')return `<label>${l}<textarea rows="${a||3}" data-k="${k}"></textarea></label>`;
 if(t==='number')return `<label>${l}<input type="number" min="0" data-k="${k}"></label>`;
 if(t==='media')return `<div class="mpick" data-mk="${k}"><span>${l}</span><button class="btn sm ghost" data-pick>🖼️ Pilih</button><button class="btn sm ghost" data-clr>✕</button><em></em></div>`;
 return `<label>${l}<input type="text" data-k="${k}"></label>`}
const panels=L=>L.map(g=>`<div class="panel glass"><h3>${g[0]}</h3><div class="row">${g[1].map(field).join('')}</div></div>`).join('');
const path=(k)=>{const p=k.split('.'),last=p.pop();let o=S;p.forEach(a=>o=o[a]);return[o,last]};
function bind(el){$$('[data-k]',el).forEach(i=>{const [o,k]=path(i.dataset.k),out=i.type==='range'?i.nextElementSibling:null,show=()=>{if(out)out.textContent=i.value+(out.dataset.u||'')};
  if(i.type==='checkbox'){i.checked=!!o[k];i.onchange=()=>{o[k]=i.checked?1:0;live()}}
  else{i.value=o[k]??'';show();i.oninput=()=>{o[k]=(i.type==='range'||i.type==='number')?+i.value:i.value;show();live()}}});
 $$('.mpick',el).forEach(w=>{const [o,k]=path(w.dataset.mk),nm=()=>{const m=D.media.find(x=>x.id===o[k]);w.querySelector('em').textContent=m?m.name:'—'};nm();
  w.querySelector('[data-pick]').onclick=()=>pickMedia(m=>{o[k]=m.id;nm();live()},'image');w.querySelector('[data-clr]').onclick=()=>{o[k]='';nm();live()}})}

/* ---------- dashboard ---------- */
async function dash(v){v.innerHTML='<h1 class="chrome">Halo 👋</h1><div id="ds"></div>';
 const c=(t,f)=>{let q=sb.from(t).select('id',{count:'exact',head:true});return f?f(q):q};
 const [sub,gb]=await Promise.all([c('subscribers'),c('guestbook',q=>q.eq('approved',false))]);
 const posts=D.entries.filter(e=>e.kind==='post'),pub=posts.filter(e=>e.status==='published').length;
 $('#ds').innerHTML=`<div class="stats">${[['Artikel',posts.length,pub+' terbit'],['Halaman',D.entries.length-posts.length,''],['Media',D.media.length,'file'],['Pengunjung',D.hits,'total'],['Pelanggan',sub.count||0,'email'],['Buku tamu',gb.count||0,'menunggu']].map(s=>`<div class="glass stat"><span class="pixel">${s[0]}</span><b>${s[1]}</b><small>${s[2]}</small></div>`).join('')}</div>
 <div class="panel glass"><h3>Aksi cepat</h3><div class="acts"><a class="btn" href="#/edit/post/new">＋ Artikel</a><a class="btn ghost" href="#/edit/page/new">＋ Halaman</a><a class="btn ghost" href="#/media">Upload file</a><a class="btn ghost" href="#/fonts">Upload font</a><a class="btn ghost" href="#/look">Atur tampilan</a></div></div>
 <div class="panel glass"><h3>Tips</h3><ol class="steps"><li>Nyalakan <b>Live preview</b> di bar atas — semua perubahan tampil seketika tanpa menyimpan.</li><li>Nyalakan <b>Auto-simpan</b> agar pengaturan langsung tersimpan &amp; tampil real-time ke pengunjung.</li><li>Tekan <code>Ctrl+S</code> untuk menyimpan kapan saja.</li></ol></div>`}

/* ---------- daftar ---------- */
function list(v,kind){const isP=kind==='post',L=isP?'Artikel':'Halaman';
 v.innerHTML=`<h1 class="chrome">${L}</h1><div class="panel glass"><div class="bar"><input type="text" id="s" placeholder="Cari…"><a class="btn" href="#/edit/${kind}/new">＋ Baru</a></div><div class="tw"><table><thead><tr><th>Judul</th><th>${isP?'Kategori':'Di menu'}</th><th>Terbit</th><th></th></tr></thead><tbody id="tb"></tbody></table></div></div>`;
 const draw=()=>{const q=$('#s').value.toLowerCase();$('#tb').innerHTML=D.entries.filter(x=>x.kind===kind&&x.title.toLowerCase().includes(q)).sort((a,b)=>(b.pinned-a.pinned)||String(b.publish_at).localeCompare(String(a.publish_at))).map(x=>{const fut=x.status==='published'&&new Date(x.publish_at)>new Date();return `<tr><td><b>${x.pinned?'📌 ':''}${esc(x.title)}</b><br><small>/${esc(x.slug)} · ${new Date(x.publish_at).toLocaleDateString('id-ID')}${fut?' · ⏰ terjadwal':''}</small></td><td>${isP?esc(x.cat):(x.nav?'Ya':'—')}</td><td><label class="sw"><input type="checkbox" data-s="${x.id}" ${x.status==='published'?'checked':''}></label></td><td class="ac"><a class="btn sm ghost" href="#/edit/${kind}/${x.id}">Edit</a>${isP?`<button class="btn sm ghost" data-p="${x.id}">${x.pinned?'Lepas pin':'📌'}</button>`:''}<a class="btn sm ghost" target="_blank" href="${isP?'post.html?s=':'page.html?p='}${encodeURIComponent(x.slug)}&preview=1">Lihat</a><button class="btn sm ghost" data-d="${x.id}">Gandakan</button><button class="btn sm ghost" data-x="${x.id}">Hapus</button></td></tr>`}).join('')||'<tr><td colspan="4" class="empty">Belum ada data.</td></tr>'};
 draw();$('#s').oninput=draw;
 const upd=async(id,p,m)=>{const {error}=await sb.from('entries').update(p).eq('id',id);if(error)toast(error.message,1);else{await reload();toast(m);draw()}};
 $('#tb').onchange=e=>{const i=e.target.dataset.s;if(i)upd(i,{status:e.target.checked?'published':'draft'},e.target.checked?'Diterbitkan ✓':'Jadi draf')};
 $('#tb').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const g=D.entries.find(a=>a.id===(b.dataset.p||b.dataset.d||b.dataset.x));
  if(b.dataset.p)upd(g.id,{pinned:!g.pinned},'Diperbarui');
  if(b.dataset.x&&confirm('Hapus permanen?')){const {error}=await sb.from('entries').delete().eq('id',g.id);error?toast(error.message,1):(await reload(),toast('Dihapus'),draw())}
  if(b.dataset.d){const {id,created_at,updated_at,...r}=g;const {error}=await sb.from('entries').insert({...r,title:g.title+' (salinan)',slug:g.slug+'-salinan-'+Date.now().toString(36).slice(-3),status:'draft'});error?toast(error.message,1):(await reload(),toast('Digandakan'),draw())}}}

/* ---------- editor ---------- */
const TB=[['h2','H2'],['h3','H3'],['b','<b>B</b>'],['i','<i>I</i>'],['q','❝'],['ul','• Daftar'],['a','🔗'],['med','📎 Media/File'],['yt','▶ YouTube'],['btn','Tombol'],['hr','—']];
function edit(v,kind,id){const isP=kind==='post',isNew=id==='new',back='#/'+(isP?'posts':'pages');
 let x=isNew?{kind,title:'',slug:'',content:'',status:'draft',cat:'Catatan',excerpt:'',emoji:'✨',c1:'#8a5cff',c2:'#ff5fd2',cover:'',nav:true,pinned:false,tags:[],publish_at:new Date().toISOString(),seo_title:'',seo_desc:''}:D.entries.find(a=>a.id===id);
 if(!x){location.hash=back;return}let auto=isNew;const loc=d=>{d=new Date(d);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16)};
 v.innerHTML=`<h1 class="chrome">${isNew?'Baru':'Edit'}: ${isP?'artikel':'halaman'}</h1>
 <div class="panel glass"><div class="row"><label>Judul<input type="text" id="f-title"></label><label>Slug<input type="text" id="f-slug"></label><label>Jadwal terbit<input type="datetime-local" id="f-pub"></label></div>
 ${isP?`<div class="row"><label>Kategori<input type="text" id="f-cat"></label><label>Tag (pisah koma)<input type="text" id="f-tags"></label><label>Emoji<input type="text" id="f-emoji" maxlength="4"></label><label>Warna A<input type="color" id="f-c1"></label><label>Warna B<input type="color" id="f-c2"></label></div><label>Ringkasan<textarea id="f-excerpt" rows="2"></textarea></label><div class="cov"><button class="btn sm ghost" id="pc">🖼️ Sampul</button><button class="btn sm ghost" id="rc">Hapus</button><span id="cn"></span></div><label class="sw" style="margin-top:1rem"><input type="checkbox" id="f-pinned"> 📌 Sematkan di atas</label>`:`<label class="sw"><input type="checkbox" id="f-nav"> Tampilkan di menu navigasi</label>`}
 <details style="margin-top:1rem"><summary class="hint">SEO</summary><div class="row"><label>Judul SEO<input type="text" id="f-seot"></label><label>Deskripsi SEO<input type="text" id="f-seod"></label></div></details></div>
 <div class="panel glass"><div class="toolbar">${TB.map(t=>`<button class="btn sm ghost" data-t="${t[0]}">${t[1]}</button>`).join('')}</div><textarea id="f-content" rows="20" style="width:100%;min-height:380px;font-family:ui-monospace,Menlo,monospace;font-size:.9rem" placeholder="Tulis dengan Markdown sederhana… pratinjau tampil di panel kanan."></textarea><p class="hint">## judul · **tebal** · *miring* · &gt; kutipan · - daftar · [teks](url) · [[Tombol|url]] · page:slug / post:slug · {{youtube:ID}}</p></div>
 <div class="acts"><button class="btn" id="pub">${x.status==='published'?'Perbarui':'Terbitkan'}</button><button class="btn ghost" id="dr">Simpan sebagai draf</button><a class="btn ghost" href="${back}">Batal</a>${x.id?'<button class="btn danger" id="del" style="margin-left:auto">Hapus</button>':''}</div>`;
 const g=i=>$('#f-'+i),ta=g('content');
 ['title','slug','content','seot','seod'].forEach(k=>g(k).value=x[{seot:'seo_title',seod:'seo_desc'}[k]||k]||'');g('pub').value=loc(x.publish_at);
 if(isP){['cat','emoji','c1','c2','excerpt'].forEach(k=>g(k).value=x[k]||'');g('tags').value=(x.tags||[]).join(', ');g('pinned').checked=!!x.pinned}else g('nav').checked=!!x.nav;
 const row=st=>({kind,title:g('title').value.trim(),slug:slug(g('slug').value||g('title').value)||'tanpa-judul',content:ta.value,status:st||x.status,publish_at:new Date(g('pub').value||Date.now()).toISOString(),seo_title:g('seot').value.trim(),seo_desc:g('seod').value.trim(),
  ...(isP?{cat:g('cat').value.trim(),tags:g('tags').value.split(',').map(s=>s.trim()).filter(Boolean),emoji:g('emoji').value.trim(),c1:g('c1').value,c2:g('c2').value,excerpt:g('excerpt').value.trim(),cover:x.cover||'',pinned:g('pinned').checked}:{nav:g('nav').checked})});
 const upd=()=>{draft={...x,...row()};pushD()};v.oninput=upd;
 g('title').addEventListener('input',e=>{if(auto)g('slug').value=slug(e.target.value)});g('slug').addEventListener('input',()=>auto=false);
 const ins=(a,b='',ph='')=>{const s=ta.selectionStart,e=ta.selectionEnd;ta.setRangeText(a+(ta.value.slice(s,e)||ph)+b,s,e,'end');ta.focus();upd()};
 const A={h2:()=>ins('\n\n## ','\n\n','Judul'),h3:()=>ins('\n\n### ','\n\n','Subjudul'),b:()=>ins('**','**','tebal'),i:()=>ins('*','*','miring'),q:()=>ins('\n\n> ','\n\n','Kutipan'),ul:()=>ins('\n\n- ','\n','Butir'),a:()=>ins('[','](https://)','teks'),
  med:()=>pickMedia(m=>/^(image|video|audio)\//.test(m.mime||'')?ins(`\n\n![${m.name}](media:${m.id})\n\n`):ins(`\n\n[[📎 ${m.name}|media:${m.id}]]\n\n`)),yt:()=>ins('\n\n{{youtube:','}}\n\n','ID_VIDEO'),btn:()=>ins('[[','|https://]]','Teks tombol'),hr:()=>ins('\n\n---\n\n')};
 $$('[data-t]').forEach(b=>b.onclick=A[b.dataset.t]);
 if(isP){const cn=()=>{const m=D.media.find(a=>a.id===x.cover);$('#cn').textContent=m?m.name:'Belum ada (memakai emoji)'};cn();$('#pc').onclick=()=>pickMedia(m=>{x.cover=m.id;cn();upd()},'image');$('#rc').onclick=()=>{x.cover='';cn();upd()}}
 const commit=async(st,stay)=>{const r=row(st);if(!r.title){toast('Judul wajib diisi',1);return}
  if(D.entries.some(a=>a.kind===kind&&a.slug===r.slug&&a.id!==x.id)){toast('Slug sudah dipakai',1);return}
  flash('Menyimpan…');const {data,error}=await(x.id?sb.from('entries').update(r).eq('id',x.id):sb.from('entries').insert(r)).select().single();
  if(error){toast(error.message,1);flash('Gagal ✕');return}await reload();toast(r.status==='published'?'Diterbitkan ✓':'Tersimpan ✓');flash('Tersimpan ✓');
  if(!stay)location.hash=back;else if(!x.id)location.hash='#/edit/'+kind+'/'+data.id;else x=data};
 $('#pub').onclick=()=>commit('published');$('#dr').onclick=()=>commit('draft');cur=()=>commit(x.status||'draft',1);
 if(x.id)$('#del').onclick=async()=>{if(confirm('Hapus permanen?')){const {error}=await sb.from('entries').delete().eq('id',x.id);error?toast(error.message,1):(await reload(),location.hash=back)}};
 upd()}

/* ---------- media (file apa saja) ---------- */
const safe=n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w.\-]+/g,'_');
async function shrink(f){if(localStorage.wcShrink==='0'||!/^image\/(jpeg|png|webp)$/.test(f.type)||f.size<3e5)return f;const im=await createImageBitmap(f),k=Math.min(1,1920/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);const t=f.type==='image/png'?'image/png':'image/jpeg',b=await new Promise(r=>c.toBlob(r,t,.85));return b&&b.size<f.size?new File([b],f.name,{type:t}):f}
async function put(f,dir){if(f.size>50e6)throw Error(f.name+' lebih dari 50 MB');const p=`${dir}/${Date.now()}-${Math.random().toString(36).slice(2,6)}-${safe(f.name)}`,{error}=await sb.storage.from('media').upload(p,f,{contentType:f.type||'application/octet-stream',cacheControl:'31536000'});if(error)throw error;return{path:p,url:sb.storage.from('media').getPublicUrl(p).data.publicUrl}}
const ico=m=>{const t=m.mime||'',n=(m.name||'').toLowerCase();return t.startsWith('video/')?'🎬':t.startsWith('audio/')?'🎵':/pdf/.test(t)?'📕':/zip|rar|7z|tar/.test(t)?'🗜️':/font|ttf|otf|woff/.test(t+n)?'🔤':/text|json|csv|word|sheet|presentation/.test(t)?'📄':'📎'};
const thumb=m=>(m.mime||'').startsWith('image/')?`<img src="${esc(m.url)}" alt="" loading="lazy">`:`<div class="ico">${ico(m)}</div>`;
function media(v){let flt='all',q='';
 v.innerHTML=`<h1 class="chrome">Media &amp; file</h1><div class="panel glass"><label class="drop" id="dz">📤 Tarik file apa saja ke sini atau klik untuk upload (gambar, video, audio, PDF, ZIP, dll — maks 50 MB)<input type="file" id="fi" multiple hidden></label><label class="sw" style="margin-top:1rem"><input type="checkbox" id="sk"> Kecilkan gambar besar otomatis (maks 1920px)</label><p class="hint" id="pg"></p></div>
 <div class="panel glass"><div class="bar"><input type="text" id="s" placeholder="Cari file…"></div><div class="mtabs">${[['all','Semua'],['image','Gambar'],['video','Video'],['audio','Audio'],['other','Lainnya']].map(t=>`<button class="btn sm ghost${t[0]==='all'?' on':''}" data-f="${t[0]}">${t[1]}</button>`).join('')}</div><div class="mgrid" id="mg"></div></div>`;
 $('#sk').checked=localStorage.wcShrink!=='0';$('#sk').onchange=e=>localStorage.wcShrink=e.target.checked?1:0;
 const match=m=>{const t=(m.mime||'').split('/')[0];return(flt==='all'||(flt==='other'?!['image','video','audio'].includes(t):t===flt))&&m.name.toLowerCase().includes(q)};
 const draw=()=>$('#mg').innerHTML=D.media.filter(match).map(m=>`<figure class="glass mi">${thumb(m)}<figcaption><b>${esc(m.name)}</b><br><small>${fsz(m.size||0)} · ${esc(m.mime||'?')}</small><div><button class="btn sm ghost" data-c="${m.id}">Kode</button><button class="btn sm ghost" data-u="${m.id}">URL</button><button class="btn sm ghost" data-r="${m.id}">Nama</button><button class="btn sm ghost" data-x="${m.id}">Hapus</button></div></figcaption></figure>`).join('')||'<p class="empty">Tidak ada file.</p>';
 const up=async fs=>{let n=0;for(const f0 of fs){n++;$('#pg').textContent=`Mengunggah ${n}/${fs.length}: ${f0.name}…`;try{const f=await shrink(f0),{path:p,url}=await put(f,'uploads'),{error}=await sb.from('media').insert({name:f0.name.replace(/\.[^.]+$/,'').replace(/[\[\]()|]/g,''),path:p,url,mime:f.type||'application/octet-stream',size:f.size});if(error)throw error}catch(e){toast(e.message||'Gagal',1)}}$('#pg').textContent='Selesai ✓';await reload();draw();push()};
 draw();const dz=$('#dz');$('#fi').onchange=e=>up([...e.target.files]);dz.ondragover=e=>{e.preventDefault();dz.classList.add('ov')};dz.ondragleave=()=>dz.classList.remove('ov');dz.ondrop=e=>{e.preventDefault();dz.classList.remove('ov');up([...e.dataTransfer.files])};
 $('#s').oninput=e=>{q=e.target.value.toLowerCase();draw()};$$('[data-f]',v).forEach(b=>b.onclick=()=>{flt=b.dataset.f;$$('[data-f]',v).forEach(x=>x.classList.toggle('on',x===b));draw()});
 $('#mg').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const m=D.media.find(a=>a.id===(b.dataset.c||b.dataset.u||b.dataset.r||b.dataset.x));
  const cp=async t=>{try{await navigator.clipboard.writeText(t);toast('Disalin ✓')}catch(_){prompt('Salin:',t)}};
  if(b.dataset.c)cp(/^(image|video|audio)\//.test(m.mime||'')?`![${m.name}](media:${m.id})`:`[[📎 ${m.name}|media:${m.id}]]`);if(b.dataset.u)cp(m.url);
  if(b.dataset.r){const n=prompt('Nama baru:',m.name);if(n){await sb.from('media').update({name:n.replace(/[\[\]()|]/g,'')}).eq('id',m.id);await reload();draw()}}
  if(b.dataset.x&&confirm('Hapus file ini? Tulisan yang memakainya akan kehilangan file tersebut.')){await sb.storage.from('media').remove([m.path]);await sb.from('media').delete().eq('id',m.id);await reload();draw();push()}}}
function pickMedia(cb,only){const m=document.createElement('div');m.className='modal';const L=D.media.filter(a=>!only||(a.mime||'').startsWith(only+'/'));
 m.innerHTML=`<div class="glass box"><div class="win-bar"><b></b><b></b><b></b><span>pilih file</span></div><div class="win-body"><div class="mgrid">${L.map(a=>`<button class="mp" data-i="${a.id}">${thumb(a)}<span>${esc(a.name)}</span></button>`).join('')||'<p class="empty">Belum ada file. Upload dulu di menu Media.</p>'}</div><p><button class="btn ghost sm" id="mc" style="margin-top:1rem">Tutup</button></p></div></div>`;
 document.body.appendChild(m);m.onclick=e=>{const b=e.target.closest('.mp');if(b){cb(D.media.find(a=>a.id===b.dataset.i));m.remove()}else if(e.target===m||e.target.id==='mc')m.remove()}}

/* ---------- font ---------- */
function fonts(v){v.innerHTML=`<h1 class="chrome">Font kustom</h1><div class="panel glass"><label class="drop" id="dz">🔤 Upload font .ttf / .otf / .woff / .woff2<input type="file" id="fi" accept=".ttf,.otf,.woff,.woff2" multiple hidden></label><p class="hint" id="pg">Setelah diunggah, pilih font tersebut di menu Tampilan → Tipografi, atau klik tombol “Pakai” di bawah.</p></div><div id="fl"></div>`;
 const draw=()=>{Store.faces(S);$('#fl').innerHTML=S.fonts.map((f,i)=>`<div class="glass fnt"><b>${esc(f.name)}</b> <small>(${esc(f.fmt)})</small><div class="sample" style="font-family:'${esc(f.name)}'">Aa Bb Cc 123 — The quick brown fox</div><div class="acts"><button class="btn sm ghost" data-u="${i}:fDisplay">Pakai: Judul</button><button class="btn sm ghost" data-u="${i}:fBody">Pakai: Isi</button><button class="btn sm ghost" data-u="${i}:fPixel">Pakai: Label</button><button class="btn sm ghost" data-x="${i}">Hapus</button></div></div>`).join('')||'<p class="empty">Belum ada font unggahan.</p>'};
 const up=async fs=>{for(const f of fs){const ext=f.name.split('.').pop().toLowerCase(),fmt={ttf:'truetype',otf:'opentype',woff:'woff',woff2:'woff2'}[ext];if(!fmt){toast(f.name+': format tidak didukung',1);continue}
  let name=(prompt('Nama font:',f.name.replace(/\.[^.]+$/,'').replace(/[^\w \-]/g,' ').trim())||'').replace(/[^\w \-]/g,'').trim();if(!name)continue;if(S.fonts.some(a=>a.name===name)||Store.FONTS[name])name+=' '+Math.random().toString(36).slice(2,4);
  try{$('#pg').textContent='Mengunggah '+f.name+'…';const {path:p,url}=await put(f,'fonts');S.fonts.push({name,url,fmt,path:p});await saveSettings();draw();push();$('#pg').textContent='Font siap dipakai ✓'}catch(e){toast(e.message||'Gagal',1)}}};
 draw();const dz=$('#dz');$('#fi').onchange=e=>up([...e.target.files]);dz.ondragover=e=>{e.preventDefault();dz.classList.add('ov')};dz.ondragleave=()=>dz.classList.remove('ov');dz.ondrop=e=>{e.preventDefault();dz.classList.remove('ov');up([...e.dataTransfer.files])};
 $('#fl').onclick=async e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.u){const [i,k]=b.dataset.u.split(':');S.theme[k]=S.fonts[i].name;Store.faces(S);live();toast('Font dipakai')}
  if(b.dataset.x&&confirm('Hapus font ini?')){const f=S.fonts[b.dataset.x];await sb.storage.from('media').remove([f.path]);['fDisplay','fBody','fPixel'].forEach(k=>{if(S.theme[k]===f.name)S.theme[k]=Store.DEF.theme[k]});S.fonts.splice(b.dataset.x,1);await saveSettings();draw();push()}}}

/* ---------- tampilan ---------- */
const PR={'Neon Y2K':['#ff5fd2','#5ff5ff','#d4ff5f','#8a5cff','#0a0618'],'Permen karet':['#ff7eb6','#ffd6f5','#fff29c','#b57cff','#1a0b2e'],'Mint siber':['#00ffa3','#00e5ff','#eaff00','#3d5afe','#03121a'],'Senja':['#ff6b6b','#ffd166','#ffe66d','#ff9e00','#1b0a14'],'Vaporwave':['#ff71ce','#01cdfe','#05ffa1','#b967ff','#120a2a'],'Monokrom':['#ffffff','#cccccc','#999999','#666666','#050505']};
const hx=(h,s,l)=>{h=((h%360)+360)%360;s/=100;l/=100;const f=n=>{const k=(n+h/30)%12,a=s*Math.min(l,1-l);return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0')};return '#'+f(0)+f(8)+f(4)};
function look(v){v.innerHTML=`<h1 class="chrome">Tampilan</h1><div class="panel glass"><h3>Preset &amp; alat</h3><div class="presets">${Object.keys(PR).map(n=>`<button class="btn ghost sm" data-p="${esc(n)}">${esc(n)}</button>`).join('')}<button class="btn sm" id="rnd">🎲 Acak warna</button><button class="btn ghost sm" id="ex">⬇ Ekspor tema</button><label class="btn ghost sm" style="margin:0">⬆ Impor tema<input type="file" id="im" accept=".json" hidden></label><button class="btn ghost sm" id="rs">↺ Reset tampilan</button></div></div>
 ${panels(SCHEMA.look)}<div class="panel glass"><h3>Efek &amp; saklar</h3><div class="togs">${FXL.map(f=>`<label class="sw"><input type="checkbox" data-k="fx.${f[0]}"> ${f[1]}</label>`).join('')}</div></div>`;
 bind(v);const redo=()=>{look(v);live()};
 $$('[data-p]',v).forEach(b=>b.onclick=()=>{['pink','cyan','lime','violet','bg'].forEach((k,i)=>S.theme[k]=PR[b.dataset.p][i]);redo()});
 $('#rnd').onclick=()=>{const h=Math.random()*360;[S.theme.pink,S.theme.cyan,S.theme.lime,S.theme.violet,S.theme.bg]=[hx(h,100,68),hx(h+150,100,66),hx(h+90,100,66),hx(h+240,90,64),hx(h+260,55,6)];redo()};
 $('#ex').onclick=()=>dl('tema-webcore.json',JSON.stringify({theme:S.theme,fx:S.fx,layout:S.layout}));
 $('#im').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());S.theme=Store.mix(S.theme,d.theme||{});S.fx=Store.mix(S.fx,d.fx||{});if(d.layout)S.layout=d.layout;redo();toast('Tema diimpor')}catch(_){toast('File tema tidak valid',1)}};
 $('#rs').onclick=()=>{if(confirm('Kembalikan semua pengaturan tampilan ke awal?')){S.theme=structuredClone(Store.DEF.theme);S.fx=structuredClone(Store.DEF.fx);redo()}}}

/* ---------- layout beranda ---------- */
const SN={hero:'Hero (judul utama)',marquee:'Teks berjalan',posts:'Daftar artikel',guestbook:'Buku tamu',newsletter:'Newsletter'};
function layout(v){const L=S.layout.sections;v.innerHTML=`<h1 class="chrome">Layout beranda</h1><div class="panel glass"><p class="hint" style="margin:0 0 1rem">Nyalakan/matikan bagian dan ubah urutannya. Perubahan tampil langsung di preview.</p>${L.map((s,i)=>`<div class="glass sec"><label class="sw"><input type="checkbox" data-i="${i}" ${s.on?'checked':''}></label><b>${SN[s.id]||s.id}</b><button class="btn sm ghost" data-m="${i}:-1" ${i?'':'disabled'}>▲</button><button class="btn sm ghost" data-m="${i}:1" ${i<L.length-1?'':'disabled'}>▼</button></div>`).join('')}</div>`;
 v.onchange=e=>{if(e.target.dataset.i!=null){L[e.target.dataset.i].on=e.target.checked?1:0;live()}};
 v.onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;const [i,d]=b.dataset.m.split(':').map(Number);[L[i],L[i+d]]=[L[i+d],L[i]];layout(v);live()}}
function gen(v){v.innerHTML=`<h1 class="chrome">Pengaturan</h1>${panels(SCHEMA.gen)}`;bind(v)}

/* ---------- kotak masuk ---------- */
async function inbox(v){v.innerHTML='<h1 class="chrome">Kotak masuk</h1><p class="hint">Memuat…</p>';
 const [s,g]=await Promise.all([sb.from('subscribers').select('*').order('created_at',{ascending:false}),sb.from('guestbook').select('*').order('created_at',{ascending:false})]);
 const ds=s.data||[],dg=g.data||[];
 v.innerHTML=`<h1 class="chrome">Kotak masuk</h1><div class="two"><div class="panel glass"><h3>📬 Pelanggan (${ds.length})</h3><div class="acts" style="margin-bottom:1rem"><button class="btn sm ghost" id="csv">Ekspor CSV</button></div><div class="tw"><table><tbody>${ds.map(x=>`<tr><td>${esc(x.email)}<br><small>${new Date(x.created_at).toLocaleDateString('id-ID')}</small></td><td class="ac"><button class="btn sm ghost" data-ds="${x.id}">Hapus</button></td></tr>`).join('')||'<tr><td class="empty">Belum ada.</td></tr>'}</tbody></table></div></div>
 <div class="panel glass"><h3>📖 Buku tamu (${dg.length})</h3><div class="tw"><table><tbody>${dg.map(x=>`<tr><td><b>${esc(x.name)}</b> <small>${new Date(x.created_at).toLocaleDateString('id-ID')}</small><br>${esc(x.message)}</td><td class="ac"><label class="sw" title="Tampilkan"><input type="checkbox" data-ga="${x.id}" ${x.approved?'checked':''}></label><button class="btn sm ghost" data-dg="${x.id}">Hapus</button></td></tr>`).join('')||'<tr><td class="empty">Belum ada.</td></tr>'}</tbody></table></div></div></div>`;
 $('#csv').onclick=()=>dl('pelanggan.csv','email,tanggal\n'+ds.map(x=>x.email+','+x.created_at).join('\n'),'text/csv');
 v.onchange=async e=>{if(e.target.dataset.ga){await sb.from('guestbook').update({approved:e.target.checked}).eq('id',e.target.dataset.ga);toast(e.target.checked?'Ditampilkan':'Disembunyikan')}};
 v.onclick=async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.ds&&confirm('Hapus?')){await sb.from('subscribers').delete().eq('id',b.dataset.ds);inbox(v)}if(b.dataset.dg&&confirm('Hapus?')){await sb.from('guestbook').delete().eq('id',b.dataset.dg);inbox(v)}}}

/* ---------- keamanan ---------- */
async function security(v){const u=(await sb.auth.getUser()).data.user,fs=((await sb.auth.mfa.listFactors()).data||{}).totp||[];
 v.innerHTML=`<h1 class="chrome">Keamanan</h1>
 <div class="panel glass"><h3>Akun</h3><p class="hint">Masuk sebagai <b>${esc(u.email)}</b>. Login memakai Supabase Auth (kata sandi di-hash di server), data dilindungi Row Level Security.</p><div class="acts" style="margin-top:1rem"><button class="btn ghost sm" id="so">Keluarkan sesi lain</button></div></div>
 <div class="panel glass"><h3>Ganti kata sandi</h3><div class="row"><label>Sandi baru (min. 10 karakter)<input type="password" id="p1" autocomplete="new-password"></label><label>Ulangi<input type="password" id="p2" autocomplete="new-password"></label></div><button class="btn sm" id="np">Ganti sandi</button></div>
 <div class="panel glass"><h3>Autentikasi 2 langkah (TOTP)</h3><div id="mf">${fs.length?`<p class="hint">2FA <b style="color:var(--lime)">aktif</b>.</p><button class="btn danger sm" id="mo">Matikan 2FA</button>`:'<button class="btn sm" id="me">Aktifkan 2FA</button>'}</div></div>
 <div class="panel glass"><h3>Auto-logout</h3><label>Keluar otomatis setelah tidak aktif<br><input type="range" id="id" min="5" max="120" step="5"><output></output></label><p class="hint">Berlaku pada login berikutnya.</p></div>
 <div class="panel glass"><h3>Checklist</h3><ol class="steps"><li>Matikan “Allow new users to sign up” di Supabase → Authentication.</li><li>Jangan pernah memakai <code>service_role</code> key di file ini — hanya anon key.</li><li>Jika hosting di Netlify, file <code>_headers</code> menambah CSP &amp; header keamanan.</li></ol></div>`;
 $('#so').onclick=async()=>{await sb.auth.signOut({scope:'others'});toast('Sesi lain dikeluarkan')};
 $('#np').onclick=async()=>{const a=$('#p1').value;if(a.length<10||a!==$('#p2').value){toast('Minimal 10 karakter dan harus sama',1);return}const {error}=await sb.auth.updateUser({password:a});error?toast(error.message,1):toast('Kata sandi diganti ✓')};
 const id=$('#id'),o=id.nextElementSibling;id.value=localStorage.wcIdle||WC.idleMin||15;o.textContent=id.value+' mnt';id.oninput=()=>{localStorage.wcIdle=id.value;o.textContent=id.value+' mnt'};
 if(fs.length)$('#mo').onclick=async()=>{if(confirm('Matikan 2FA?')){await sb.auth.mfa.unenroll({factorId:fs[0].id});security(v)}};
 else $('#me').onclick=async()=>{const {data,error}=await sb.auth.mfa.enroll({factorType:'totp'});if(error){toast(error.message,1);return}
  $('#mf').innerHTML=`<p class="hint">Pindai QR dengan aplikasi autentikator, lalu masukkan kode.</p><img class="qr" src="${esc(data.totp.qr_code)}" alt="QR"><p class="hint">Kunci manual: <code>${esc(data.totp.secret)}</code></p><div class="row"><label>Kode 6 digit<input type="text" id="cd" maxlength="6" inputmode="numeric"></label></div><button class="btn sm" id="vf">Verifikasi &amp; aktifkan</button>`;
  $('#vf').onclick=async()=>{const ch=await sb.auth.mfa.challenge({factorId:data.id}),r=await sb.auth.mfa.verify({factorId:data.id,challengeId:ch.data.id,code:$('#cd').value.trim()});r.error?toast('Kode salah',1):(toast('2FA aktif ✓'),security(v))}}}

/* ---------- backup ---------- */
function backup(v){v.innerHTML=`<h1 class="chrome">Backup &amp; impor</h1><div class="panel glass"><h3>💾 Ekspor</h3><p class="hint" style="margin:0 0 1rem">Pengaturan, artikel, halaman, dan daftar media (file tetap di Supabase Storage).</p><button class="btn" id="bk">Unduh backup (.json)</button></div><div class="panel glass"><h3>⬆ Impor</h3><p class="hint" style="margin:0 0 1rem">Pengaturan ditimpa; artikel/halaman digabung berdasarkan slug.</p><label class="btn ghost" style="margin:0">Pilih file backup<input type="file" id="im" accept=".json" hidden></label></div>`;
 $('#bk').onclick=()=>dl('backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({settings:S,entries:D.entries,media:D.media}));
 $('#im').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!d.settings||!Array.isArray(d.entries))throw Error();if(!confirm('Impor backup ini?'))return;
  S=D.settings=Store.norm(d.settings);await saveSettings();const rows=d.entries.map(({id,created_at,updated_at,...r})=>r);const {error}=await sb.from('entries').upsert(rows,{onConflict:'kind,slug'});if(error)throw error;await reload();toast('Backup diimpor ✓')}catch(err){toast('Gagal impor: '+(err.message||'file tidak valid'),1)}}}

boot();
})();
