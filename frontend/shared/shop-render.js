/* GoAround shared tool — draws an SME shop page (owner: Tommy, 2026-11-06)
 * Used by the public page (/shop/<id>, frontend/shop/shop.js) and by the live phone preview in the
 * Business portal editor, so the owner sees exactly what travellers will see.
 *
 * The page is built only from structured sections (see backend/shop-pages.js) — never from owner HTML.
 * Every text is escaped here and every link is re-checked (https only), so a page cannot run scripts.
 *
 *   TravalShopRender.html({content, place, googleUrl, reviews, mode, imageUrl, lang}) → HTML string
 *     mode: 'public' (hide empty sections, expired promos) | 'preview' (show hints for empty sections)
 *     imageUrl(path) → URL to load a photo (admin preview maps /uploads/x to /api/admin/business-media/x)
 *   TravalShopRender.TEMPLATES / COLORS / SECTION_TYPES / blankSection(type)
 * Loads in the browser as window.TravalShopRender and in Node via require().
 */
(function(global, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.TravalShopRender = api;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';

  const TEMPLATES = [
    {id: 'classic', th: 'คลาสสิก', en: 'Classic', hint: 'รูปปกใหญ่ เรียบง่าย สบายตา'},
    {id: 'modern', th: 'โมเดิร์น', en: 'Modern', hint: 'หัวเพจเข้ม ตัวอักษรใหญ่'},
    {id: 'market', th: 'ตลาดนัด', en: 'Market', hint: 'โทนกระดาษอุ่น ราคาแบบร้านตลาด'}
  ];
  const COLORS = [
    {id: 'forest', th: 'เขียวป่า', en: 'Forest', swatch: '#1E5538'},
    {id: 'sunset', th: 'ส้มพระอาทิตย์', en: 'Sunset', swatch: '#C2410C'},
    {id: 'ocean', th: 'ฟ้าทะเล', en: 'Ocean', swatch: '#0E4A6E'},
    {id: 'berry', th: 'ชมพูเบอร์รี่', en: 'Berry', swatch: '#9D174D'},
    {id: 'charcoal', th: 'ถ่านดำ', en: 'Charcoal', swatch: '#1F2937'}
  ];
  const SECTION_TYPES = [
    {id: 'hero', th: 'หัวเพจ + รูปปก', en: 'Header + cover photo'},
    {id: 'story', th: 'เรื่องราวของร้าน', en: 'Our story'},
    {id: 'menu', th: 'เมนู / สินค้า', en: 'Menu / products'},
    {id: 'gallery', th: 'อัลบั้มรูป', en: 'Photo gallery'},
    {id: 'hours', th: 'เวลาเปิด–ปิด', en: 'Opening hours'},
    {id: 'promo', th: 'โปรโมชัน', en: 'Promotion'},
    {id: 'contact', th: 'ช่องทางติดต่อ', en: 'Contact'}
  ];

  function blankSection(type) {
    switch (type) {
      case 'hero': return {type, visible: true, title: '', subtitle: '', image: ''};
      case 'story': return {type, visible: true, heading: 'เรื่องราวของร้าน', text: ''};
      case 'menu': return {type, visible: true, heading: 'เมนูแนะนำ', items: []};
      case 'gallery': return {type, visible: true, heading: 'บรรยากาศร้าน', images: []};
      case 'hours': return {type, visible: true, heading: 'เวลาเปิด–ปิด', lines: [], note: ''};
      case 'promo': return {type, visible: true, title: '', text: '', validUntil: ''};
      case 'contact': return {type, visible: true, heading: 'ติดต่อร้าน', phone: '', line: '', facebook: '', instagram: '', tiktok: '', website: ''};
    }
    return null;
  }

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const IMAGE = /^\/uploads\/[a-f0-9-]{36}\.(?:webp|png|jpg)$/;
  function safeHttps(url) {
    try { const u = new URL(String(url)); return u.protocol === 'https:' ? u.href : ''; } catch (e) { return ''; }
  }
  const paragraphs = text => String(text || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const money = n => n == null || n === '' ? '' : '฿' + Number(n).toLocaleString('th-TH', {maximumFractionDigits: 2});
  const lineUrl = v => !v ? '' : v.startsWith('@') ? 'https://line.me/R/ti/p/' + encodeURIComponent(v) : safeHttps(v);
  const today = () => new Date().toISOString().slice(0, 10);

  const ICON = {
    nav: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 21 3l-8 18-2-8-8-2z"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>'
  };

  function html(opts) {
    const o = opts || {};
    const c = o.content || {};
    const place = o.place || {};
    const preview = o.mode === 'preview';
    const img = p => IMAGE.test(p || '') ? esc(o.imageUrl ? o.imageUrl(p) : p) : '';
    const template = TEMPLATES.some(t => t.id === c.template) ? c.template : 'classic';
    const color = COLORS.some(x => x.id === c.color) ? c.color : 'forest';
    const sections = (Array.isArray(c.sections) ? c.sections : []).filter(s => s && s.visible !== false);
    const name = place.th || place.en || 'ร้านค้า';
    const empty = label => preview ? `<section class="tsp-sec tsp-empty"><p>${esc(label)} — ยังว่างอยู่ ส่วนนี้จะไม่แสดงบนหน้าจริง</p></section>` : '';

    let hero = sections.find(s => s.type === 'hero');
    if (!hero) hero = {title: name, subtitle: place.locTh || place.locEn || '', image: IMAGE.test(place.photo || '') ? place.photo : ''};
    const heroImg = img(hero.image);
    const smeType = place.smeType ? `<span class="tsp-chip">${esc(place.smeType)}</span>` : '';
    const parts = [];
    parts.push(`<header class="tsp-hero${heroImg ? ' has-img' : ''}">
      ${heroImg ? `<img class="tsp-hero-img" src="${heroImg}" alt="">` : ''}
      <div class="tsp-hero-text">
        <span class="tsp-badge">SME · GoAround</span>${smeType}
        <h1>${esc(hero.title || name)}</h1>
        ${hero.subtitle ? `<p>${esc(hero.subtitle)}</p>` : ''}
      </div>
    </header>`);

    // Actions: navigate, our reviews, Google reviews (only when the owner linked a Google listing), share
    const nav = o.navigateUrl ? safeHttps(o.navigateUrl) : '';
    const google = o.googleUrl ? safeHttps(o.googleUrl) : '';
    parts.push(`<nav class="tsp-actions" aria-label="Shop actions">
      ${nav ? `<a class="tsp-act primary" href="${esc(nav)}" target="_blank" rel="noopener">${ICON.nav}<span>นำทาง</span></a>` : ''}
      <a class="tsp-act" href="#tsp-reviews">${ICON.star}<span>รีวิว</span></a>
      ${google ? `<a class="tsp-act" href="${esc(google)}" target="_blank" rel="noopener" data-google-reviews>${ICON.google}<span>รีวิวบน Google</span></a>` : ''}
      <button class="tsp-act" type="button" data-share>${ICON.share}<span>แชร์</span></button>
    </nav>`);

    for (const s of sections) {
      if (s.type === 'hero') continue;
      if (s.type === 'story') {
        if (!s.text) { parts.push(empty('เรื่องราวของร้าน')); continue; }
        parts.push(`<section class="tsp-sec tsp-story">${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}${paragraphs(s.text)}</section>`);
      } else if (s.type === 'menu') {
        const items = Array.isArray(s.items) ? s.items : [];
        if (!items.length) { parts.push(empty('เมนู / สินค้า')); continue; }
        parts.push(`<section class="tsp-sec tsp-menu">${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}<ul>${items.map(it => {
          const pic = img(it.image);
          return `<li${pic ? ' class="has-img"' : ''}>${pic ? `<img src="${pic}" alt="" loading="lazy">` : ''}
            <div class="tsp-item"><div class="tsp-item-row"><strong>${esc(it.name)}</strong><span class="tsp-dots"></span>${it.price != null && it.price !== '' ? `<span class="tsp-price">${esc(money(it.price))}</span>` : ''}</div>
            ${it.description ? `<small>${esc(it.description)}</small>` : ''}</div></li>`;
        }).join('')}</ul></section>`);
      } else if (s.type === 'gallery') {
        const pics = (Array.isArray(s.images) ? s.images : []).map(img).filter(Boolean);
        if (!pics.length) { parts.push(empty('อัลบั้มรูป')); continue; }
        parts.push(`<section class="tsp-sec tsp-gallery">${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}<div class="tsp-grid n${pics.length}">${pics.map(p => `<img src="${p}" alt="" loading="lazy">`).join('')}</div></section>`);
      } else if (s.type === 'hours') {
        const lines = Array.isArray(s.lines) ? s.lines : [];
        if (!lines.length && !s.note) { parts.push(empty('เวลาเปิด–ปิด')); continue; }
        parts.push(`<section class="tsp-sec tsp-hours">${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}<dl>${lines.map(l => `<div><dt>${esc(l.days)}</dt><dd>${esc(l.time)}</dd></div>`).join('')}</dl>${s.note ? `<p class="tsp-note">${esc(s.note)}</p>` : ''}</section>`);
      } else if (s.type === 'promo') {
        const expired = s.validUntil && s.validUntil < today();
        if (!s.title || (expired && !preview)) { if (!s.title) parts.push(empty('โปรโมชัน')); continue; }
        parts.push(`<section class="tsp-sec tsp-promo${expired ? ' expired' : ''}"><span class="tsp-promo-tag">โปรโมชัน</span><h2>${esc(s.title)}</h2>${s.text ? paragraphs(s.text) : ''}${s.validUntil ? `<p class="tsp-note">ถึงวันที่ ${esc(s.validUntil)}${expired ? ' (หมดเขตแล้ว — ไม่แสดงบนหน้าจริง)' : ''}</p>` : ''}</section>`);
      } else if (s.type === 'contact') {
        const links = [];
        if (s.phone) links.push(`<a href="tel:${esc(String(s.phone).replace(/[^+0-9]/g, ''))}">${ICON.phone}<span>${esc(s.phone)}</span></a>`);
        const line = lineUrl(s.line);
        if (line) links.push(`<a href="${esc(line)}" target="_blank" rel="noopener">${ICON.link}<span>LINE ${esc(s.line.startsWith('@') ? s.line : '')}</span></a>`);
        for (const [key, label] of [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['website', 'เว็บไซต์']]) {
          const url = safeHttps(s[key]);
          if (url) links.push(`<a href="${esc(url)}" target="_blank" rel="noopener nofollow">${ICON.link}<span>${label}</span></a>`);
        }
        if (!links.length) { parts.push(empty('ช่องทางติดต่อ')); continue; }
        parts.push(`<section class="tsp-sec tsp-contact">${s.heading ? `<h2>${esc(s.heading)}</h2>` : ''}<div class="tsp-links">${links.join('')}</div></section>`);
      }
    }

    // Our reviews (from the GoAround app). Writing a review happens in the app, on the place card.
    const reviews = Array.isArray(o.reviews) ? o.reviews : [];
    const avg = reviews.length ? reviews.reduce((a, r) => a + Number(r.stars || 0), 0) / reviews.length : 0;
    const writeUrl = o.writeReviewUrl ? esc(o.writeReviewUrl) : '';
    parts.push(`<section class="tsp-sec tsp-reviews" id="tsp-reviews">
      <h2>รีวิวจากนักเดินทาง</h2>
      ${reviews.length ? `<p class="tsp-avg"><strong>${avg.toFixed(1)}</strong> ★ · ${reviews.length} รีวิวบน GoAround</p>
        <ul>${reviews.slice(0, 6).map(r => `<li><div class="tsp-stars" aria-label="${Number(r.stars)} ดาว">${'★'.repeat(Math.max(0, Math.min(5, Number(r.stars) || 0)))}<span>${'★'.repeat(5 - Math.max(0, Math.min(5, Number(r.stars) || 0)))}</span></div><p>${esc(r.text)}</p><small>— ${esc(r.name || 'นักเดินทาง')}</small></li>`).join('')}</ul>`
        : `<p class="tsp-note">ยังไม่มีรีวิวบน GoAround — มาเป็นคนแรกกัน</p>`}
      <div class="tsp-review-actions">
        ${writeUrl ? `<a class="tsp-btn" href="${writeUrl}">เขียนรีวิวใน GoAround</a>` : ''}
        ${google ? `<a class="tsp-btn ghost" href="${esc(google)}" target="_blank" rel="noopener">ดู / เขียนรีวิวบน Google</a>` : ''}
      </div>
    </section>`);
    parts.push(`<footer class="tsp-foot">หน้าร้านนี้สร้างด้วย GoAround · ข้อมูลจากเจ้าของร้าน ตรวจโดยทีมงาน</footer>`);

    return `<article class="tsp tsp-t-${template} tsp-c-${color}">${parts.join('')}</article>`;
  }

  return {TEMPLATES, COLORS, SECTION_TYPES, blankSection, html, esc};
});
