/* ===== player.js — pemutar musik bergaya nightcore: sampul, info, visualizer, speed+pitch, reverb, bass, lirik LRC ===== */
const Player=(()=>{
let host,A,ac,nd={},D,P={},tracks=[],idx=0,embed=false,built=false,sig='',st={},lrc=[],raf=0,noFx=false,order=[],resumeT=0,wantPlay=false;
const esc=Store.esc,fmt=t=>{t=Math.max(0,Math.floor(t||0));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
const $=(s,c=host)=>c.querySelector(s),$$=(s,c=host)=>[...c.querySelectorAll(s)];
const media=id=>D.media.find(x=>x.id===id),cvr=t=>{const m=t&&media(t.cover);return m?m.url:''},aud=t=>{const m=t&&media(t.audio);return m?m.url:''};
const TPL=`<div class="pbg"></div><button class="pmini" aria-label="Buka pemutar"><span class="pm-cov"></span><i class="pm-ring"></i></button>
<div class="pmain glass"><div class="phead"><span class="pchip" data-r="nc"></span><span class="pnum"></span><span class="sp"></span><button data-a="lyr" title="Lirik">${ic('mic',16)}</button><button data-a="list" title="Playlist">${ic('list',16)}</button><button data-a="fx" title="Efek suara">${ic('sliders',16)}</button><button data-a="min" title="Kecilkan">${ic('chevron-down',16)}</button></div>
<div class="pcov"><div class="pdisc"><img class="pimg" alt=""><span class="pph">${ic('music',48)}</span><i class="phole"></i></div><canvas class="pviz"></canvas></div>
<div class="pinfo"><div class="ptitle"><span></span></div><div class="partist"></div><div class="pchips"></div></div><div class="plrc"></div>
<div class="pseek"><span class="pcur">0:00</span><input type="range" class="pr" min="0" max="1000" value="0" aria-label="Posisi"><span class="pdur">0:00</span></div>
<div class="pctl"><button data-a="shuf" title="Acak">${ic('shuffle',16)}</button><button data-a="prev" title="Sebelumnya">${ic('skip-back',20)}</button><button data-a="play" class="pbig" title="Putar">${ic('play',24)}</button><button data-a="next" title="Berikutnya">${ic('skip-forward',20)}</button><button data-a="rep" title="Ulangi">${ic('repeat',16)}<b class="r1">1</b></button><span class="pvol"><button data-a="mute" title="Senyap">${ic('volume',16)}</button><input type="range" class="pv" min="0" max="100" aria-label="Volume"></span></div>
<div class="ppanel pfx"><label>Kecepatan <b class="rv">1.00×</b><input type="range" class="fr" min="50" max="200" step="1"></label>
<div class="pre"><button data-p="1">Normal</button><button data-p="1.25">Nightcore</button><button data-p="1.4">Hyper</button><button data-p="0.85">Slowed</button></div>
<label class="sw"><input type="checkbox" class="fn"> Naikkan pitch mengikuti kecepatan (nightcore)</label><label>Reverb <input type="range" class="fv" min="0" max="100"></label><label>Bass boost <input type="range" class="fb" min="0" max="12"></label><p class="fnote"></p></div>
<div class="ppanel plist"></div><div class="ppanel plyr"></div></div>`;

/* ---------- lirik LRC ---------- */
function parseLrc(t){const out=[];String(t||'').split(/\r?\n/).forEach(l=>{const m=[...l.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)],txt=l.replace(/\[[^\]]*\]/g,'').trim();m.forEach(x=>out.push({t:+x[1]*60+ +x[2],s:txt}))});return out.sort((a,b)=>a.t-b.t)}

/* ---------- audio graph (hanya jika CORS mengizinkan) ---------- */
function fxInit(){if(ac||noFx)return;try{const AC=window.AudioContext||window.webkitAudioContext;ac=new AC();const src=ac.createMediaElementSource(A);
 nd.bass=ac.createBiquadFilter();nd.bass.type='lowshelf';nd.bass.frequency.value=160;nd.dry=ac.createGain();nd.wet=ac.createGain();nd.cv=ac.createConvolver();
 const n=ac.sampleRate*2.4,b=ac.createBuffer(2,n,ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3)}nd.cv.buffer=b;
 nd.an=ac.createAnalyser();nd.an.fftSize=512;nd.an.smoothingTimeConstant=.78;
 src.connect(nd.bass);nd.bass.connect(nd.dry);nd.bass.connect(nd.cv);nd.cv.connect(nd.wet);nd.dry.connect(nd.an);nd.wet.connect(nd.an);nd.an.connect(ac.destination);fxApply()}catch(e){noFx=true}}
function fxApply(){if(!nd.bass)return;const w=st.reverb/100;nd.wet.gain.value=w*1.3;nd.dry.gain.value=1-w*.35;nd.bass.gain.value=st.bass}
function rate(){A.playbackRate=st.rate;const pp=!st.nc;A.preservesPitch=pp;A.mozPreservesPitch=pp;A.webkitPreservesPitch=pp}

/* ---------- tampilan ---------- */
function vars(){const h=host.style;host.dataset.style=P.style;host.dataset.pos=P.pos;host.dataset.cover=P.cover;host.dataset.shape=P.shape;host.dataset.bg=P.bg;host.classList.toggle('noglow',!P.glow);
 h.setProperty('--psz',P.size);h.setProperty('--pa',P.useAccent?P.accent:'var(--pink)');
 ['sTitle','sArtist','sAlbum','sMeta','sTime','sLyrics','sList','sFx'].forEach(k=>host.classList.toggle('h-'+k,!P[k]))}
function info(){const t=tracks[idx];if(!t)return;const c=cvr(t),img=$('.pimg');
 host.classList.toggle('nocov',!c);if(c){img.src=c;host.style.setProperty('--pcov',`url("${c}")`)}else{img.removeAttribute('src');host.style.setProperty('--pcov','none')}
 $('.pm-cov').style.backgroundImage=c?`url("${c}")`:'';
 const tt=$('.ptitle span');tt.textContent=t.title;$('.ptitle').classList.toggle('mq',tt.scrollWidth>$('.ptitle').clientWidth+4);
 $('.partist').textContent=[t.artist,P.sAlbum&&t.album].filter(Boolean).join('  ·  ');
 $('.pchips').innerHTML=[t.year,t.genre,t.duration?fmt(t.duration):''].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('');
 $('.pnum').textContent=(idx+1)+' / '+tracks.length;lrc=parseLrc(t.lyrics);
 $('.plyr').innerHTML=t.lyrics?(lrc.length?lrc.map((l,i)=>`<p data-i="${i}" data-t="${l.t}">${esc(l.s)||'&nbsp;'}</p>`).join(''):`<pre>${esc(t.lyrics)}</pre>`):'<p class="empty">Tidak ada lirik.</p>';
 $('.plrc').textContent='';$('.pdur').textContent=fmt(t.duration);
 $('.plist').innerHTML=tracks.map((x,i)=>`<button data-i="${i}" class="${i===idx?'on':''}"><span class="pl-c" style="background-image:${cvr(x)?`url('${esc(cvr(x))}')`:'none'}"></span><span><b>${esc(x.title)}</b><small>${esc(x.artist)}</small></span><em>${x.duration?fmt(x.duration):''}</em></button>`).join('');
 if('mediaSession' in navigator&&P.media&&!embed){try{navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist,album:t.album,artwork:c?[{src:c,sizes:'512x512'}]:[]})}catch(e){}}}
function badge(){const r=st.rate,c=$('.pchip');c.textContent=(st.nc&&r>1.04)?`NIGHTCORE ${r.toFixed(2)}×`:r!==1?`${r.toFixed(2)}×`:'NOW PLAYING';c.classList.toggle('nc',st.nc&&r>1.04);$('.rv').textContent=r.toFixed(2)+'×';$('.fr').value=Math.round(r*100);$('.fn').checked=!!st.nc;$('.fv').value=st.reverb;$('.fb').value=st.bass;
 $('.fnote').textContent=noFx?'Reverb & bass butuh file audio dengan CORS (Supabase Storage mendukung).':''}
function ui(){const pl=!A.paused;host.classList.toggle('playing',pl);$('[data-a=play]').innerHTML=ic(pl?'pause':'play',24);$('[data-a=shuf]').classList.toggle('on',!!st.shuffle);
 const rp=$('[data-a=rep]');rp.classList.toggle('on',st.loop!=='off');rp.classList.toggle('one',st.loop==='one');$('[data-a=mute]').innerHTML=ic(A.muted||!A.volume?'volume-x':'volume',16);host.classList.toggle('open',!!st.open)}

/* ---------- kontrol ---------- */
function load(i,play){idx=(i+tracks.length)%tracks.length;const t=tracks[idx];A.src=aud(t);A.load();if(!st.user&&t.speed&&t.speed!==1)st.rate=t.speed;else if(!st.user)st.rate=P.speed;rate();info();badge();$('.pr').value=0;$('.pcur').textContent='0:00';
 if(play)start()}
function start(){fxInit();if(ac&&ac.state==='suspended')ac.resume();const r=A.play();if(r&&r.catch)r.catch(()=>{host.classList.add('blocked');ui()})}
function pick(dir){if(st.shuffle&&tracks.length>1){let n;do n=Math.floor(Math.random()*tracks.length);while(n===idx);return n}return idx+dir}
const next=()=>load(pick(1),true),prev=()=>{if(A.currentTime>3){A.currentTime=0}else load(pick(-1),true)};
function save(){if(embed||!built)return;try{sessionStorage.wcPl=JSON.stringify({id:(tracks[idx]||{}).id,t:A.currentTime,p:!A.paused,r:st.rate,u:st.user,nc:st.nc,rv:st.reverb,b:st.bass,v:A.volume,sh:st.shuffle,lp:st.loop,o:st.open})}catch(e){}}
function lyric(){if(!lrc.length)return;const t=A.currentTime;let i=lrc.findIndex(l=>l.t>t)-1;if(i<-2)i=lrc.length-1;if(i<0)i=0;const el=$('.plrc'),tx=lrc[i].s;if(el.dataset.i!==String(i)){el.dataset.i=i;el.innerHTML=`<small>${esc((lrc[i-1]||{}).s||'')}</small><b>${esc(tx||'♪')}</b><small>${esc((lrc[i+1]||{}).s||'')}</small>`;
 $$('.plyr p').forEach(p=>p.classList.toggle('on',+p.dataset.i===i));const a=$('.plyr p.on');if(a&&host.classList.contains('lyrOpen'))a.scrollIntoView({block:'center',behavior:'smooth'})}}

/* ---------- visualizer ---------- */
function draw(){raf=requestAnimationFrame(draw);const cv=$('.pviz');if(!cv||!host.classList.contains('open')||A.paused||!nd.an||P.viz==='none')return;
 const w=cv.clientWidth,h=cv.clientHeight;if(cv.width!==w*2){cv.width=w*2;cv.height=h*2}const g=cv.getContext('2d'),an=nd.an,N=an.frequencyBinCount,d=new Uint8Array(N);
 g.clearRect(0,0,cv.width,cv.height);const W=cv.width,H=cv.height,S=P.vizSens;let e=0;an.getByteFrequencyData(d);for(let i=0;i<5;i++)e+=d[i];e/=5*255;host.style.setProperty('--beat',P.cover==='bounce'?(1+e*.14*S).toFixed(3):1);
 const color=i=>P.vizColor==='rainbow'?`hsl(${i*300+(Date.now()/30%360)},95%,65%)`:P.vizColor==='white'?'#fff':`hsl(${320-i*110},100%,${62+e*10}%)`;
 if(P.viz==='wave'){an.getByteTimeDomainData(d);g.lineWidth=3;g.strokeStyle=color(.3);g.beginPath();for(let i=0;i<N;i++){const x=i/N*W,y=H/2+(d[i]-128)/128*H*.35*S;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();return}
 const n=P.vizBars,step=Math.floor(N*.7/n)||1;
 if(P.viz==='ring'){const r0=Math.min(W,H)*.34,cx=W/2,cy=H/2;g.lineCap='round';g.lineWidth=Math.max(2,W/n*.7);for(let i=0;i<n;i++){const v=d[i*step]/255*S,a=i/n*6.283-1.57;g.strokeStyle=color(i/n);g.beginPath();g.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0);g.lineTo(cx+Math.cos(a)*(r0+v*W*.16+3),cy+Math.sin(a)*(r0+v*W*.16+3));g.stroke()}return}
 const bw=W/n;for(let i=0;i<n;i++){const v=Math.pow(d[i*step]/255,1.2)*S,bh=Math.max(3,v*H*.9);g.fillStyle=color(i/n);g.beginPath();g.roundRect?g.roundRect(i*bw+bw*.15,H-bh,bw*.7,bh,bw*.3):g.rect(i*bw+bw*.15,H-bh,bw*.7,bh);g.fill()}}

/* ---------- build ---------- */
function build(){host=document.createElement('div');host.id='wcp';host.innerHTML=TPL;document.body.appendChild(host);A=new Audio();A.preload='metadata';A.crossOrigin='anonymous';built=true;
 A.addEventListener('timeupdate',()=>{const d=A.duration||tracks[idx].duration||0;if(d)$('.pr').value=A.currentTime/d*1000;$('.pcur').textContent=fmt(A.currentTime);host.style.setProperty('--prog',d?A.currentTime/d*100:0);lyric()});
 A.addEventListener('loadedmetadata',()=>{$('.pdur').textContent=fmt(A.duration);if(resumeT){A.currentTime=resumeT;resumeT=0}});
 A.addEventListener('play',()=>{host.classList.remove('blocked');ui()});A.addEventListener('pause',()=>{ui();save()});
 A.addEventListener('ended',()=>{if(st.loop==='one'){A.currentTime=0;start()}else if(st.loop==='off'&&idx===tracks.length-1&&!st.shuffle)ui();else next()});
 A.addEventListener('error',()=>{if(A.crossOrigin){A.removeAttribute('crossorigin');noFx=true;const t=A.currentTime;A.src=aud(tracks[idx]);A.load();resumeT=t;if(wantPlay)start()}});
 host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b){if(e.target.closest('.pmini'))return;return}
  if(b.classList.contains('pmini')){st.open=1;ui();if(host.classList.contains('blocked'))start();save();return}
  const a=b.dataset.a;
  if(a==='play'){A.paused?(wantPlay=true,start()):(wantPlay=false,A.pause())}else if(a==='next')next();else if(a==='prev')prev();else if(a==='shuf'){st.shuffle=st.shuffle?0:1;ui()}
  else if(a==='rep'){st.loop={all:'one',one:'off',off:'all'}[st.loop];ui()}else if(a==='mute'){A.muted=!A.muted;ui()}else if(a==='min'){st.open=0;ui()}
  else if(['list','fx','lyr'].includes(a)){const k={list:'plist',fx:'pfx',lyr:'plyr'}[a],on=host.classList.contains('o-'+k);['plist','pfx','plyr'].forEach(x=>host.classList.remove('o-'+x));host.classList.remove('lyrOpen');if(!on){host.classList.add('o-'+k);if(a==='lyr')host.classList.add('lyrOpen')}}
  else if(b.dataset.i!=null&&b.closest('.plist'))load(+b.dataset.i,true);
  else if(b.dataset.p){st.rate=+b.dataset.p;st.user=1;st.nc=+b.dataset.p>1?1:(+b.dataset.p<1?0:st.nc);if(+b.dataset.p===0.85)st.reverb=Math.max(st.reverb,40);fxApply();rate();badge()}
  save()});
 $('.plyr').onclick=e=>{const p=e.target.closest('p[data-t]');if(p)A.currentTime=+p.dataset.t};
 $('.pr').oninput=e=>{const d=A.duration||tracks[idx].duration||0;if(d)A.currentTime=e.target.value/1000*d};
 $('.pv').oninput=e=>{A.volume=e.target.value/100;A.muted=false;ui()};
 $('.fr').oninput=e=>{st.rate=e.target.value/100;st.user=1;rate();badge()};$('.fn').onchange=e=>{st.nc=e.target.checked?1:0;rate();badge()};
 $('.fv').oninput=e=>{st.reverb=+e.target.value;fxInit();fxApply()};$('.fb').oninput=e=>{st.bass=+e.target.value;fxInit();fxApply()};
 if('mediaSession' in navigator&&!embed){const m=(a,f)=>{try{navigator.mediaSession.setActionHandler(a,f)}catch(e){}};m('play',()=>start());m('pause',()=>A.pause());m('previoustrack',prev);m('nexttrack',next);m('seekto',x=>{A.currentTime=x.seekTime})}
 setInterval(save,1500);addEventListener('pagehide',save);raf=requestAnimationFrame(draw)}
function destroy(){if(!built)return;try{A.pause();cancelAnimationFrame(raf)}catch(e){}host.remove();built=false;sig='';ac=null;nd={}}

function sync(d,emb){D=d;embed=!!emb;P=d.settings.player;const list=(d.tracks||[]).filter(t=>t.active!==false&&media(t.audio));
 if(!P.on||!list.length||(P.pages==='home'&&document.body.dataset.view!=='home')){destroy();return}
 const s=JSON.stringify(list.map(t=>[t.id,t.audio,t.cover,t.title,t.artist,t.album,t.year,t.genre,t.lyrics,t.speed,t.duration]))+d.media.length;
 const first=!built;tracks=list;
 if(first){let sv={};try{sv=P.resume&&!embed?JSON.parse(sessionStorage.wcPl||'{}'):{}}catch(e){}
  st={rate:sv.r||P.speed,user:sv.u||0,nc:sv.nc!=null?sv.nc:P.nc,reverb:sv.rv!=null?sv.rv:P.reverb,bass:sv.b!=null?sv.b:P.bass,shuffle:sv.sh!=null?sv.sh:P.shuffle,loop:sv.lp||P.loop,open:sv.o!=null?sv.o:P.open};
  build();vars();const i=Math.max(0,tracks.findIndex(t=>t.id===sv.id));A.volume=(sv.v!=null?sv.v:P.volume/100);$('.pv').value=A.volume*100;resumeT=sv.t||0;load(i,false);
  if(!embed&&(sv.p||P.autoplay)){wantPlay=true;start()}ui()}
 else{vars();if(s!==sig){const cur=tracks[idx]&&tracks[idx].id;const keep=tracks.findIndex(t=>t.id===cur);if(keep>=0)idx=keep;else load(0,false);info()}if(!st.user){st.rate=tracks[idx].speed&&tracks[idx].speed!==1?tracks[idx].speed:P.speed;rate();badge()}}
 sig=s;ui()}
return{sync,destroy}})();
