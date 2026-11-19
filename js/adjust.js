/* ===== adjust.js — Adjustment Studio (tersembunyi; hanya untuk admin yang login) ===== */
(async()=>{
const {esc}=Store,sb=Store.sb,{$,$$,look}=UI,root=$('#root');
if(!(await UI.guard())){UI.fake404();return}
document.title='Adjustment Studio';document.documentElement.style.visibility='visible';
let D=await Store.load(),S=D.settings,orig=JSON.stringify(S),hist=[orig],hi=0,page='index.html?embed=1',cmp=false,dev=localStorage.wcDev||'desktop',auto=false,dirty=false;
const ctx={S:()=>S,D:()=>D,tab:'warna',live:()=>live()},DEVW={mobile:390,tablet:768,desktop:1280};
const deb=(f,t)=>{let h;return(...a)=>{clearTimeout(h);h=setTimeout(()=>f(...a),t)}};
function toast(m,bad){const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.classList.add('out'),2200);setTimeout(()=>t.remove(),2800)}
const posts=D.entries.filter(e=>e.kind==='post'&&e.status==='published'),pages=D.entries.filter(e=>e.kind==='page'&&e.status==='published');
root.innerHTML=`<div class="studio"><div class="sbar glass"><b class="logo chrome">Adjustment</b><span id="st" class="pixel st"></span>
 <select id="pg"><option value="index.html?embed=1">Beranda</option>${posts.map(p=>`<option value="post.html?embed=1&s=${encodeURIComponent(p.slug)}">Artikel: ${esc(p.title)}</option>`).join('')}${pages.map(p=>`<option value="page.html?embed=1&p=${encodeURIComponent(p.slug)}">Halaman: ${esc(p.title)}</option>`).join('')}</select>
 ${[['mobile','smartphone'],['tablet','tablet'],['desktop','monitor']].map(d=>`<button class="btn sm ghost" data-dv="${d[0]}">${ic(d[1],15)}</button>`).join('')}
 <button class="btn sm ghost" id="un" title="Undo (Ctrl+Z)">${ic('undo',15)}</button><button class="btn sm ghost" id="re" title="Redo (Ctrl+Y)">${ic('redo',15)}</button><button class="btn sm ghost" id="cm" title="Bandingkan dengan versi tersimpan">${ic('eye',15)} Bandingkan</button>
 <label class="sw"><input type="checkbox" id="au"> Auto-simpan</label><button class="btn sm" id="sv">${ic('check',15)} Simpan</button><button class="btn sm ghost" id="pt">${ic('panel',15)} Panel</button><a class="btn sm ghost" href="admin.html">${ic('arrow-left',15)} Admin</a></div>
 <div class="sbody" id="sb"><iframe id="sf" title="Preview" sandbox="allow-scripts allow-same-origin"></iframe><aside class="spanel glass" id="sp"><header class="win-bar" id="sh"><b></b><b></b><b></b><span>pengaturan</span></header><div class="win-body" id="spb"></div></aside></div></div>`;
const sf=$('#sf'),flash=(t,c)=>{$('#st').textContent=t;$('#st').className='pixel st '+(c||'')};
function fit(){const b=$('#sb'),W=DEVW[dev],k=Math.min(1,b.clientWidth/W);sf.style.cssText=`width:${W}px;height:${b.clientHeight/k}px;transform:scale(${k});transform-origin:top center;margin-left:${(b.clientWidth-W)/2}px`}
const push=()=>{if(sf.contentWindow)sf.contentWindow.postMessage({wc:'state',settings:cmp?JSON.parse(orig):S,draft:null,media:D.media},'*')};
addEventListener('message',e=>{if(e.data&&e.data.wc==='ready')push()});addEventListener('resize',deb(fit,100));
const rec=deb(()=>{const j=JSON.stringify(S);if(j!==hist[hi]){hist=hist.slice(0,hi+1);hist.push(j);hi=hist.length-1}},450);
const aSave=deb(()=>save(),900);
function live(){push();rec();dirty=true;flash(auto?'Menyimpan…':'Belum disimpan','warn');if(auto)aSave()}
async function save(){flash('Menyimpan…');const {error}=await sb.from('settings').upsert({id:1,data:S,updated_at:new Date().toISOString()});if(error){toast(error.message,1);flash('Gagal','err')}else{orig=JSON.stringify(S);dirty=false;flash('Tersimpan','ok');toast('Tersimpan')}}
const panel=()=>look($('#spb'),ctx,true);
const restore=i=>{if(i<0||i>=hist.length)return;hi=i;S=JSON.parse(hist[i]);D.settings=S;panel();push();dirty=true;flash('Belum disimpan','warn')};
$('#pg').onchange=e=>{page=e.target.value;sf.src=page};sf.src=page;
$$('[data-dv]').forEach(b=>b.onclick=()=>{dev=b.dataset.dv;localStorage.wcDev=dev;fit()});
$('#un').onclick=()=>restore(hi-1);$('#re').onclick=()=>restore(hi+1);$('#sv').onclick=save;$('#au').onchange=e=>{auto=e.target.checked;if(auto&&dirty)aSave()};
$('#cm').onclick=()=>{cmp=!cmp;$('#cm').classList.toggle('on',cmp);push()};
$('#pt').onclick=()=>$('#sp').classList.toggle('off');
addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey))return;if(e.key==='s'){e.preventDefault();save()}else if(e.key==='z'&&!e.shiftKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();restore(hi-1)}else if(e.key==='y'){e.preventDefault();restore(hi+1)}});
addEventListener('beforeunload',e=>{if(dirty&&!auto){e.preventDefault();e.returnValue=''}});
/* panel dapat digeser */
const sp=$('#sp'),sh=$('#sh');let dx,dy,drag=0;sh.onpointerdown=e=>{drag=1;dx=e.clientX-sp.offsetLeft;dy=e.clientY-sp.offsetTop;sh.setPointerCapture(e.pointerId)};sh.onpointermove=e=>{if(drag){sp.style.left=Math.max(0,e.clientX-dx)+'px';sp.style.top=Math.max(0,e.clientY-dy)+'px'}};sh.onpointerup=()=>drag=0;
Store.faces(S);panel();fit();
})();
