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

const FX=(()=>{
const $$=(s,c=document)=>[...c.querySelectorAll(s)];let io,cfg={},lastT=0;
const spd=()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spd'))||1;
function refresh(instant){
 $$('.grid').forEach(g=>$$('.reveal',g).forEach((el,i)=>el.style.setProperty('--d',i*.08+'s')));
 $$('.reveal:not(.in)').forEach(e=>(instant||!cfg.reveal)?e.classList.add('in'):io.observe(e))}
function init(embed){
 io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
 const ring=document.createElement('div');ring.className='ring';document.body.appendChild(ring);
 addEventListener('pointermove',e=>{const s=document.documentElement.style;s.setProperty('--mx',e.clientX+'px');s.setProperty('--my',e.clientY+'px');
  if(cfg.trail&&e.timeStamp-lastT>45){lastT=e.timeStamp;const i=document.createElement('i');i.className='spark';i.textContent='+';
   i.style.cssText=`left:${e.clientX}px;top:${e.clientY}px;color:hsl(${Math.random()*360},100%,75%);--dx:${(Math.random()-.5)*60}px`;document.body.appendChild(i);setTimeout(()=>i.remove(),900)}
  const c=e.target.closest&&e.target.closest('.card');
  if(cfg.tilt&&c){const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;c.style.transform=`perspective(900px) rotateY(${x*9}deg) rotateX(${-y*9}deg) translateY(-6px)`}});
 document.addEventListener('pointerout',e=>{const c=e.target.closest&&e.target.closest('.card');if(c&&!c.contains(e.relatedTarget))c.style.transform=''});
 const cu=document.createElement('div');cu.className='curtain';document.body.appendChild(cu);
 if(cfg.transition&&!embed)document.body.classList.add('enter');
 addEventListener('pageshow',()=>cu.classList.remove('cover'));
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;
  if(embed){e.preventDefault();return}
  if(!cfg.transition||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||a.target||a.hasAttribute('download'))return;
  const u=new URL(a.href,location.href);if(u.protocol!==location.protocol||(u.protocol.startsWith('http')&&u.origin!==location.origin))return;
  if(u.hash&&u.pathname===location.pathname)return;
  e.preventDefault();cu.style.setProperty('--cx',e.clientX+'px');cu.style.setProperty('--cy',e.clientY+'px');
  document.body.classList.remove('enter');cu.classList.add('cover');setTimeout(()=>location.href=a.href,650*spd())});
 addEventListener('scroll',()=>{const bar=document.querySelector('.progress');if(bar){const h=document.documentElement;bar.style.transform=`scaleX(${h.scrollTop/(h.scrollHeight-h.clientHeight||1)})`}},{passive:true})}
return{init,refresh,set:f=>cfg=f||{}}})();
