/* ===== render.js — halaman publik dari Supabase + live preview ===== */
(async()=>{
const q=new URLSearchParams(location.search),embed=q.has('embed'),preview=embed||q.has('preview'),{esc,md,U}=Store,$=id=>document.getElementById(id),app=$('app');
Store.theme(Store.norm());
let D;try{D=await Store.load()}catch(e){D={settings:Store.norm(),entries:[],media:[],gb:[],hits:0}}
let draft=null,first=1,last='',cat='',term='',curPosts=[];
const view=document.body.dataset.view,now=()=>new Date();
const vis=e=>e.status==='published'&&new Date(e.publish_at||0)<=now();
const fmt=d=>d?new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'';
const mediaUrl=id=>{const m=D.media.find(x=>x.id===id);return m?m.url:''};
const meta=(n,v,p)=>{const k=p?'property':'name';let m=document.querySelector(`meta[${k}="${n}"]`);if(!m){m=document.createElement('meta');m.setAttribute(k,n);document.head.appendChild(m)}m.content=v||''};
const sortE=(a,b)=>(b.pinned-a.pinned)||String(b.publish_at).localeCompare(String(a.publish_at));
const cur=(location.pathname.split('/').pop()||'index.html')+location.search.replace(/[?&](preview|embed|draft)=1/g,'');

function card(p,i,inn){const c=mediaUrl(p.cover);return `<a href="post.html?s=${encodeURIComponent(p.slug)}" class="card glass reveal${i===0?' big':''}${inn?' in':''}"><div class="thumb" style="--c1:${esc(p.c1)};--c2:${esc(p.c2)}">${c?`<img src="${esc(c)}" alt="">`:`<span>${esc(p.emoji)}</span>`}</div><div class="win-body"><span class="tag">${p.pinned?'📌 ':''}${esc(p.cat)}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p></div></a>`}
function drawGrid(inn){const g=$('grid');if(!g)return;const l=curPosts.filter(p=>(!cat||p.cat===cat)&&(p.title+' '+p.excerpt+' '+(p.tags||[]).join(' ')).toLowerCase().includes(term));
 g.innerHTML=l.map((p,i)=>card(p,i,inn)).join('')||`<p class="empty">${curPosts.length?'Tidak ada artikel yang cocok.':'Belum ada artikel.'}</p>`}

function build(){
 const S=D.settings,T=S.site;Store.theme(S,D.media);document.documentElement.lang=T.lang||'id';
 const posts=D.entries.filter(e=>e.kind==='post'&&vis(e)).sort(sortE),pages=D.entries.filter(e=>e.kind==='page'&&vis(e));
 curPosts=T.postsLimit>0?posts.slice(0,T.postsLimit):posts;
 const links=[['Beranda','index.html'],['Artikel','index.html#artikel'],...pages.filter(p=>p.nav).map(p=>[p.title,'page.html?p='+encodeURIComponent(p.slug)]),
  ...String(T.navExtra).split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(a=>a[0]&&a[1]).map(a=>[a[0],U(a[1],D)])];
 const top=`<header class="nav glass"><div class="win-bar"><b></b><b></b><b></b><span>${esc(T.name)}.exe</span></div><nav class="win-body"><a class="logo chrome" href="index.html">${esc(T.name)}</a>${links.map(l=>`<a class="l${l[1]===cur?' on':''}" href="${esc(l[1])}">${esc(l[0])}</a>`).join('')}</nav></header>`;
 const soc=String(T.social).split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(a=>a[0]&&a[1]).map(a=>`<a href="${esc(U(a[1],D))}" target="_blank" rel="noopener noreferrer">${esc(a[0])}</a>`).join(' · ');
 const foot=`<div class="counter-box"><div class="pixel">kamu pengunjung ke</div><div class="counter">${String(D.hits).padStart(5,'0').split('').map(c=>`<b>${c}</b>`).join('')}</div></div>${soc?`<p class="soc">${soc}</p>`:''}<p>${esc(T.footer)}</p>`;
 const notFound=()=>{document.title='404 — '+T.name;return `<section class="wrap" style="text-align:center"><h1 class="chrome">404</h1><p class="lead" style="margin:1rem auto 2rem">Halaman ini tidak ada atau belum diterbitkan.</p><a class="btn" href="index.html">Kembali ke beranda</a></section>`};
 const find=(k,key)=>{const e=(embed&&draft&&draft.kind===k&&q.has('draft'))?draft:D.entries.find(x=>x.kind===k&&x.slug===q.get(key));return e&&(preview||vis(e))?e:null};
 const seo=(t,d,img)=>{document.title=t+' — '+T.name;meta('description',d||T.tagline);meta('og:title',t,1);meta('og:description',d||T.tagline,1);meta('og:image',img||mediaUrl(T.ogImage),1)};
 let html='';
 if(T.maintenance&&!preview){seo('Perawatan');html=`<section class="wrap maint"><div class="glass"><div class="win-body"><h1 class="chrome">🛠️</h1><p class="lead">${esc(T.maintMsg)}</p></div></div></section>`}
 else if(view==='home'){
  seo('Beranda',T.tagline);
  const items=String(T.marquee).split('\n').filter(Boolean).map(t=>`<span>${esc(t)}</span>`).join('');
  const cats=[...new Set(posts.map(p=>p.cat).filter(Boolean))];
  const SEC={
   hero:()=>`<section class="hero wrap"><div class="sticker">${esc(T.sticker)}</div><span class="pixel reveal">${esc(T.heroKicker)}</span><h1 class="chrome reveal" style="--d:.1s">${esc(T.heroTitle).replace(/\n/g,'<br>')}</h1><p class="lead reveal" style="--d:.2s">${esc(T.heroSub)}</p><div class="cta reveal" style="--d:.3s">${T.btn1?`<a class="btn" href="${esc(U(T.btn1Url||'#',D))}">${esc(T.btn1)}</a>`:''}${T.btn2?`<a class="btn ghost" href="${esc(U(T.btn2Url||'#',D))}">${esc(T.btn2)}</a>`:''}</div></section>`,
   marquee:()=>`<div class="marquee"><div>${items+items+items+items}</div></div>`,
   posts:()=>`<section class="wrap" id="artikel"><h2 class="reveal">${esc(T.postsTitle)}</h2><div class="filters reveal"><input type="text" id="qs" placeholder="Cari artikel…" aria-label="Cari artikel" value="${esc(term)}"><button class="tag f${cat?'':' on'}" data-c="">Semua</button>${cats.map(c=>`<button class="tag f${cat===c?' on':''}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="grid" id="grid"></div></section>`,
   guestbook:()=>`<section class="wrap" id="buku-tamu"><h2 class="reveal">${esc(T.gbTitle)}</h2><p class="lead reveal">${esc(T.gbSub)}</p><div class="glass reveal" style="margin-top:1.4rem"><div class="win-bar"><b></b><b></b><b></b><span>guestbook.exe</span></div><div class="win-body"><form class="mail" data-f="gb"><input name="name" placeholder="Namamu" maxlength="60" required><input name="message" placeholder="Pesanmu (maks 500)" maxlength="500" required><input class="hp" name="website" tabindex="-1" autocomplete="off"><button class="btn">Kirim</button></form><div class="gb">${D.gb.filter(g=>g.approved).slice(0,20).map(g=>`<div class="glass msg"><b>${esc(g.name)}</b> <small>${fmt(g.created_at)}</small><p>${esc(g.message)}</p></div>`).join('')||'<p class="empty">Belum ada pesan. Jadilah yang pertama!</p>'}</div></div></div></section>`,
   newsletter:()=>`<section class="wrap" id="langganan"><div class="glass reveal"><div class="win-bar"><b></b><b></b><b></b><span>newsletter.exe</span></div><div class="win-body"><h2>${esc(T.nlTitle)}</h2><p class="lead" style="margin-top:.8rem">${esc(T.nlSub)}</p><form class="mail" data-f="nl"><input type="email" name="email" placeholder="email@kamu.com" required aria-label="Email"><input class="hp" name="website" tabindex="-1" autocomplete="off"><button class="btn" type="submit">Langganan</button></form></div></div></section>`};
  html=S.layout.sections.filter(s=>s.on&&SEC[s.id]).map(s=>SEC[s.id]()).join('')}
 else if(view==='post'){
  const p=find('post','s');
  if(!p)html=notFound();else{const i=posts.findIndex(x=>x.id===p.id),pv=posts[i+1],nx=posts[i-1],c=mediaUrl(p.cover),min=Math.max(1,Math.round(String(p.content).split(/\s+/).length/200));
   seo(p.seo_title||p.title,p.seo_desc||p.excerpt,c);
   html=`<div class="progress"></div><article class="wrap post drop" style="padding-top:4rem"><span class="tag reveal">${esc(p.cat)}</span><h1 class="chrome reveal" style="--d:.1s">${esc(p.title)}</h1><div class="pixel reveal" style="--d:.2s">${fmt(p.publish_at)} | ${min} menit baca${p.status!=='published'?' | DRAF':''}</div>${c?`<img class="cover reveal" src="${esc(c)}" alt="">`:''}<div class="body">${md(p.content,D)}</div>${(p.tags||[]).length?`<div class="tags">${p.tags.map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div>`:''}<div class="acts"><button class="btn ghost" data-copy>🔗 Salin tautan</button><a class="btn ghost" href="index.html#artikel">Semua artikel</a></div>${(pv||nx)?`<div class="pn">${pv?`<a class="glass win-body" href="post.html?s=${encodeURIComponent(pv.slug)}"><span class="pixel">← sebelumnya</span><br>${esc(pv.title)}</a>`:'<span></span>'}${nx?`<a class="glass win-body" style="text-align:right" href="post.html?s=${encodeURIComponent(nx.slug)}"><span class="pixel">berikutnya →</span><br>${esc(nx.title)}</a>`:''}</div>`:''}</article>`}}
 else{const p=find('page','p');
  if(!p)html=notFound();else{seo(p.seo_title||p.title,p.seo_desc||p.excerpt);html=`<article class="wrap post" style="padding-top:4rem"><h1 class="chrome reveal">${esc(p.title)}</h1><div class="body">${md(p.content,D)}</div></article>`}}
 $('top').innerHTML=top;$('foot').innerHTML=foot;
 if(html!==last){last=html;app.innerHTML=html;app.querySelectorAll('.body>*').forEach(e=>e.classList.add('reveal'));drawGrid(!first)}
 FX.set(S.fx);if(first){FX.init(embed)}FX.refresh(!first)}

/* interaksi */
app.addEventListener('input',e=>{if(e.target.id==='qs'){term=e.target.value.toLowerCase();drawGrid(1)}});
app.addEventListener('click',e=>{const b=e.target.closest('.f');if(b){cat=b.dataset.c;document.querySelectorAll('.filters .f').forEach(x=>x.classList.toggle('on',x===b));drawGrid(1)}
 if(e.target.closest('[data-copy]')){navigator.clipboard&&navigator.clipboard.writeText(location.href.replace(/[?&](preview|embed|draft)=1/g,''));e.target.closest('[data-copy]').textContent='Tersalin ✓'}});
document.addEventListener('submit',async e=>{const f=e.target.closest('[data-f]');if(!f)return;e.preventDefault();const b=f.querySelector('button'),o=b.textContent,v=Object.fromEntries(new FormData(f)),say=t=>{b.textContent=t;setTimeout(()=>b.textContent=o,2400)};
 if(v.website)return;if(embed||!Store.sb){say('Mode demo');return}
 const gb=f.dataset.f==='gb',r=gb?await Store.sb.from('guestbook').insert({name:v.name.trim(),message:v.message.trim()}):await Store.sb.from('subscribers').insert({email:v.email.trim().toLowerCase()});
 say(r.error?(r.error.code==='23505'?'Sudah terdaftar':'Gagal, coba lagi'):(gb?'Menunggu persetujuan ✓':'Terkirim ✓'));if(!r.error)f.reset()});

build();first=0;
if(location.hash)try{document.querySelector(location.hash).scrollIntoView()}catch(e){}
if(embed){addEventListener('message',e=>{if(e.source!==parent||!e.data||e.data.wc!=='state')return;const m=e.data;if(m.settings)D.settings=m.settings;if(m.media)D.media=m.media;draft=m.draft||null;build()});parent.postMessage({wc:'ready'},'*')}
else{Store.sub(async()=>{try{D=await Store.load();build()}catch(e){}});
 if(!sessionStorage.wcHit){sessionStorage.wcHit=1;Store.bump().then(n=>{if(n){D.hits=n;build()}})}}
})();
