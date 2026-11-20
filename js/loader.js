/* loader.js — memuat SDK Supabase (beberapa mirror) lalu skrip aplikasi secara berurutan */
(()=>{const me=document.currentScript,app=me.dataset.app,base=me.src.replace(/js\/loader\.js.*$/,'');
const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=ok;s.onerror=()=>no(src);document.head.appendChild(s)});
const SDK=['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js','https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',base+'js/vendor/supabase.js'];
const APP={site:['main','player','render'],admin:['ui','admin'],adjust:['ui','adjust']}[app]||[];
window.WCsdk={tried:[],ok:''};
if(/[?&]embed=1/.test(location.search))document.body.classList.remove('loading');setTimeout(()=>document.body.classList.remove('loading'),7000);
(async()=>{
 for(const u of SDK){try{await load(u);if(window.supabase&&window.supabase.createClient){WCsdk.ok=u;break}WCsdk.tried.push(u)}catch(e){WCsdk.tried.push(u)}}
 for(const f of ['config','icons','store',...APP]){try{await load(base+'js/'+f+'.js')}catch(e){console.error('Gagal memuat',e)}}
})()})();
