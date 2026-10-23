'use strict';
const $=(q)=>document.querySelector(q);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=$('#admin-root');
const ADMIN_BASE='/api/admin';
const CATS=[['nature','Nature / ธรรมชาติ'],['food','Food / ร้านอาหาร'],['stay','Stay / ที่พัก'],['culture','Culture / วัฒนธรรม']];
const REGIONS=[['north','ภาคเหนือ'],['south','ภาคใต้'],['central','ภาคกลาง'],['northeast','ภาคอีสาน'],['east','ภาคตะวันออก'],['west','ภาคตะวันตก'],['world','ต่างประเทศ']];
const blank=()=>({id:null,en:'',th:'',locEn:'',locTh:'',category:'nature',region:'north',lat:'',lon:'',visit:'',priceFrom:'',currency:'THB',storyEn:'',storyTh:'',photo:'',gallery:[],status:'draft',featured:false});
const S={places:[],selected:null,edit:blank(),filter:'all',search:'',busy:false,authenticated:false,mode:'loading',section:'overview',businesses:[],reviews:[],submissions:[],users:[],safetyReports:[],campaigns:[],smeStats:null,safetyFilter:'all',userSearch:'',isLocal:true,dupPairs:null,showDupModal:false};
let toastHandle;
function toast(msg){const node=$('#admin-toast');node.textContent=msg;node.classList.add('show');clearTimeout(toastHandle);toastHandle=setTimeout(()=>node.classList.remove('show'),3800)}
async function api(path,method='GET',body){
  const res=await fetch(path,{method,credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
  let data={};try{data=await res.json()}catch{}
  if(!res.ok){const error=new Error(data.error||`HTTP ${res.status}`);error.status=res.status;throw error;}return data;
}
function image(url){return url&&(/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(url))?url.replace('/uploads/','/api/admin/place-media/'):(url&&url.startsWith('assets/')?url:'assets/hero-forest.webp')}

function authHtml(setup){
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '::1';
  return `<main class="auth-shell"><div class="auth-art"><div class="auth-art-content"><small>UNFOLD · STUDIO</small><h2>Traval Admin<br>Management.</h2><p>ระบบจัดการสถานที่ ข้อมูลร้านค้าชุมชน SME และการดูแลความปลอดภัย</p></div></div><div class="auth-form-side"><a class="logo" href="/">unfold<span>.</span></a><section class="auth-form"><div style="margin-bottom:18px;"><span style="background:#e8ede6;color:#183e2d;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;">Admin Studio</span></div><h1>${setup?'เริ่มตั้งค่าบัญชีผู้ดูแล':'เข้าสู่ระบบผู้ดูแล'}</h1><p>${setup?'ตั้งรหัสผ่านผู้ดูแลระบบครั้งแรกเพื่อเริ่มต้นใช้งาน':'ลงชื่อเข้าใช้เพื่อจัดการสถานที่ อนุมัติร้านค้าชุมชน และดูแลระบบ'}</p><form id="auth-form" style="display:flex;flex-direction:column;gap:14px;"><label>บัญชีผู้ใช้ (Username)<input type="text" value="admin (ผู้ดูแลระบบหลัก)" readonly style="background:#f4f6f2;cursor:not-allowed;font-weight:700;color:#183e2d;border:1px solid #d1d9cf;border-radius:10px;padding:10px 14px;font-size:13px;" /></label>${setup?`<label>Setup Code (รหัสติดตั้ง)<input type="text" name="setupToken" required placeholder="ใส่รหัสจากหน้าต่าง Server หรือใช้ปุ่มด้านล่าง" autocomplete="off" style="border:1px solid #d1d9cf;border-radius:10px;padding:10px 14px;font-size:13px;" /></label>`:''}<label>รหัสผ่านผู้ดูแล (Password)<div style="position:relative;display:flex;align-items:center;"><input type="password" id="admin-password-input" name="password" required minlength="${setup?12:1}" autocomplete="${setup?'new-password':'current-password'}" placeholder="ใส่รหัสผ่าน..." style="width:100%;border:1px solid #d1d9cf;border-radius:10px;padding:10px 44px 10px 14px;font-size:13px;" /><button type="button" data-action="toggle-pwd" style="position:absolute;right:10px;background:none;border:none;cursor:pointer;font-size:16px;padding:4px;color:#56685b;" title="แสดง/ซ่อนรหัสผ่าน">👁️</button></div></label>${setup?`<label>ยืนยันรหัสผ่าน<input type="password" name="confirm" required minlength="12" autocomplete="new-password" placeholder="••••••••••••" style="border:1px solid #d1d9cf;border-radius:10px;padding:10px 14px;font-size:13px;" /></label>`:''}<button class="btn primary fill" type="submit" style="padding:12px;font-size:14px;font-weight:700;margin-top:4px;">${setup?'สร้างบัญชีผู้ดูแล':'เข้าสู่ระบบ Admin'} ↗</button></form>${isLocalHost?`<div style="margin-top:20px;background:#eef7ec;border:1px solid #b7e1b0;border-radius:12px;padding:14px;font-size:12px;color:#1b4a22;line-height:1.6;"><div style="font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:6px;font-size:13px;">💡 ทางลัดสำหรับเครื่องนี้ (Local Development)</div><div>• บัญชีผู้ดูแล: <strong>admin</strong><br>• รหัสผ่านเริ่มต้น: <strong style="color:#0f3817;background:#dcf1d7;padding:2px 6px;border-radius:4px;">Admin@12345678</strong></div><div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;"><button type="button" class="btn small primary" data-action="quick-fill-admin" style="font-size:11px;padding:6px 12px;">⚡ กรอกรหัสและล็อกอินทันที</button><button type="button" class="btn small ghost" data-action="reset-local-admin" style="font-size:11px;padding:6px 12px;background:#fff;">🔄 รีเซ็ตรหัสผ่านใหม่</button></div><div style="margin-top:8px;color:#45634b;font-size:11px;">(หากติดปัญหา สามารถดับเบิลคลิกไฟล์ <code>RESET-ADMIN-PASSWORD.cmd</code> ในโฟลเดอร์โปรเจกต์ได้ตลอดเวลา)</div></div>`:''}<p class="smallnote" style="margin-top:20px;"><a href="/">← กลับไปหน้าแอป Traval</a></p></section></div></main>`;
}

function stats(){
  return {
    all: S.places.length,
    published: S.places.filter(x=>x.status==='published').length,
    drafts: S.places.filter(x=>x.status==='draft').length,
    archived: S.places.filter(x=>x.status==='archived').length
  };
}

function listHtml(){
  const n=stats();
  const filtered=S.places.filter(p=>(S.filter==='all'||p.status===S.filter)&&(`${p.en} ${p.th} ${p.locEn} ${p.locTh}`.toLowerCase().includes(S.search.toLowerCase())));
  return `<div class="manage-list-top"><div><div class="overline">CONTENT MANAGEMENT</div><h1>Manage places<span style="color:#87b453">.</span></h1><p class="sub">${n.all} places · ${n.published} published · ${n.drafts} drafts${n.archived?` · ${n.archived} archived`:''}</p></div><div style="display:flex;gap:8px;"><button class="btn ghost small" data-action="scan-duplicates" title="ตรวจหาสถานที่ที่ชื่อหรือพิกัดซ้ำกัน">🔍 ตรวจสถานที่ซ้ำ</button><button class="btn primary" data-action="new">+ Add place</button></div></div><div class="library-toolbar"><input class="search" id="list-search" value="${esc(S.search)}" placeholder="Search places…" aria-label="Search places" /></div><div class="filter">${[['all','All places'],['published','Published'],['draft','Drafts'],['archived',`📦 Archived (${n.archived})`]].map(([id,label])=>`<button data-filter="${id}" class="${S.filter===id?'active':''}">${label}</button>`).join('')}</div><div class="place-list">${filtered.length?filtered.map(p=>`<button class="list-card ${p.id===S.selected?'active':''}" data-action="edit" data-id="${esc(p.id)}"><img src="${esc(image(p.photo))}" alt=""/><span><b>${esc(p.en)}</b><small>${esc(p.locEn)}</small><em class="status ${p.status==='published'?'published':p.status==='archived'?'archived':''}">${p.status==='published'?'Published':p.status==='archived'?'Archived':'Draft'}</em></span><span class="row-arrow">↗</span></button>`).join(''):`<div class="list-empty">${S.places.length?'No places match the filter':'No places yet. Add your first destination.'}</div>`}</div>`;
}

function opts(values,selected){return values.map(([id,label])=>`<option value="${id}" ${id===selected?'selected':''}>${esc(label)}</option>`).join('')}
function field(label,name,value,type='text',span='',required=false,more=''){return `<div class="field ${span}"><label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} ${more}/></div>`}
function textArea(label,name,value){return `<div class="field"><label for="field-${name}">${label}</label><textarea id="field-${name}" name="${name}" rows="3" maxlength="2000">${esc(value)}</textarea></div>`}

function formHtml(){
  const p=S.edit;
  return `<div class="editor-top"><div class="overline">UNFOLD / CONTENT STUDIO</div><a class="btn small" href="/#discover" target="_blank" rel="noopener">ดูหน้าแอป ↗</a></div><h1 class="editor-heading">${p.id?'Edit this place.':'Add a new place.'}</h1><div class="editor-desc">กรอกข้อมูลให้ครบ บันทึกเป็น Draft ก่อน แล้วค่อยเผยแพร่เมื่อพร้อม</div>${p.status==='archived'?`<div class="archive-box" style="background:#fff8e6;border:1px solid #fed7aa;border-radius:12px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;color:#9a3412;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">📦</span><div><strong>สถานที่นี้อยู่ในถังขยะ (Archived)</strong><div style="font-size:12px;color:#c2410c;">ซ่อนจากหน้าแอปและการค้นหาทั้งหมด สามารถกู้คืนกลับมาเป็น Draft ได้ตลอดเวลา</div></div></div><button type="button" class="btn small primary" data-action="restore-place">⟲ กู้คืนสถานที่ (Restore)</button></div>`:''}<div id="dup-warning-box" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:12px 16px;border-radius:10px;margin-bottom:16px;font-size:12px;line-height:1.5;"></div><form id="place-form" class="edit-form"><div class="form-group"><div class="form-title">01 · ชื่อและสถานที่</div><div class="field-grid">${field('ชื่อสถานที่ (English) *','en',p.en,'text','',true,'maxlength="120"')}${field('ชื่อสถานที่ (ไทย)','th',p.th,'text','','','maxlength="120"')}${field('พื้นที่ (English) *','locEn',p.locEn,'text','',true,'maxlength="160"')}${field('พื้นที่ (ไทย)','locTh',p.locTh,'text','','','maxlength="160"')}</div><div class="field-grid cols3"><div class="field"><label>หมวดหมู่</label><select name="category">${opts(CATS,p.category)}</select></div><div class="field"><label>ภูมิภาค</label><select name="region">${opts(REGIONS,p.region)}</select></div>${field('ใช้เวลาเที่ยว','visit',p.visit,'text','','','maxlength="40" placeholder="2–4h"')}</div><div class="field-grid">${field('Latitude','lat',p.lat,'number','','','step="any" min="-85" max="85" placeholder="18.790"')}${field('Longitude','lon',p.lon,'number','','','step="any" min="-180" max="180" placeholder="98.985"')}</div><div class="field-grid">${field('ราคาเริ่มต้นต่อคน (ถ้ามี)','priceFrom',p.priceFrom??'','number','','','step="0.01" min="0" max="10000000" placeholder="เว้นว่างหากไม่ทราบ"')}<div class="field"><label>สกุลเงินของราคา</label><select name="currency">${opts([['THB','THB / บาท'],['USD','USD'],['EUR','EUR'],['JPY','JPY'],['GBP','GBP']],p.currency||'THB')}</select><span class="help">กรอกราคาต่อคนที่ตรวจสอบได้เท่านั้น ระบบไม่แปลงสกุลเงินอัตโนมัติ</span></div></div></div><div class="form-group"><div class="form-title">02 · ภาพสถานที่</div><div class="cover-box"><div class="cover-thumb" id="cover-thumb">${p.photo?`<img src="${esc(image(p.photo))}" alt="Cover photo"/>`:'ยังไม่มีภาพปก'}</div><div><p style="font-weight:800;font-size:14px">Cover photo</p><p class="smallnote">อัปโหลดภาพของสถานที่จริง PNG, JPG หรือ WebP (ไม่เกิน 5 MB) ห้ามใช้ภาพสถานที่อื่นเป็นภาพยืนยัน</p><div class="upload-actions"><label class="upload-label" for="upload-cover">↑ อัปโหลดภาพปก</label><input id="upload-cover" type="file" accept="image/png,image/jpeg,image/webp"/><button class="btn small" type="button" data-action="clear-cover">ลบภาพ</button></div></div></div><div><div class="field"><label>Gallery photos (สูงสุด 8 รูป)</label><div class="upload-actions"><label class="upload-label" for="upload-gallery">＋ เพิ่มรูป Gallery</label><input type="file" id="upload-gallery" accept="image/png,image/jpeg,image/webp" multiple /></div><div class="img-grid" id="gallery-preview">${(p.gallery||[]).map((url,i)=>`<div class="img-item"><img alt="Gallery photo" src="${esc(image(url))}"/><button type="button" data-action="remove-gallery" data-index="${i}" aria-label="ลบรูป">×</button></div>`).join('')}</div></div></div></div><div class="form-group"><div class="form-title">03 · รายละเอียด</div><div class="field-grid">${textArea('Description (English)','storyEn',p.storyEn)}${textArea('คำอธิบายภาษาไทย','storyTh',p.storyTh)}</div></div><div class="form-group"><div class="form-title">04 · การเผยแพร่</div><div class="field-grid"><div class="field"><label>สถานะ</label><select name="status"><option value="draft" ${p.status==='draft'?'selected':''}>Draft — ยังไม่แสดงในแอป</option><option value="published" ${p.status==='published'?'selected':''}>Published — แสดงในแอป</option><option value="archived" ${p.status==='archived'?'selected':''}>Archived — ย้ายไปถังขยะ (ซ่อน)</option></select><span class="help">การเผยแพร่ต้องมีภาพปกและพิกัดก่อน</span></div><div class="field" style="align-content:center"><label class="checkline"><input type="checkbox" name="featured" ${p.featured?'checked':''}/> Highlight in Explore</label><span class="help">ขึ้นก่อนสถานที่ทั่วไป</span></div></div><div class="hints"><b>ข้อมูลจริงเท่านั้น</b> — เมื่อเผยแพร่ข้อมูลจะปรากฏใน Explore, Search, Map และหน้ารายละเอียด พร้อมให้บันทึกและเพิ่มเข้าทริปได้ ไม่มีคะแนนรีวิวสมมติ</div></div><div class="editor-actions"><button class="btn primary" type="submit" id="save-btn">${p.id?'บันทึกการเปลี่ยนแปลง':'สร้างสถานที่'}</button><button class="btn ghost" type="button" data-action="new">ยกเลิก</button><span class="spacer"></span>${p.id?(p.status!=='archived'?`<button class="btn ghost" type="button" data-action="archive-place" style="color:#b45309;border-color:#fcd34d;">📦 ย้ายไปถังขยะ (Archive)</button>`:`<button class="btn primary small" type="button" data-action="restore-place">⟲ กู้คืน (Restore)</button>`):''}${p.id?`<button class="btn danger" type="button" data-action="delete">ลบถาวร</button>`:''}</div></form>`;
}

function duplicatesModalHtml(pairs){
  return `<div class="dup-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;"><div style="background:#fff;border-radius:16px;max-width:700px;width:100%;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 40px rgba(0,0,0,0.2);"><div style="padding:18px 24px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;"><h2 style="margin:0;font-size:18px;color:#183e2d;">🔍 รายการสถานที่ที่อาจซ้ำซ้อน (${pairs.length} คู่)</h2><button class="btn small ghost" data-action="close-dup-modal" style="font-size:16px;padding:4px 10px;">✕</button></div><div style="padding:20px 24px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;">${pairs.length?pairs.map((pair,i)=>`<div style="border:1px solid #fed7aa;background:#fffaf0;border-radius:12px;padding:14px;"><div style="font-size:12px;font-weight:700;color:#c2410c;margin-bottom:8px;">⚠️ ตรวจพบลักษณะที่ซ้ำกัน: ${pair.reasons.join(', ')}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div style="background:#fff;padding:10px;border-radius:8px;border:1px solid #e2e8f0;"><strong style="font-size:13px;display:block;">${esc(pair.place1.en)}</strong><small style="color:#64748b;">${esc(pair.place1.locEn)} · <em class="status ${pair.place1.status==='published'?'published':''}">${pair.place1.status}</em></small><div style="margin-top:8px;"><button class="btn small" data-action="edit" data-id="${esc(pair.place1.id)}">ตรวจดูสถานที่นี้ →</button></div></div><div style="background:#fff;padding:10px;border-radius:8px;border:1px solid #e2e8f0;"><strong style="font-size:13px;display:block;">${esc(pair.place2.en)}</strong><small style="color:#64748b;">${esc(pair.place2.locEn)} · <em class="status ${pair.place2.status==='published'?'published':''}">${pair.place2.status}</em></small><div style="margin-top:8px;"><button class="btn small" data-action="edit" data-id="${esc(pair.place2.id)}">ตรวจดูสถานที่นี้ →</button></div></div></div></div>`).join(''):`<div style="text-align:center;padding:40px 20px;color:#64748b;">🎉 ไม่พบสถานที่ที่มีชื่อหรือพิกัดซ้ำกันในระบบ</div>`}</div><div style="padding:14px 24px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;"><button class="btn primary" data-action="close-dup-modal">ปิดหน้าต่าง</button></div></div></div>`;
}

function glyph(name){const icons={home:'⌂',places:'⌖',review:'☆',business:'♙',app:'↗',settings:'⚙',users:'👥',safety:'🛡',campaigns:'📢',analytics:'📊'};return `<span class="nav-symbol" aria-hidden="true">${icons[name]||'·'}</span>`}
function rail(){return `<aside class="rail"><div><a class="logo" href="/">unfold<span>.</span></a><div class="rail-label" style="margin-top:2px">TRAVEL PLATFORM</div></div><nav class="rail-nav" aria-label="Admin navigation"><div class="rail-label">WORKSPACE</div><button data-action="nav-overview" class="${S.section==='overview'?'active':''}">${glyph('home')}<span>Dashboard</span></button><button data-action="nav-places" class="${S.section==='places'?'active':''}">${glyph('places')}<span>Places</span></button><button data-action="nav-users" class="${S.section==='users'?'active':''}">${glyph('users')}<span>Users (PDPA)</span></button><button data-action="nav-safety" class="${S.section==='safety'?'active':''}">${glyph('safety')}<span>Safety & Scams</span></button><button data-action="nav-campaigns" class="${S.section==='campaigns'?'active':''}">${glyph('campaigns')}<span>Campaigns CMS</span></button><button data-action="nav-analytics" class="${S.section==='analytics'?'active':''}">${glyph('analytics')}<span>SME Analytics</span></button><a href="/business-admin.html">${glyph('business')}<span>Business Owners</span></a><a href="/moderation.html">${glyph('review')}<span>Reviews</span></a><a href="/audit.html"><span style="font-size:18px">≡</span><span>Activity log</span></a><a href="/#discover" target="_blank" rel="noopener">${glyph('app')}<span>View traveller app</span></a></nav><div class="rail-promo" style="background:linear-gradient(0deg,#071e19c2,#19392926),url('assets/terraced-fields.webp') center/cover"><small>DISCOVER LOCAL STORIES</small><strong>Give great places a voice.</strong></div><div class="rail-bottom"><div class="word">Admin Studio · v2.7<br>Local preview · real records</div><button data-action="logout">Sign out ↗</button></div></aside>`}
function statCard(label,value,symbol,tone){return `<div class="admin-kpi"><span class="kpi-icon ${tone}">${symbol}</span><div><strong>${Number(value).toLocaleString('en-US')}</strong><small>${esc(label)}</small></div></div>`}

function overviewHtml(){
  const n=stats(),pendingBiz=S.businesses.filter(b=>b.status==='pending').length,pendingReviews=S.reviews.filter(r=>r.status==='pending').length,pendingSub=S.submissions.filter(r=>r.status==='pending').length,pendingSafety=S.safetyReports.filter(r=>r.status==='pending').length;
  const activity=[...S.places.map(p=>({title:p.en,description:p.locEn,status:p.status,time:p.updatedAt,photo:image(p.photo)})),...S.businesses.map(b=>({title:b.name,description:'Business owner',status:b.status,time:b.updatedAt,photo:'assets/cabin-retreat.webp'})),...S.submissions.map(x=>({title:x.payload?.en||x.placeId||x.businessName,description:'Place proposal',status:x.status,time:x.updatedAt,photo:'assets/terraced-fields.webp'})),...S.safetyReports.map(s=>({title:s.title,description:s.category+' - '+s.locationName,status:s.status,time:s.updatedAt,photo:'assets/hero-forest.webp'}))].filter(x=>x.time).sort((a,b)=>new Date(b.time)-new Date(a.time)).slice(0,5);
  const regions=[...new Map(REGIONS.map(([k,v])=>[k,{name:v,count:S.places.filter(x=>x.region===k&&x.status==='published').length}])).values()].filter(x=>x.count>0).sort((a,b)=>b.count-a.count);const max=Math.max(1,...regions.map(x=>x.count));
  return `<div class="adm-pagehead"><div><span class="overline">OVERVIEW / UNFOLD</span><h1>Dashboard<span>.</span></h1><p>Places, people and pending work — in one view.</p></div><button data-action="new" class="btn primary">+ Add new place</button></div><div class="admin-kpis">${statCard('Total places',n.all,'⌖','mint')}${statCard('Registered users',S.users.length,'👥','peach')}${statCard('Published places',n.published,'✓','blue')}${statCard('Pending moderation',pendingBiz+pendingReviews+pendingSub+pendingSafety,'☆','amber')}</div><div class="adm-grid"><section class="adm-card activity"><div class="adm-card-title"><h2>Recent activity</h2><button class="adm-link" data-action="nav-places">View all →</button></div>${activity.length?activity.map(x=>`<div class="adm-activity-row"><img src="${esc(x.photo)}" alt=""><div><strong>${esc(x.title)}</strong><small>${esc(x.description)}</small></div><em class="status ${x.status==='published'||x.status==='approved'||x.status==='verified'?'published':''}">${esc(x.status)}</em></div>`).join(''):`<div class="adm-empty">Your first locations and requests will show up here.</div>`}</section><section class="adm-card coverage"><div class="adm-card-title"><h2>Places overview</h2><span class="hint-tag">Published data</span></div><div class="coverage-image"><img src="assets/map-art.svg" alt="Stylized background map (not a live coordinate map)"><div class="coverage-legend">${n.published} <small>published places</small><br>${n.drafts} <small>drafts</small></div></div><div class="region-list">${regions.length?regions.slice(0,4).map(r=>`<div class="region-row"><span>${esc(r.name)}</span><span class="region-bar"><i style="width:${r.count/max*100}%"></i></span><strong>${r.count}</strong></div>`).join(''):'<p class="adm-empty">No published regions yet.</p>'}</div><small class="map-caveat">Map illustration only · <a href="/#map" target="_blank" rel="noopener">Open the live map ↗</a></small></section></div><div class="adm-footer-card"><div><span class="overline">REVIEW WORKFLOW</span><h2>Keep every discovery trustworthy.</h2><p>${pendingBiz} business accounts · ${pendingSafety} safety alerts · ${pendingReviews} reviews awaiting moderation</p></div><div class="adm-buttons"><button class="btn" data-action="nav-safety">Review safety alerts →</button><a class="btn primary" href="/moderation.html">Review travellers →</a></div></div>`;
}

function usersHtml(){
  const filtered = S.users.filter(u=>!S.userSearch||(u.email+u.name).toLowerCase().includes(S.userSearch.toLowerCase()));
  return `<div class="adm-pagehead"><div><span class="overline">ADMIN / USER MANAGEMENT</span><h1>Users & PDPA Access<span>.</span></h1><p>Manage registered accounts and enforce immediate suspension / PDPA access.</p></div></div><div class="library-toolbar" style="margin-bottom:20px;display:flex;gap:12px;"><input class="search" id="user-search" value="${esc(S.userSearch)}" placeholder="Search by name or email…" style="max-width:400px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 14px;font-size:13px;width:100%;"/></div><div class="adm-card" style="padding:0;overflow:hidden;"><table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;"><thead><tr style="background:#f4f6f2;border-bottom:1px solid var(--line);color:#56685b;"><th style="padding:14px 18px;">User</th><th style="padding:14px 18px;">Role</th><th style="padding:14px 18px;">Status</th><th style="padding:14px 18px;">Joined</th><th style="padding:14px 18px;">Activity</th><th style="padding:14px 18px;text-align:right;">Actions</th></tr></thead><tbody>${filtered.length ? filtered.map(u=>`<tr style="border-bottom:1px solid #edf0ea;"><td style="padding:14px 18px;"><strong>${esc(u.name)}</strong><br><small style="color:#78857b;">${esc(u.email)}</small></td><td style="padding:14px 18px;"><span style="background:#e8ede6;padding:3px 8px;border-radius:99px;font-size:10px;font-weight:700;">${esc(u.role||'user')}</span></td><td style="padding:14px 18px;"><span class="status ${u.status==='active'?'published':'draft'}" style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:99px;background:${u.status==='active'?'#dcf1d7':'#fed7d7'};color:${u.status==='active'?'#183e2d':'#9b2c2c'};">${esc(u.status)}</span></td><td style="padding:14px 18px;color:#78857b;">${new Date(u.createdAt).toLocaleDateString()}</td><td style="padding:14px 18px;color:#56685b;">${u.reviewCount||0} reviews · ${u.itineraryCount||0} trips</td><td style="padding:14px 18px;text-align:right;"><button class="btn small ${u.status==='active'?'danger':'primary'}" data-action="toggle-user-status" data-id="${esc(u.id)}" data-status="${u.status==='active'?'suspended':'active'}">${u.status==='active'?'Suspend (ระงับ)':'Activate (เปิดใช้)'}</button></td></tr>`).join('') : `<tr><td colspan="6" style="padding:32px;text-align:center;color:#78857b;">No users found.</td></tr>`}</tbody></table></div>`;
}

function safetyHtml(){
  const filter = S.safetyFilter || 'all';
  const filtered = S.safetyReports.filter(r=>filter==='all'||r.status===filter);
  const pendingCount = S.safetyReports.filter(r=>r.status==='pending').length;
  return `<div class="adm-pagehead"><div><span class="overline">ADMIN / MODERATION</span><h1>Travel Safety & Scams<span>.</span></h1><p>Review community reports on overcharging, transport issues, and travel scams.</p></div><div style="font-size:12px;font-weight:700;background:#fef8ec;color:#925c08;border:1px solid #f59e0b;padding:8px 14px;border-radius:99px;">⚠️ ${pendingCount} pending reviews</div></div><div class="filter" style="margin-bottom:20px;">${[['all','All reports'],['pending','Pending'],['verified','Verified'],['rejected','Rejected'],['resolved','Resolved']].map(([id,label])=>`<button data-action="safety-filter" data-filter="${id}" class="${filter===id?'active':''}">${label}</button>`).join('')}</div><div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:16px;">${filtered.length ? filtered.map(r=>`<div class="adm-card" style="display:flex;flex-direction:column;gap:12px;"><div style="display:flex;align-items:center;justify-content:space-between;"><span style="background:#e1eef0;color:#2b6cb0;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;">${esc(r.category)}</span><span class="status ${r.status==='verified'?'published':r.status==='rejected'?'draft':''}" style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:99px;background:${r.status==='verified'?'#dcf1d7':r.status==='rejected'?'#fed7d7':'#faeed8'};color:${r.status==='verified'?'#183e2d':r.status==='rejected'?'#9b2c2c':'#b57d34'};">${esc(r.status)}</span></div><h3 style="margin:0;font-size:16px;color:#183e2d;">${esc(r.title)}</h3><p style="margin:0;font-size:12px;color:#455248;line-height:1.5;">${esc(r.description)}</p><div style="font-size:11px;color:#78857b;">📍 <strong>${esc(r.locationName)}</strong> (${Number(r.lat).toFixed(4)}, ${Number(r.lon).toFixed(4)})<br>👤 By: ${esc(r.userName||'Anonymous')} (${esc(r.userEmail||'—')}) · ${new Date(r.createdAt).toLocaleDateString()}</div>${r.photo ? `<div style="height:140px;border-radius:10px;overflow:hidden;background:#eee;"><img src="${esc(r.photo)}" alt="Report photo" style="width:100%;height:100%;object-fit:cover;"/></div>` : ''}${r.adminNote ? `<div style="background:#f7f9f6;border-left:3px solid #78857b;padding:8px 10px;font-size:11px;color:#455248;">Admin Note: ${esc(r.adminNote)}</div>` : ''}<div style="margin-top:auto;display:flex;gap:8px;padding-top:12px;border-top:1px solid var(--line);"><button class="btn small primary" data-action="update-safety-status" data-id="${esc(r.id)}" data-status="verified" ${r.status==='verified'?'disabled':''}>Verify (ยืนยัน)</button><button class="btn small danger" data-action="update-safety-status" data-id="${esc(r.id)}" data-status="rejected" ${r.status==='rejected'?'disabled':''}>Reject (ปฏิเสธ)</button><button class="btn small ghost" data-action="update-safety-status" data-id="${esc(r.id)}" data-status="resolved" ${r.status==='resolved'?'disabled':''}>Resolve (แก้ไขแล้ว)</button></div></div>`).join('') : `<div class="adm-empty" style="grid-column:1/-1;text-align:center;">No reports match the filter.</div>`}</div>`;
}

function campaignsHtml(){
  return `<div class="adm-pagehead"><div><span class="overline">ADMIN / PROMOTIONS</span><h1>Campaigns & Spotlight CMS<span>.</span></h1><p>Manage promotional banners, featured SME spotlights, and partner highlights.</p></div></div><div style="display:grid;grid-template-columns:minmax(320px, 1fr) minmax(360px, 1.4fr);gap:20px;align-items:start;"><div class="adm-card"><h2 style="font-size:18px;margin:0 0 16px 0;">+ Create new campaign</h2><form id="campaign-create-form" style="display:flex;flex-direction:column;gap:12px;"><div class="field"><label>Campaign Title *</label><input name="title" required placeholder="e.g. Local Food Festival 2026" maxlength="120"/></div><div class="field"><label>Spotlight Badge</label><input name="badgeText" placeholder="e.g. Local Pick, Hidden Gem" maxlength="40"/></div><div class="field"><label>Banner Image URL</label><input name="imageUrl" placeholder="e.g. assets/hero-forest.webp or /uploads/..." value="assets/hero-forest.webp"/></div><div class="field"><label>Target Place Slug</label><select name="targetSlug"><option value="">-- No specific place --</option>${S.places.map(p=>`<option value="${esc(p.id)}">${esc(p.en)} (${esc(p.locEn)})</option>`).join('')}</select></div><div class="field-grid cols2"><div class="field"><label>Priority (1-100)</label><input type="number" name="priority" value="10" min="1" max="100"/></div><div class="field"><label>Province (optional)</label><input name="province" placeholder="e.g. chiang-mai"/></div></div><div class="field-grid cols2"><div class="field"><label>Start Date</label><input type="date" name="startDate"/></div><div class="field"><label>End Date</label><input type="date" name="endDate"/></div></div><button class="btn primary" type="submit" style="margin-top:8px;">Save Campaign ↗</button></form></div><div class="adm-card"><h2 style="font-size:18px;margin:0 0 16px 0;">Active Campaigns (${S.campaigns.length})</h2><div style="display:flex;flex-direction:column;gap:12px;">${S.campaigns.length ? S.campaigns.map(c=>`<div style="display:flex;gap:14px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:12px;background:#fbfcf9;"><img src="${esc(c.imageUrl||'assets/hero-forest.webp')}" alt="" style="width:72px;height:54px;border-radius:8px;object-fit:cover;"/><div style="flex:1;min-width:0;"><strong style="font-size:13px;display:block;">${esc(c.title)}</strong><small style="color:#78857b;">${c.badgeText?`<span style="background:#fef8ec;color:#925c08;padding:1px 6px;border-radius:4px;font-size:9px;">★ ${esc(c.badgeText)}</span> · `:''}Clicks: ${c.clickCount||0} · Priority: ${c.priority}</small></div><button class="btn small danger" data-action="delete-campaign" data-id="${esc(c.id)}">Delete</button></div>`).join('') : `<div class="adm-empty">No campaigns created yet.</div>`}</div></div></div>`;
}

function analyticsHtml(){
  const s = S.smeStats || { totals: {}, smeStats: [] };
  const totals = s.totals || {};
  return `<div class="adm-pagehead"><div><span class="overline">ADMIN / ANALYTICS</span><h1>SME Performance Analytics<span>.</span></h1><p>Stateless event aggregates for community enterprises and local discovery.</p></div><button class="btn" data-action="refresh-analytics">↻ Refresh Stats</button></div><div class="admin-kpis">${statCard('Total Impressions', totals.impression || 0, '👁', 'mint')}${statCard('Total Place Views', totals.view || 0, '📖', 'blue')}${statCard('Direction Clicks', totals.direction || 0, '📍', 'amber')}${statCard('Trip / Saves', (totals.save || 0) + (totals.trip_add || 0), '♡', 'peach')}</div><div class="adm-card" style="padding:0;overflow:hidden;margin-top:20px;"><div style="padding:18px 24px;border-bottom:1px solid var(--line);"><h2 style="margin:0;font-size:16px;">Top Performing Local SME Places</h2></div><table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;"><thead><tr style="background:#f4f6f2;border-bottom:1px solid var(--line);color:#56685b;"><th style="padding:12px 18px;">Place Name</th><th style="padding:12px 18px;">Type & Badge</th><th style="padding:12px 18px;text-align:right;">Views</th><th style="padding:12px 18px;text-align:right;">Directions</th><th style="padding:12px 18px;text-align:right;">Trip Adds</th><th style="padding:12px 18px;text-align:right;">Contacts</th></tr></thead><tbody>${(s.smeStats||[]).length ? s.smeStats.map(r=>`<tr style="border-bottom:1px solid #edf0ea;"><td style="padding:12px 18px;"><strong>${esc(r.nameEn)}</strong><br><small style="color:#78857b;">${esc(r.nameTh||'')}</small></td><td style="padding:12px 18px;"><span style="background:#e8ede6;padding:2px 7px;border-radius:4px;font-size:10px;">${esc(r.smeType||'SME')}</span>${r.spotlightBadge?`<span style="background:#fef8ec;color:#925c08;padding:2px 7px;border-radius:4px;font-size:10px;margin-left:4px;">★ ${esc(r.spotlightBadge)}</span>`:''}</td><td style="padding:12px 18px;text-align:right;font-weight:700;">${(r.views||0).toLocaleString()}</td><td style="padding:12px 18px;text-align:right;font-weight:700;color:#2b6cb0;">${(r.directions||0).toLocaleString()}</td><td style="padding:12px 18px;text-align:right;font-weight:700;color:#183e2d;">${(r.tripAdds||0).toLocaleString()}</td><td style="padding:12px 18px;text-align:right;">${(r.contacts||0).toLocaleString()}</td></tr>`).join('') : `<tr><td colspan="6" style="padding:32px;text-align:center;color:#78857b;">No SME analytics recorded yet. Events record when visitors explore places.</td></tr>`}</tbody></table></div>`;
}

function dashboard(){
  const title = {overview:'Dashboard', places:'Places', users:'User Management & PDPA', safety:'Safety & Scam Reports', campaigns:'Campaigns CMS', analytics:'SME Performance Analytics'}[S.section] || 'Dashboard';
  let content = overviewHtml();
  if(S.section==='places') content = `<div class="manage-layout"><section class="library" id="library">${listHtml()}</section><section class="editor" id="editor">${formHtml()}</section></div>`;
  else if(S.section==='users') content = usersHtml();
  else if(S.section==='safety') content = safetyHtml();
  else if(S.section==='campaigns') content = campaignsHtml();
  else if(S.section==='analytics') content = analyticsHtml();
  root.innerHTML=`<div class="dashboard admin-v26">${rail()}<main class="admin-main"><div class="admin-topbar"><span>unfold <b>/</b> ${esc(title)}</span><span class="admin-avatar">AD</span></div>${content}</main>${S.showDupModal&&S.dupPairs?duplicatesModalHtml(S.dupPairs):''}</div>`;
}

function showAuth(setup){S.mode=setup?'setup':'login';root.innerHTML=authHtml(setup)}
function openEditor(id){
  S.section='places';S.selected=id||null;
  const p=S.places.find(x=>x.id===id);
  S.edit=p?structuredClone(p):blank();
  dashboard();
  if(window.innerWidth<=800)$('#editor').scrollIntoView({behavior:'smooth',block:'start'});
}

async function refresh(){
  const result=await api(ADMIN_BASE+'/places');
  S.places=result.places;
  const extra=await Promise.allSettled([
    api('/api/admin/businesses?status=all'),
    api('/api/admin/reviews?status=all'),
    api('/api/admin/business-submissions?status=all'),
    api('/api/admin/users'),
    api('/api/admin/safety-reports'),
    api('/api/admin/campaigns'),
    api('/api/admin/sme-stats')
  ]);
  S.businesses=extra[0].status==='fulfilled'?extra[0].value.businesses:[];
  S.reviews=extra[1].status==='fulfilled'?extra[1].value.reviews:[];
  S.submissions=extra[2].status==='fulfilled'?extra[2].value.submissions:[];
  S.users=extra[3].status==='fulfilled'?extra[3].value.users:[];
  S.safetyReports=extra[4].status==='fulfilled'?extra[4].value.reports:[];
  S.campaigns=extra[5].status==='fulfilled'?extra[5].value.campaigns:[];
  S.smeStats=extra[6].status==='fulfilled'?extra[6].value:{totals:{},smeStats:[]};
  S.authenticated=true;
  S.mode='dashboard';
  if(S.selected&&!S.places.find(p=>p.id===S.selected))S.selected=null;
  S.edit=S.selected?structuredClone(S.places.find(p=>p.id===S.selected)):blank();
  dashboard();
}

async function boot(){
  try{
    const r=await api(ADMIN_BASE+'/status');
    S.isLocal=!!r.isLocal;
    if(r.setupRequired)showAuth(true);
    else if(!r.authenticated)showAuth(false);
    else await refresh();
  }catch(e){
    root.innerHTML=`<main style="padding:50px"><h1>Server unavailable</h1><p>${esc(e.message)}</p><p>Start with START-WINDOWS.cmd (Node.js server).</p></main>`;
  }
}

function syncForm(){
  const form=$('#place-form');
  if(!form)return;
  const d=new FormData(form);
  for(const key of ['en','th','locEn','locTh','category','region','lat','lon','visit','priceFrom','currency','storyEn','storyTh','status'])S.edit[key]=String(d.get(key)||'');
  S.edit.featured=form.elements.featured.checked;
}

async function save(){
  syncForm();
  const p={...S.edit};
  try{
    const path=p.id?`${ADMIN_BASE}/places/${encodeURIComponent(p.id)}`:`${ADMIN_BASE}/places`,method=p.id?'PUT':'POST';
    const result=await api(path,method,p);
    S.selected=result.place.id;
    await refresh();
    toast(p.id?'บันทึกการเปลี่ยนแปลงแล้ว':'สร้างสถานที่แล้ว');
  }catch(e){
    toast('ไม่สำเร็จ: '+e.message);
    if(e.status===401)showAuth(false);
  }
}

async function remove(){
  if(!S.selected)return;
  const p=S.edit;
  if(!confirm(`ลบ ${p.en} ออกจากฐานข้อมูลอย่างถาวร? (การลบนี้ไม่สามารถกู้คืนได้)`))return;
  try{
    await api(`${ADMIN_BASE}/places/${encodeURIComponent(S.selected)}`,'DELETE');
    S.selected=null;
    await refresh();
    toast('ลบสถานที่ออกจากฐานข้อมูลอย่างถาวรแล้ว');
  }catch(e){
    toast(e.message);
  }
}

async function archivePlace(){
  if(!S.selected)return;
  const p=S.edit;
  if(!confirm(`ย้าย ${p.en} ไปถังขยะ (Archive)?\nสถานที่นี้จะถูกซ่อนจากแอปและการค้นหา แต่สามารถกู้คืนได้ภายหลัง`))return;
  try{
    await api(`${ADMIN_BASE}/places/${encodeURIComponent(S.selected)}/archive`,'POST');
    await refresh();
    toast('📦 ย้ายสถานที่ไปถังขยะแล้ว');
  }catch(e){
    toast(e.message);
  }
}

async function restorePlace(){
  if(!S.selected)return;
  try{
    await api(`${ADMIN_BASE}/places/${encodeURIComponent(S.selected)}/restore`,'POST');
    await refresh();
    toast('⟲ กู้คืนสถานที่กลับสู่สถานะ Draft แล้ว');
  }catch(e){
    toast(e.message);
  }
}

async function checkDuplicatesLive(){
  syncForm();
  const box=$('#dup-warning-box');
  if(!box)return;
  const p=S.edit;
  if(!p.en&&!p.th&&!p.lat&&!p.lon){
    box.style.display='none';
    return;
  }
  try{
    const res=await api(`${ADMIN_BASE}/places/check-duplicates`,'POST',{
      nameEn:p.en,nameTh:p.th,lat:p.lat,lon:p.lon,excludeSlug:p.id||''
    });
    if(res.duplicates&&res.duplicates.length){
      box.style.display='block';
      box.innerHTML=`<strong>⚠️ ตรวจพบสถานที่ที่อาจซ้ำซ้อน:</strong><ul style="margin:4px 0 0 16px;padding:0;">${res.duplicates.map(d=>`<li><strong>${esc(d.en)}</strong> (${esc(d.locEn)}) — <em>${d.reasons.join(', ')}</em></li>`).join('')}</ul>`;
    }else{
      box.style.display='none';
    }
  }catch{}
}

let dupTimer;
function onFormFieldChange(){
  clearTimeout(dupTimer);
  dupTimer=setTimeout(checkDuplicatesLive,400);
}

async function upload(file){
  if(!file)throw new Error('ไม่พบไฟล์');
  if(file.size>5*1024*1024)throw new Error('รูปต้องไม่เกิน 5 MB');
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('รองรับเฉพาะ JPG / PNG / WebP');
  const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('อ่านรูปภาพไม่ได้'));reader.readAsDataURL(file)});
  return (await api(ADMIN_BASE+'/uploads','POST',{dataUrl})).url;
}

document.addEventListener('submit',async e=>{
  if(!['auth-form','place-form','campaign-create-form'].includes(e.target.id))return;
  e.preventDefault();if(S.busy)return;S.busy=true;const button=e.target.querySelector('[type="submit"]');if(button)button.disabled=true;
  try{
    if(e.target.id==='auth-form'){
      const f=new FormData(e.target),password=String(f.get('password')||'');
      if(S.mode==='setup'){
        if(password!==f.get('confirm'))throw new Error('รหัสผ่านไม่ตรงกัน');
        await api(ADMIN_BASE+'/setup','POST',{password,setupToken:String(f.get('setupToken')||'').trim()});
      }else{
        await api(ADMIN_BASE+'/login','POST',{password});
      }
      await refresh();
      toast('เข้าสู่ระบบสำเร็จ');
    } else if(e.target.id==='campaign-create-form'){
      const f=new FormData(e.target);
      const payload={
        title:String(f.get('title')||'').trim(),badgeText:String(f.get('badgeText')||'').trim(),
        imageUrl:String(f.get('imageUrl')||'').trim(),targetSlug:String(f.get('targetSlug')||'').trim(),
        priority:Number(f.get('priority')||10),province:String(f.get('province')||'').trim(),
        startDate:String(f.get('startDate')||'')||null,endDate:String(f.get('endDate')||'')||null
      };
      await api(ADMIN_BASE+'/campaigns','POST',payload);
      await refresh();toast('สร้างแคมเปญสำเร็จ');
    } else {
      await save();
    }
  }catch(error){toast(error.message)}finally{S.busy=false;if(button)button.disabled=false}
});

document.addEventListener('click',async e=>{
  const filter=e.target.closest('[data-filter]');
  if(filter&&!e.target.closest('[data-action="safety-filter"]')){
    S.filter=filter.dataset.filter;
    const library=$('#library');
    if(library)library.innerHTML=listHtml();
    return;
  }
  const el=e.target.closest('[data-action]');
  if(!el||S.busy)return;
  const a=el.dataset.action;

  if(a==='toggle-pwd'){
    const input=$('#admin-password-input');
    if(input){
      const isPwd=input.type==='password';
      input.type=isPwd?'text':'password';
      el.textContent=isPwd?'🙈':'👁️';
    }
    return;
  }
  if(a==='quick-fill-admin'){
    const input=$('#admin-password-input');
    if(input){
      input.value='Admin@12345678';
      toast('กรอกรหัสผ่าน Admin@12345678 แล้ว');
      const form=$('#auth-form');
      if(form){
        const submitBtn=form.querySelector('[type="submit"]');
        if(submitBtn)submitBtn.click();
      }
    }
    return;
  }
  if(a==='reset-local-admin'){
    try{
      S.busy=true;
      const res=await api(ADMIN_BASE+'/reset-local','POST',{});
      toast(res.message);
      const input=$('#admin-password-input');
      if(input)input.value='Admin@12345678';
      await api(ADMIN_BASE+'/login','POST',{password:'Admin@12345678'});
      await refresh();
      toast('รีเซ็ตและเข้าสู่ระบบสำเร็จ!');
    }catch(err){toast(err.message)}finally{S.busy=false}
    return;
  }
  if(a==='scan-duplicates'){
    try{
      S.busy=true;
      const res=await api(ADMIN_BASE+'/places/duplicates');
      S.dupPairs=res.pairs||[];
      S.showDupModal=true;
      dashboard();
    }catch(err){toast(err.message)}finally{S.busy=false}
    return;
  }
  if(a==='close-dup-modal'){
    S.showDupModal=false;
    dashboard();
    return;
  }
  if(a==='archive-place'){
    await archivePlace();
    return;
  }
  if(a==='restore-place'){
    await restorePlace();
    return;
  }
  if(a==='nav-overview'){S.section='overview';dashboard();return}
  if(a==='nav-places'){S.section='places';dashboard();return}
  if(a==='nav-users'){S.section='users';dashboard();return}
  if(a==='nav-safety'){S.section='safety';dashboard();return}
  if(a==='nav-campaigns'){S.section='campaigns';dashboard();return}
  if(a==='nav-analytics'){S.section='analytics';dashboard();return}
  if(a==='safety-filter'){S.safetyFilter=el.dataset.filter;dashboard();return}
  if(a==='toggle-user-status'){
    try{S.busy=true;await api(ADMIN_BASE+`/users/${encodeURIComponent(el.dataset.id)}/status`,'PATCH',{status:el.dataset.status});await refresh();toast('อัปเดตสถานะผู้ใช้แล้ว');}
    catch(err){toast(err.message)}finally{S.busy=false}
    return;
  }
  if(a==='update-safety-status'){
    try{
      S.busy=true;
      let adminNote='';
      if(el.dataset.status==='rejected'){const n=prompt('เหตุผลการปฏิเสธ (Admin note):');if(n===null)return;adminNote=n.trim();}
      await api(ADMIN_BASE+`/safety-reports/${encodeURIComponent(el.dataset.id)}`,'PATCH',{status:el.dataset.status,adminNote});
      await refresh();toast('อัปเดตรายงานความปลอดภัยแล้ว');
    }catch(err){toast(err.message)}finally{S.busy=false}
    return;
  }
  if(a==='delete-campaign'){
    if(!confirm('ต้องการลบแคมเปญนี้ใช่หรือไม่?'))return;
    try{S.busy=true;await api(ADMIN_BASE+`/campaigns/${encodeURIComponent(el.dataset.id)}`,'DELETE');await refresh();toast('ลบแคมเปญแล้ว');}
    catch(err){toast(err.message)}finally{S.busy=false}
    return;
  }
  if(a==='refresh-analytics'){
    try{S.busy=true;const stats=await api(ADMIN_BASE+'/sme-stats');S.smeStats=stats;dashboard();toast('อัปเดตสถิติแล้ว');}
    catch(err){toast(err.message)}finally{S.busy=false}
    return;
  }
  if(a==='new'||a==='edit'){
    if($('#place-form'))syncForm();
    if(S.showDupModal){S.showDupModal=false;}
    openEditor(a==='new'?null:el.dataset.id);
    return;
  }
  if(a==='clear-cover'){syncForm();S.edit.photo='';$('#cover-thumb').textContent='ยังไม่มีภาพปก';return}
  if(a==='remove-gallery'){syncForm();S.edit.gallery.splice(Number(el.dataset.index),1);$('#gallery-preview').innerHTML=S.edit.gallery.map((url,i)=>`<div class="img-item"><img alt="Gallery photo" src="${esc(image(url))}"/><button type="button" data-action="remove-gallery" data-index="${i}" aria-label="ลบรูป">×</button></div>`).join('');return}
  if(a==='delete')return remove();
  if(a==='logout'){await api(ADMIN_BASE+'/logout','POST');S.authenticated=false;showAuth(false);toast('ออกจากระบบแล้ว')}
});

document.addEventListener('input',e=>{
  if(e.target.id==='list-search'){
    S.search=e.target.value;const focused=e.target,at=focused.selectionStart;$('#library').innerHTML=listHtml();const next=$('#list-search');next.focus();next.setSelectionRange(at,at);
  }
  else if(e.target.id==='user-search'){S.userSearch=e.target.value;dashboard();}
  else if(e.target.closest('#place-form')){
    if(['en','th','lat','lon'].includes(e.target.name))onFormFieldChange();
  }
});

document.addEventListener('change',async e=>{
  if(!['upload-cover','upload-gallery'].includes(e.target.id))return;syncForm();const target=e.target;const isCover=target.id==='upload-cover';const files=[...target.files];if(!files.length)return;
  try{
    S.busy=true;target.disabled=true;
    for(const file of files){
      if(!isCover&&S.edit.gallery.length>=8)throw new Error('Gallery มีรูปได้สูงสุด 8 รูป');
      const url=await upload(file);
      if(isCover)S.edit.photo=url;else S.edit.gallery.push(url);
    }
    $('#cover-thumb').innerHTML=S.edit.photo?`<img src="${esc(image(S.edit.photo))}" alt="Cover photo"/>`:'ยังไม่มีภาพปก';
    $('#gallery-preview').innerHTML=S.edit.gallery.map((url,i)=>`<div class="img-item"><img alt="Gallery photo" src="${esc(image(url))}"/><button type="button" data-action="remove-gallery" data-index="${i}" aria-label="ลบรูป">×</button></div>`).join('');
    toast('อัปโหลดรูปแล้ว — กดบันทึกเพื่อใช้กับสถานที่');
  }catch(error){toast(error.message)}finally{S.busy=false;target.disabled=false;target.value=''}
});

boot();
