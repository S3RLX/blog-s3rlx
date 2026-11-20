/* ===== render.js — situs publik: Supabase, live preview, profil, maintenance, musik ===== */
(async()=>{
const q=new URLSearchParams(location.search),embed=q.has('embed'),{esc,md,U}=Store,$=id=>document.getElementById(id),app=$('app');
Store.theme(Store.norm());
let D;try{D=await Store.load()}catch(e){D={settings:Store.norm(),entries:[],media:[],gb:[],tracks:[],hits:0,err:e.message}}
/* pemilik = punya sesi login di browser ini (hanya pemilik yang boleh pratinjau draf / melewati mode perawatan) */
let owner=false;try{const s=Store.sb&&await Store.sb.auth.getSession();owner=!!(s&&s.data&&s.data.session)}catch(e){}
const preview=embed||(owner&&q.has('preview')),bypass=embed||owner;
let draft=null,first=1,last='',lastTop='',lastFoot='',cat='',term='',curPosts=[],cdTimer;
const view=document.body.dataset.view,now=()=>new Date();
const vis=e=>e.status==='published'&&new Date(e.publish_at||0)<=now();
const fmt=d=>d?new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'';
const mediaOf=id=>D.media.find(x=>x.id===id);
const meta=(n,v,p)=>{const k=p?'property':'name';let m=document.querySelector(`meta[${k}="${n}"]`);if(!m){m=document.createElement('meta');m.setAttribute(k,n);document.head.appendChild(m)}m.content=v||''};
const sortE=(a,b)=>(b.pinned-a.pinned)||String(b.publish_at).localeCompare(String(a.publish_at));
const cur=(location.pathname.split('/').pop()||'index.html')+location.search.replace(/[?&](preview|embed|draft|maint)=1/g,'');
const mins=p=>Math.max(1,Math.round(String(p.content||'').split(/\s+/).length/200));
const jp=t=>t?`<span class="jp">${esc(t)}</span>`:'';

function avatar(sz,dot){const P=D.settings.profile,m=mediaOf(P.avatar),s=sz||P.size;return `<span class="av av-${esc(P.shape)} ring-${esc(P.ring)}" style="--s:${s}px">${m?`<img src="${esc(m.url)}" alt="${esc(P.name)}">`:`<span class="ai">${ic('user',Math.round(s*.5))}</span>`}${dot?`<i class="pres pres-${esc(P.presence)}"></i>`:''}</span>`}
function tMedia(p){let m=mediaOf(p.cover);if(!m&&D.settings.thumbs.auto){const r=/!\[[^\]]*\]\(media:([\w-]+)\)/g;let x;while(x=r.exec(p.content||'')){const mm=mediaOf(x[1]);if(mm&&(mm.mime||'').startsWith('image/')){m=mm;break}}}return m}
function thumb(p){const m=tMedia(p),ext=p.meta&&/^https:\/\//.test(p.meta.coverUrl||'')?p.meta.coverUrl:'',u=m?m.url:ext,fo=p.meta&&p.meta.focus;
 return `<div class="thumb" style="--c1:${esc(p.c1)};--c2:${esc(p.c2)}">${u?`<img src="${esc(u)}" alt="" loading="lazy"${fo?` style="object-position:${esc(fo)}"`:''}>`:`<span class="ti">${ic(p.emoji||'star',56)}</span>`}</div>`}
function card(p,i,inn){const th=D.settings.thumbs,bits=[th.date?fmt(p.publish_at):'',th.read?mins(p)+' mnt':''].filter(Boolean).join(' · ');
 return `<a href="post.html?s=${encodeURIComponent(p.slug)}" class="card glass reveal${i===0&&th.big?' big':''}${inn?' in rdone':''}">${thumb(p)}<div class="win-body">${th.tag?`<span class="tag">${p.pinned?ic('pin',13)+' ':''}${esc(p.cat)}</span>`:''}<h3>${esc(p.title)}</h3>${th.excerpt?`<p>${esc(p.excerpt)}</p>`:''}${bits?`<small class="pixel">${bits}</small>`:''}</div></a>`}
function drawGrid(inn){const g=$('grid');if(!g)return;const l=curPosts.filter(p=>(!cat||p.cat===cat)&&(p.title+' '+p.excerpt+' '+(p.tags||[]).join(' ')).toLowerCase().includes(term));
 g.innerHTML=l.map((p,i)=>card(p,i,inn)).join('')||`<p class="empty">${curPosts.length?'Tidak ada artikel yang cocok.':'Belum ada artikel.'}</p>`}
function countdown(){clearInterval(cdTimer);const el=document.querySelector('.mcd');if(!el)return;const t=new Date(el.dataset.eta).getTime();
 const tick=()=>{let s=Math.floor((t-Date.now())/1e3);if(isNaN(t)){el.remove();return}if(s<=0){el.textContent='Segera kembali';clearInterval(cdTimer);return}const d=Math.floor(s/86400);s%=86400;const h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor(s%3600/60)).padStart(2,'0'),c=String(s%60).padStart(2,'0');el.textContent=(d?d+'h ':'')+h+':'+m+':'+c};tick();cdTimer=setInterval(tick,1000)}

function build(){
 const S=D.settings,T=S.site,PF=S.profile,MT=S.maint;Store.theme(S,D.media);Wall.apply(S,D.media);document.documentElement.lang=T.lang||'id';
 const posts=D.entries.filter(e=>e.kind==='post'&&vis(e)).sort(sortE),pages=D.entries.filter(e=>e.kind==='page'&&vis(e));
 curPosts=T.postsLimit>0?posts.slice(0,T.postsLimit):posts;
 const showMaint=(T.maintenance&&!bypass)||q.has('maint'),links=[['Beranda','index.html'],['Artikel','index.html#artikel'],...pages.filter(p=>p.nav).map(p=>[p.title,'page.html?p='+encodeURIComponent(p.slug)]),
  ...String(T.navExtra).split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(a=>a[0]&&a[1]).map(a=>[a[0],U(a[1],D)])];
 const lm=mediaOf(T.logoImage),logo=lm?`<img src="${esc(lm.url)}" alt="">`:(T.showLogoIcon?`<span class="lg">${ic(T.logoIcon,20)}</span>`:'');
 const top=`<header class="nav glass" data-sec="nav"><div class="win-bar"><b></b><b></b><b></b><span>${esc(T.name)}.exe</span></div><nav class="win-body">${PF.navAvatar&&PF.avatar?avatar(30):''}<a class="logo" href="index.html">${logo}<span class="chrome">${esc(T.name)}</span></a>${links.map(l=>`<a class="l${l[1]===cur?' on':''}" href="${esc(l[1])}">${esc(l[0])}</a>`).join('')}</nav></header>`;
 const soc=String(T.social).split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(a=>a[0]&&a[1]).map(a=>`<a href="${esc(U(a[1],D))}" target="_blank" rel="noopener noreferrer">${esc(a[0])}</a>`).join(' · ');
 const foot=`<div class="counter-box"><div class="pixel">kamu pengunjung ke</div><div class="counter">${String(D.hits).padStart(5,'0').split('').map(c=>`<b>${c}</b>`).join('')}</div></div>${soc?`<p class="soc">${soc}</p>`:''}<p>${esc(T.footer)}</p>${D.err&&owner?`<p class="conn">Gagal membaca data Supabase: ${esc(D.err)}</p>`:''}`;
 const notFound=()=>{document.title='404 — '+T.name;return `<section class="wrap" style="text-align:center"><h1 class="chrome">404</h1><p class="lead" style="margin:1rem auto 2rem">Halaman ini tidak ada atau belum diterbitkan.</p><a class="btn" href="index.html">Kembali ke beranda</a></section>`};
 const find=(k,key)=>{const e=(embed&&draft&&draft.kind===k&&q.has('draft'))?draft:D.entries.find(x=>x.kind===k&&x.slug===q.get(key));return e&&(preview||vis(e))?e:null};
 const seo=(t,d,img)=>{document.title=t+' — '+T.name;meta('description',d||T.tagline);meta('og:title',t,1);meta('og:description',d||T.tagline,1);meta('og:image',img||(mediaOf(T.ogImage)||{}).url||'',1)};
 let html='';
 if(showMaint){seo(MT.title);const mm=mediaOf(MT.image);
  html=`<section class="wrap maint maint-${esc(MT.style)}" data-sec="maint"><div class="glass mbox"><div class="win-bar"><b></b><b></b><b></b><span>maintenance.exe</span></div><div class="win-body">${mm?`<img class="mimg" src="${esc(mm.url)}" alt="">`:`<div class="mgear">${ic('wrench',56)}</div>`}<h1 class="chrome">${esc(MT.title)}</h1><p class="lead">${esc(T.maintMsg)}</p>${MT.progress>0?`<div class="mprog"><i style="width:${MT.progress}%"></i><span>${MT.progress}%</span></div>`:''}${MT.timer&&MT.eta?`<div class="mcd" data-eta="${esc(MT.eta)}">--:--:--</div>`:''}${MT.subscribe?`<form class="mail" data-f="nl"><input type="email" name="email" placeholder="Kabari aku saat sudah kembali" required aria-label="Email"><input class="hp" name="website" tabindex="-1" autocomplete="off"><button class="btn">Kabari</button></form>`:''}</div></div></section>`}
 else if(view==='home'){
  seo('Beranda',T.tagline);
  const items=String(T.marquee).split('\n').filter(Boolean).map(t=>`<span>${ic('star',14)}${esc(t)}</span>`).join('');
  const cats=[...new Set(posts.map(p=>p.cat).filter(Boolean))],sm=mediaOf(T.stickerImage),hi=mediaOf(T.heroImage),split=S.theme.heroLayout==='split'&&hi;
  const SEC={
   hero:()=>`<section class="hero wrap${split?' split':''}"><div class="hcol">${split?'':`<div class="sticker">${sm?`<img src="${esc(sm.url)}" alt="">`:ic(T.stickerIcon,96)}</div>`}${T.heroBadge?`<span class="badge reveal">${esc(T.heroBadge)}</span>`:''}<span class="pixel hk reveal">${esc(T.heroKicker)}</span><h1 class="chrome reveal" style="--d:.1s">${esc(T.heroTitle).replace(/\n/g,'<br>')}</h1><p class="lead reveal" style="--d:.2s">${esc(T.heroSub)}</p><div class="cta reveal" style="--d:.3s">${T.btn1?`<a class="btn" href="${esc(U(T.btn1Url||'#',D))}">${esc(T.btn1)} ${ic('arrow-right',16)}</a>`:''}${T.btn2?`<a class="btn ghost" href="${esc(U(T.btn2Url||'#',D))}">${esc(T.btn2)}</a>`:''}</div></div>${split?`<div class="himg reveal"><img src="${esc(hi.url)}" alt=""></div>`:''}</section>`,
   profile:()=>{if(!PF.home||(!PF.name&&!PF.avatar))return '';const bm=mediaOf(PF.banner),lk=String(PF.links).split('\n').map(l=>l.split('|').map(s=>s.trim())).filter(a=>a[0]&&a[1]).map(a=>`<a class="tag" href="${esc(U(a[1],D))}" target="_blank" rel="noopener noreferrer">${esc(a[0])}</a>`).join('');
    return `<section class="wrap" id="profil"><div class="glass pcard reveal"><div class="pbanner" ${bm?`style="background-image:url('${esc(bm.url)}')"`:''}></div><div class="pbody">${avatar(PF.size,1)}<div><h3 class="pname">${esc(PF.name)}</h3>${PF.handle?`<small class="pixel">@${esc(PF.handle)}</small>`:''}${PF.status?`<p class="pstat">${esc(PF.status)}</p>`:''}${PF.bio?`<p class="pbio">${esc(PF.bio)}</p>`:''}${PF.location?`<small class="ploc">${ic('globe',13)} ${esc(PF.location)}</small>`:''}${lk?`<div class="plinks">${lk}</div>`:''}</div></div></div></section>`},
   marquee:()=>`<div class="marquee"><div>${items+items+items+items}</div></div>`,
   featured:()=>{const f=posts.filter(p=>p.pinned).slice(0,3);return f.length?`<section class="wrap" id="pilihan"><h2 class="reveal">${esc(T.featTitle)}${jp(T.jpFeat)}</h2><div class="grid">${f.map((p,i)=>card(p,i)).join('')}</div></section>`:''},
   posts:()=>`<section class="wrap" id="artikel"><h2 class="reveal">${esc(T.postsTitle)}${jp(T.jpPosts)}</h2><div class="filters reveal"><input type="text" id="qs" placeholder="Cari artikel…" aria-label="Cari artikel" value="${esc(term)}"><button class="tag f${cat?'':' on'}" data-c="">Semua</button>${cats.map(c=>`<button class="tag f${cat===c?' on':''}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="grid" id="grid"></div></section>`,
   custom:()=>T.customBody?`<section class="wrap post"><h2 class="reveal">${esc(T.customTitle)}</h2><div class="body">${md(T.customBody,D)}</div></section>`:'',
   guestbook:()=>`<section class="wrap" id="buku-tamu"><h2 class="reveal">${esc(T.gbTitle)}${jp(T.jpGuest)}</h2><p class="lead reveal">${esc(T.gbSub)}</p><div class="glass reveal" style="margin-top:1.4rem"><div class="win-bar"><b></b><b></b><b></b><span>guestbook.exe</span></div><div class="win-body"><form class="mail" data-f="gb"><input name="name" placeholder="Namamu" maxlength="60" required><input name="message" placeholder="Pesanmu (maks 500)" maxlength="500" required><input class="hp" name="website" tabindex="-1" autocomplete="off"><button class="btn">Kirim</button></form><div class="gb">${D.gb.filter(g=>g.approved).slice(0,20).map(g=>`<div class="glass msg"><b>${esc(g.name)}</b> <small>${fmt(g.created_at)}</small><p>${esc(g.message)}</p></div>`).join('')||'<p class="empty">Belum ada pesan. Jadilah yang pertama!</p>'}</div></div></div></section>`,
   newsletter:()=>`<section class="wrap" id="langganan"><div class="glass reveal"><div class="win-bar"><b></b><b></b><b></b><span>newsletter.exe</span></div><div class="win-body"><h2>${esc(T.nlTitle)}${jp(T.jpNews)}</h2><p class="lead" style="margin-top:.8rem">${esc(T.nlSub)}</p><form class="mail" data-f="nl"><input type="email" name="email" placeholder="email@kamu.com" required aria-label="Email"><input class="hp" name="website" tabindex="-1" autocomplete="off"><button class="btn" type="submit">Langganan</button></form></div></div></section>`};
  html=S.layout.sections.filter(s=>s.on&&SEC[s.id]).map(s=>SEC[s.id]().replace(/^<(\w+)/,`<$1 data-sec="${s.id}"`)).join('')}
 else if(view==='post'){
  const p=find('post','s');
  if(!p)html=notFound();else{const i=posts.findIndex(x=>x.id===p.id),pv=posts[i+1],nx=posts[i-1],m=tMedia(p),cu=m?m.url:(p.meta&&/^https:\/\//.test(p.meta.coverUrl||'')?p.meta.coverUrl:''),fo=p.meta&&p.meta.focus,
    files=((p.meta&&p.meta.files)||[]).map(mediaOf).filter(Boolean),gal=((p.meta&&p.meta.gallery)||[]).map(mediaOf).filter(Boolean);
   seo(p.seo_title||p.title,p.seo_desc||p.excerpt,cu);
   html=`<div class="progress"></div><article class="wrap post drop" style="padding-top:4rem"><span class="tag reveal">${esc(p.cat)}</span><h1 class="chrome reveal" style="--d:.1s">${esc(p.title)}</h1>${PF.byline&&PF.name?`<div class="byline reveal">${avatar(34)}<span>${esc(PF.name)}</span></div>`:''}<div class="pixel reveal" style="--d:.2s">${fmt(p.publish_at)} | ${mins(p)} menit baca${p.status!=='published'?' | DRAF':''}</div>${cu?`<img class="cover reveal" src="${esc(cu)}" alt=""${fo?` style="object-position:${esc(fo)}"`:''}>`:''}<div class="body">${md(p.content,D)}</div>
   ${gal.length?`<div class="gal reveal">${gal.map(g=>`<img src="${esc(g.url)}" alt="${esc(g.name)}" loading="lazy">`).join('')}</div>`:''}
   ${files.length?`<div class="files reveal"><h3>Lampiran</h3>${files.map(f=>`<div class="glass file"><span class="fi">${ic(fileIcon(f),24)}</span><div><b>${esc(f.name)}</b><br><small>${fsz(f.size)}</small></div><a class="btn sm" href="${esc(f.url)}" download target="_blank" rel="noopener">${ic('download',15)} Unduh</a></div>`).join('')}</div>`:''}
   ${(p.tags||[]).length?`<div class="tags">${p.tags.map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div>`:''}<div class="acts"><button class="btn ghost" data-copy>${ic('link',16)} Salin tautan</button><a class="btn ghost" href="index.html#artikel">${ic('arrow-left',16)} Semua artikel</a></div>${(pv||nx)?`<div class="pn">${pv?`<a class="glass win-body" href="post.html?s=${encodeURIComponent(pv.slug)}"><span class="pixel">sebelumnya</span><br>${esc(pv.title)}</a>`:'<span></span>'}${nx?`<a class="glass win-body" style="text-align:right" href="post.html?s=${encodeURIComponent(nx.slug)}"><span class="pixel">berikutnya</span><br>${esc(nx.title)}</a>`:''}</div>`:''}</article>`}}
 else{const p=find('page','p');
  if(!p)html=notFound();else{seo(p.seo_title||p.title,p.seo_desc||p.excerpt);html=`<article class="wrap post" style="padding-top:4rem"><h1 class="chrome reveal">${esc(p.title)}</h1><div class="body">${md(p.content,D)}</div></article>`}}
 if(T.maintenance&&bypass&&!embed)html=`<div class="ownerbar">Mode perawatan aktif — pengunjung lain hanya melihat halaman perawatan.</div>`+html;
 if(top!==lastTop){lastTop=top;$('top').innerHTML=top}if(foot!==lastFoot){lastFoot=foot;$('foot').innerHTML=foot}
 if(html!==last){last=html;app.innerHTML=html;app.querySelectorAll('.body>*').forEach(e=>e.classList.add('reveal'));drawGrid(!first);countdown()}
 FX.set(S.fx);if(first){FX.init(embed)}FX.refresh(!first);FX.particles(S.particles);FX.text(S.theme.heroFx);
 if(!showMaint||MT.player)Player.sync(D,embed);else Player.destroy()}

app.addEventListener('input',e=>{if(e.target.id==='qs'){term=e.target.value.toLowerCase();drawGrid(1)}});
app.addEventListener('click',e=>{const b=e.target.closest('.f');if(b){cat=b.dataset.c;document.querySelectorAll('.filters .f').forEach(x=>x.classList.toggle('on',x===b));drawGrid(1)}
 const c=e.target.closest('[data-copy]');if(c){navigator.clipboard&&navigator.clipboard.writeText(location.href.replace(/[?&](preview|embed|draft|maint)=1/g,''));c.textContent='Tersalin'}});
document.addEventListener('click',e=>{const i=e.target.closest('.body img,.gal img,.cover');if(!i||embed)return;const o=document.createElement('div');o.className='lb';o.innerHTML=`<img src="${esc(i.src)}" alt="">`;o.onclick=()=>o.remove();document.body.appendChild(o)});
addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.lb').forEach(x=>x.remove())});
document.addEventListener('submit',async e=>{const f=e.target.closest('[data-f]');if(!f)return;e.preventDefault();const b=f.querySelector('button'),o=b.textContent,v=Object.fromEntries(new FormData(f)),say=t=>{b.textContent=t;setTimeout(()=>b.textContent=o,2400)};
 if(v.website)return;if(embed||!Store.sb){say('Mode demo');return}
 const gb=f.dataset.f==='gb',r=gb?await Store.sb.from('guestbook').insert({name:v.name.trim(),message:v.message.trim()}):await Store.sb.from('subscribers').insert({email:v.email.trim().toLowerCase()});
 say(r.error?(r.error.code==='23505'?'Sudah terdaftar':'Gagal, coba lagi'):(gb?'Menunggu persetujuan':'Terkirim'));if(!r.error)f.reset()});
/* di preview: klik elemen → beri tahu Studio bagian mana yang dipilih */
if(embed)document.addEventListener('click',e=>{const t=e.target,s=t.closest('#wcp')?'player':t.closest('.card')?'thumb':t.closest('[data-sec]');parent.postMessage({wc:'pick',sec:typeof s==='string'?s:(s&&s.dataset.sec)||''},'*')},true);

build();first=0;
if(location.hash)try{document.querySelector(location.hash).scrollIntoView()}catch(e){}
if(embed){addEventListener('message',e=>{if(e.source!==parent||!e.data||e.data.wc!=='state')return;const m=e.data;if(m.settings)D.settings=m.settings;if(m.media)D.media=m.media;if(m.tracks)D.tracks=m.tracks;draft=m.draft||null;build()});parent.postMessage({wc:'ready'},'*')}
else{Store.sub(async()=>{try{D=await Store.load();build()}catch(e){}});
 if(!sessionStorage.wcHit){sessionStorage.wcHit=1;Store.bump().then(n=>{if(n){D.hits=n;build()}})}}
})();
