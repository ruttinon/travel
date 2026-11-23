'use strict';
/* SME shop pages (owner: Tommy, 2026-11-06)
 *
 * A shop that is on the GoAround map can have its own page, built from one of our templates. The owner fills in
 * sections (no HTML — only text, prices, our uploaded photos and checked links), so every page is safe and looks
 * consistent.
 *
 * Approval rule (decided by the team 2026-11-06):
 *   - The FIRST version of a shop page waits for admin approval (status 'pending').
 *   - Once a page has been approved, the owner's later edits go live straight away when they press publish.
 *   - Admin can still hide a page at any time ('hidden'). The owner can fix it and send it again; it then waits
 *     for admin approval like a first version.
 *   - Set TRAVAL_SHOP_PAGES_AUTO_APPROVE=1 to skip approval for first versions too (possible future change).
 *
 *   Public     GET  /api/shop-pages                     → [{id, googleUrl}] places that have a published page
 *              GET  /api/shop-pages/:placeId            → {page, place} (published version)
 *              GET  /api/shop-pages/:placeId?draft=1    → the draft, for its owner (preview)
 *   Owner      GET  /api/business/shop-pages            → my places with their page status
 *              PUT  /api/business/shop-pages/:placeId   → save draft {content}
 *              POST /api/business/shop-pages/:placeId/submit → first time: send to admin; after approval: publish now
 *   Admin      GET  /api/admin/shop-pages?status=pending
 *              GET  /api/admin/shop-pages/:placeId      → one page's draft + live version (preview)
 *              POST /api/admin/shop-pages/:placeId/decision {status:'approved'|'rejected', note}
 *              POST /api/admin/shop-pages/:placeId/unpublish {note}
 *
 * Owner = an approved business linked to the place in place_owners (created when admin approves the shop
 * proposal or a claim). The page is shown at /shop/<placeId> (frontend/shop/shop.html).
 *
 * Google: SME shops made in GoAround often have no Google Maps listing. The owner may link one (a Google Maps link
 * or Place ID); only then the page and the app show "Reviews on Google". Our own reviews are always shown.
 */

const TEMPLATES = ['classic', 'modern', 'market'];
const COLORS = ['forest', 'sunset', 'ocean', 'berry', 'charcoal'];
const SECTION_TYPES = ['hero', 'story', 'menu', 'gallery', 'hours', 'promo', 'contact'];
const MAX_SECTIONS = 12, MAX_MENU = 40, MAX_GALLERY = 12, MAX_HOURS = 14;
const IMAGE_PATH = /^\/uploads\/[a-f0-9-]{36}\.(?:webp|png|jpg)$/;
const SLUG = /^[-a-z0-9]{1,65}$/;
const GOOGLE_HOSTS = /^(?:www\.)?google\.[a-z.]{2,6}$|^maps\.google\.[a-z.]{2,6}$|^maps\.app\.goo\.gl$|^goo\.gl$/;
const LINKS = {
  facebook: /^(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.com|fb\.me)$/,
  instagram: /^(?:www\.)?instagram\.com$/,
  tiktok: /^(?:www\.)?tiktok\.com$/,
  website: /./
};

function makeShopPages({ db, fail, audit, getRow, rowToPlace }) {
  db.exec(`CREATE TABLE IF NOT EXISTS shop_pages (
    place_slug TEXT PRIMARY KEY REFERENCES places(slug) ON DELETE CASCADE,
    business_id TEXT NOT NULL,
    draft_json TEXT NOT NULL DEFAULT '{}',
    published_json TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected','hidden')),
    admin_note TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL, submitted_at TEXT, reviewed_at TEXT, published_at TEXT)`);

  const autoApprove = () => process.env.TRAVAL_SHOP_PAGES_AUTO_APPROVE === '1';
  const now = () => new Date().toISOString();
  const parse = s => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

  // ---------- content checking: only the fields we know, with limits ----------
  function text(v, max, label, required = false) {
    if (v == null || v === '') { if (required) fail(400, `${label} is required`); return ''; }
    if (typeof v !== 'string') fail(400, `${label} must be text`);
    const s = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
    if (s.length > max) fail(400, `${label} is too long (max ${max})`);
    if (required && !s) fail(400, `${label} is required`);
    return s;
  }
  function image(v, label) {
    if (!v) return '';
    if (typeof v !== 'string' || !IMAGE_PATH.test(v)) fail(400, `${label}: use a photo uploaded to GoAround`);
    return v;
  }
  function httpsUrl(v, label, hostRule) {
    if (!v) return '';
    let u;
    try { u = new URL(String(v).trim()); } catch { fail(400, `${label}: not a valid link`); }
    if (u.protocol !== 'https:') fail(400, `${label}: link must start with https://`);
    if (hostRule && !hostRule.test(u.hostname)) fail(400, `${label}: not a ${label} link`);
    if (u.href.length > 500) fail(400, `${label}: link is too long`);
    return u.href;
  }
  function lineId(v) {
    if (!v) return '';
    const s = String(v).trim();
    if (/^@?[a-z0-9._-]{2,40}$/i.test(s)) return s.startsWith('@') ? s : '@' + s;
    return httpsUrl(s, 'LINE', /^(?:line\.me|lin\.ee|page\.line\.me)$/);
  }
  function price(v) {
    if (v == null || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 10_000_000) fail(400, 'Price must be a number');
    return Math.round(n * 100) / 100;
  }
  function section(s, i) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) fail(400, `Section ${i + 1} is not valid`);
    const type = s.type;
    if (!SECTION_TYPES.includes(type)) fail(400, `Section ${i + 1}: unknown type`);
    const visible = s.visible !== false;
    switch (type) {
      case 'hero': return { type, visible, title: text(s.title, 80, 'Title'), subtitle: text(s.subtitle, 160, 'Subtitle'), image: image(s.image, 'Cover photo') };
      case 'story': return { type, visible, heading: text(s.heading, 80, 'Heading'), text: text(s.text, 3000, 'Story') };
      case 'menu': {
        const items = Array.isArray(s.items) ? s.items : [];
        if (items.length > MAX_MENU) fail(400, `Menu: at most ${MAX_MENU} items`);
        return { type, visible, heading: text(s.heading, 80, 'Heading'),
          items: items.map((it, k) => ({ name: text(it?.name, 80, `Menu item ${k + 1}`, true), price: price(it?.price), description: text(it?.description, 200, 'Description'), image: image(it?.image, 'Menu photo') })) };
      }
      case 'gallery': {
        const images = Array.isArray(s.images) ? s.images : [];
        if (images.length > MAX_GALLERY) fail(400, `Gallery: at most ${MAX_GALLERY} photos`);
        return { type, visible, heading: text(s.heading, 80, 'Heading'), images: images.map((x, k) => image(x, `Photo ${k + 1}`)).filter(Boolean) };
      }
      case 'hours': {
        const lines = Array.isArray(s.lines) ? s.lines : [];
        if (lines.length > MAX_HOURS) fail(400, `Opening hours: at most ${MAX_HOURS} lines`);
        return { type, visible, heading: text(s.heading, 80, 'Heading'), lines: lines.map(l => ({ days: text(l?.days, 40, 'Days', true), time: text(l?.time, 40, 'Time', true) })), note: text(s.note, 200, 'Note') };
      }
      case 'promo': return { type, visible, title: text(s.title, 80, 'Promotion title'), text: text(s.text, 500, 'Promotion'), validUntil: /^\d{4}-\d{2}-\d{2}$/.test(String(s.validUntil || '')) ? s.validUntil : '' };
      case 'contact': return { type, visible, heading: text(s.heading, 80, 'Heading'),
        phone: (() => { const p = text(s.phone, 40, 'Phone'); if (p && !/^[+0-9() .-]{6,40}$/.test(p)) fail(400, 'Phone: numbers only'); return p; })(),
        line: lineId(s.line), facebook: httpsUrl(s.facebook, 'Facebook', LINKS.facebook), instagram: httpsUrl(s.instagram, 'Instagram', LINKS.instagram),
        tiktok: httpsUrl(s.tiktok, 'TikTok', LINKS.tiktok), website: httpsUrl(s.website, 'Website', LINKS.website) };
    }
  }
  function normalizeContent(c) {
    if (!c || typeof c !== 'object' || Array.isArray(c)) fail(400, 'Invalid page');
    const template = TEMPLATES.includes(c.template) ? c.template : 'classic';
    const color = COLORS.includes(c.color) ? c.color : 'forest';
    const sections = Array.isArray(c.sections) ? c.sections : [];
    if (sections.length > MAX_SECTIONS) fail(400, `At most ${MAX_SECTIONS} sections`);
    const g = c.google && typeof c.google === 'object' ? c.google : {};
    const google = { url: httpsUrl(g.url, 'Google Maps', GOOGLE_HOSTS), placeId: '' };
    if (g.placeId) { const id = String(g.placeId).trim(); if (!/^[A-Za-z0-9_-]{10,300}$/.test(id)) fail(400, 'Google Place ID is not valid'); google.placeId = id; }
    const out = { template, color, sections: sections.map(section), google };
    if (JSON.stringify(out).length > 200_000) fail(413, 'Page is too large');
    return out;
  }

  // Photos must be this business's own uploads (Business portal) or photos already on the place.
  const mediaOwner = db.prepare('SELECT business_id FROM business_media WHERE filename=?');
  function checkImageOwnership(content, businessId, place) {
    const onPlace = new Set([place.cover, ...(parse(place.gallery_json) || [])].filter(Boolean));
    const used = [];
    for (const sec of content.sections) {
      if (sec.image) used.push(sec.image);
      if (sec.images) used.push(...sec.images);
      if (sec.items) for (const it of sec.items) if (it.image) used.push(it.image);
    }
    for (const img of used) {
      if (onPlace.has(img)) continue;
      if (mediaOwner.get(img.split('/').pop())?.business_id !== businessId) fail(403, 'Use photos you uploaded in the Business portal');
    }
  }

  // ---------- helpers ----------
  const getPage = db.prepare('SELECT * FROM shop_pages WHERE place_slug=?');
  const ownerOf = db.prepare('SELECT business_id FROM place_owners WHERE place_slug=?');
  function pagePublic(row, which) {
    if (!row) return null;
    return { placeId: row.place_slug, status: row.status, note: row.admin_note,
      content: which === 'draft' ? parse(row.draft_json) : parse(row.published_json),
      hasPublished: !!row.published_json, hasChanges: !!row.published_json && row.draft_json !== row.published_json, approvedBefore: !!row.published_at, updatedAt: row.updated_at, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at, publishedAt: row.published_at };
  }
  function googleUrlOf(content, placeRow) {
    if (content?.google?.url) return content.google.url;
    const id = content?.google?.placeId || placeRow?.google_place_id;
    if (!id) return '';
    const name = placeRow ? (placeRow.name_en || placeRow.name_th || '') : '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name || 'place')}&query_place_id=${encodeURIComponent(id)}`;
  }
  function ownedPlace(business, slug) {
    if (!SLUG.test(slug)) fail(404, 'Place not found');
    const place = getRow.get(slug);
    if (!place) fail(404, 'Place not found');
    if (ownerOf.get(slug)?.business_id !== business.id) fail(403, 'Only the verified owner can edit this shop page');
    return place;
  }
  function starterContent(place) {
    // A first draft from what we already know about the place, so the owner never starts from an empty page.
    return normalizeContent({
      template: 'classic', color: 'forest',
      sections: [
        { type: 'hero', title: place.name_th || place.name_en, subtitle: place.location_th || place.location_en || '', image: IMAGE_PATH.test(place.cover || '') ? place.cover : '' },
        { type: 'story', heading: 'เรื่องราวของร้าน', text: place.local_story_th || place.description_th || place.description_en || '' },
        { type: 'menu', heading: 'เมนู / สินค้าแนะนำ', items: [] },
        { type: 'hours', heading: 'เวลาเปิด–ปิด', lines: [] },
        { type: 'contact', heading: 'ติดต่อร้าน', phone: /^[+0-9() .-]{6,40}$/.test(place.contact_phone || '') ? place.contact_phone : '', line: '' }
      ],
      google: { placeId: place.google_place_id || '' }
    });
  }

  // ---------- routes ----------
  async function handle(req, res, route, method, u, h) {
    // Public index (used by the app to show "View shop page" and the Google button rule)
    if (route === '/api/shop-pages' && method === 'GET') {
      const rows = db.prepare("SELECT s.place_slug,s.published_json,p.name_en,p.name_th,p.google_place_id FROM shop_pages s JOIN places p ON p.slug=s.place_slug WHERE s.published_json IS NOT NULL AND p.status='published'").all();
      return h.reply(res, 200, { pages: rows.map(r => ({ id: r.place_slug, googleUrl: googleUrlOf(parse(r.published_json), r) })) });
    }
    const pub = /^\/api\/shop-pages\/([-a-z0-9]{1,65})$/.exec(route);
    if (pub && method === 'GET') {
      const slug = pub[1], row = getPage.get(slug), place = getRow.get(slug);
      if (!place) fail(404, 'Shop page not found');
      if (u.searchParams.get('draft') === '1') {
        // Preview for the owner: the draft, even before approval. (Admin previews use /api/admin/shop-pages/:id,
        // because the admin cookie is only sent to /api/admin.)
        const user = h.userSession(req), biz = user && h.businessOf(user.id);
        if (!biz || ownerOf.get(slug)?.business_id !== biz.id) fail(403, 'Preview is only for the shop owner');
        const page = row ? pagePublic(row, 'draft') : { placeId: slug, status: 'draft', content: starterContent(place) };
        return h.reply(res, 200, { page, place: h.rowToPlace(place), googleUrl: googleUrlOf(page.content, place) });
      }
      if (!row || !row.published_json || place.status !== 'published') fail(404, 'Shop page not found');
      const page = pagePublic(row, 'published');
      return h.reply(res, 200, { page, place: h.rowToPlace(place), googleUrl: googleUrlOf(page.content, place) });
    }

    // Owner
    if (route === '/api/business/shop-pages' && method === 'GET') {
      const { business } = h.requireBusiness(req, true);
      const places = db.prepare('SELECT p.* FROM places p JOIN place_owners o ON o.place_slug=p.slug WHERE o.business_id=? ORDER BY p.updated_at DESC').all(business.id);
      return h.reply(res, 200, { pages: places.map(p => {
        const row = getPage.get(p.slug);
        return { place: h.rowToPlace(p, true), page: row ? pagePublic(row, 'draft') : { placeId: p.slug, status: 'new', content: starterContent(p), hasPublished: false, approvedBefore: false } };
      }) });
    }
    const own = /^\/api\/business\/shop-pages\/([-a-z0-9]{1,65})(?:\/(submit))?$/.exec(route);
    if (own) {
      h.checkOrigin(req);
      const { user, business } = h.requireBusiness(req, true);
      const slug = own[1], place = ownedPlace(business, slug), t = now();
      if (!own[2] && method === 'PUT') {
        const body = await h.jsonBody(req);
        const content = normalizeContent(body?.content);
        checkImageOwnership(content, business.id, place);
        const row = getPage.get(slug);
        if (row) db.prepare("UPDATE shop_pages SET business_id=?,draft_json=?,status=CASE WHEN status='hidden' THEN 'hidden' WHEN published_json IS NOT NULL THEN 'approved' ELSE 'draft' END,updated_at=? WHERE place_slug=?").run(business.id, JSON.stringify(content), t, slug);
        else db.prepare("INSERT INTO shop_pages(place_slug,business_id,draft_json,status,updated_at) VALUES(?,?,?,'draft',?)").run(slug, business.id, JSON.stringify(content), t);
        audit('owner', user.id, 'shop_page.save', 'place', slug, {});
        return h.reply(res, 200, { page: pagePublic(getPage.get(slug), 'draft') });
      }
      if (own[2] === 'submit' && method === 'POST') {
        const row = getPage.get(slug);
        if (!row) fail(400, 'Save the page first');
        if (row.status === 'pending') fail(409, 'Already waiting for admin');
        const content = normalizeContent(parse(row.draft_json));
        if (!content.sections.some(s => s.visible)) fail(400, 'Add at least one section');
        const approvedBefore = !!row.published_at; // admin approved a version of this page before
        // A page that admin hid must be checked again before it comes back, even if it was approved before.
        const publishNow = row.status !== 'hidden' && (approvedBefore || autoApprove());
        if (publishNow && approvedBefore) {
          db.prepare("UPDATE shop_pages SET published_json=?,status='approved',submitted_at=?,published_at=?,updated_at=? WHERE place_slug=?").run(JSON.stringify(content), t, t, t, slug);
          applyGoogleLink(slug, content);
        } else if (publishNow) {
          db.prepare("UPDATE shop_pages SET published_json=?,status='approved',admin_note='',submitted_at=?,reviewed_at=?,published_at=?,updated_at=? WHERE place_slug=?").run(JSON.stringify(content), t, t, t, t, slug);
          applyGoogleLink(slug, content);
        } else {
          db.prepare("UPDATE shop_pages SET status='pending',admin_note='',submitted_at=?,updated_at=? WHERE place_slug=?").run(t, t, slug);
        }
        const oldGoogle = JSON.stringify(parse(row.published_json)?.google || {}), newGoogle = JSON.stringify(content.google);
        audit('owner', user.id, publishNow ? 'shop_page.publish' : 'shop_page.submit', 'place', slug,
          { firstVersion: !approvedBefore, googleChanged: approvedBefore && oldGoogle !== newGoogle });
        return h.reply(res, 200, { page: pagePublic(getPage.get(slug), 'draft'), published: publishNow });
      }
      fail(405, 'Method not allowed');
    }

    // Admin
    if (route === '/api/admin/shop-pages' && method === 'GET') {
      h.requireAdmin(req);
      const status = u.searchParams.get('status') || 'pending';
      if (!['pending', 'approved', 'rejected', 'hidden', 'draft', 'all'].includes(status)) fail(400, 'Invalid status');
      const rows = db.prepare(`SELECT s.*,p.name_en,p.name_th,b.name AS business_name FROM shop_pages s JOIN places p ON p.slug=s.place_slug LEFT JOIN businesses b ON b.id=s.business_id ${status === 'all' ? '' : 'WHERE s.status=?'} ORDER BY COALESCE(s.submitted_at,s.updated_at) DESC LIMIT 200`).all(...(status === 'all' ? [] : [status]));
      return h.reply(res, 200, { pages: rows.map(r => ({ ...pagePublic(r, 'draft'), placeName: r.name_th || r.name_en, businessName: r.business_name || '' })) });
    }
    const admOne = /^\/api\/admin\/shop-pages\/([-a-z0-9]{1,65})$/.exec(route);
    if (admOne && method === 'GET') {
      h.requireAdmin(req);
      const row = getPage.get(admOne[1]), place = getRow.get(admOne[1]);
      if (!row || !place) fail(404, 'Shop page not found');
      return h.reply(res, 200, { page: pagePublic(row, 'draft'), live: parse(row.published_json), place: h.rowToPlace(place, true), googleUrl: googleUrlOf(parse(row.draft_json), place) });
    }
    const adm = /^\/api\/admin\/shop-pages\/([-a-z0-9]{1,65})\/(decision|unpublish)$/.exec(route);
    if (adm && method === 'POST') {
      h.requireAdmin(req); h.checkOrigin(req);
      const slug = adm[1], row = getPage.get(slug), t = now();
      if (!row) fail(404, 'Shop page not found');
      const body = await h.jsonBody(req);
      const note = text(body?.note, 500, 'Note');
      if (adm[2] === 'unpublish') {
        db.prepare("UPDATE shop_pages SET published_json=NULL,status='hidden',admin_note=?,reviewed_at=?,updated_at=? WHERE place_slug=?").run(note, t, t, slug);
        audit('admin', '1', 'shop_page.hide', 'place', slug, { note });
        return h.reply(res, 200, { page: pagePublic(getPage.get(slug), 'draft') });
      }
      const status = body?.status;
      if (!['approved', 'rejected'].includes(status)) fail(400, 'status must be approved or rejected');
      if (row.status !== 'pending') fail(409, 'Only pages waiting for approval can be decided');
      if (status === 'approved') {
        const content = normalizeContent(parse(row.draft_json));
        db.prepare("UPDATE shop_pages SET published_json=?,status='approved',admin_note=?,reviewed_at=?,published_at=?,updated_at=? WHERE place_slug=?").run(JSON.stringify(content), note, t, t, t, slug);
        applyGoogleLink(slug, content);
      } else {
        if (!note) fail(400, 'Tell the owner what to change (note)');
        db.prepare("UPDATE shop_pages SET status='rejected',admin_note=?,reviewed_at=?,updated_at=? WHERE place_slug=?").run(note, t, t, slug);
      }
      audit('admin', '1', 'shop_page.' + status, 'place', slug, { note });
      return h.reply(res, 200, { page: pagePublic(getPage.get(slug), 'draft') });
    }
    return false;
  }

  // A Google Place ID linked on an approved page is also kept on the place, so every "Reviews on Google" link uses it.
  function applyGoogleLink(slug, content) {
    if (content.google.placeId) db.prepare('UPDATE places SET google_place_id=? WHERE slug=?').run(content.google.placeId, slug);
  }

  return { handle, normalizeContent, TEMPLATES, COLORS, SECTION_TYPES };
}

module.exports = { makeShopPages, TEMPLATES, COLORS, SECTION_TYPES };
