/* ===== main.js — efek (dikonfigurasi lewat FX.set) ===== */
const FX=(()=>{
const $$=(s,c=document)=>[...c.querySelectorAll(s)];let io,cfg={},lastT=0;
const spd=()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spd'))||1;
function refresh(instant){
 $$('.grid').forEach(g=>$$('.reveal',g).forEach((el,i)=>el.style.setProperty('--d',i*.08+'s')));
 $$('.reveal:not(.in)').forEach(e=>(instant||!cfg.reveal)?e.classList.add('in'):io.observe(e))}
function init(embed){
 io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
 addEventListener('pointermove',e=>{const s=document.documentElement.style;s.setProperty('--mx',e.clientX+'px');s.setProperty('--my',e.clientY+'px');
  if(cfg.trail&&e.timeStamp-lastT>45){lastT=e.timeStamp;const i=document.createElement('i');i.className='spark';i.textContent='✦';
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
