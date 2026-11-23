/* Admin — SME shop pages (owner: Tommy, 2026-11-06). Lives in the "SME Verification" tab of admin.html.
 *
 * Rule: a shop page's FIRST version must be approved here. Later edits by the owner go live straight away,
 * so this panel also lists live pages, with "Hide" for anything that breaks the rules (owner can fix + resend).
 * Server: backend/shop-pages.js  (GET /api/admin/shop-pages?status=…, GET /api/admin/shop-pages/:id,
 *         POST /api/admin/shop-pages/:id/decision {status, note}, POST /api/admin/shop-pages/:id/unpublish {note})
 * Preview uses /shop-render.js; private photos load through /api/admin/business-media/ (admin cookie is /api/admin only).
 */
(function() {
  'use strict';
  const R = window.TravalShopRender;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const toast = m => (window.showToast ? showToast(m) : alert(m));
  let filter = 'pending';

  async function api(method, url, body) {
    const res = await fetch(url, {method, credentials: 'same-origin', headers: body ? {'Content-Type': 'application/json'} : {}, body: body ? JSON.stringify(body) : undefined});
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty */ }
    if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
    return data;
  }
  const adminImage = p => '/api/admin/business-media/' + String(p).split('/').pop();
  const LABEL = {pending: ['รออนุมัติ (ครั้งแรก)', 'pending'], approved: ['เผยแพร่อยู่', 'approved'], rejected: ['ส่งกลับให้แก้', 'rejected'], hidden: ['ซ่อนอยู่', 'rejected'], draft: ['ร่าง', 'pending']};

  async function load() {
    const box = document.getElementById('shopPagesContainer');
    if (!box) return;
    document.querySelectorAll('[data-shop-filter]').forEach(b => b.classList.toggle('active', b.dataset.shopFilter === filter));
    box.innerHTML = '<p class="sp-note">กำลังโหลด…</p>';
    let pages;
    try { pages = (await api('GET', '/api/admin/shop-pages?status=' + filter)).pages; }
    catch (e) { box.innerHTML = `<p class="sp-note">โหลดไม่สำเร็จ: ${esc(e.message)}</p>`; return; }
    const count = document.getElementById('shopPendingCount');
    if (count && filter === 'pending') count.textContent = pages.length ? `(${pages.length})` : '';
    if (!pages.length) { box.innerHTML = `<p class="sp-note">${filter === 'pending' ? 'ไม่มีหน้าร้านรออนุมัติ' : 'ไม่มีรายการ'}</p>`; return; }
    box.innerHTML = pages.map(p => {
      const c = p.content || {};
      const hero = (c.sections || []).find(s => s.type === 'hero') || {};
      const [label, cls] = LABEL[p.status] || [p.status, 'pending'];
      return `<div class="mod-card">
        <div class="mod-top"><span class="mod-category">หน้าร้าน · ${esc(c.template || '')}</span><span class="status-badge ${cls}">${esc(label)}</span></div>
        ${hero.image ? `<img src="${esc(adminImage(hero.image))}" class="mod-img" alt="">` : ''}
        <h3>${esc(hero.title || p.placeName)}</h3>
        <div class="mod-meta">🏪 <strong>สถานที่:</strong> ${esc(p.placeName)}<br>👤 <strong>ธุรกิจ:</strong> ${esc(p.businessName || '-')}<br>
          🕒 <strong>อัปเดต:</strong> ${esc((p.submittedAt || p.updatedAt || '').slice(0, 16).replace('T', ' '))}
          ${c.google && c.google.url ? `<br>🔗 <strong>Google:</strong> <a href="${esc(c.google.url)}" target="_blank" rel="noopener">ตรวจลิงก์</a>` : ''}
          ${p.note ? `<br>📝 <strong>หมายเหตุ:</strong> ${esc(p.note)}` : ''}</div>
        <div class="mod-actions">
          <button class="btn-sm" data-sp-preview="${esc(p.placeId)}">ดูตัวอย่าง</button>
          ${p.status === 'pending' ? `<button class="btn-sm approve" data-sp-approve="${esc(p.placeId)}">✓ อนุมัติ</button><button class="btn-sm reject" data-sp-reject="${esc(p.placeId)}">✕ ส่งกลับ</button>` : ''}
          ${p.status === 'approved' ? `<a class="btn-sm" href="/shop/${encodeURIComponent(p.placeId)}" target="_blank" rel="noopener">เปิดหน้าจริง ↗</a><button class="btn-sm reject" data-sp-hide="${esc(p.placeId)}">ซ่อน</button>` : ''}
        </div></div>`;
    }).join('');
  }

  async function preview(id) {
    let data;
    try { data = await api('GET', '/api/admin/shop-pages/' + encodeURIComponent(id)); } catch (e) { toast(e.message); return; }
    const wrap = document.createElement('div');
    wrap.className = 'sp-modal';
    wrap.innerHTML = `<div class="sp-sheet" role="dialog" aria-label="ตัวอย่างหน้าร้าน">
      <div class="sp-head"><b>${esc(data.place.th || data.place.en)}</b><span>${data.live ? 'ฉบับที่ส่งมา (ยังไม่เผยแพร่)' : 'ฉบับแรก — รออนุมัติ'}</span><button type="button" class="sp-close" aria-label="ปิด">✕</button></div>
      <div class="sp-screen">${R.html({content: data.page.content, place: data.place, googleUrl: data.googleUrl, reviews: [], mode: 'preview', imageUrl: adminImage, navigateUrl: 'https://www.google.com/maps'})}</div></div>`;
    wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('.sp-close')) wrap.remove(); });
    wrap.querySelectorAll('.sp-screen a').forEach(a => a.addEventListener('click', e => e.preventDefault()));
    document.body.appendChild(wrap);
  }

  async function decide(id, status) {
    let note = '';
    if (status === 'rejected') { note = prompt('บอกเจ้าของร้านว่าต้องแก้อะไร (จำเป็น):', ''); if (!note) return; }
    try { await api('POST', `/api/admin/shop-pages/${encodeURIComponent(id)}/decision`, {status, note}); toast(status === 'approved' ? 'อนุมัติหน้าร้านแล้ว — ขึ้นหน้าจริงทันที' : 'ส่งกลับให้เจ้าของร้านแก้แล้ว'); load(); }
    catch (e) { toast('ไม่สำเร็จ: ' + e.message); }
  }
  async function hide(id) {
    const note = prompt('เหตุผลที่ซ่อนหน้าร้าน (เจ้าของร้านจะเห็น):', '');
    if (note === null) return;
    try { await api('POST', `/api/admin/shop-pages/${encodeURIComponent(id)}/unpublish`, {note}); toast('ซ่อนหน้าร้านแล้ว'); load(); }
    catch (e) { toast('ไม่สำเร็จ: ' + e.message); }
  }

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-sp-preview],[data-sp-approve],[data-sp-reject],[data-sp-hide],[data-shop-filter]');
    if (!b) return;
    const d = b.dataset;
    if (d.shopFilter) { filter = d.shopFilter; load(); }
    else if (d.spPreview) preview(d.spPreview);
    else if (d.spApprove) decide(d.spApprove, 'approved');
    else if (d.spReject) decide(d.spReject, 'rejected');
    else if (d.spHide) hide(d.spHide);
  });
  window.TravalAdminShopPages = {load};
})();
