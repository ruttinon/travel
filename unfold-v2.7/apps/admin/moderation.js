'use strict';
const root=document.getElementById('moderation-root');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={status:'pending',reviews:[],busy:false};
async function api(route,method='GET',body){
 const res=await fetch(route,{method,credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
 let obj={};try{obj=await res.json()}catch{}
 if(!res.ok){const e=new Error(obj.error||`HTTP ${res.status}`);e.status=res.status;throw e}return obj;
}
function toast(text){const el=document.getElementById('review-toast');el.textContent=text;el.className='show';setTimeout(()=>el.className='',3000)}
function shell(body){root.innerHTML=`<header class="topbar"><a class="brand" href="/admin.html">unfold<span>.</span> <small>studio</small></a><div class="toplinks"><a href="/admin.html">Places</a><a href="/moderation.html" class="current">Reviews</a><a href="/#discover" target="_blank" rel="noopener">View app ↗</a></div></header>${body}`}
function fail(error){shell(`<main class="locked"><div class="eyebrow">UNFOLD / REVIEW STUDIO</div><h1>${error.status===401?'Admin sign in required':'Cannot load reviews'}</h1><p>${esc(error.message)}</p><a class="button" href="/admin.html">Go to Admin Studio →</a></main>`)}
function reviewCard(r){const badge=r.status==='approved'?'published':r.status;
 return `<article class="review-card"><div class="card-top"><span class="status ${esc(badge)}">${esc(r.status)}</span><span>${esc(new Date(r.updatedAt).toLocaleDateString('th-TH'))}</span></div><h2>${esc(r.placeName)}</h2><div class="byline">${esc(r.name)} · ${esc(r.email)}</div><div class="stars">${'★'.repeat(r.stars)}<span>${'☆'.repeat(5-r.stars)}</span></div><p>${esc(r.text)}</p>${r.photo?`<img class="review-image" src="${esc(r.photo.startsWith('/review-media/')?'/api/admin'+r.photo:'')}" alt="Photo submitted with review" loading="lazy">`:''}<div class="actions"><button data-id="${esc(r.id)}" data-status="approved" class="approve" ${state.busy||r.status==='approved'?'disabled':''}>Approve</button><button data-id="${esc(r.id)}" data-status="rejected" class="reject" ${state.busy||r.status==='rejected'?'disabled':''}>Reject</button>${r.status!=='pending'?`<button data-id="${esc(r.id)}" data-status="pending" class="reset">Reopen</button>`:''}</div></article>`}
function render(){shell(`<main class="studio"><div class="eyebrow">UNFOLD / COMMUNITY</div><div class="heading"><div><h1>Traveller reviews<span>.</span></h1><p>Review what visitors share before it goes public.</p></div><button id="reload" class="refresh">Refresh ↻</button></div><nav class="filters" aria-label="Moderation status">${[['pending','Pending'],['approved','Published'],['rejected','Rejected'],['all','All']].map(([id,label])=>`<button data-filter="${id}" class="${state.status===id?'active':''}">${label}</button>`).join('')}</nav><div class="count">${state.reviews.length} review${state.reviews.length===1?'':'s'}</div>${state.reviews.length?`<div class="cards">${state.reviews.map(reviewCard).join('')}</div>`:`<div class="empty"><strong>Nothing to review here.</strong><p>Reviews submitted from published places will appear in this studio.</p></div>`}</main>`)}
async function load(){try{const r=await api('/api/admin/reviews?status='+encodeURIComponent(state.status));state.reviews=r.reviews;render()}catch(e){fail(e)}}
document.addEventListener('click',async e=>{
 const filter=e.target.closest('[data-filter]');if(filter){state.status=filter.dataset.filter;await load();return}
 if(e.target.id==='reload'){await load();return}
 const el=e.target.closest('[data-id][data-status]');if(!el||state.busy)return;
 state.busy=true;
 try{await api('/api/admin/reviews/'+encodeURIComponent(el.dataset.id),'PATCH',{status:el.dataset.status});await load();toast('Review updated')}catch(err){toast(err.message)}finally{state.busy=false}
});load();
