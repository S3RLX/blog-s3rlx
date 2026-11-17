/* ===== store.js — data (Supabase), markdown mini, tema ===== */
const Store=(()=>{
const DEF={
site:{name:'pixel dreamer',tagline:'Catatan tentang desain, kode, dan nostalgia internet.',favicon:'💿',ogImage:'',lang:'id',footer:'© 2026 Pixel Dreamer — dibuat dengan cahaya neon dan kopi.',
 heroKicker:'> selamat datang di ruang kecilku',heroTitle:'Web yang\nberkilau lagi.',heroSub:'Catatan tentang desain, kode, dan nostalgia internet — ditulis seperti surat untuk teman lama.',
 btn1:'Baca artikel terbaru',btn1Url:'#artikel',btn2:'Langganan',btn2Url:'#langganan',sticker:'💿',
 postsTitle:'Tulisan terbaru',postsLimit:0,marquee:'★ artikel baru tiap minggu\n✦ glass & chrome\n☆ web 2000-an\n♡ ditulis dengan cinta',
 nlTitle:'Surat mingguan, tanpa spam.',nlSub:'Satu email tiap Jumat berisi tulisan baru dan tautan menarik.',
 gbTitle:'Buku tamu',gbSub:'Tinggalkan jejak di sini — pesan tampil setelah disetujui.',navExtra:'',social:'',maintenance:0,maintMsg:'Situs sedang dirapikan. Kembali sebentar lagi ✨'},
theme:{pink:'#ff5fd2',cyan:'#5ff5ff',lime:'#d4ff5f',violet:'#8a5cff',bg:'#0a0618',ink:'#f4efff',mute:'#b9aedd',
 fDisplay:'Unbounded',fBody:'Space Grotesk',fPixel:'VT323',base:16,lh:1.7,hw:800,ls:-.03,upper:0,
 blur:20,glass:7,sat:170,border:28,radius:22,shadow:60,width:1120,cardw:290,layout:'grid',heroAlign:'left',heroSize:1,btn:'chrome',
 speed:1,ease:'smooth',aurora:100,bgImage:'',bgOpacity:30,css:''},
fx:{aurora:1,glow:1,stars:1,chrome:1,marquee:1,reveal:1,transition:1,tilt:1,counter:1,sticker:1,search:1,filters:1,progress:1,trail:0,scan:0,grain:0},
layout:{sections:[{id:'hero',on:1},{id:'marquee',on:1},{id:'posts',on:1},{id:'guestbook',on:1},{id:'newsletter',on:1}]},
fonts:[]};
const FONTS={Unbounded:'Unbounded:wght@500;800',Syne:'Syne:wght@500;800','Bricolage Grotesque':'Bricolage+Grotesque:wght@500;800',Bungee:'Bungee','Rubik Mono One':'Rubik+Mono+One','Dela Gothic One':'Dela+Gothic+One',
 'Space Grotesk':'Space+Grotesk:wght@400;500;600',Inter:'Inter:wght@400;600;800','DM Sans':'DM+Sans:wght@400;600;800',Manrope:'Manrope:wght@400;600;800',Lora:'Lora:wght@400;600','JetBrains Mono':'JetBrains+Mono:wght@400;600',
 VT323:'VT323','Press Start 2P':'Press+Start+2P',Silkscreen:'Silkscreen:wght@400;700',DotGothic16:'DotGothic16'};
const E=(id,title,cat,emoji,c1,c2,excerpt,content,kind='post',nav=false)=>({id,kind,title,slug:title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),cat,emoji,c1,c2,cover:'',excerpt,content,status:'published',nav,pinned:false,tags:[],publish_at:'2026-11-01T00:00:00Z'});
const DEMO=[E('d1','Selamat datang di mode demo','Info','✨','#8a5cff','#ff5fd2','Situs belum terhubung ke Supabase, jadi ini hanya contoh.','Ini adalah **mode demo**. Isi `js/config.js` dengan URL dan anon key Supabase, jalankan `supabase/schema.sql`, lalu buka admin.html.\n\n> Situs pribadi adalah kamar, bukan etalase.\n\n[[Buka admin|admin.html]]'),
 E('d2','Chrome, gradien, dan kaca','Desain','💿','#5ff5ff','#8a5cff','Semua efek bisa diatur dari panel admin.','Atur **blur**, warna, font, dan animasi lewat menu Tampilan — hasilnya langsung terlihat di live preview.'),
 E('d3','Tentang','','🦋','#ff5fd2','#d4ff5f','','Halo! Ini halaman contoh.','page',true)];
const sb=(window.WC&&WC.url&&WC.key&&window.supabase)?supabase.createClient(WC.url,WC.key,{auth:{persistSession:true,autoRefreshToken:true}}):null;

const mix=(a,b)=>{const o=Array.isArray(a)?[...a]:{...a};for(const k in b){o[k]=(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))?mix(a[k],b[k]):b[k]}return o};
const norm=d=>{const x=mix(structuredClone(DEF),d||{});const ids=x.layout.sections.map(s=>s.id);DEF.layout.sections.forEach(s=>{if(!ids.includes(s.id))x.layout.sections.push({...s})});if(!Array.isArray(x.fonts))x.fonts=[];return x};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const U=(u,D)=>{u=String(u).trim();if(u.startsWith('media:')){const m=(D.media||[]).find(x=>x.id===u.slice(6));return m?m.url:'#'}if(u.startsWith('page:'))return 'page.html?p='+encodeURIComponent(u.slice(5));if(u.startsWith('post:'))return 'post.html?s='+encodeURIComponent(u.slice(5));return /^(https?:|mailto:|#|\.{0,2}\/|[\w-]+\.html)/i.test(u)?u:'#'};

const mediaEl=(m,alt)=>{const t=m.mime||'',u=esc(m.url);
 if(t.startsWith('image/'))return `<img src="${u}" alt="${alt}" loading="lazy">`;
 if(t.startsWith('video/'))return `<video src="${u}" controls playsinline preload="metadata"></video>`;
 if(t.startsWith('audio/'))return `<audio src="${u}" controls preload="none"></audio>`;
 return `<a class="btn file" href="${u}" target="_blank" rel="noopener" download>📎 ${alt||esc(m.name)}</a>`};

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

function theme(S,media=[]){const T=S.theme,r=document.documentElement.style,B=document.body,set=(k,v)=>r.setProperty(k,v);
 ['pink','cyan','lime','violet','bg','ink','mute'].forEach(k=>set('--'+k,T[k]));
 set('--blur',T.blur+'px');set('--glass','rgba(255,255,255,'+T.glass/100+')');set('--sat',T.sat+'%');set('--edge','rgba(255,255,255,'+T.border/100+')');set('--r',T.radius+'px');set('--sh',T.shadow/100);
 set('--w',T.width+'px');set('--cw',T.cardw+'px');set('--base',T.base+'px');set('--lh',T.lh);set('--hw',T.hw);set('--ls',T.ls+'em');set('--tt',T.upper?'uppercase':'none');set('--hs',T.heroSize);
 set('--spd',1/(T.speed||1));set('--ao',T.aurora/100);set('--ease',{smooth:'cubic-bezier(.22,1,.36,1)',bounce:'cubic-bezier(.34,1.56,.64,1)',linear:'linear'}[T.ease]||'ease');
 set('--f-display',`'${clean(T.fDisplay)}',sans-serif`);set('--f-body',`'${clean(T.fBody)}',sans-serif`);set('--f-pixel',`'${clean(T.fPixel)}',monospace`);
 faces(S);
 const q=[T.fDisplay,T.fBody,T.fPixel].filter((f,i,a)=>FONTS[f]&&a.indexOf(f)===i).map(f=>'family='+FONTS[f]).join('&');
 let l=document.getElementById('gfont');if(!l){l=document.createElement('link');l.id='gfont';l.rel='stylesheet';document.head.appendChild(l)}
 const h=q?'https://fonts.googleapis.com/css2?'+q+'&display=swap':'';if(l.getAttribute('href')!==h)l.setAttribute('href',h);
 Object.keys(S.fx).forEach(k=>{B.classList.toggle('no-'+k,!S.fx[k]);B.classList.toggle('on-'+k,!!S.fx[k])});
 B.dataset.btn=T.btn;B.dataset.lay=T.layout;B.dataset.ha=T.heroAlign;
 let bg=document.querySelector('.bgimg');if(!bg){bg=document.createElement('div');bg.className='bgimg';B.prepend(bg)}
 const m=media.find(x=>x.id===T.bgImage);bg.style.setProperty('--bgimg',m?`url("${m.url}")`:'none');bg.style.setProperty('--bgo',T.bgOpacity/100);
 let c=document.getElementById('ccss');if(!c){c=document.createElement('style');c.id='ccss';document.head.appendChild(c)}c.textContent=String(T.css||'').replace(/<\/style/gi,'');
 let f=document.getElementById('fav');if(!f){f=document.createElement('link');f.id='fav';f.rel='icon';document.head.appendChild(f)}
 f.href='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${esc(S.site.favicon||'💿')}</text></svg>`)}

async function load(){
 if(!sb)return{settings:norm(),entries:DEMO,media:[],gb:[],hits:0,demo:true};
 const [s,e,m,h,g]=await Promise.all([sb.from('settings').select('data').eq('id',1).maybeSingle(),sb.from('entries').select('*').order('publish_at',{ascending:false}),
  sb.from('media').select('*').order('created_at',{ascending:false}),sb.from('stats').select('hits').eq('id',1).maybeSingle(),
  sb.from('guestbook').select('name,message,created_at,approved,id').order('created_at',{ascending:false}).limit(100)]);
 return{settings:norm(s.data&&s.data.data),entries:e.data||[],media:m.data||[],gb:g.data||[],hits:(h.data&&h.data.hits)||0,err:e.error&&e.error.message}}
function sub(cb){if(!sb)return;let t;sb.channel('wc-live').on('postgres_changes',{event:'*',schema:'public'},()=>{clearTimeout(t);t=setTimeout(cb,350)}).subscribe()}
const bump=()=>sb?sb.rpc('bump_hits').then(r=>r.data):Promise.resolve(0);
return{DEF,FONTS,sb,esc,slug,U,md,theme,faces,norm,mix,load,sub,bump}})();
