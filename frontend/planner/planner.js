'use strict';
const root=document.getElementById('planner-root'),msg=document.getElementById('trip-toast');
const engine=window.UnfoldTripEngine;
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=p=>/^\/uploads\/[a-f0-9-]{36}\.(?:webp|jpg|png)$/.test(p?.photo||'')?p.photo:(p?.photo?.startsWith('assets/')?p.photo:'assets/terraced-fields.webp');
const st={places:[],account:null,collections:{saved:[],trip:[]},selected:new Set(),plans:[],editing:null,days:2,hours:7,budget:'',currency:'THB',travelMode:'driving',title:'My local escape',groups:[[],[]],notice:'',unassigned:[],issues:[],dirtySelection:false,costEstimate:null};
let tHandle;
function toast(s){msg.textContent=s;msg.classList.add('on');clearTimeout(tHandle);tHandle=setTimeout(()=>msg.classList.remove('on'),3600)}
async function request(url,method='GET',body){const r=await fetch(url,{method,cache:'no-store',credentials:'same-origin',headers:body==null?{}:{'Content-Type':'application/json'},body:body==null?undefined:JSON.stringify(body)});let o={};try{o=await r.json()}catch{}if(!r.ok)throw new Error(o.error||`HTTP ${r.status}`);return o}
const byId=id=>st.places.find(p=>p.id===id);
const km=engine.km;
const visitHours=engine.visitHours;

async function updateCostEstimate(){
 try{
  const n=st.groups.flat().length;
  if(!n){st.costEstimate=null;return}
  const res=await request(`/api/trips/estimate-cost?days=${st.days}&placesCount=${n}&style=cultural`);
  st.costEstimate=res.estimate;
  render();
 }catch{}
}

function planDays(){
 const chosen=st.places.filter(p=>st.selected.has(p.id));
 const generated=engine.plan(chosen,{days:st.days,hoursPerDay:st.hours,travelMode:st.travelMode});
 st.groups=generated.groups;st.unassigned=generated.unassigned;st.issues=generated.issues;
 st.dirtySelection=false;
 render();
 updateCostEstimate();
 toast(!chosen.length?'Select places first':generated.unassigned.length?'Some places need more days. Review the warning.':'Suggested plan created');
}

function budgetView(){let known=0,unknown=0,total=0;for(const id of st.groups.flat()){const p=byId(id);if(!p)continue;if(p.priceFrom!=null&&Number.isFinite(Number(p.priceFrom))&&p.currency===st.currency){total+=Number(p.priceFrom);known++}else unknown++}return {known,unknown,total};}
function fmtAmount(v){return new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(v)}
function directions(group){const ps=group.map(byId).filter(p=>p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon)));if(!ps.length)return '#';
 const coord=p=>`${p.lat},${p.lon}`;
 let url='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(coord(ps[ps.length-1]))+'&travelmode='+st.travelMode;
 if(ps.length>1)url+='&origin='+encodeURIComponent(coord(ps[0]));
 if(ps.length>2)url+='&waypoints='+encodeURIComponent(ps.slice(1,-1).slice(0,8).map(coord).join('|'));
 return url;
}
function appHeader(){return `<header class="top"><a href="/" class="logo">unfold<small>THE ART OF DISCOVERY</small></a><nav class="topnav"><a href="/#discover">Explore</a><a href="/#saved">Saved</a><a class="active" href="/planner.html">My trips</a></nav><a class="pill" href="/#profile">${st.account?safe(st.account.name.split(' ')[0]):'Sign in'} ↗</a></header>`}
function select(k,v){return String(k)===String(v)?'selected':''}
function controls(){return `<section class="panel"><h2>Make it yours.</h2><p class="panel-sub">Pick your places. We'll arrange the days.</p><form id="plan-controls"><div class="control-grid"><label class="field full">Trip name<input name="title" maxlength="100" required value="${safe(st.title)}"></label><label class="field">Days<select name="days">${Array.from({length:7},(_,i)=>`<option value="${i+1}" ${select(i+1,st.days)}>${i+1} ${i===0?'day':'days'}</option>`).join('')}</select></label><label class="field">Hours / day<select name="hours">${[3,4,5,6,7,8,9,10,12].map(h=>`<option value="${h}" ${select(h,st.hours)}>${h} h</option>`).join('')}</select></label><label class="field">Travel by<select name="travelMode">${[['driving','Car'],['walking','Walk'],['transit','Public transport']].map(([k,v])=>`<option value="${k}" ${select(k,st.travelMode)}>${v}</option>`).join('')}</select></label><label class="field">Currency<select name="currency">${['THB','USD','EUR','JPY','GBP'].map(v=>`<option value="${v}" ${select(v,st.currency)}>${v}</option>`).join('')}</select></label><label class="field full">Budget (optional)<input name="budget" min="0" max="100000000" step="1" type="number" value="${safe(st.budget)}" placeholder="Set your budget"></label></div><div class="formbuttons"><button type="submit" class="primary">Generate a route ↗</button><button type="button" data-action="save" class="pill" ${!st.groups.flat().length?'disabled':''}>${st.editing?'Update saved trip':'Save trip to account'}</button></div></form><p class="small-note">Order is suggested from straight-line proximity and visit-time allowances. Road times, opening hours and transport availability are <b>not verified</b>.</p></section>`}
function choices(){return `<div class="saved-box"><div class="section-bar"><h2>Choose places</h2><span class="muted">${st.selected.size} selected</span></div>${st.places.length?`<div class="picklist">${st.places.map(p=>`<label class="pick"><input data-select="${safe(p.id)}" type="checkbox" ${st.selected.has(p.id)?'checked':''}><img src="${safe(img(p))}" alt=""><span class="picktext"><strong>${safe(p.en)}</strong>${p.isSme?' <span style="color:#E5A836;font-size:11px;">★ SME</span>':''}<small>${safe(p.locEn)}</small></span></label>`).join('')}</div><p class="small-note">Only locations published by Admin are available. Add more in <a href="/#discover"><u>Explore</u></a>.</p>`:`<div class="empty">No verified places yet. <a href="/admin.html">Publish a location in Admin</a> to begin.</div>`}</div>`}
function dayCard(day,index){const hs=day.reduce((sum,id)=>sum+visitHours(byId(id)),0);const exceeded=hs>st.hours;return `<section class="day"><div class="day-title"><h3>Day ${index+1}</h3><small>${day.length} ${day.length===1?'place':'places'} · ~${hs.toFixed(hs%1?1:0)}h visit allowance${exceeded?' · Over daily target':''}</small></div><div class="stops">${day.length?day.map((id,i)=>{const p=byId(id);if(!p)return '';return `<div class="stop"><span class="stop-num">${i+1}</span><img src="${safe(img(p))}" alt=""><div class="stop-info"><strong>${safe(p.en)}</strong>${p.isSme?' <span style="background:#FEF8EC;color:#925C08;border:1px solid #F59E0B;padding:1px 6px;border-radius:99px;font-size:9px;font-weight:700;">★ SME</span>':''}<small>${safe(p.locEn)}</small></div><div class="stop-actions"><button title="Move to previous day" data-action="move" data-day="${index}" data-pos="${i}" data-direction="-1" ${index===0?'disabled':''}>←</button><button title="Move to next day" data-action="move" data-day="${index}" data-pos="${i}" data-direction="1" ${index===st.days-1?'disabled':''}>→</button><button title="Remove" data-action="remove" data-day="${index}" data-pos="${i}">×</button></div></div>`}).join(''):'<div class="day-empty">Your next discovery goes here.</div>'}</div><div style="padding:10px 14px;background:#FAFAF8;border-top:1px solid #ECEEE8;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><button type="button" data-action="recommend-sme" data-day="${index}" style="font-size:11px;font-weight:700;color:#925C08;background:#FEF8EC;border:1px solid #F59E0B;border-radius:99px;padding:5px 12px;cursor:pointer;">★ แนะนำร้านชุมชน SME ระหว่างทาง</button>${day.length&&!engine.groupWarnings([day],st.places,st.travelMode).length?`<a href="${safe(directions(day))}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#0D2C1C;font-weight:600;">Open day route ↗</a>`:''}</div></section>`}
function savedBox(){return `<section class="saved-box"><div class="section-bar"><h2>Saved plans</h2><button class="link-btn" data-action="refresh">Refresh ↻</button></div>${!st.account?`<div class="empty">Sign in to save plans and access them across devices.<br><a href="/#profile">Go to account →</a></div>`:st.plans.length?`<div class="saved-list">${st.plans.map(p=>`<div class="saved-item"><span><strong>${safe(p.title)}</strong><br><small>${p.days} day${p.days===1?'':'s'} · ${p.groups.flat().length} places</small></span><span class="actions"><button data-action="open" data-id="${safe(p.id)}">Open</button><button data-action="delete" data-id="${safe(p.id)}" aria-label="Delete ${safe(p.title)}">×</button></span></div>`).join('')}</div>`:'<p class="muted">You have no saved trips yet.</p>'}</section>`}
function preview(){const estimate=budgetView(),n=st.groups.flat().length;
 const warnings=[...new Set([...st.issues,...engine.groupWarnings(st.groups,st.places,st.travelMode)])];
 if(st.dirtySelection)warnings.unshift('Selection changed: generate a route before saving so all selected places are included.');
 const warningsHtml=warnings.length?`<div class="planning-warnings" role="alert"><strong>Before you travel</strong>${warnings.map(w=>`<p>${safe(w)}</p>`).join('')}${st.unassigned.length?`<p>Not included: ${safe(st.unassigned.map(id=>byId(id)?.en||id).join(', '))}</p>`:''}</div>`:'';
 return `<div class="preview-hero"><div><span class="eyebrow" style="color:#d5f0bd">THE JOURNEY STARTS HERE</span><h2>${safe(st.title)}</h2><span>${st.days} days · ${n} places · Your pace</span></div></div><div class="summary-row"><div class="summary"><strong>${st.days}</strong><span>Days</span></div><div class="summary"><strong>${n}</strong><span>Places</span></div><div class="summary"><strong>${estimate.known?fmtAmount(estimate.total):'—'}</strong><span>${st.currency} known starting prices</span></div></div>${st.costEstimate?`<div style="background:#F4F8F1;border:1px solid #D1E7C4;border-radius:12px;padding:12px 16px;margin:16px 0;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong style="color:#183E2D;font-size:13px;">💰 ประมาณการงบประมาณ AI (Estimated Cost)</strong><span style="font-weight:800;color:#0D2C1C;font-size:14px;">฿${fmtAmount(st.costEstimate.totalEstimatedCost||0)}</span></div><div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(100px, 1fr));gap:8px;font-size:11px;"><div><span style="color:#78857B;">ที่พัก:</span> <strong>฿${fmtAmount(st.costEstimate.breakdown?.accommodations||0)}</strong></div><div><span style="color:#78857B;">อาหาร & SME:</span> <strong>฿${fmtAmount(st.costEstimate.breakdown?.foodAndDining||0)}</strong></div><div><span style="color:#78857B;">เดินทาง:</span> <strong>฿${fmtAmount(st.costEstimate.breakdown?.transportation||0)}</strong></div><div><span style="color:#78857B;">สำรองฉุกเฉิน:</span> <strong>฿${fmtAmount(st.costEstimate.breakdown?.emergencyCushion||0)}</strong></div></div></div>`:''}${st.budget!==''?`<p class="notice">Budget ${fmtAmount(Number(st.budget))} ${st.currency} · Known price entries ${estimate.known}/${n}. ${estimate.total>Number(st.budget)?'Known starting prices exceed your target.':''} Unknown prices, transport and accommodation may increase total costs.</p>`:''}${warningsHtml}<div class="section-bar"><h2>Your itinerary</h2><div class="actions"><button class="pill" data-action="print">Print</button><span class="hint-tag">Draft route</span></div></div><div class="daygrid">${st.groups.map(dayCard).join('')}</div><p class="small-note">Map directions open a separate service. Route and prices must be checked before travel. The suggested day order is not live road routing.</p>${savedBox()}`}
function render(){root.innerHTML=appHeader()+`<main class="wrap"><div class="pagehead"><div><div class="eyebrow">UNFOLD / PLAN SOMETHING DIFFERENT</div><h1>My journeys.</h1><p>Good plans leave room for surprises.</p></div><a class="pill" href="/#saved">← My saved places</a></div>${st.notice?`<div class="notice">${safe(st.notice)}</div>`:''}<div class="workspace"><div>${controls()}${choices()}</div><div>${preview()}</div></div></main>`}
function syncForm(){const f=document.getElementById('plan-controls');if(!f)return;const v=new FormData(f);st.title=String(v.get('title')||'').trim();st.days=Number(v.get('days'));st.hours=Number(v.get('hours'));st.travelMode=String(v.get('travelMode'));st.currency=String(v.get('currency'));st.budget=String(v.get('budget')||'').trim();}
function payload(){return {title:st.title,days:st.days,hoursPerDay:st.hours,travelMode:st.travelMode,currency:st.currency,budget:st.budget===''?null:Number(st.budget),groups:st.groups.map(g=>[...g])}}
async function loadSaved(){if(!st.account){st.plans=[];return}const x=await request('/api/me/itineraries');st.plans=x.itineraries||[]}
async function boot(){try{const [pub,user]=await Promise.all([request('/api/places'),request('/api/auth/me')]);st.places=pub.places||[];st.account=user.user||null;let candidates=[];
 if(st.account){const [col]=await Promise.all([request('/api/me/collections'),loadSaved()]);st.collections=col;candidates=[...col.trip,...col.saved]}
 else{try{const local=JSON.parse(localStorage.getItem('unfold-v2-user')||'{}');candidates=[...(local.trip||[]),...(local.saved||[])]}catch{}}
 for(const id of candidates){if(byId(id))st.selected.add(id)}
 if(!st.selected.size&&st.places.length){const first=st.places[0];st.places.filter(p=>engine.sameCountry(first,p)&&engine.km(first,p)<60).slice(0,3).forEach(p=>st.selected.add(p.id));}
 planDays();
 }catch(e){st.notice='The local server is not ready: '+e.message;render()}}
root.addEventListener('change',e=>{if(e.target.matches('[data-select]')){const id=e.target.dataset.select;if(e.target.checked){if(st.selected.size>=30){e.target.checked=false;toast('Maximum 30 locations');return}st.selected.add(id)}else st.selected.delete(id);st.dirtySelection=true;document.querySelector('.saved-box .muted')?.replaceChildren(document.createTextNode(st.selected.size+' selected'));toast('Places changed — generate the itinerary to update your days')}});
root.addEventListener('change',e=>{if(e.target.matches('#plan-controls select[name=days],#plan-controls select[name=hours],#plan-controls select[name=travelMode]')){st.dirtySelection=true;toast('Planning settings changed — regenerate before saving')}});
root.addEventListener('submit',e=>{if(e.target.id!=='plan-controls')return;e.preventDefault();syncForm();if(!st.title){toast('Name your trip');return}planDays()});
root.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el)return;const action=el.dataset.action;try{
 if(action==='move'){const d=Number(el.dataset.day),pos=Number(el.dataset.pos),direction=Number(el.dataset.direction);const target=d+direction;if(target<0||target>=st.days)return;const [id]=st.groups[d].splice(pos,1);st.groups[target].push(id);render()}
 if(action==='remove'){const [id]=st.groups[Number(el.dataset.day)].splice(Number(el.dataset.pos),1);st.selected.delete(id);render()}
 if(action==='recommend-sme'){
  const d=Number(el.dataset.day);
  const dayPlaces=st.groups[d].map(byId).filter(Boolean);
  if(!dayPlaces.length){toast('เพิ่มสถานที่ในวันนี้ก่อนค้นหาร้านชุมชน');return}
  toast('กำลังค้นหาร้านค้าชุมชน SME บริเวณใกล้เคียง...');
  try{
   const res=await request('/api/trips/recommend-sme','POST',{stops:dayPlaces});
   const added=[];
   if(Array.isArray(res.stopovers)&&res.stopovers.length){
    for(const item of res.stopovers){
     const p=item.place;
     if(p&&!st.groups[d].includes(p.id)){
      if(!byId(p.id)) st.places.push(p);
      st.selected.add(p.id);
      st.groups[d].push(p.id);
      added.push(p.en||p.nameEn||p.id);
     }
    }
   }
   if(added.length){
    render();
    updateCostEstimate();
    toast(`เพิ่มร้านค้า SME ${added.length} แห่งเข้าใน Day ${d+1} แล้ว!`);
   }else{
    toast('ไม่พบร้านค้า SME เพิ่มเติมในพิกัดนี้');
   }
  }catch(err){toast(err.message)}
 }
 if(action==='refresh'){await loadSaved();render();toast('Plans refreshed')}
 if(action==='open'){const plan=st.plans.find(x=>x.id===el.dataset.id);if(!plan)return;Object.assign(st,{title:plan.title,days:plan.days,hours:plan.hoursPerDay,currency:plan.currency,budget:plan.budget??'',travelMode:plan.travelMode,editing:plan.id,groups:plan.groups.map(g=>[...g]),selected:new Set(plan.groups.flat()),unassigned:[],issues:[],dirtySelection:false});render();updateCostEstimate();window.scrollTo(0,0)}
 if(action==='save'){if(st.unassigned.length||st.dirtySelection){toast('Generate a complete itinerary before saving. Resolve any unassigned places.');return}if(!st.account){toast('Sign in to save your plan');return}syncForm();const item=payload();if(!item.groups.flat().length){toast('Add places first');return}const response=st.editing?await request('/api/me/itineraries/'+st.editing,'PUT',item):await request('/api/me/itineraries','POST',item);st.editing=response.itinerary.id;await loadSaved();render();toast('Trip saved to your account')}
 if(action==='delete'){if(!confirm('Delete this saved trip?'))return;await request('/api/me/itineraries/'+el.dataset.id,'DELETE');if(st.editing===el.dataset.id)st.editing=null;await loadSaved();render();toast('Trip deleted')}
 if(action==='print')window.print();
 }catch(err){toast(err.message)}});
boot();
