/* ===== main.js — efek, wallpaper dinamis, kursor ===== */
const Wall=(()=>{let S=null,M=[],cache={},timer;const R=document.documentElement.style,set=(k,v)=>R.setProperty(k,v);
 const rgb2h=(r,g,b)=>{r/=255;g/=255;b/=255;const x=Math.max(r,g,b),n=Math.min(r,g,b),d=x-n,l=(x+n)/2;if(!d)return[0,0,l];const s=d/(1-Math.abs(2*l-1));let h=x===r?((g-b)/d)%6:x===g?(b-r)/d+2:(r-g)/d+4;return[(h*60+360)%360,s,l]};
 function palette(url,cb){if(cache[url])return cb(cache[url]);const im=new Image();im.crossOrigin='anonymous';
  im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.drawImage(im,0,0,32,32);const d=x.getImageData(0,0,32,32).data,b=Array.from({length:12},()=>({n:0,h:0}));
   for(let i=0;i<d.length;i+=4){const [h,s,l]=rgb2h(d[i],d[i+1],d[i+2]);if(s<.25||l<.12||l>.9)continue;const k=Math.floor(h/30)%12;b[k].n+=s;b[k].h+=h*s}
   const top=b.filter(o=>o.n>0).sort((a,c)=>c.n-a.n).slice(0,3).map(o=>o.h/o.n);if(!top.length)top.push(280);while(top.length<3)top.push((top[top.length-1]+70)%360);cache[url]=top;cb(top)}catch(e){}};im.src=url}
 function applyPal(h){set('--a1',`hsl(${h[0]},85%,60%)`);set('--a2',`hsl(${h[1]},85%,62%)`);set('--a3',`hsl(${h[2]},85%,62%)`);
  if(S.wall.dynAccent){set('--pink',`hsl(${h[0]},90%,68%)`);set('--cyan',`hsl(${h[1]},90%,68%)`);set('--violet',`hsl(${h[2]},85%,66%)`)}}
 const clr=()=>['--a1','--a2','--a3'].forEach(k=>R.removeProperty(k));
 const tick=()=>{if(!S||S.wall.dyn!=='time')return;const d=new Date();set('--wp-h',(((d.getHours()+d.getMinutes()/60)/24)*S.wall.dynRange).toFixed(1))};
 function apply(s,m){S=s;M=m||[];const W=S.wall;tick();
  if(W.dyn==='image'){const im=M.find(x=>x.id===W.image);if(im)palette(im.url,applyPal);else clr()}else clr();
  clearInterval(timer);if(W.dyn==='time')timer=setInterval(tick,6e4)}
 addEventListener('scroll',()=>{if(!S)return;const h=document.documentElement,f=h.scrollTop/(h.scrollHeight-h.clientHeight||1);if(S.wall.dyn==='scroll')set('--wp-h',(f*S.wall.dynRange).toFixed(1));if(S.wall.parallax)set('--wpy-s',(-h.scrollTop*.06)+'px')},{passive:true});
 addEventListener('pointermove',e=>{if(!S||S.wall.dyn!=='pointer')return;const x=e.clientX/innerWidth,y=e.clientY/innerHeight;set('--wpx',(x*100)+'%');set('--wpy',(y*100)+'%');set('--wp-h',(x*S.wall.dynRange).toFixed(1))});
 return{apply}})();

/* ===== partikel latar: sakura, salju, bintang, gelembung, kunang-kunang, hati, garis kecepatan ===== */
const Particles=(()=>{let cv,cx,ps=[],cfg={type:'none'},raf=0,W=0,H=0,t0=0;
 const SZ={sakura:9,snow:3,stars:4,bubbles:9,fireflies:2.6,hearts:8,speed:1};
 const col=()=>cfg.auto?getComputedStyle(document.documentElement).getPropertyValue('--pink').trim()||'#ff9ccf':cfg.color;
 const mk=(init)=>{const t=cfg.type,s=(Math.random()*.6+.7)*cfg.size*SZ[t],sp=cfg.speed;
  return{x:Math.random()*W,y:init?Math.random()*H:(t==='bubbles'?H+20:-20),s,vy:(t==='bubbles'?-1:1)*(Math.random()*.8+.5)*sp*(t==='snow'?.8:t==='sakura'?1:t==='stars'?.15:t==='fireflies'?.2:t==='speed'?9:.9),
   vx:(Math.random()-.5)*.6*sp,r:Math.random()*6.28,vr:(Math.random()-.5)*.03*sp,ph:Math.random()*6.28}};
 function size(){if(!cv)return;const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0)}
 function petal(s){cx.beginPath();cx.moveTo(0,-s);cx.bezierCurveTo(s*.9,-s*.7,s*.9,s*.5,0,s);cx.bezierCurveTo(-s*.9,s*.5,-s*.9,-s*.7,0,-s);cx.moveTo(0,-s);cx.lineTo(0,-s*.35)}
 function heart(s){cx.beginPath();cx.moveTo(0,s*.9);cx.bezierCurveTo(-s*1.4,-s*.2,-s*.6,-s*1.1,0,-s*.4);cx.bezierCurveTo(s*.6,-s*1.1,s*1.4,-s*.2,0,s*.9)}
 function frame(ts){raf=requestAnimationFrame(frame);if(document.hidden||cfg.type==='none')return;const dt=Math.min(40,ts-t0)/16.7;t0=ts;cx.clearRect(0,0,W,H);const c=col(),wind=cfg.wind/100*1.2,t=cfg.type;cx.globalAlpha=cfg.opacity/100;cx.fillStyle=c;cx.strokeStyle=c;
  for(const p of ps){p.ph+=.02*dt;p.y+=p.vy*dt;p.x+=(p.vx+wind*(t==='speed'?.4:1)+(t==='sakura'||t==='snow'?Math.sin(p.ph)*.5:0))*dt;p.r+=p.vr*dt;
   if(t==='fireflies'){p.x+=Math.sin(p.ph*.7)*.6*dt;p.y+=Math.cos(p.ph*.5)*.5*dt}
   if(p.y>H+30||p.y<-30||p.x>W+30||p.x<-30){Object.assign(p,mk(false));if(t==='bubbles')p.y=H+20;else if(t!=='fireflies'&&t!=='stars')p.x=Math.random()*W;continue}
   cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);
   if(t==='sakura'){cx.scale(.7,1);petal(p.s);cx.fill()}
   else if(t==='snow'){cx.beginPath();cx.arc(0,0,p.s,0,6.28);cx.fill()}
   else if(t==='bubbles'){cx.lineWidth=1.3;cx.beginPath();cx.arc(0,0,p.s,0,6.28);cx.stroke()}
   else if(t==='hearts'){heart(p.s);cx.fill()}
   else if(t==='stars'){cx.globalAlpha=cfg.opacity/100*(.4+.6*Math.abs(Math.sin(p.ph)));cx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?p.s*.3:p.s;cx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}cx.closePath();cx.fill()}
   else if(t==='fireflies'){const g=cx.createRadialGradient(0,0,0,0,0,p.s*4);g.addColorStop(0,c);g.addColorStop(1,'transparent');cx.globalAlpha=cfg.opacity/100*(.3+.7*Math.abs(Math.sin(p.ph)));cx.fillStyle=g;cx.beginPath();cx.arc(0,0,p.s*4,0,6.28);cx.fill();cx.fillStyle=c}
   else if(t==='speed'){cx.rotate(-p.r+.5);cx.lineWidth=1.2;cx.beginPath();cx.moveTo(0,0);cx.lineTo(0,70*cfg.size);cx.stroke()}
   cx.restore()}}
 function set(c){c=c||{type:'none'};const rebuild=!cv||c.type!==cfg.type||c.count!==cfg.count;cfg=c;
  if(!cv){cv=document.createElement('canvas');cv.className='pcv';cx=cv.getContext('2d');document.body.appendChild(cv);addEventListener('resize',size);size();raf=requestAnimationFrame(frame)}
  cv.classList.toggle('front',!!c.front);cv.style.display=c.type==='none'?'none':'block';
  if(rebuild){ps=c.type==='none'?[]:Array.from({length:c.count},()=>mk(true))}}
 return{set}})();

/* ===== efek teks hero ===== */
const HeroFx=(()=>{let tmr;return function(mode){const h=document.querySelector('.hero h1'),k=document.querySelector('.hero .hk');if(!h)return;
 clearInterval(tmr);if(h.dataset.fx===mode&&!(mode==='type'&&k&&k.dataset.done!=='1'))return;h.dataset.fx=mode;h.className=h.className.replace(/\bfx-\w+/g,'').trim();
 if(mode==='glitch'){h.classList.add('fx-glitch');h.dataset.t=h.textContent}
 else if(mode==='wave'){h.classList.add('fx-wave');let i=0;const wrap=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();[...c.textContent].forEach(ch=>{const s=document.createElement('span');s.textContent=ch;s.style.setProperty('--i',i++);f.appendChild(s)});c.replaceWith(f)}else if(c.nodeType===1&&c.tagName!=='BR')wrap(c)})};wrap(h)}
 else if(mode==='type'&&k){const full=k.dataset.full||k.textContent;k.dataset.full=full;k.dataset.done='0';k.textContent='';let n=0;tmr=setInterval(()=>{k.textContent=full.slice(0,++n);if(n>=full.length){clearInterval(tmr);k.dataset.done='1'}},45)}}})();

const FX=(()=>{
const $$=(s,c=document)=>[...c.querySelectorAll(s)];let io,cfg={},lastT=0,booted=0;
const spd=()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spd'))||1;
function refresh(instant){
 $$('.grid').forEach(g=>$$('.reveal',g).forEach((el,i)=>el.style.setProperty('--d',i*.08+'s')));
 $$('.reveal:not(.in)').forEach(e=>{if(instant||!cfg.reveal){e.classList.add('in','rdone')}else io.observe(e)})}
function init(embed){
 io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
 /* selesai animasi masuk → hilangkan delay & transisi lambat agar hover/tilt responsif */
 document.addEventListener('transitionend',e=>{const t=e.target;if(t.classList&&t.classList.contains('reveal')&&t.classList.contains('in')&&e.propertyName==='opacity')t.classList.add('rdone')});
 const ring=document.createElement('div');ring.className='ring';document.body.appendChild(ring);
 addEventListener('pointermove',e=>{const s=document.documentElement.style;s.setProperty('--mx',e.clientX+'px');s.setProperty('--my',e.clientY+'px');
  if(cfg.trail&&e.timeStamp-lastT>45){lastT=e.timeStamp;const i=document.createElement('i');i.className='spark';i.textContent='+';
   i.style.cssText=`left:${e.clientX}px;top:${e.clientY}px;color:hsl(${Math.random()*360},100%,75%);--dx:${(Math.random()-.5)*60}px`;document.body.appendChild(i);setTimeout(()=>i.remove(),900)}
  const c=e.target.closest&&e.target.closest('.card');
  if(cfg.tilt&&c){const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;c.style.transform=`perspective(900px) rotateY(${x*9}deg) rotateX(${-y*9}deg) translateY(-6px)`}});
 document.addEventListener('pointerout',e=>{const c=e.target.closest&&e.target.closest('.card');if(c&&!c.contains(e.relatedTarget))c.style.transform=''});
 const cu=document.querySelector('.curtain')||document.body.appendChild(Object.assign(document.createElement('div'),{className:'curtain'}));
 /* buka tirai: hapus class "loading" → transisi clip-path menutup lingkaran */
 if(!cfg.transition||embed)cu.style.transition='none';
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.remove('loading')));
 addEventListener('pageshow',e=>{cu.classList.remove('cover');if(e.persisted)document.body.classList.remove('loading')});
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;
  if(embed){e.preventDefault();return}
  if(!cfg.transition||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||a.target||a.hasAttribute('download'))return;
  const u=new URL(a.href,location.href);if(u.protocol!==location.protocol||(u.protocol.startsWith('http')&&u.origin!==location.origin))return;
  if(u.hash&&u.pathname===location.pathname)return;
  e.preventDefault();cu.style.transition='';cu.style.setProperty('--cx',e.clientX+'px');cu.style.setProperty('--cy',e.clientY+'px');
  cu.classList.add('cover');setTimeout(()=>location.href=a.href,650*spd())});
 addEventListener('scroll',()=>{const bar=document.querySelector('.progress');if(bar){const h=document.documentElement;bar.style.transform=`scaleX(${h.scrollTop/(h.scrollHeight-h.clientHeight||1)})`}},{passive:true})}
return{init,refresh,set:f=>cfg=f||{},text:HeroFx,particles:Particles.set}})();
