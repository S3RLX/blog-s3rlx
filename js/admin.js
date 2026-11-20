/* ===== admin.js — panel admin: diagnostik koneksi, live preview, thumbnail, file, font, keamanan ===== */
(async()=>{
const {esc,slug}=Store,sb=Store.sb,{$,$$,panels,bind,look,pickMedia,thumbOf}=UI,root=$('#root');
const deb=(f,t)=>{let h;return(...a)=>{clearTimeout(h);h=setTimeout(()=>f(...a),t)}};
function toast(m,bad){const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.classList.add('out'),2600);setTimeout(()=>t.remove(),3200)}
const dl=(n,t,m='application/json')=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)};
const flash=(t,c)=>{const e=$('#st');if(e){e.textContent=t;e.className='pixel st '+(c||'')}};
let D,S,draft=null,cur=null,dirty=false,idleOn=0,autosave=localStorage.wcAuto==='1',pvOn=localStorage.wcPv!=='0',dev=localStorage.wcDev||'desktop';
const ctx={S:()=>S,D:()=>D,live:()=>live(),tab:'warna'};

/* ---------- khusus pemilik: admin.html tampil 404 bagi siapa pun tanpa kunci ---------- */
const K=Store.cfg.adminKey;
if(K){if(new URLSearchParams(location.hash.slice(1)).get('k')===K)sessionStorage.wcK=K;if(sessionStorage.wcK!==K){UI.fake404();return}}
else if(!UI.isLocal()){UI.fake404();return}   // di hosting publik tanpa adminKey → disembunyikan total

/* ---------- diagnostik koneksi ---------- */
async function probe(){try{const r=await sb.from('settings').select('id').limit(1);if(!r.error)return null;const m=r.error.message||'',c=r.error.code||'';
 if(c==='42P01'||c==='PGRST205'||/does not exist|schema cache/i.test(m))return{t:'schema',m:'Koneksi berhasil, tetapi tabel belum ada. Jalankan seluruh isi supabase/schema.sql di SQL Editor (aman dijalankan ulang).'};
 if(/api key|jwt|unauthor/i.test(m)||r.status===401)return{t:'key',m:'Anon key ditolak Supabase. Salin ulang “anon public” / “publishable” key dari Settings → API.'};
 return{t:'other',m}}catch(e){return{t:'net',m:'Tidak bisa menjangkau Supabase ('+(e.message||'network')+'). Periksa Project URL dan koneksi internet.'}}}
function setup(reason){const sdk=Store.state.sdk,tried=(window.WCsdk&&WCsdk.tried)||[];
 const msg=!sdk?`<b>SDK Supabase gagal dimuat</b> dari semua sumber (${tried.length} dicoba). Periksa internet / pemblokir iklan, atau letakkan file <code>supabase.js</code> di <code>js/vendor/</code>.`:
  reason&&reason.m?`<b>${esc(reason.m)}</b>`:Store.state.err?`<b>Konfigurasi tidak valid:</b> ${esc(Store.state.err)}`:!Store.state.cfg?'<b>URL / key belum diisi.</b> Isi form di bawah atau edit <code>js/config.js</code>.':'';
 root.innerHTML=`<div class="login glass" style="width:min(680px,94%)"><div class="win-bar"><b></b><b></b><b></b><span>setup.exe</span></div><div class="win-body"><h1 class="chrome">Hubungkan Supabase</h1>
 <div class="diag">${msg||'Siap dihubungkan.'}<br><small>SDK: ${sdk?'termuat':'gagal'} · konfigurasi: ${Store.state.cfg?'ada ('+esc(Store.cfg.src||'')+')':'kosong'}</small></div>
 <form id="cf"><label>Project URL<input type="text" id="cu" placeholder="https://xxxx.supabase.co" value="${esc(Store.cfg.url)}"></label><label>Anon / publishable key<input type="text" id="ck" value="${esc(Store.cfg.key)}"></label>
 <label>Kunci admin (rahasia) — admin.html akan tampil 404 kecuali dibuka dengan <code>admin.html#k=KUNCI</code><span class="kr"><input type="text" id="cm" value="${esc(Store.cfg.adminKey||'')}" placeholder="kosongkan untuk mode lokal"><button type="button" class="btn sm ghost" id="rk">${ic('dice',14)} Acak</button></span></label>
 <div class="acts"><button class="btn">${ic('check',16)} Simpan &amp; uji koneksi</button><button type="button" class="btn ghost" id="dc">${ic('download',16)} Unduh config.js</button><button type="button" class="btn ghost" id="rt">${ic('refresh',16)} Coba lagi</button></div></form>
 <p class="hint">Disimpan di browser ini. Agar situs di hosting juga terhubung, unduh <code>config.js</code> lalu timpa <code>js/config.js</code>. Setelah kunci admin dipasang, buka <code>admin.html#k=KUNCI</code>.</p></div></div>`;
 const rd=()=>({url:$('#cu').value.trim().replace(/\/+$/,'').replace(/\/rest\/v1$/,''),key:$('#ck').value.trim(),adminKey:$('#cm').value.trim()});
 $('#rk').onclick=()=>{$('#cm').value=[...crypto.getRandomValues(new Uint8Array(12))].map(b=>b.toString(36).padStart(2,'0')).join('').slice(0,20)};
 $('#cf').onsubmit=e=>{e.preventDefault();const c=rd();localStorage.wcCfg=JSON.stringify(c);if(c.adminKey)sessionStorage.wcK=c.adminKey;location.reload()};
 $('#dc').onclick=()=>{const c=rd();dl('config.js',`window.WC={\n  url:'${c.url}',\n  key:'${c.key}',\n  idleMin:${Store.cfg.idleMin||15},\n  adminKey:'${c.adminKey}'\n};\n`,'text/javascript')};$('#rt').onclick=()=>location.reload()}

/* ---------- auth ---------- */
function login(msg){root.innerHTML=`<div class="login glass"><div class="win-bar"><b></b><b></b><b></b><span>login.exe</span></div><form class="win-body"><h1 class="chrome">Panel admin</h1><p class="lead" style="margin:.6rem 0 1.2rem">Masuk untuk mengelola blogmu.</p><label>Email<input type="email" id="em" autocomplete="username" required></label><label>Kata sandi<input type="password" id="pw" autocomplete="current-password" required></label><button class="btn" style="width:100%;justify-content:center">Masuk</button><p id="err" class="err">${esc(msg||'')}</p><p class="hint"><a href="#" id="cfg">Ubah koneksi Supabase</a></p></form></div>`;
 $('#cfg').onclick=e=>{e.preventDefault();setup()};
 $('form').onsubmit=async e=>{e.preventDefault();const lock=+localStorage.wcL||0;if(Date.now()<lock){$('#err').textContent='Terlalu banyak percobaan. Tunggu '+Math.ceil((lock-Date.now())/1000)+' detik.';return}
  const {error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});
  if(error){const f=(+localStorage.wcF||0)+1;localStorage.wcF=f;if(f>=5)localStorage.wcL=Date.now()+30000*Math.min(40,2**(f-5));$('#err').textContent='Email atau kata sandi salah.'}else{localStorage.wcF=0;boot()}}}
async function mfaPrompt(){const fs=(await sb.auth.mfa.listFactors()).data.totp||[];root.innerHTML=`<div class="login glass"><div class="win-bar"><b></b><b></b><b></b><span>2fa.exe</span></div><form class="win-body"><h1 class="chrome">Verifikasi 2FA</h1><label>Kode 6 digit dari aplikasi autentikator<input type="text" id="cd" inputmode="numeric" maxlength="6" autofocus required></label><button class="btn" style="width:100%;justify-content:center">Verifikasi</button><p id="err" class="err"></p></form></div>`;
 $('form').onsubmit=async e=>{e.preventDefault();const ch=await sb.auth.mfa.challenge({factorId:fs[0].id}),v=await sb.auth.mfa.verify({factorId:fs[0].id,challengeId:ch.data.id,code:$('#cd').value.trim()});v.error?$('#err').textContent='Kode salah.':boot()}}
async function boot(){const {data}=await sb.auth.getSession();if(!data.session)return login();
 const a=(await sb.auth.mfa.getAuthenticatorAssuranceLevel()).data;if(a&&a.nextLevel==='aal2'&&a.currentLevel!=='aal2')return mfaPrompt();
 const adm=await sb.from('admins').select('user_id').maybeSingle();
 if(!adm.data){root.innerHTML=`<div class="login glass"><div class="win-body"><h1 class="chrome">Akses ditolak</h1><p class="lead" style="margin:1rem 0">Akun ini belum terdaftar sebagai admin. Jalankan SQL <code>insert into public.admins...</code> untuk email ini.</p><button class="btn" id="so">Keluar</button></div></div>`;$('#so').onclick=async()=>{await sb.auth.signOut();login()};return}
 localStorage.wcAdmin=1;D=await Store.load();S=D.settings;Store.faces(S);startIdle();shell()}
function startIdle(){if(idleOn)return;idleOn=1;let t;const m=+localStorage.wcIdle||(Store.cfg.idleMin||15),r=()=>{clearTimeout(t);t=setTimeout(async()=>{await sb.auth.signOut();location.reload()},m*60000)};['pointermove','keydown','click'].forEach(ev=>addEventListener(ev,r,{passive:true}));r()}

/* ---------- preview realtime ---------- */
const DEVW={mobile:390,tablet:768,desktop:1280};
function fit(){const fr=$('#fr'),b=$('#fw');if(!fr||!b||!b.clientWidth||!b.clientHeight)return;const W=DEVW[dev],k=Math.min(1,b.clientWidth/W);fr.style.cssText=`width:${W}px;height:${b.clientHeight/k}px;transform:scale(${k});transform-origin:top center;margin-left:${(b.clientWidth-W)/2}px`}
function push(){const fr=$('#fr');if(fr&&fr.contentWindow)fr.contentWindow.postMessage({wc:'state',settings:S,draft,media:D.media,tracks:D.tracks},'*')}
const pushD=deb(push,30);
function syncFrame(){const fr=$('#fr');if(!fr)return;const h=location.hash,u=/#\/edit\/post/.test(h)?'post.html?embed=1&draft=1':/#\/edit\/page/.test(h)?'page.html?embed=1&draft=1':'index.html?embed=1';if(fr.dataset.u!==u){fr.dataset.u=u;fr.src=u}else push();fit()}
addEventListener('message',e=>{if(e.data&&e.data.wc==='ready')push()});addEventListener('resize',deb(fit,100));
function live(){pushD();dirty=true;flash(autosave?'Menyimpan…':'Belum disimpan',autosave?'':'warn');if(autosave)aSave()}
async function saveSettings(msg){flash('Menyimpan…');const {error}=await sb.from('settings').upsert({id:1,data:S,updated_at:new Date().toISOString()});if(error){toast(error.message,1);flash('Gagal menyimpan','err')}else{dirty=false;flash('Tersimpan','ok');if(msg)toast(msg)}}
const aSave=deb(()=>saveSettings(),900);
async function reload(){const n=await Store.load();D.entries=n.entries;D.media=n.media;D.gb=n.gb;D.hits=n.hits;D.tracks=n.tracks}
addEventListener('beforeunload',e=>{if(dirty&&!autosave){e.preventDefault();e.returnValue=''}});
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();cur&&cur()}});

/* ---------- shell + router ---------- */
const NAV=[['dash','home','Dashboard'],['posts','edit','Artikel'],['pages','file','Halaman'],['profile','user','Profil'],['music','music','Musik'],['media','image','Media & file'],['fonts','type','Font'],['look','palette','Tampilan'],['layout','layout','Layout beranda'],['gen','settings','Pengaturan'],['inbox','mail','Kotak masuk'],['security','lock','Keamanan'],['backup','download','Backup']];
function shell(){root.innerHTML=`<div class="top glass">${S.profile.avatar?`<span class="topav">${avPrev(30)}</span>`:''}<b class="logo chrome">${esc(S.site.name)}</b><span id="st" class="pixel st"></span><label class="sw"><input type="checkbox" id="au"> Auto-simpan</label><label class="sw"><input type="checkbox" id="pvt"> Live preview</label><button class="btn sm" id="svb">${ic('check',15)} Simpan</button><a class="btn sm ghost" href="adjust.html" target="_blank">${ic('sliders',15)} Adjustment</a><a class="btn sm ghost" href="index.html" target="_blank">${ic('external',15)} Situs</a><button class="btn sm ghost" id="out">${ic('logout',15)} Keluar</button></div>
<div class="shell${pvOn?' pv-on':''}" id="sh"><aside class="side glass">${NAV.map(n=>`<a href="#/${n[0]}" data-r="${n[0]}">${ic(n[1],17)} ${n[2]}</a>`).join('')}</aside><main class="view" id="view"></main>
<aside class="pvbox glass" id="pvb"><div class="pvbar"><span class="pixel">live preview</span>${[['mobile','smartphone'],['tablet','tablet'],['desktop','monitor']].map(d=>`<button class="btn sm ghost" data-dv="${d[0]}" title="${d[0]}">${ic(d[1],15)}</button>`).join('')}<button class="btn sm ghost" id="rl" title="Muat ulang">${ic('refresh',15)}</button></div><div class="fw" id="fw"><iframe id="fr" title="Preview" sandbox="allow-scripts allow-same-origin"></iframe></div></aside></div>`;
 $('#au').checked=autosave;$('#pvt').checked=pvOn;$('#au').onchange=e=>{autosave=e.target.checked;localStorage.wcAuto=autosave?1:0;if(autosave&&dirty)aSave()};
 $('#pvt').onchange=e=>{pvOn=e.target.checked;localStorage.wcPv=pvOn?1:0;$('#sh').classList.toggle('pv-on',pvOn);setTimeout(fit,50)};
 $('#svb').onclick=()=>cur&&cur();$('#out').onclick=async()=>{await sb.auth.signOut();location.reload()};
 $$('[data-dv]').forEach(b=>b.onclick=()=>{dev=b.dataset.dv;localStorage.wcDev=dev;fit()});$('#rl').onclick=()=>{const f=$('#fr');f.src=f.src};
 onhashchange=go;go()}
function go(){const p=(location.hash.slice(2)||'dash').split('/'),v=$('#view');draft=null;v.oninput=v.onchange=v.onclick=null;ctx.rerender=null;cur=()=>saveSettings('Tersimpan');
 $$('.side [data-r]').forEach(a=>a.classList.toggle('on',a.dataset.r===(p[0]==='edit'?(p[1]==='page'?'pages':'posts'):p[0])));
 ({dash,posts:()=>list(v,'post'),pages:()=>list(v,'page'),edit:()=>edit(v,p[1],p[2]),profile,music,media,fonts,look:()=>look(v,ctx),layout,gen,inbox,security,backup}[p[0]]||dash)(v);syncFrame();scrollTo(0,0)}

/* ---------- dashboard ---------- */
async function dash(v){v.innerHTML='<h1 class="chrome">Dashboard</h1><div id="ds"></div>';
 const c=(t,f)=>{let q=sb.from(t).select('id',{count:'exact',head:true});return f?f(q):q};
 const [sub,gb]=await Promise.all([c('subscribers'),c('guestbook',q=>q.eq('approved',false))]);
 const posts=D.entries.filter(e=>e.kind==='post'),pub=posts.filter(e=>e.status==='published').length;
 $('#ds').innerHTML=`<div class="stats">${[['Artikel',posts.length,pub+' terbit'],['Halaman',D.entries.length-posts.length,''],['File',D.media.length,'media'],['Pengunjung',D.hits,'total'],['Pelanggan',sub.count||0,'email'],['Buku tamu',gb.count||0,'menunggu']].map(s=>`<div class="glass stat"><span class="pixel">${s[0]}</span><b>${s[1]}</b><small>${s[2]}</small></div>`).join('')}</div>
 <div class="panel glass"><h3>Aksi cepat</h3><div class="acts"><a class="btn" href="#/edit/post/new">${ic('plus',16)} Artikel</a><a class="btn ghost" href="#/edit/page/new">${ic('plus',16)} Halaman</a><a class="btn ghost" href="#/media">${ic('upload',16)} Upload file</a><a class="btn ghost" href="#/fonts">${ic('type',16)} Upload font</a><a class="btn ghost" href="#/look">${ic('palette',16)} Tampilan</a><a class="btn ghost" href="adjust.html" target="_blank">${ic('sliders',16)} Adjustment Studio</a></div></div>
 <div class="panel glass"><h3>Koneksi</h3><p class="hint" style="margin:0">Terhubung ke <b>${esc(new URL(Store.cfg.url).host)}</b> (konfigurasi: ${esc(Store.cfg.src||'')}). Realtime aktif.</p></div>
 <div class="panel glass"><h3>Tips</h3><ol class="steps"><li>Nyalakan <b>Live preview</b> — perubahan tampil seketika tanpa menyimpan.</li><li><b>Adjustment Studio</b> adalah halaman penuh khusus admin untuk menyetel tampilan sambil melihat situs.</li><li>Tekan <code>Ctrl+S</code> untuk menyimpan kapan saja.</li></ol></div>`}

/* ---------- daftar ---------- */
function list(v,kind){const isP=kind==='post',L=isP?'Artikel':'Halaman';
 v.innerHTML=`<h1 class="chrome">${L}</h1><div class="panel glass"><div class="bar"><input type="text" id="s" placeholder="Cari…"><a class="btn" href="#/edit/${kind}/new">${ic('plus',16)} Baru</a></div><div class="tw"><table><thead><tr><th>Judul</th><th>${isP?'Kategori':'Di menu'}</th><th>Terbit</th><th></th></tr></thead><tbody id="tb"></tbody></table></div></div>`;
 const draw=()=>{const q=$('#s').value.toLowerCase();$('#tb').innerHTML=D.entries.filter(x=>x.kind===kind&&x.title.toLowerCase().includes(q)).sort((a,b)=>(b.pinned-a.pinned)||String(b.publish_at).localeCompare(String(a.publish_at))).map(x=>{const fut=x.status==='published'&&new Date(x.publish_at)>new Date(),cm=D.media.find(a=>a.id===x.cover);return `<tr><td class="tt">${cm?`<img class="mini" src="${esc(cm.url)}" alt="">`:`<span class="mini">${ic(x.emoji||'file',18)}</span>`}<div><b>${x.pinned?ic('pin',13)+' ':''}${esc(x.title)}</b><br><small>/${esc(x.slug)} · ${new Date(x.publish_at).toLocaleDateString('id-ID')}${fut?' · terjadwal':''}</small></div></td><td>${isP?esc(x.cat):(x.nav?'Ya':'—')}</td><td><label class="sw"><input type="checkbox" data-s="${x.id}" ${x.status==='published'?'checked':''}></label></td><td class="ac"><a class="btn sm ghost" href="#/edit/${kind}/${x.id}">${ic('edit',14)}</a>${isP?`<button class="btn sm ghost" data-p="${x.id}" title="Sematkan">${ic('pin',14)}</button>`:''}<a class="btn sm ghost" target="_blank" href="${isP?'post.html?s=':'page.html?p='}${encodeURIComponent(x.slug)}&preview=1" title="Lihat">${ic('eye',14)}</a><button class="btn sm ghost" data-d="${x.id}" title="Gandakan">${ic('copy',14)}</button><button class="btn sm ghost" data-x="${x.id}" title="Hapus">${ic('trash',14)}</button></td></tr>`}).join('')||'<tr><td colspan="4" class="empty">Belum ada data.</td></tr>'};
 draw();$('#s').oninput=draw;
 const upd=async(id,p,m)=>{const {error}=await sb.from('entries').update(p).eq('id',id);if(error)toast(error.message,1);else{await reload();toast(m);draw()}};
 $('#tb').onchange=e=>{const i=e.target.dataset.s;if(i)upd(i,{status:e.target.checked?'published':'draft'},e.target.checked?'Diterbitkan':'Jadi draf')};
 $('#tb').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const g=D.entries.find(a=>a.id===(b.dataset.p||b.dataset.d||b.dataset.x));
  if(b.dataset.p)upd(g.id,{pinned:!g.pinned},g.pinned?'Sematan dilepas':'Disematkan');
  if(b.dataset.x&&confirm('Hapus permanen?')){const {error}=await sb.from('entries').delete().eq('id',g.id);error?toast(error.message,1):(await reload(),toast('Dihapus'),draw())}
  if(b.dataset.d){const {id,created_at,updated_at,...r}=g;const {error}=await sb.from('entries').insert({...r,title:g.title+' (salinan)',slug:g.slug+'-salinan-'+Date.now().toString(36).slice(-3),status:'draft'});error?toast(error.message,1):(await reload(),toast('Digandakan'),draw())}}}

/* ---------- upload helper (semua jenis file) ---------- */
const safe=n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w.\-]+/g,'_');
async function shrink(f){if(localStorage.wcShrink==='0'||!/^image\/(jpeg|png|webp)$/.test(f.type)||f.size<3e5)return f;const im=await createImageBitmap(f),k=Math.min(1,1920/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);const t=f.type==='image/png'?'image/png':'image/jpeg',b=await new Promise(r=>c.toBlob(r,t,.85));return b&&b.size<f.size?new File([b],f.name,{type:t}):f}
async function put(f,dir){if(f.size>50e6)throw Error(f.name+' lebih dari 50 MB');const p=`${dir}/${Date.now()}-${Math.random().toString(36).slice(2,6)}-${safe(f.name)}`,{error}=await sb.storage.from('media').upload(p,f,{contentType:f.type||'application/octet-stream',cacheControl:'31536000'});if(error)throw error;return{path:p,url:sb.storage.from('media').getPublicUrl(p).data.publicUrl}}
async function upl(files,onp){const out=[];let n=0;for(const f0 of files){n++;if(onp)onp(`Mengunggah ${n}/${files.length}: ${f0.name}…`);try{const f=await shrink(f0),{path:p,url}=await put(f,'uploads'),{data,error}=await sb.from('media').insert({name:f0.name.replace(/\.[^.]+$/,'').replace(/[\[\]()|]/g,''),path:p,url,mime:f.type||'application/octet-stream',size:f.size}).select().single();if(error)throw error;D.media.unshift(data);out.push(data)}catch(e){toast(e.message||'Gagal mengunggah',1)}}push();return out}
const mdOf=m=>/^(image|video|audio)\//.test(m.mime||'')?`\n\n![${m.name}](media:${m.id})\n\n`:`\n\n[[${m.name}|media:${m.id}]]\n\n`;
const dz=(el,fn)=>{el.ondragover=e=>{e.preventDefault();el.classList.add('ov')};el.ondragleave=()=>el.classList.remove('ov');el.ondrop=e=>{e.preventDefault();el.classList.remove('ov');fn([...e.dataTransfer.files])}};

/* ---------- editor ---------- */
const TB=[['h2','H2'],['h3','H3'],['b','B'],['i','I'],['q',ic('message',15)],['ul',ic('list',15)],['a',ic('link',15)],['med',ic('paperclip',15)+' Media/File'],['yt',ic('play',15)+' YouTube'],['btn',ic('button',15)],['hr',ic('minus',15)]];
function edit(v,kind,id){const isP=kind==='post',isNew=id==='new',back='#/'+(isP?'posts':'pages');
 let x=isNew?{kind,title:'',slug:'',content:'',status:'draft',cat:'Catatan',excerpt:'',emoji:'star',c1:'#8a5cff',c2:'#ff5fd2',cover:'',nav:true,pinned:false,tags:[],meta:{},publish_at:new Date().toISOString(),seo_title:'',seo_desc:''}:D.entries.find(a=>a.id===id);
 if(!x){location.hash=back;return}let auto=isNew;const loc=d=>{d=new Date(d);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16)};
 const M={files:[],gallery:[],...(x.meta||{})};if(!ICONS_OK(x.emoji))x.emoji='star';
 v.innerHTML=`<h1 class="chrome">${isNew?'Baru':'Edit'}: ${isP?'artikel':'halaman'}</h1>
 <div class="panel glass"><div class="row"><label>Judul<input type="text" id="f-title"></label><label>Slug<input type="text" id="f-slug"></label><label>Jadwal terbit<input type="datetime-local" id="f-pub"></label></div>
 ${isP?`<div class="row"><label>Kategori<input type="text" id="f-cat"></label><label>Tag (pisah koma)<input type="text" id="f-tags"></label></div><label>Ringkasan<textarea id="f-excerpt" rows="2"></textarea></label><label class="sw"><input type="checkbox" id="f-pinned"> Sematkan di atas (tampil di “Pilihan editor”)</label>`:`<label class="sw"><input type="checkbox" id="f-nav"> Tampilkan di menu navigasi</label>`}
 <details style="margin-top:1rem"><summary class="hint">SEO</summary><div class="row"><label>Judul SEO<input type="text" id="f-seot"></label><label>Deskripsi SEO<input type="text" id="f-seod"></label></div></details></div>
 ${isP?`<div class="panel glass two"><div><h3>Thumbnail</h3><div class="tbox" id="tbx" style="aspect-ratio:${S.thumbs.ratio}"></div><div class="acts" style="margin-top:.8rem"><button class="btn sm" id="tu">${ic('upload',15)} Unggah</button><button class="btn sm ghost" id="tp">${ic('image',15)} Dari media</button><button class="btn sm ghost" id="tl">${ic('link',15)} URL</button><button class="btn sm ghost" id="tr">${ic('trash',15)} Hapus</button></div><input type="file" id="tf" accept="image/*" hidden><p class="hint">Klik gambar untuk menentukan titik fokus. Tanpa thumbnail, gambar pertama di tulisan dipakai otomatis.</p></div>
 <div><h3>Ikon cadangan &amp; warna</h3><div class="icg" id="icg">${DECOR.map(n=>`<button type="button" data-ic="${n}" title="${n}">${ic(n,20)}</button>`).join('')}</div><div class="row" style="margin-top:1rem"><label>Warna A<input type="color" id="f-c1"></label><label>Warna B<input type="color" id="f-c2"></label></div></div></div>`:''}
 <div class="panel glass"><div class="toolbar">${TB.map(t=>`<button class="btn sm ghost" data-t="${t[0]}">${t[1]}</button>`).join('')}</div><textarea id="f-content" rows="20" style="width:100%;min-height:380px;font-family:ui-monospace,Menlo,monospace;font-size:.9rem" placeholder="Tulis dengan Markdown sederhana… seret file atau tempel gambar ke sini untuk upload otomatis."></textarea><p class="hint">## judul · **tebal** · *miring* · &gt; kutipan · - daftar · [teks](url) · [[Tombol|url]] · page:slug / post:slug · {{youtube:ID}}</p></div>
 <div class="panel glass two"><div><h3>Lampiran file</h3><div id="fl"></div><div class="acts"><button class="btn sm" id="fu">${ic('upload',15)} Unggah</button><button class="btn sm ghost" id="fp">${ic('paperclip',15)} Dari media</button></div><input type="file" id="ff" multiple hidden></div><div><h3>Galeri gambar</h3><div id="gl"></div><div class="acts"><button class="btn sm" id="gu">${ic('upload',15)} Unggah</button><button class="btn sm ghost" id="gp">${ic('image',15)} Dari media</button></div><input type="file" id="gf" accept="image/*" multiple hidden></div></div>
 <div class="acts"><button class="btn" id="pub">${x.status==='published'?'Perbarui':'Terbitkan'}</button><button class="btn ghost" id="dr">Simpan sebagai draf</button><a class="btn ghost" href="${back}">Batal</a>${x.id?`<button class="btn danger" id="del" style="margin-left:auto">${ic('trash',15)} Hapus</button>`:''}</div>`;
 const g=i=>$('#f-'+i),ta=g('content');
 ['title','slug','content','seot','seod'].forEach(k=>g(k).value=x[{seot:'seo_title',seod:'seo_desc'}[k]||k]||'');g('pub').value=loc(x.publish_at);
 if(isP){['cat','excerpt','c1','c2'].forEach(k=>g(k).value=x[k]||'');g('tags').value=(x.tags||[]).join(', ');g('pinned').checked=!!x.pinned}else g('nav').checked=!!x.nav;
 const row=st=>({kind,title:g('title').value.trim(),slug:slug(g('slug').value||g('title').value)||'tanpa-judul',content:ta.value,status:st||x.status,publish_at:new Date(g('pub').value||Date.now()).toISOString(),seo_title:g('seot').value.trim(),seo_desc:g('seod').value.trim(),meta:M,
  ...(isP?{cat:g('cat').value.trim(),tags:g('tags').value.split(',').map(s=>s.trim()).filter(Boolean),emoji:x.emoji,c1:g('c1').value,c2:g('c2').value,excerpt:g('excerpt').value.trim(),cover:x.cover||'',pinned:g('pinned').checked}:{nav:g('nav').checked})});
 const upd=()=>{draft={...x,...row()};pushD()};v.oninput=upd;
 g('title').addEventListener('input',e=>{if(auto)g('slug').value=slug(e.target.value)});g('slug').addEventListener('input',()=>auto=false);
 const ins=(a,b='',ph='')=>{const s=ta.selectionStart,e=ta.selectionEnd;ta.setRangeText(a+(ta.value.slice(s,e)||ph)+b,s,e,'end');ta.focus();upd()};
 const A={h2:()=>ins('\n\n## ','\n\n','Judul'),h3:()=>ins('\n\n### ','\n\n','Subjudul'),b:()=>ins('**','**','tebal'),i:()=>ins('*','*','miring'),q:()=>ins('\n\n> ','\n\n','Kutipan'),ul:()=>ins('\n\n- ','\n','Butir'),a:()=>ins('[','](https://)','teks'),med:()=>pickMedia(()=>D,m=>ins(mdOf(m)),'any'),yt:()=>ins('\n\n{{youtube:','}}\n\n','ID_VIDEO'),btn:()=>ins('[[','|https://]]','Teks tombol'),hr:()=>ins('\n\n---\n\n')};
 $$('[data-t]',v).forEach(b=>b.onclick=A[b.dataset.t]);
 const insFiles=async fs=>{toast('Mengunggah…');for(const m of await upl(fs))ins(mdOf(m))};
 ta.ondragover=e=>e.preventDefault();ta.ondrop=e=>{if(e.dataTransfer.files.length){e.preventDefault();insFiles([...e.dataTransfer.files])}};ta.onpaste=e=>{const fs=[...((e.clipboardData&&e.clipboardData.files)||[])];if(fs.length){e.preventDefault();insFiles(fs)}};
 /* thumbnail */
 if(isP){const drawTb=()=>{const m=D.media.find(a=>a.id===x.cover),u=m?m.url:(M.coverUrl||''),f=(M.focus||'50% 50%').split(' ');$('#tbx').innerHTML=u?`<img src="${esc(u)}" alt="" style="object-position:${esc(M.focus||'50% 50%')}"><i class="fp" style="left:${f[0]};top:${f[1]}">${ic('crosshair',22)}</i>`:`<div class="ti">${ic(x.emoji,56)}</div>`;$$('[data-ic]',v).forEach(b=>b.classList.toggle('on',b.dataset.ic===x.emoji))};
  drawTb();$('#tbx').onclick=e=>{if(!(x.cover||M.coverUrl))return;const r=$('#tbx').getBoundingClientRect();M.focus=`${Math.round((e.clientX-r.left)/r.width*100)}% ${Math.round((e.clientY-r.top)/r.height*100)}%`;drawTb();upd()};
  $('#tu').onclick=()=>$('#tf').click();$('#tf').onchange=async e=>{const [m]=await upl([...e.target.files]);if(m){x.cover=m.id;M.coverUrl='';drawTb();upd()}};dz($('#tbx'),async fs=>{const [m]=await upl(fs.filter(f=>f.type.startsWith('image/')));if(m){x.cover=m.id;M.coverUrl='';drawTb();upd()}});
  $('#tp').onclick=()=>pickMedia(()=>D,m=>{x.cover=m.id;M.coverUrl='';drawTb();upd()},'image');$('#tr').onclick=()=>{x.cover='';M.coverUrl='';M.focus='';drawTb();upd()};
  $('#tl').onclick=()=>{const u=prompt('URL gambar (https://…):',M.coverUrl||'');if(u&&/^https:\/\//.test(u)){M.coverUrl=u.trim();x.cover='';drawTb();upd()}};
  $('#icg').onclick=e=>{const b=e.target.closest('[data-ic]');if(b){x.emoji=b.dataset.ic;drawTb();upd()}}}
 /* lampiran & galeri */
 const drawIds=(key,box)=>{$(box).innerHTML=M[key].map((id,i)=>{const m=D.media.find(a=>a.id===id);return m?`<div class="glass sec">${ic(fileIcon(m),16)}<b>${esc(m.name)}</b><small>${fsz(m.size)}</small><button class="btn sm ghost" data-rm="${key}:${i}">${ic('x',14)}</button></div>`:''}).join('')||'<p class="hint">Belum ada.</p>'};
 const redraw=()=>{drawIds('files','#fl');drawIds('gallery','#gl')};redraw();
 const add=(key,ms)=>{ms.forEach(m=>{if(m&&!M[key].includes(m.id))M[key].push(m.id)});redraw();upd()};
 $('#fu').onclick=()=>$('#ff').click();$('#ff').onchange=async e=>add('files',await upl([...e.target.files]));$('#fp').onclick=()=>pickMedia(()=>D,m=>add('files',[m]),'any');
 $('#gu').onclick=()=>$('#gf').click();$('#gf').onchange=async e=>add('gallery',await upl([...e.target.files]));$('#gp').onclick=()=>pickMedia(()=>D,m=>add('gallery',[m]),'image');
 v.onclick=e=>{const b=e.target.closest('[data-rm]');if(b){const [k,i]=b.dataset.rm.split(':');M[k].splice(+i,1);redraw();upd()}};
 const commit=async(st,stay)=>{const r=row(st);if(!r.title){toast('Judul wajib diisi',1);return}
  if(D.entries.some(a=>a.kind===kind&&a.slug===r.slug&&a.id!==x.id)){toast('Slug sudah dipakai',1);return}
  flash('Menyimpan…');const {data,error}=await(x.id?sb.from('entries').update(r).eq('id',x.id):sb.from('entries').insert(r)).select().single();
  if(error){toast(/meta/.test(error.message)?'Jalankan ulang supabase/schema.sql (kolom meta belum ada)':error.message,1);flash('Gagal menyimpan','err');return}await reload();toast(r.status==='published'?'Diterbitkan':'Tersimpan');flash('Tersimpan','ok');
  if(!stay)location.hash=back;else if(!x.id)location.hash='#/edit/'+kind+'/'+data.id;else x=data};
 $('#pub').onclick=()=>commit('published');$('#dr').onclick=()=>commit('draft');cur=()=>commit(x.status||'draft',1);
 if(x.id)$('#del').onclick=async()=>{if(confirm('Hapus permanen?')){const {error}=await sb.from('entries').delete().eq('id',x.id);error?toast(error.message,1):(await reload(),location.hash=back)}};
 upd()}
const ICONS_OK=n=>DECOR.includes(n);


/* ---------- profil (khusus pemilik) ---------- */
function avPrev(sz){const P=S.profile,m=D.media.find(x=>x.id===P.avatar);return `<span class="av av-${esc(P.shape)} ring-${esc(P.ring)}" style="--s:${sz}px">${m?`<img src="${esc(m.url)}" alt="">`:`<span class="ai">${ic('user',Math.round(sz*.5))}</span>`}<i class="pres pres-${esc(P.presence)}"></i></span>`}
function profile(v){const draw=()=>{v.innerHTML=`<h1 class="chrome">Profil</h1><div class="panel glass two"><div class="pvav">${avPrev(S.profile.size)}</div><div><h3>Foto profil &amp; banner</h3><p class="hint" style="margin:0 0 1rem">Mendukung gambar <b>JPG, PNG, WebP, dan GIF animasi</b> (GIF tidak dikompres agar tetap bergerak).</p><div class="acts"><button class="btn sm" id="au1">${ic('upload',15)} Unggah foto profil</button><button class="btn sm ghost" id="au2">${ic('image',15)} Unggah banner</button></div><input type="file" id="fa" accept="image/*" hidden><input type="file" id="fb" accept="image/*" hidden></div></div>${panels(UI.SCHEMA.profil,S)}`;bind(v,{...ctx,rerender:draw});
  const up=(btn,inp,key)=>{$(btn).onclick=()=>$(inp).click();$(inp).onchange=async e=>{const [m]=await upl([...e.target.files]);if(m){S.profile[key]=m.id;live();draw()}}};up('#au1','#fa','avatar');up('#au2','#fb','banner')};draw()}

/* ---------- musik ---------- */
async function id3(file){try{const h=new Uint8Array(await file.slice(0,10).arrayBuffer());if(String.fromCharCode(h[0],h[1],h[2])!=='ID3')return{};const ver=h[3],size=((h[6]&127)<<21)|((h[7]&127)<<14)|((h[8]&127)<<7)|(h[9]&127);
 const b=new Uint8Array(await file.slice(10,10+Math.min(size,14e6)).arrayBuffer()),out={};let p=0;const dec=(e,u)=>new TextDecoder(e===1?'utf-16le':e===2?'utf-16be':e===3?'utf-8':'iso-8859-1').decode(u).replace(/\0+$/,'').replace(/^\uFEFF/,'');
 while(p+10<b.length){const id=String.fromCharCode(b[p],b[p+1],b[p+2],b[p+3]);if(!/^[A-Z0-9]{4}$/.test(id))break;
  const fs=ver===4?((b[p+4]&127)<<21)|((b[p+5]&127)<<14)|((b[p+6]&127)<<7)|(b[p+7]&127):((b[p+4]<<24)|(b[p+5]<<16)|(b[p+6]<<8)|b[p+7])>>>0,d=b.subarray(p+10,p+10+fs);p+=10+fs;
  if(id[0]==='T'&&id!=='TXXX'){const m={TIT2:'title',TPE1:'artist',TALB:'album',TYER:'year',TDRC:'year',TCON:'genre'}[id];if(m)out[m]=dec(d[0],d.subarray(1)).slice(0,m==='year'?4:200)}
  else if(id==='APIC'){const enc=d[0];let i=1;while(d[i])i++;const mime=String.fromCharCode(...d.subarray(1,i));i+=2;if(enc===1||enc===2){while(i<d.length&&!(d[i]===0&&d[i+1]===0))i+=2;i+=2}else{while(d[i])i++;i++}out.pic=new Blob([d.subarray(i)],{type:mime.includes('/')?mime:'image/jpeg'})}}
 return out}catch(e){return{}}}
const durOf=f=>new Promise(ok=>{const a=new Audio(),u=URL.createObjectURL(f);a.preload='metadata';a.onloadedmetadata=()=>{ok(Math.round(a.duration)||0);URL.revokeObjectURL(u)};a.onerror=()=>ok(0);a.src=u});
async function music(v){
 const tr=()=>D.tracks||[];
 const draw=()=>{v.innerHTML=`<h1 class="chrome">Musik</h1>
 <div class="panel glass"><label class="drop" id="dz">${ic('music',28)}<span>Tarik file audio (mp3, m4a, ogg, wav, flac) — judul, artis, album, tahun, genre &amp; sampul dibaca otomatis dari tag ID3</span><input type="file" id="fi" accept="audio/*,.mp3,.m4a,.flac,.ogg,.wav" multiple hidden></label><p class="hint" id="pg">Aktifkan pemutar di bagian “Pengaturan pemutar” di bawah.</p></div>
 <div id="tl">${tr().map((t,i)=>{const c=D.media.find(a=>a.id===t.cover),au=D.media.find(a=>a.id===t.audio);return `<div class="glass trk" data-id="${t.id}"><div class="tcov">${c?`<img src="${esc(c.url)}" alt="">`:ic('music',26)}</div><div class="tf"><div class="row"><label>Judul<input type="text" data-f="title" value="${esc(t.title)}"></label><label>Artis<input type="text" data-f="artist" value="${esc(t.artist)}"></label><label>Album<input type="text" data-f="album" value="${esc(t.album)}"></label></div><div class="row"><label>Tahun<input type="text" data-f="year" value="${esc(t.year)}" maxlength="4"></label><label>Genre<input type="text" data-f="genre" value="${esc(t.genre)}"></label><label>Kecepatan bawaan lagu<input type="number" step="0.05" min="0.5" max="2" data-f="speed" value="${t.speed||1}"></label></div><small class="hint">${au?esc(au.name)+' · '+fsz(au.size):'file audio hilang'} · ${t.duration?Math.floor(t.duration/60)+':'+String(t.duration%60).padStart(2,'0'):''}</small></div><div class="tb2"><label class="sw" title="Tampilkan di pemutar"><input type="checkbox" data-f="active" ${t.active!==false?'checked':''}></label><button class="btn sm ghost" data-a="cov" title="Ganti sampul">${ic('image',14)}</button><button class="btn sm ghost" data-a="lrc" title="Lirik (LRC)">${ic('mic',14)}</button><button class="btn sm ghost" data-a="up" ${i?'':'disabled'}>${ic('chevron-up',14)}</button><button class="btn sm ghost" data-a="dn" ${i<tr().length-1?'':'disabled'}>${ic('chevron-down',14)}</button><button class="btn sm ghost" data-a="del">${ic('trash',14)}</button></div></div>`}).join('')||'<p class="empty">Belum ada lagu.</p>'}</div>
 <div class="panel glass"><h3>Pengaturan pemutar</h3><p class="hint" style="margin:0">Atur gaya, visualizer, nightcore, dan info yang tampil. Lihat hasilnya di live preview.</p></div>${panels(UI.SCHEMA.player,S)}`;
  bind(v,{...ctx,rerender:draw});dz($('#dz'),add);$('#fi').onchange=e=>add([...e.target.files])};
 const add=async fs=>{fs=fs.filter(f=>f.type.startsWith('audio/')||/\.(mp3|m4a|flac|ogg|wav|aac)$/i.test(f.name));let n=0;
  for(const f of fs){n++;$('#pg').textContent=`Memproses ${n}/${fs.length}: ${f.name}…`;try{const tg=await id3(f),dur=await durOf(f),[am]=await upl([f]);if(!am)continue;let cid='';if(tg.pic&&tg.pic.size>500){const ext=(tg.pic.type.split('/')[1]||'jpg').replace('jpeg','jpg'),[cm]=await upl([new File([tg.pic],(tg.title||f.name)+' (sampul).'+ext,{type:tg.pic.type})]);if(cm)cid=cm.id}
   const {error}=await sb.from('tracks').insert({title:tg.title||f.name.replace(/\.[^.]+$/,''),artist:tg.artist||'',album:tg.album||'',year:tg.year||'',genre:tg.genre||'',audio:am.id,cover:cid,duration:dur,sort:Math.max(0,...tr().map(t=>t.sort||0))+1});if(error)throw error;await reload()}catch(e){toast(/tracks/.test(e.message||'')?'Jalankan ulang supabase/schema.sql (tabel tracks belum ada)':(e.message||'Gagal'),1)}}
  $('#pg').textContent=fs.length?'Selesai':'';draw();push()};
 draw();
 const upd=async(id,p)=>{const {error}=await sb.from('tracks').update(p).eq('id',id);if(error)toast(error.message,1);else{await reload();push()}};
 v.onchange=e=>{const f=e.target.dataset.f;if(!f)return;const id=e.target.closest('.trk').dataset.id;upd(id,{[f]:f==='active'?e.target.checked:f==='speed'?+e.target.value||1:e.target.value})};
 v.onclick=async e=>{const b=e.target.closest('[data-a]');if(!b||!b.closest('.trk'))return;const id=b.closest('.trk').dataset.id,t=tr().find(x=>x.id===id),a=b.dataset.a,i=tr().findIndex(x=>x.id===id);
  if(a==='del'&&confirm('Hapus lagu ini? (file audio tetap ada di Media)')){await sb.from('tracks').delete().eq('id',id);await reload();draw();push()}
  if(a==='cov')pickMedia(()=>D,async m=>{await upd(id,{cover:m.id});draw()},'image');
  if(a==='lrc'){const o=document.createElement('div');o.className='modal';o.innerHTML=`<div class="glass box"><div class="win-bar"><b></b><b></b><b></b><span>lirik — ${esc(t.title)}</span></div><div class="win-body"><p class="hint">Tempel lirik. Format LRC ber-timestamp, mis. <code>[00:12.50] baris lirik</code>, akan disinkronkan dengan lagu.</p><textarea id="lt" rows="14" style="width:100%;font-family:ui-monospace,monospace">${esc(t.lyrics||'')}</textarea><div class="acts" style="margin-top:1rem"><button class="btn sm" id="ls">Simpan</button><button class="btn ghost sm" id="lc">Batal</button></div></div></div>`;document.body.appendChild(o);$('#lc',o).onclick=()=>o.remove();$('#ls',o).onclick=async()=>{await upd(id,{lyrics:$('#lt',o).value});o.remove();toast('Lirik tersimpan')}}
  if(a==='up'||a==='dn'){const j=a==='up'?i-1:i+1,o=tr()[j];if(!o)return;await sb.from('tracks').update({sort:o.sort}).eq('id',t.id);await sb.from('tracks').update({sort:t.sort}).eq('id',o.id);await reload();draw();push()}}}

/* ---------- media ---------- */
function media(v){let flt='all',q='';
 v.innerHTML=`<h1 class="chrome">Media &amp; file</h1><div class="panel glass"><label class="drop" id="dz">${ic('upload',28)}<span>Tarik file apa saja ke sini atau klik untuk upload — gambar, video, audio, PDF, ZIP, dokumen (maks 50 MB)</span><input type="file" id="fi" multiple hidden></label><label class="sw" style="margin-top:1rem"><input type="checkbox" id="sk"> Kecilkan gambar besar otomatis (maks 1920px)</label><p class="hint" id="pg"></p></div>
 <div class="panel glass"><div class="bar"><input type="text" id="s" placeholder="Cari file…"></div><div class="mtabs">${[['all','Semua'],['image','Gambar'],['video','Video'],['audio','Audio'],['other','Lainnya']].map(t=>`<button class="btn sm ghost${t[0]==='all'?' on':''}" data-f="${t[0]}">${t[1]}</button>`).join('')}</div><div class="mgrid" id="mg"></div></div>`;
 $('#sk').checked=localStorage.wcShrink!=='0';$('#sk').onchange=e=>localStorage.wcShrink=e.target.checked?1:0;
 const match=m=>{const t=(m.mime||'').split('/')[0];return(flt==='all'||(flt==='other'?!['image','video','audio'].includes(t):t===flt))&&m.name.toLowerCase().includes(q)};
 const draw=()=>$('#mg').innerHTML=D.media.filter(match).map(m=>`<figure class="glass mi">${thumbOf(m)}<figcaption><b>${esc(m.name)}</b><br><small>${fsz(m.size)} · ${esc(m.mime||'?')}</small><div><button class="btn sm ghost" data-c="${m.id}" title="Salin kode">${ic('copy',14)}</button><button class="btn sm ghost" data-u="${m.id}" title="Salin URL">${ic('link',14)}</button><button class="btn sm ghost" data-r="${m.id}" title="Ganti nama">${ic('edit',14)}</button><button class="btn sm ghost" data-x="${m.id}" title="Hapus">${ic('trash',14)}</button></div></figcaption></figure>`).join('')||'<p class="empty">Tidak ada file.</p>';
 const up=async fs=>{await upl(fs,t=>$('#pg').textContent=t);$('#pg').textContent='Selesai';await reload();draw()};
 draw();$('#fi').onchange=e=>up([...e.target.files]);dz($('#dz'),up);
 $('#s').oninput=e=>{q=e.target.value.toLowerCase();draw()};$$('[data-f]',v).forEach(b=>b.onclick=()=>{flt=b.dataset.f;$$('[data-f]',v).forEach(x=>x.classList.toggle('on',x===b));draw()});
 $('#mg').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const m=D.media.find(a=>a.id===(b.dataset.c||b.dataset.u||b.dataset.r||b.dataset.x));
  const cp=async t=>{try{await navigator.clipboard.writeText(t);toast('Disalin')}catch(_){prompt('Salin:',t)}};
  if(b.dataset.c)cp(mdOf(m).trim());if(b.dataset.u)cp(m.url);
  if(b.dataset.r){const n=prompt('Nama baru:',m.name);if(n){await sb.from('media').update({name:n.replace(/[\[\]()|]/g,'')}).eq('id',m.id);await reload();draw()}}
  if(b.dataset.x&&confirm('Hapus file ini? Tulisan yang memakainya akan kehilangan file tersebut.')){await sb.storage.from('media').remove([m.path]);await sb.from('media').delete().eq('id',m.id);await reload();draw();push()}}}

/* ---------- font ---------- */
function fonts(v){v.innerHTML=`<h1 class="chrome">Font kustom</h1><div class="panel glass"><label class="drop" id="dz">${ic('type',28)}<span>Upload font .ttf / .otf / .woff / .woff2</span><input type="file" id="fi" accept=".ttf,.otf,.woff,.woff2" multiple hidden></label><p class="hint" id="pg">Setelah diunggah, klik “Pakai” atau pilih di Tampilan → Tipografi.</p></div><div id="fl"></div>`;
 const draw=()=>{Store.faces(S);$('#fl').innerHTML=S.fonts.map((f,i)=>`<div class="glass fnt"><b>${esc(f.name)}</b> <small>(${esc(f.fmt)})</small><div class="sample" style="font-family:'${esc(f.name)}'">Aa Bb Cc 123 — The quick brown fox</div><div class="acts"><button class="btn sm ghost" data-u="${i}:fDisplay">Pakai: Judul</button><button class="btn sm ghost" data-u="${i}:fBody">Pakai: Isi</button><button class="btn sm ghost" data-u="${i}:fPixel">Pakai: Label</button><button class="btn sm ghost" data-x="${i}">${ic('trash',14)}</button></div></div>`).join('')||'<p class="empty">Belum ada font unggahan.</p>'};
 const up=async fs=>{for(const f of fs){const ext=f.name.split('.').pop().toLowerCase(),fmt={ttf:'truetype',otf:'opentype',woff:'woff',woff2:'woff2'}[ext];if(!fmt){toast(f.name+': format tidak didukung',1);continue}
  let name=(prompt('Nama font:',f.name.replace(/\.[^.]+$/,'').replace(/[^\w \-]/g,' ').trim())||'').replace(/[^\w \-]/g,'').trim();if(!name)continue;if(S.fonts.some(a=>a.name===name)||Store.FONTS[name])name+=' '+Math.random().toString(36).slice(2,4);
  try{$('#pg').textContent='Mengunggah '+f.name+'…';const {path:p,url}=await put(f,'fonts');S.fonts.push({name,url,fmt,path:p});await saveSettings();draw();push();$('#pg').textContent='Font siap dipakai'}catch(e){toast(e.message||'Gagal',1)}}};
 draw();$('#fi').onchange=e=>up([...e.target.files]);dz($('#dz'),up);
 $('#fl').onclick=async e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.u){const [i,k]=b.dataset.u.split(':');S.theme[k]=S.fonts[i].name;Store.faces(S);live();toast('Font dipakai')}
  if(b.dataset.x&&confirm('Hapus font ini?')){const f=S.fonts[b.dataset.x];await sb.storage.from('media').remove([f.path]);['fDisplay','fBody','fPixel'].forEach(k=>{if(S.theme[k]===f.name)S.theme[k]=Store.DEF.theme[k]});S.fonts.splice(b.dataset.x,1);await saveSettings();draw();push()}}}

/* ---------- layout, pengaturan ---------- */
const SN={hero:'Hero (judul utama)',marquee:'Teks berjalan',featured:'Pilihan editor (artikel tersemat)',posts:'Daftar artikel',custom:'Blok kustom',guestbook:'Buku tamu',newsletter:'Newsletter'};
function layout(v){const L=S.layout.sections;v.innerHTML=`<h1 class="chrome">Layout beranda</h1><div class="panel glass"><p class="hint" style="margin:0 0 1rem">Nyalakan/matikan bagian dan ubah urutannya. Perubahan tampil langsung di preview.</p>${L.map((s,i)=>`<div class="glass sec"><label class="sw"><input type="checkbox" data-i="${i}" ${s.on?'checked':''}></label><b>${SN[s.id]||s.id}</b><button class="btn sm ghost" data-m="${i}:-1" ${i?'':'disabled'}>${ic('chevron-up',15)}</button><button class="btn sm ghost" data-m="${i}:1" ${i<L.length-1?'':'disabled'}>${ic('chevron-down',15)}</button></div>`).join('')}</div>`;
 v.onchange=e=>{if(e.target.dataset.i!=null){L[e.target.dataset.i].on=e.target.checked?1:0;live()}};
 v.onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;const [i,d]=b.dataset.m.split(':').map(Number);[L[i],L[i+d]]=[L[i+d],L[i]];layout(v);live()}}
function gen(v){v.innerHTML=`<h1 class="chrome">Pengaturan</h1>${panels(UI.SCHEMA.gen,S)}`;bind(v,{...ctx,rerender:()=>gen(v)})}

/* ---------- kotak masuk ---------- */
async function inbox(v){v.innerHTML='<h1 class="chrome">Kotak masuk</h1><p class="hint">Memuat…</p>';
 const [s,g]=await Promise.all([sb.from('subscribers').select('*').order('created_at',{ascending:false}),sb.from('guestbook').select('*').order('created_at',{ascending:false})]);const ds=s.data||[],dg=g.data||[];
 v.innerHTML=`<h1 class="chrome">Kotak masuk</h1><div class="two"><div class="panel glass"><h3>${ic('mail',17)} Pelanggan (${ds.length})</h3><div class="acts" style="margin-bottom:1rem"><button class="btn sm ghost" id="csv">${ic('download',14)} Ekspor CSV</button></div><div class="tw"><table><tbody>${ds.map(x=>`<tr><td>${esc(x.email)}<br><small>${new Date(x.created_at).toLocaleDateString('id-ID')}</small></td><td class="ac"><button class="btn sm ghost" data-ds="${x.id}">${ic('trash',14)}</button></td></tr>`).join('')||'<tr><td class="empty">Belum ada.</td></tr>'}</tbody></table></div></div>
 <div class="panel glass"><h3>${ic('book',17)} Buku tamu (${dg.length})</h3><div class="tw"><table><tbody>${dg.map(x=>`<tr><td><b>${esc(x.name)}</b> <small>${new Date(x.created_at).toLocaleDateString('id-ID')}</small><br>${esc(x.message)}</td><td class="ac"><label class="sw" title="Tampilkan"><input type="checkbox" data-ga="${x.id}" ${x.approved?'checked':''}></label><button class="btn sm ghost" data-dg="${x.id}">${ic('trash',14)}</button></td></tr>`).join('')||'<tr><td class="empty">Belum ada.</td></tr>'}</tbody></table></div></div></div>`;
 $('#csv').onclick=()=>dl('pelanggan.csv','email,tanggal\n'+ds.map(x=>x.email+','+x.created_at).join('\n'),'text/csv');
 v.onchange=async e=>{if(e.target.dataset.ga){await sb.from('guestbook').update({approved:e.target.checked}).eq('id',e.target.dataset.ga);toast(e.target.checked?'Ditampilkan':'Disembunyikan')}};
 v.onclick=async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.ds&&confirm('Hapus?')){await sb.from('subscribers').delete().eq('id',b.dataset.ds);inbox(v)}if(b.dataset.dg&&confirm('Hapus?')){await sb.from('guestbook').delete().eq('id',b.dataset.dg);inbox(v)}}}

/* ---------- keamanan ---------- */
async function security(v){const u=(await sb.auth.getUser()).data.user,fs=((await sb.auth.mfa.listFactors()).data||{}).totp||[];
 v.innerHTML=`<h1 class="chrome">Keamanan</h1>
 <div class="panel glass"><h3>Akun</h3><p class="hint">Masuk sebagai <b>${esc(u.email)}</b>. Login memakai Supabase Auth; data dilindungi Row Level Security.</p><div class="acts" style="margin-top:1rem"><button class="btn ghost sm" id="so">Keluarkan sesi lain</button></div></div>
 <div class="panel glass"><h3>Halaman tersembunyi</h3><p class="hint" style="margin:0">Halaman <code>adjust.html</code> tidak ditautkan di situs publik, ditandai noindex, dan hanya tampil bagi admin yang sudah login — pengunjung lain melihat halaman 404 biasa. Untuk menyembunyikan <code>admin.html</code> juga, isi <code>adminKey</code> di <code>js/config.js</code>, lalu buka <code>admin.html#k=KUNCIMU</code>.</p></div>
 <div class="panel glass"><h3>Ganti kata sandi</h3><div class="row"><label>Sandi baru (min. 10 karakter)<input type="password" id="p1" autocomplete="new-password"></label><label>Ulangi<input type="password" id="p2" autocomplete="new-password"></label></div><button class="btn sm" id="np">Ganti sandi</button></div>
 <div class="panel glass"><h3>Autentikasi 2 langkah (TOTP)</h3><div id="mf">${fs.length?`<p class="hint">2FA <b style="color:var(--lime)">aktif</b>.</p><button class="btn danger sm" id="mo">Matikan 2FA</button>`:'<button class="btn sm" id="me">Aktifkan 2FA</button>'}</div></div>
 <div class="panel glass"><h3>Auto-logout</h3><label>Keluar otomatis setelah tidak aktif<br><input type="range" id="id" min="5" max="120" step="5"><output></output></label><p class="hint">Berlaku pada login berikutnya.</p></div>
 <div class="panel glass"><h3>Checklist</h3><ol class="steps"><li>Matikan “Allow new users to sign up” di Supabase → Authentication.</li><li>Jangan pernah memakai <code>service_role</code> key — hanya anon key.</li><li>Di Netlify, file <code>_headers</code> menambah CSP &amp; header keamanan.</li></ol></div>`;
 $('#so').onclick=async()=>{await sb.auth.signOut({scope:'others'});toast('Sesi lain dikeluarkan')};
 $('#np').onclick=async()=>{const a=$('#p1').value;if(a.length<10||a!==$('#p2').value){toast('Minimal 10 karakter dan harus sama',1);return}const {error}=await sb.auth.updateUser({password:a});error?toast(error.message,1):toast('Kata sandi diganti')};
 const id=$('#id'),o=id.nextElementSibling;id.value=localStorage.wcIdle||Store.cfg.idleMin||15;o.textContent=id.value+' mnt';id.oninput=()=>{localStorage.wcIdle=id.value;o.textContent=id.value+' mnt'};
 if(fs.length)$('#mo').onclick=async()=>{if(confirm('Matikan 2FA?')){await sb.auth.mfa.unenroll({factorId:fs[0].id});security(v)}};
 else $('#me').onclick=async()=>{const {data,error}=await sb.auth.mfa.enroll({factorType:'totp'});if(error){toast(error.message,1);return}
  $('#mf').innerHTML=`<p class="hint">Pindai QR dengan aplikasi autentikator, lalu masukkan kode.</p><img class="qr" src="${esc(data.totp.qr_code)}" alt="QR"><p class="hint">Kunci manual: <code>${esc(data.totp.secret)}</code></p><div class="row"><label>Kode 6 digit<input type="text" id="cd" maxlength="6" inputmode="numeric"></label></div><button class="btn sm" id="vf">Verifikasi &amp; aktifkan</button>`;
  $('#vf').onclick=async()=>{const ch=await sb.auth.mfa.challenge({factorId:data.id}),r=await sb.auth.mfa.verify({factorId:data.id,challengeId:ch.data.id,code:$('#cd').value.trim()});r.error?toast('Kode salah',1):(toast('2FA aktif'),security(v))}}}

/* ---------- backup ---------- */
function backup(v){v.innerHTML=`<h1 class="chrome">Backup &amp; impor</h1><div class="panel glass"><h3>Ekspor</h3><p class="hint" style="margin:0 0 1rem">Pengaturan, artikel, halaman, dan daftar media (file tetap di Supabase Storage).</p><button class="btn" id="bk">${ic('download',16)} Unduh backup (.json)</button></div><div class="panel glass"><h3>Impor</h3><p class="hint" style="margin:0 0 1rem">Pengaturan ditimpa; artikel/halaman digabung berdasarkan slug.</p><label class="btn ghost" style="margin:0">${ic('upload',16)} Pilih file backup<input type="file" id="im" accept=".json" hidden></label></div>`;
 $('#bk').onclick=()=>dl('backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({settings:S,entries:D.entries,media:D.media}));
 $('#im').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!d.settings||!Array.isArray(d.entries))throw Error();if(!confirm('Impor backup ini?'))return;
  S=D.settings=Store.norm(d.settings);await saveSettings();const rows=d.entries.map(({id,created_at,updated_at,...r})=>r);const {error}=await sb.from('entries').upsert(rows,{onConflict:'kind,slug'});if(error)throw error;await reload();toast('Backup diimpor')}catch(err){toast('Gagal impor: '+(err.message||'file tidak valid'),1)}}}

/* ---------- mulai ---------- */
if(!Store.state.sdk||!sb)return setup();
const pr=await probe();if(pr)return setup(pr);
boot();
})();
