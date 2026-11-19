/* ===== store.js — data (Supabase), markdown mini, tema & wallpaper ===== */
const Store=(()=>{
const DEF={
site:{name:'pixel dreamer',tagline:'Catatan tentang desain, kode, dan nostalgia internet.',favicon:'disc',ogImage:'',lang:'id',footer:'© 2026 Pixel Dreamer — dibuat dengan cahaya neon dan kopi.',
 logoIcon:'disc',logoImage:'',showLogoIcon:1,
 heroKicker:'> selamat datang di ruang kecilku',heroTitle:'Web yang\nberkilau lagi.',heroSub:'Catatan tentang desain, kode, dan nostalgia internet — ditulis seperti surat untuk teman lama.',
 btn1:'Baca artikel terbaru',btn1Url:'#artikel',btn2:'Langganan',btn2Url:'#langganan',stickerIcon:'disc',stickerImage:'',
 postsTitle:'Tulisan terbaru',postsLimit:0,featTitle:'Pilihan editor',marquee:'artikel baru tiap minggu\nglass & chrome\nweb 2000-an\nditulis dengan cinta',
 customTitle:'',customBody:'',nlTitle:'Surat mingguan, tanpa spam.',nlSub:'Satu email tiap Jumat berisi tulisan baru dan tautan menarik.',
 gbTitle:'Buku tamu',gbSub:'Tinggalkan jejak di sini — pesan tampil setelah disetujui.',navExtra:'',social:'',maintenance:0,maintMsg:'Situs sedang dirapikan. Kembali sebentar lagi.'},
theme:{pink:'#ff5fd2',cyan:'#5ff5ff',lime:'#d4ff5f',violet:'#8a5cff',bg:'#0a0618',ink:'#f4efff',mute:'#b9aedd',link:'#5ff5ff',sel:'#ff5fd2',
 fDisplay:'Unbounded',fBody:'Space Grotesk',fPixel:'VT323',base:16,lh:1.7,hw:800,ls:-.03,upper:0,h2s:1,pSize:1,
 blur:20,glass:7,sat:170,border:28,radius:22,shadow:60,width:1120,cardw:290,sp:1,gap:1,layout:'grid',heroAlign:'left',heroSize:1,btn:'chrome',navStyle:'float',
 speed:1,ease:'smooth',aurora:100,trans:'circle',rev:'rise',mqSpeed:26,mqSize:1,cursor:'auto',glowI:22,css:''},
thumbs:{ratio:'16/10',fit:'cover',hover:'zoom',pos:'50% 50%',tag:1,excerpt:1,date:0,read:0,auto:1,big:1},
wall:{mode:'aurora',c1:'#1a0b3d',c2:'#3d0b4a',c3:'#0b2a4a',c4:'#0a0618',gtype:'linear',angle:135,image:'',video:'',imgFit:'cover',imgBlur:0,imgOp:100,parallax:0,
 overlay:'#000000',overlayOp:0,pattern:'none',patColor:'#ffffff',patOp:8,patSize:28,dyn:'off',dynSpeed:40,dynRange:360,dynAurora:1,dynAccent:0},
fx:{aurora:1,glow:1,trail:0,stars:1,grain:0,scan:0,chrome:1,marquee:1,reveal:1,transition:1,tilt:1,sticker:1,counter:1,search:1,filters:1,progress:1,winbar:1,scrollbar:1},
layout:{sections:[{id:'hero',on:1},{id:'marquee',on:1},{id:'featured',on:0},{id:'posts',on:1},{id:'custom',on:0},{id:'guestbook',on:1},{id:'newsletter',on:1}]},
fonts:[]};
const FONTS={Unbounded:'Unbounded:wght@500;800',Syne:'Syne:wght@500;800','Bricolage Grotesque':'Bricolage+Grotesque:wght@500;800',Bungee:'Bungee','Rubik Mono One':'Rubik+Mono+One','Dela Gothic One':'Dela+Gothic+One',
 'Space Grotesk':'Space+Grotesk:wght@400;500;600',Inter:'Inter:wght@400;600;800','DM Sans':'DM+Sans:wght@400;600;800',Manrope:'Manrope:wght@400;600;800',Lora:'Lora:wght@400;600','JetBrains Mono':'JetBrains+Mono:wght@400;600',
 VT323:'VT323','Press Start 2P':'Press+Start+2P',Silkscreen:'Silkscreen:wght@400;700',DotGothic16:'DotGothic16'};
const E=(id,title,cat,icon,c1,c2,excerpt,content,kind='post',nav=false)=>({id,kind,title,slug:title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),cat,emoji:icon,c1,c2,cover:'',excerpt,content,status:'published',nav,pinned:false,tags:[],meta:{},publish_at:'2026-11-01T00:00:00Z'});
const DEMO=[E('d1','Selamat datang di mode demo','Info','star','#8a5cff','#ff5fd2','Situs belum terhubung ke Supabase, jadi ini hanya contoh.','Ini adalah **mode demo**. Hubungkan Supabase lewat admin.html, lalu semua yang kamu tulis tersimpan di database.\n\n> Situs pribadi adalah kamar, bukan etalase.\n\n[[Buka admin|admin.html]]'),
 E('d2','Chrome, gradien, dan kaca','Desain','layers','#5ff5ff','#8a5cff','Semua efek bisa diatur dari panel admin.','Atur **blur**, warna, font, wallpaper, dan animasi lewat menu Tampilan.'),
 E('d3','Tentang','','heart','#ff5fd2','#d4ff5f','','Halo! Ini halaman contoh.','page',true)];

/* konfigurasi koneksi: config.js, lalu cadangan dari localStorage (layar setup admin) */
const C=Object.assign({},window.WC||{});
if(!(C.url&&C.key)){try{Object.assign(C,JSON.parse(localStorage.wcCfg||'{}'),{src:'lokal'})}catch(e){}}else C.src='config.js';
C.url=String(C.url||'').trim().replace(/\/+$/,'').replace(/\/rest\/v1$/,'');C.key=String(C.key||'').trim();
const state={sdk:!!(window.supabase&&window.supabase.createClient),cfg:!!(C.url&&C.key),err:''};
let sb=null;if(state.sdk&&state.cfg){try{sb=supabase.createClient(C.url,C.key,{auth:{persistSession:true,autoRefreshToken:true}})}catch(e){state.err=e.message}}

const mix=(a,b)=>{const o=Array.isArray(a)?[...a]:{...a};for(const k in b){o[k]=(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))?mix(a[k],b[k]):b[k]}return o};
const norm=d=>{const x=mix(structuredClone(DEF),d||{});const ids=x.layout.sections.map(s=>s.id);DEF.layout.sections.forEach(s=>{if(!ids.includes(s.id))x.layout.sections.push({...s})});if(!Array.isArray(x.fonts))x.fonts=[];return x};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const U=(u,D)=>{u=String(u).trim();if(u.startsWith('media:')){const m=(D.media||[]).find(x=>x.id===u.slice(6));return m?m.url:'#'}if(u.startsWith('page:'))return 'page.html?p='+encodeURIComponent(u.slice(5));if(u.startsWith('post:'))return 'post.html?s='+encodeURIComponent(u.slice(5));return /^(https?:|mailto:|#|\.{0,2}\/|[\w-]+\.html)/i.test(u)?u:'#'};
const mediaEl=(m,alt)=>{const t=m.mime||'',u=esc(m.url);
 if(t.startsWith('image/'))return `<img src="${u}" alt="${alt}" loading="lazy">`;
 if(t.startsWith('video/'))return `<video src="${u}" controls playsinline preload="metadata"></video>`;
 if(t.startsWith('audio/'))return `<audio src="${u}" controls preload="none"></audio>`;
 return `<a class="btn file" href="${u}" target="_blank" rel="noopener" download>${ic('paperclip',16)} ${alt||esc(m.name)}</a>`};

function md(src,D){
 const I=s=>esc(s)
  .replace(/!\[([^\]]*)\]\(media:([\w-]+)\)/g,(_,a,id)=>{const m=D.media.find(x=>x.id===id);return m?mediaEl(m,a):''})
  .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,(_,a,u)=>`<img src="${U(u,D)}" alt="${a}" loading="lazy">`)
  .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g,(_,t,u)=>`<a class="btn" href="${U(u,D)}">${t}</a>`)
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(_,t,u)=>`<a href="${U(u,D)}"${/^https?:/i.test(u)?' target="_blank" rel="noopener noreferrer"':''}>${t}</a>`)
  .replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
 return String(src||'').replace(/\r/g,'').split(/\n{2,}/).map(b=>{b=b.trim();if(!b)return '';let m;
  if(/^---+$/.test(b))return '<hr>';
  if(m=b.match(/^\{\{youtube:([\w-]{6,15})\}\}$/))return `<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
  if(m=b.match(/^(#{2,3}) (.+)/))return `<h${m[1].length}>${I(m[2])}</h${m[1].length}>`;
  if(b.startsWith('> '))return `<blockquote class="glass chrome">${I(b.replace(/^> ?/gm,''))}</blockquote>`;
  if(/^[-*] /.test(b))return '<ul>'+b.split('\n').map(l=>`<li>${I(l.replace(/^[-*] /,''))}</li>`).join('')+'</ul>';
  if(/^!\[[^\]]*\]\([^)]+\)$/.test(b))return `<figure>${I(b)}</figure>`;
  return `<p>${I(b).replace(/\n/g,'<br>')}</p>`}).join('')}

const clean=s=>String(s).replace(/[^\w \-]/g,'');
function faces(S){let s=document.getElementById('cfonts');if(!s){s=document.createElement('style');s.id='cfonts';document.head.appendChild(s)}
 s.textContent=(S.fonts||[]).map(f=>`@font-face{font-family:'${clean(f.name)}';src:url('${String(f.url).replace(/['"\\()]/g,'')}') format('${/^[a-z0-9]+$/.test(f.fmt)?f.fmt:'truetype'}');font-display:swap}`).join('')}

/* wallpaper statis: gradien, gambar, video, overlay, pola (bagian dinamis ada di main.js → Wall) */
function wallpaper(S,media){const W=S.wall,B=document.body;let wp=document.querySelector('.wp');
 if(!wp){wp=document.createElement('div');wp.className='wp';wp.innerHTML='<div class="wp-base"></div><div class="wp-vid"></div><div class="wp-pat"></div><div class="wp-ov"></div>';B.prepend(wp)}
 const [base,vid,pat,ov]=wp.children,img=media.find(x=>x.id===W.image),vd=media.find(x=>x.id===W.video),stops=[W.c1,W.c2,W.c3,W.c4].filter(Boolean).join(',');let bg='none';
 if(W.mode==='solid')bg=W.c1;
 else if(W.mode==='gradient')bg=W.gtype==='radial'?`radial-gradient(circle at var(--wpx,50%) var(--wpy,30%),${stops})`:W.gtype==='conic'?`conic-gradient(from ${W.angle}deg at var(--wpx,50%) var(--wpy,50%),${stops},${W.c1})`:`linear-gradient(${W.angle}deg,${stops})`;
 else if(W.mode==='image'&&img)bg=`url("${img.url}") center/${W.imgFit} no-repeat`;
 base.style.cssText=`background:${bg};opacity:${W.mode==='image'?W.imgOp/100:1};filter:blur(${W.mode==='image'?W.imgBlur:0}px)${W.mode==='image'&&W.imgBlur?';inset:-30px':''};${W.parallax?'transform:scale(1.12) translateY(var(--wpy-s,0px))':''}`;
 const vu=(W.mode==='video'&&vd)?vd.url:'';if(vid.dataset.u!==vu){vid.dataset.u=vu;vid.innerHTML=vu?`<video src="${esc(vu)}" muted loop autoplay playsinline></video>`:'';const v=vid.firstChild;if(v&&v.play)v.play().catch(()=>{})}
 vid.style.opacity=W.imgOp/100;vid.style.filter=`blur(${W.imgBlur}px)`;
 ov.style.cssText=`background:${W.overlay};opacity:${W.overlayOp/100}`;
 const pc=W.patColor,ps=W.patSize,P={dots:`radial-gradient(${pc} 1.2px,transparent 1.6px)`,grid:`linear-gradient(${pc} 1px,transparent 1px),linear-gradient(90deg,${pc} 1px,transparent 1px)`,stripes:`repeating-linear-gradient(45deg,${pc} 0 1px,transparent 1px ${Math.round(ps/2)}px)`,checker:`conic-gradient(${pc} 25%,transparent 0 50%,${pc} 0 75%,transparent 0)`}[W.pattern];
 pat.style.cssText=P?`background-image:${P};background-size:${ps}px ${ps}px;opacity:${W.patOp/100}`:'display:none'}

function theme(S,media=[]){const T=S.theme,th=S.thumbs,r=document.documentElement.style,B=document.body,set=(k,v)=>r.setProperty(k,v);
 ['pink','cyan','lime','violet','bg','ink','mute'].forEach(k=>set('--'+k,T[k]));
 set('--lnk',T.link);set('--sel',T.sel);set('--blur',T.blur+'px');set('--glass','rgba(255,255,255,'+T.glass/100+')');set('--sat',T.sat+'%');set('--edge','rgba(255,255,255,'+T.border/100+')');set('--r',T.radius+'px');set('--sh',T.shadow/100);
 set('--w',T.width+'px');set('--cw',T.cardw+'px');set('--base',T.base+'px');set('--lh',T.lh);set('--hw',T.hw);set('--ls',T.ls+'em');set('--tt',T.upper?'uppercase':'none');set('--hs',T.heroSize);
 set('--sp',T.sp);set('--gap',T.gap);set('--ps',T.pSize);set('--h2s',T.h2s);set('--glowI',T.glowI);set('--mq',T.mqSpeed+'s');set('--mqs',T.mqSize);
 set('--spd',1/(T.speed||1));set('--ao',T.aurora/100);set('--ease',{smooth:'cubic-bezier(.22,1,.36,1)',bounce:'cubic-bezier(.34,1.56,.64,1)',linear:'linear'}[T.ease]||'ease');
 set('--ratio',th.ratio);set('--fit',th.fit);set('--pos',th.pos);
 set('--dyn-dur',S.wall.dynSpeed+'s');set('--dyn-range',S.wall.dynRange+'deg');set('--dyn-dir',S.wall.dynRange>=360?'normal':'alternate');
 set('--f-display',`'${clean(T.fDisplay)}',sans-serif`);set('--f-body',`'${clean(T.fBody)}',sans-serif`);set('--f-pixel',`'${clean(T.fPixel)}',monospace`);
 faces(S);
 const q=[T.fDisplay,T.fBody,T.fPixel].filter((f,i,a)=>FONTS[f]&&a.indexOf(f)===i).map(f=>'family='+FONTS[f]).join('&');
 let l=document.getElementById('gfont');if(!l){l=document.createElement('link');l.id='gfont';l.rel='stylesheet';document.head.appendChild(l)}
 const h=q?'https://fonts.googleapis.com/css2?'+q+'&display=swap':'';if(l.getAttribute('href')!==h)l.setAttribute('href',h);
 Object.keys(S.fx).forEach(k=>{B.classList.toggle('no-'+k,!S.fx[k]);B.classList.toggle('on-'+k,!!S.fx[k])});
 Object.assign(B.dataset,{btn:T.btn,lay:T.layout,ha:T.heroAlign,trans:T.trans,rev:T.rev,hover:th.hover,nav:T.navStyle,cursor:T.cursor,dyn:S.wall.dyn});B.classList.toggle('dyn-au',!!S.wall.dynAurora);
 wallpaper(S,media);
 let c=document.getElementById('ccss');if(!c){c=document.createElement('style');c.id='ccss';document.head.appendChild(c)}c.textContent=String(T.css||'').replace(/<\/style/gi,'');
 let f=document.getElementById('fav');if(!f){f=document.createElement('link');f.id='fav';f.rel='icon';document.head.appendChild(f)}
 f.href='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${T.pink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${Icons[S.site.favicon]||Icons.disc}</svg>`)}

async function load(){
 if(!sb)return{settings:norm(),entries:DEMO,media:[],gb:[],hits:0,demo:true};
 const [s,e,m,h,g]=await Promise.all([sb.from('settings').select('data').eq('id',1).maybeSingle(),sb.from('entries').select('*').order('publish_at',{ascending:false}),
  sb.from('media').select('*').order('created_at',{ascending:false}),sb.from('stats').select('hits').eq('id',1).maybeSingle(),
  sb.from('guestbook').select('name,message,created_at,approved,id').order('created_at',{ascending:false}).limit(100)]);
 const err=[s,e,m].map(x=>x.error&&x.error.message).filter(Boolean)[0];
 return{settings:norm(s.data&&s.data.data),entries:(e.data||[]).map(x=>({...x,meta:x.meta||{}})),media:m.data||[],gb:g.data||[],hits:(h.data&&h.data.hits)||0,err}}
function sub(cb){if(!sb)return;let t;sb.channel('wc-live').on('postgres_changes',{event:'*',schema:'public'},()=>{clearTimeout(t);t=setTimeout(cb,350)}).subscribe()}
const bump=()=>sb?sb.rpc('bump_hits').then(r=>r.data):Promise.resolve(0);
return{DEF,FONTS,DEMO,sb,cfg:C,state,esc,slug,U,md,theme,faces,norm,mix,load,sub,bump}})();
