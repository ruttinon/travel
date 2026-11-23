/* Business portal — "หน้าร้านของฉัน" SME shop page editor (owner: Tommy, 2026-11-06)
 *
 * Lets an approved business design the shop page travellers open from the map (/shop/<place id>).
 * Left: template, colour, Google link and sections (add / remove / move / hide). Right: live phone preview
 * drawn by /shop-render.js — the same code the public page uses, so what the owner sees is what goes live.
 *
 * Server: backend/shop-pages.js
 *   GET  /api/business/shop-pages            my places + their page (a starter draft when there is none yet)
 *   PUT  /api/business/shop-pages/:id        save draft
 *   POST /api/business/shop-pages/:id/submit first version → admin approval; after that → goes live at once
 * Photos go through POST /api/business/uploads (shrunk to ≤1600px WebP here first).
 * Needs in business.html: <section id="view-shoppage"><div id="shopEditorRoot"></div></section>, a nav button
 * calling switchView('shoppage', this), /shop-render.css + /shop-render.js, and the page's showToast().
 */
(function() {
  'use strict';
  const R = window.TravalShopRender;
  const state = {pages: [], index: 0, content: null, dirty: false, busy: false, loaded: false};
  const esc = s => R.esc(s);
  const $ = sel => document.querySelector(sel);
  const toast = msg => (window.showToast ? window.showToast(msg) : alert(msg));

  async function api(method, url, body) {
    const res = await fetch(url, {method, credentials: 'same-origin', headers: body ? {'Content-Type': 'application/json'} : {}, body: body ? JSON.stringify(body) : undefined});
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty */ }
    if (!res.ok) { const err = new Error(data.error || 'HTTP ' + res.status); err.status = res.status; throw err; }
    return data;
  }

  const STATUS = {
    new: ['ยังไม่ได้สร้าง', '#F1F5F9', '#334155'],
    draft: ['ฉบับร่าง', '#F1F5F9', '#334155'],
    pending: ['รอแอดมินอนุมัติ', '#FFF7E6', '#8A5A00'],
    approved: ['เผยแพร่แล้ว', '#ECFDF3', '#166534'],
    rejected: ['แอดมินขอให้แก้ไข', '#FEF2F2', '#991B1B'],
    hidden: ['ถูกซ่อนโดยแอดมิน', '#FEF2F2', '#991B1B']
  };
  const chip = s => { const x = STATUS[s] || STATUS.draft; return `<span class="se-chip" style="background:${x[1]};color:${x[2]}">${x[0]}</span>`; };

  // ---------- loading ----------
  async function load() {
    const root = $('#shopEditorRoot');
    if (!root) return;
    root.innerHTML = '<div class="se-empty">กำลังโหลด…</div>';
    try {
      const data = await api('GET', '/api/business/shop-pages');
      state.pages = data.pages || [];
      state.loaded = true;
    } catch (e) {
      const msg = e.status === 401 ? 'กรุณา <a href="/login.html">เข้าสู่ระบบ</a> ด้วยบัญชีเจ้าของร้านก่อน'
        : e.status === 403 && /profile/i.test(e.message) ? 'ยังไม่มีโปรไฟล์ธุรกิจ — สมัครที่แท็บ "สมัครลงทะเบียนร้าน" ก่อน'
        : e.status === 403 ? 'ธุรกิจของคุณต้องได้รับอนุมัติจากแอดมินก่อน จึงจะสร้างหน้าร้านได้'
        : 'โหลดไม่สำเร็จ: ' + esc(e.message);
      root.innerHTML = `<div class="se-empty">${msg}</div>`;
      return;
    }
    if (!state.pages.length) {
      root.innerHTML = '<div class="se-empty"><b>ยังไม่มีร้านที่คุณเป็นเจ้าของบนแผนที่</b><br>ส่งร้านใหม่ที่แท็บ "สมัครลงทะเบียนร้าน" หรือขอสิทธิ์ร้านเดิมที่แท็บ "อ้างสิทธิ์ร้านค้า" — เมื่อแอดมินอนุมัติแล้ว ร้านจะขึ้นที่นี่ให้สร้างหน้าร้านได้</div>';
      return;
    }
    pick(Math.min(state.index, state.pages.length - 1), true);
  }

  function pick(i, force) {
    if (!force && state.dirty && !confirm('มีการแก้ไขที่ยังไม่บันทึก ต้องการเปลี่ยนร้านโดยไม่บันทึกหรือไม่?')) { renderShell(); return; }
    state.index = i;
    state.content = JSON.parse(JSON.stringify(state.pages[i].page.content));
    state.dirty = false;
    renderShell();
  }

  const cur = () => state.pages[state.index];

  // ---------- layout ----------
  function renderShell() {
    const root = $('#shopEditorRoot');
    const {place, page} = cur();
    const first = !page.approvedBefore || page.status === 'hidden';
    const publishLabel = page.status === 'pending' ? 'รอแอดมินตรวจ…' : first ? 'ส่งให้แอดมินตรวจ' : 'เผยแพร่การแก้ไข';
    let banner = '';
    if (page.status === 'pending') banner = '<div class="se-banner warn">◷ ส่งหน้าร้านให้แอดมินแล้ว รอตรวจสอบ (ครั้งแรกเท่านั้น) — ถ้าแก้ไขตอนนี้ ต้องกดส่งใหม่อีกครั้ง</div>';
    else if (page.status === 'rejected') banner = `<div class="se-banner error">✕ แอดมินขอให้แก้ไข: ${esc(page.note || '-')}</div>`;
    else if (page.status === 'hidden') banner = `<div class="se-banner error">หน้าร้านถูกซ่อนโดยแอดมิน${page.note ? ': ' + esc(page.note) : ''} — แก้ไขแล้วกดส่งให้แอดมินตรวจอีกครั้ง</div>`;
    else if (first) banner = '<div class="se-banner info">หน้าร้านครั้งแรกต้องผ่านการตรวจจากแอดมินก่อนเผยแพร่ หลังจากนั้นแก้ไขและเผยแพร่ได้เองทันที</div>';
    else if (page.hasChanges) banner = '<div class="se-banner info">มีการแก้ไขที่บันทึกแล้วแต่ยังไม่เผยแพร่ — กด "เผยแพร่การแก้ไข" เพื่อให้นักท่องเที่ยวเห็น</div>';

    root.innerHTML = `
      <div class="se-top">
        <label class="se-place">ร้าน
          <select id="sePlace">${state.pages.map((p, i) => `<option value="${i}"${i === state.index ? ' selected' : ''}>${esc(p.place.th || p.place.en)}</option>`).join('')}</select>
        </label>
        ${chip(page.status)}
        ${page.hasPublished ? `<a class="se-link" href="/shop/${encodeURIComponent(place.id)}" target="_blank" rel="noopener">เปิดหน้าร้านจริง ↗</a>` : ''}
        <span class="se-dirty" id="seDirty"${state.dirty ? '' : ' hidden'}>● ยังไม่บันทึก</span>
        <div class="se-actions">
          <button type="button" class="btn-outline" id="seSave">บันทึกร่าง</button>
          <button type="button" class="btn-action primary" id="sePublish"${page.status === 'pending' && !state.dirty ? ' disabled' : ''}>${publishLabel}</button>
        </div>
      </div>
      ${banner}
      <div class="se-grid">
        <div class="se-form" id="seForm"></div>
        <div class="se-preview-wrap"><div class="se-phone"><div class="se-phone-screen" id="sePreview"></div></div><p class="se-hint">ตัวอย่างบนมือถือ — หน้าจริงจะเหมือนแบบนี้</p></div>
      </div>`;
    $('#sePlace').onchange = e => pick(Number(e.target.value));
    $('#seSave').onclick = () => save(false);
    $('#sePublish').onclick = () => save(true);
    renderForm();
    renderPreview();
  }

  // ---------- form ----------
  const field = (label, path, value, opts = {}) => {
    const v = value == null ? '' : value;
    const attrs = `data-path="${path}"${opts.max ? ` maxlength="${opts.max}"` : ''}${opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : ''}`;
    const input = opts.area ? `<textarea rows="${opts.rows || 4}" ${attrs}>${esc(v)}</textarea>`
      : `<input type="${opts.type || 'text'}" ${attrs} value="${esc(v)}"${opts.step ? ` step="${opts.step}"` : ''}>`;
    return `<label class="se-field${opts.half ? ' half' : ''}"><span>${label}</span>${input}${opts.help ? `<small>${opts.help}</small>` : ''}</label>`;
  };
  const imagePicker = (label, path, value) => `<div class="se-field"><span>${label}</span><div class="se-img">
      ${value ? `<img src="${esc(value)}" alt="">` : '<div class="se-img-none">ไม่มีรูป</div>'}
      <button type="button" class="btn-outline" data-upload="${path}">${value ? 'เปลี่ยนรูป' : 'เลือกรูป'}</button>
      ${value ? `<button type="button" class="se-x" data-clear="${path}" aria-label="ลบรูป">✕</button>` : ''}</div></div>`;

  function sectionForm(s, i) {
    const p = `sections.${i}`;
    switch (s.type) {
      case 'hero': return field('ชื่อบนหัวเพจ', p + '.title', s.title, {max: 80}) + field('คำโปรย', p + '.subtitle', s.subtitle, {max: 160}) + imagePicker('รูปปก', p + '.image', s.image);
      case 'story': return field('หัวข้อ', p + '.heading', s.heading, {max: 80}) + field('เรื่องราว', p + '.text', s.text, {area: true, rows: 6, max: 3000, help: 'เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่'});
      case 'menu': return field('หัวข้อ', p + '.heading', s.heading, {max: 80}) +
        (s.items || []).map((it, k) => `<div class="se-row"><div class="se-row-fields">
          ${field('ชื่อเมนู/สินค้า', `${p}.items.${k}.name`, it.name, {max: 80, half: true})}
          ${field('ราคา (บาท)', `${p}.items.${k}.price`, it.price, {type: 'number', step: '0.01', half: true})}
          ${field('รายละเอียด', `${p}.items.${k}.description`, it.description, {max: 200})}
          ${imagePicker('รูป (ไม่บังคับ)', `${p}.items.${k}.image`, it.image)}</div>
          <button type="button" class="se-x" data-remove="${p}.items.${k}" aria-label="ลบรายการ">✕</button></div>`).join('') +
        ((s.items || []).length < 40 ? `<button type="button" class="se-add" data-push="${p}.items">+ เพิ่มเมนู/สินค้า</button>` : '');
      case 'gallery': return field('หัวข้อ', p + '.heading', s.heading, {max: 80}) + `<div class="se-thumbs">${(s.images || []).map((src, k) =>
        `<div class="se-thumb"><img src="${esc(src)}" alt=""><button type="button" class="se-x" data-remove="${p}.images.${k}" aria-label="ลบรูป">✕</button></div>`).join('')}
        ${(s.images || []).length < 12 ? `<button type="button" class="se-thumb add" data-upload="${p}.images.+">+ เพิ่มรูป</button>` : ''}</div><small class="se-small">สูงสุด 12 รูป</small>`;
      case 'hours': return field('หัวข้อ', p + '.heading', s.heading, {max: 80}) +
        (s.lines || []).map((l, k) => `<div class="se-row"><div class="se-row-fields">
          ${field('วัน', `${p}.lines.${k}.days`, l.days, {max: 40, half: true, placeholder: 'จันทร์–ศุกร์'})}
          ${field('เวลา', `${p}.lines.${k}.time`, l.time, {max: 40, half: true, placeholder: '08:00–17:00'})}</div>
          <button type="button" class="se-x" data-remove="${p}.lines.${k}" aria-label="ลบบรรทัด">✕</button></div>`).join('') +
        ((s.lines || []).length < 14 ? `<button type="button" class="se-add" data-push="${p}.lines">+ เพิ่มบรรทัด</button>` : '') +
        field('หมายเหตุ', p + '.note', s.note, {max: 200, placeholder: 'เช่น ปิดทุกวันพุธที่ 2 ของเดือน'});
      case 'promo': return field('ชื่อโปรโมชัน', p + '.title', s.title, {max: 80}) + field('รายละเอียด', p + '.text', s.text, {area: true, rows: 3, max: 500}) +
        field('ใช้ได้ถึงวันที่', p + '.validUntil', s.validUntil, {type: 'date', help: 'หมดเขตแล้วจะซ่อนเองอัตโนมัติ'});
      case 'contact': return field('หัวข้อ', p + '.heading', s.heading, {max: 80}) +
        field('เบอร์โทร', p + '.phone', s.phone, {max: 40, half: true, placeholder: '081 234 5678'}) + field('LINE ID หรือลิงก์', p + '.line', s.line, {max: 120, half: true, placeholder: '@myshop'}) +
        field('Facebook', p + '.facebook', s.facebook, {placeholder: 'https://www.facebook.com/…'}) + field('Instagram', p + '.instagram', s.instagram, {placeholder: 'https://www.instagram.com/…'}) +
        field('TikTok', p + '.tiktok', s.tiktok, {placeholder: 'https://www.tiktok.com/@…'}) + field('เว็บไซต์', p + '.website', s.website, {placeholder: 'https://…'});
    }
    return '';
  }

  function renderForm() {
    const c = state.content;
    const used = new Set(c.sections.map(s => s.type));
    const addable = R.SECTION_TYPES.filter(t => t.id !== 'hero' || !used.has('hero'));
    $('#seForm').innerHTML = `
      <div class="se-card"><h3>แม่แบบ</h3>
        <div class="se-templates">${R.TEMPLATES.map(t => `<button type="button" class="se-tpl${c.template === t.id ? ' on' : ''}" data-template="${t.id}"><b>${t.th}</b><small>${esc(t.hint)}</small></button>`).join('')}</div>
        <h3>สีหลัก</h3>
        <div class="se-colors">${R.COLORS.map(x => `<button type="button" class="se-color${c.color === x.id ? ' on' : ''}" data-color="${x.id}" title="${x.th}" aria-label="${x.th}" style="background:${x.swatch}"></button>`).join('')}</div>
      </div>
      <div class="se-card"><h3>รีวิวบน Google <small>(ไม่บังคับ)</small></h3>
        <p class="se-small">ถ้าร้านมีหน้าใน Google Maps อยู่แล้ว ใส่ลิงก์ไว้ — หน้าร้านจะมีปุ่ม "รีวิวบน Google" ให้ลูกค้ากดไปอ่าน/เขียนรีวิว ถ้าไม่มีก็เว้นว่างได้ รีวิวใน GoAround ยังแสดงตามปกติ</p>
        ${field('ลิงก์ Google Maps ของร้าน', 'google.url', c.google && c.google.url, {placeholder: 'https://maps.app.goo.gl/…', help: 'เปิดร้านใน Google Maps → แชร์ → คัดลอกลิงก์'})}
      </div>
      ${c.sections.map((s, i) => {
        const meta = R.SECTION_TYPES.find(t => t.id === s.type) || {th: s.type};
        return `<div class="se-card se-sec${s.visible === false ? ' off' : ''}">
          <div class="se-sec-head"><h3>${meta.th}</h3>
            <div class="se-sec-tools">
              <button type="button" data-move="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="เลื่อนขึ้น">↑</button>
              <button type="button" data-move="${i}" data-dir="1" ${i === c.sections.length - 1 ? 'disabled' : ''} aria-label="เลื่อนลง">↓</button>
              <button type="button" data-toggle="${i}">${s.visible === false ? 'แสดง' : 'ซ่อน'}</button>
              <button type="button" data-delsec="${i}" aria-label="ลบส่วนนี้">ลบ</button>
            </div></div>
          ${s.visible === false ? '<p class="se-small">ส่วนนี้ถูกซ่อนอยู่</p>' : `<div class="se-sec-body">${sectionForm(s, i)}</div>`}
        </div>`;
      }).join('')}
      ${c.sections.length < 12 ? `<div class="se-card"><h3>เพิ่มส่วนใหม่</h3><div class="se-addsec">${addable.map(t => `<button type="button" class="btn-outline" data-addsec="${t.id}">+ ${t.th}</button>`).join('')}</div></div>` : ''}
      <input type="file" id="seFile" accept="image/png,image/jpeg,image/webp" hidden>`;
  }

  // ---------- editing helpers ----------
  function getParent(path) {
    const keys = path.split('.');
    let obj = state.content;
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] == null) obj[keys[i]] = /^\d+$/.test(keys[i + 1]) || keys[i + 1] === '+' ? [] : {};
      obj = obj[keys[i]];
    }
    return [obj, keys[keys.length - 1]];
  }
  function setPath(path, value) {
    const [obj, key] = getParent(path);
    if (key === '+') obj.push(value); else obj[key] = value;
  }
  function changed(structural) {
    state.dirty = true;
    const d = $('#seDirty'); if (d) d.hidden = false;
    const pub = $('#sePublish'); if (pub) pub.disabled = false;
    if (structural) renderForm();
    schedulePreview();
  }
  let previewTimer = 0;
  function schedulePreview() { clearTimeout(previewTimer); previewTimer = setTimeout(renderPreview, 150); }
  function renderPreview() {
    const box = $('#sePreview');
    if (!box) return;
    const {place} = cur();
    const c = state.content;
    const google = c.google && c.google.url ? c.google.url : place.googlePlaceId ? (window.TravalLinks ? TravalLinks.placeUrl(place) : '') : '';
    box.innerHTML = R.html({content: c, place, googleUrl: google, reviews: [], mode: 'preview', navigateUrl: 'https://www.google.com/maps', writeReviewUrl: '#'});
    box.querySelectorAll('a').forEach(a => a.addEventListener('click', e => e.preventDefault()));
  }

  // Shrink a photo before upload: max 1600px, WebP (JPEG if the browser cannot make WebP)
  function shrink(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error('ใช้ได้เฉพาะรูป PNG, JPG หรือ WebP'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        let data = canvas.toDataURL('image/webp', 0.85);
        if (!data.startsWith('data:image/webp')) data = canvas.toDataURL('image/jpeg', 0.85);
        resolve(data);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('เปิดรูปนี้ไม่ได้')); };
      img.src = url;
    });
  }
  let uploadTarget = null;
  async function doUpload(file) {
    if (!file || !uploadTarget) return;
    const target = uploadTarget; uploadTarget = null;
    toast('กำลังอัปโหลดรูป…');
    try {
      const dataUrl = await shrink(file);
      const out = await api('POST', '/api/business/uploads', {dataUrl});
      setPath(target, out.url);
      changed(true);
      toast('อัปโหลดรูปแล้ว');
    } catch (e) { toast('อัปโหลดไม่สำเร็จ: ' + e.message); }
  }

  async function save(publish) {
    if (state.busy) return;
    const {place, page} = cur();
    state.busy = true;
    try {
      if (state.dirty || page.status === 'new') {
        // Empty rows the owner added but did not fill are dropped instead of blocking the save
        for (const sec of state.content.sections) {
          if (sec.items) sec.items = sec.items.filter(it => String(it.name || '').trim());
          if (sec.lines) sec.lines = sec.lines.filter(l => String(l.days || '').trim() && String(l.time || '').trim());
        }
        const out = await api('PUT', '/api/business/shop-pages/' + encodeURIComponent(place.id), {content: state.content});
        cur().page = out.page;
        state.content = JSON.parse(JSON.stringify(out.page.content));
        state.dirty = false;
      }
      if (publish) {
        const firstTime = !cur().page.approvedBefore || cur().page.status === 'hidden';
        if (firstTime && !confirm('ส่งหน้าร้านให้แอดมินตรวจหรือไม่? (ครั้งแรกเท่านั้น หลังอนุมัติแล้วแก้ไขได้เองทันที)')) { renderShell(); return; }
        const out = await api('POST', '/api/business/shop-pages/' + encodeURIComponent(place.id) + '/submit');
        cur().page = out.page;
        toast(out.published ? 'เผยแพร่หน้าร้านแล้ว ✓' : 'ส่งให้แอดมินตรวจแล้ว');
      } else toast('บันทึกร่างแล้ว');
      renderShell();
    } catch (e) {
      toast((publish ? 'ส่งไม่สำเร็จ: ' : 'บันทึกไม่สำเร็จ: ') + e.message);
    } finally { state.busy = false; }
  }

  // ---------- events (one listener for the whole editor) ----------
  document.addEventListener('input', e => {
    const el = e.target;
    if (!el.closest || !el.closest('#seForm') || !el.dataset.path) return;
    let v = el.value;
    if (el.type === 'number') v = v === '' ? null : Number(v);
    setPath(el.dataset.path, v);
    changed(false);
  });
  document.addEventListener('change', e => {
    if (e.target && e.target.id === 'seFile') { doUpload(e.target.files[0]); e.target.value = ''; }
  });
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#seForm button');
    if (!b) return;
    const c = state.content, d = b.dataset;
    if (d.template) { c.template = d.template; changed(true); }
    else if (d.color) { c.color = d.color; changed(true); }
    else if (d.upload) { uploadTarget = d.upload; $('#seFile').click(); }
    else if (d.clear) { setPath(d.clear, ''); changed(true); }
    else if (d.remove) { const [arr, k] = getParent(d.remove); arr.splice(Number(k), 1); changed(true); }
    else if (d.push) {
      const [obj, key] = getParent(d.push + '.+'); void key;
      obj.push(d.push.endsWith('items') ? {name: '', price: null, description: '', image: ''} : {days: '', time: ''});
      changed(true);
    }
    else if (d.move) { const i = Number(d.move), j = i + Number(d.dir); [c.sections[i], c.sections[j]] = [c.sections[j], c.sections[i]]; changed(true); }
    else if (d.toggle) { const s = c.sections[Number(d.toggle)]; s.visible = s.visible === false; changed(true); }
    else if (d.delsec) { if (confirm('ลบส่วนนี้ออกจากหน้าร้าน?')) { c.sections.splice(Number(d.delsec), 1); changed(true); } }
    else if (d.addsec) {
      const s = R.blankSection(d.addsec);
      if (d.addsec === 'hero') c.sections.unshift(s); else c.sections.push(s);
      changed(true);
    }
  });
  window.addEventListener('beforeunload', e => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

  window.TravalShopEditor = {load, isDirty: () => state.dirty};
})();
