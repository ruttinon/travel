'use strict';
const path = require('node:path');
const crypto = require('node:crypto');
const { SETUP_TOKEN, UPLOADS } = require('../config');
const { db } = require('../db/connection');
const { reply, fail, validString, jsonBody, uploadImageTo, uploadImage } = require('../utils/http');
const { pwHash, newSession, cookieFor, requireAdmin, attemptAllowed } = require('../utils/crypto');
const { audit, placeAuditSummary } = require('../utils/audit');
const { getRow, getAdmin, normalize, rowToPlace, saveNew, saveExisting } = require('../services/place-service');
const { reviewPublic } = require('../services/review-service');
const { businessPublic, submissionPublic, approveSubmission } = require('../services/business-service');

async function handleAdminRoutes(req, res, pathOnly, method, u) {
  // Admin Setup & Auth
  if (method === 'POST' && pathOnly === '/api/admin/setup') {
    const admin = db.prepare('SELECT id FROM admins WHERE id=1').get();
    if (admin) fail(409, 'Admin account already initialized');
    const b = await jsonBody(req);
    if (b.token !== SETUP_TOKEN) fail(403, 'Invalid setup code from the server console');
    const pw = validString(b.password, 120, 'Password', { required: true });
    if (pw.length < 8) fail(400, 'Password must be at least 8 characters');
    const salt = crypto.randomBytes(16).toString('hex');
    db.prepare('INSERT INTO admins(id,salt,password_hash,created_at) VALUES(1,?,?,?)')
      .run(salt, pwHash(pw, salt), new Date().toISOString());
    newSession(res, req);
    audit('admin', 1, 'admin.setup', 'admin', 1);
    return reply(res, 201, { ok: true });
  }

  if (method === 'POST' && pathOnly === '/api/admin/login') {
    const ip = req.socket.remoteAddress || 'local';
    if (!attemptAllowed(ip)) fail(429, 'Too many login attempts; try again in 15 minutes');
    const b = await jsonBody(req);
    const pw = validString(b.password, 120, 'Password', { required: true });
    const row = db.prepare('SELECT salt,password_hash FROM admins WHERE id=1').get();
    if (!row || pwHash(pw, row.salt) !== row.password_hash) fail(401, 'Invalid password');
    newSession(res, req);
    audit('admin', 1, 'admin.login', 'admin', 1);
    return reply(res, 200, { ok: true });
  }

  if (method === 'GET' && pathOnly === '/api/admin/me') {
    requireAdmin(req);
    return reply(res, 200, { admin: true });
  }

  if (method === 'POST' && pathOnly === '/api/admin/logout') {
    res.setHeader('Set-Cookie', cookieFor('', req));
    audit('admin', 1, 'admin.logout', 'admin', 1);
    return reply(res, 200, { ok: true });
  }

  // Admin Places CRUD
  if (pathOnly === '/api/admin/places') {
    requireAdmin(req);
    if (method === 'GET') {
      const list = getAdmin.all().map(p => rowToPlace(p, true));
      return reply(res, 200, { places: list });
    }
    if (method === 'POST') {
      const p = normalize(await jsonBody(req));
      const place = saveNew(p);
      audit('admin', 1, 'place.create', 'place', place.id, placeAuditSummary(p));
      return reply(res, 201, { place });
    }
  }

  const adminPlaceMatch = /^\/api\/admin\/places\/([a-z0-9-]{1,65})(?:\/photo)?$/.exec(pathOnly);
  if (adminPlaceMatch) {
    requireAdmin(req);
    const slug = adminPlaceMatch[1];
    const isPhoto = pathOnly.endsWith('/photo');
    if (isPhoto && method === 'POST') {
      const b = await jsonBody(req);
      const uploaded = uploadImage(b);
      const current = getRow.get(slug);
      if (!current) fail(404, 'Place not found');
      const gallery = JSON.parse(current.gallery_json || '[]');
      if (b.target === 'cover' || !current.cover) {
        db.prepare('UPDATE places SET cover=?,updated_at=? WHERE slug=?').run(uploaded.url, new Date().toISOString(), slug);
      } else {
        if (gallery.length >= 8) fail(400, 'Gallery accepts up to 8 photos');
        gallery.push(uploaded.url);
        db.prepare('UPDATE places SET gallery_json=?,updated_at=? WHERE slug=?').run(JSON.stringify(gallery), new Date().toISOString(), slug);
      }
      audit('admin', 1, 'place.photo_attach', 'place', slug, { url: uploaded.url, target: b.target });
      return reply(res, 200, { place: rowToPlace(getRow.get(slug), true), uploaded });
    }
    if (method === 'GET') {
      const row = getRow.get(slug);
      if (!row) fail(404, 'Place not found');
      return reply(res, 200, { place: rowToPlace(row, true) });
    }
    if (method === 'PUT') {
      const p = normalize(await jsonBody(req));
      const place = saveExisting(slug, p);
      audit('admin', 1, 'place.update', 'place', slug, placeAuditSummary(p));
      return reply(res, 200, { place });
    }
    if (method === 'DELETE') {
      const row = getRow.get(slug);
      if (!row) fail(404, 'Place not found');
      db.prepare('DELETE FROM places WHERE slug=?').run(slug);
      audit('admin', 1, 'place.delete', 'place', slug, placeAuditSummary(row));
      return reply(res, 200, { ok: true });
    }
  }

  if (method === 'POST' && pathOnly === '/api/admin/upload') {
    requireAdmin(req);
    const b = await jsonBody(req);
    const uploaded = uploadImage(b);
    audit('admin', 1, 'media.upload', 'media', path.basename(uploaded.url), { size: uploaded.size });
    return reply(res, 201, uploaded);
  }

  // Admin Reviews Moderation
  if (method === 'GET' && pathOnly === '/api/admin/reviews/pending') {
    requireAdmin(req);
    const rows = db.prepare("SELECT r.*,u.name,p.name_en AS place_name FROM reviews r JOIN users u ON u.id=r.user_id JOIN places p ON p.slug=r.place_slug WHERE r.status='pending' ORDER BY r.created_at ASC").all();
    return reply(res, 200, { reviews: rows.map(r => ({ ...reviewPublic(r, true), placeName: r.place_name })) });
  }

  const reviewModMatch = /^\/api\/admin\/reviews\/([a-f0-9-]{36})$/.exec(pathOnly);
  if (reviewModMatch && method === 'PATCH') {
    requireAdmin(req);
    const b = await jsonBody(req);
    const id = reviewModMatch[1];
    const status = validString(b.status, 20, 'Status', { required: true });
    if (!['approved', 'rejected'].includes(status)) fail(400, 'Status must be approved or rejected');
    const t = new Date().toISOString();
    const result = db.prepare('UPDATE reviews SET status=?,moderated_at=?,updated_at=? WHERE id=?').run(status, t, t, id);
    if (!result.changes) fail(404, 'Review not found');
    audit('admin', 1, 'review.moderate', 'review', id, { status });
    return reply(res, 200, { ok: true, id, status });
  }

  // Admin Audit Log
  if (method === 'GET' && pathOnly === '/api/admin/audit') {
    requireAdmin(req);
    const limit = Math.max(1, Math.min(200, Number(u.searchParams.get('limit') || 50)));
    const entityType = u.searchParams.get('entityType') || '';
    const q = entityType ? 'SELECT * FROM audit_events WHERE entity_type=? ORDER BY id DESC LIMIT ?' : 'SELECT * FROM audit_events ORDER BY id DESC LIMIT ?';
    const params = entityType ? [entityType, limit] : [limit];
    const rows = db.prepare(q).all(...params).map(r => ({
      id: r.id,
      occurredAt: r.occurred_at,
      actorType: r.actor_type,
      actorId: r.actor_id,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      context: JSON.parse(r.context_json || '{}')
    }));
    return reply(res, 200, { events: rows });
  }

  // Admin Users & PDPA Management
  if (method === 'GET' && pathOnly === '/api/admin/users') {
    requireAdmin(req);
    const rows = db.prepare('SELECT id, name, email, email_verified, status, created_at FROM users ORDER BY created_at DESC LIMIT 100').all().map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      emailVerified: !!r.email_verified,
      status: r.status || 'active',
      createdAt: r.created_at
    }));
    return reply(res, 200, { users: rows, count: rows.length });
  }

  const userStatusMatch = /^\/api\/admin\/users\/([a-f0-9-]{36})\/status$/.exec(pathOnly);
  if (userStatusMatch && method === 'PATCH') {
    requireAdmin(req);
    const userId = userStatusMatch[1];
    const b = await jsonBody(req);
    const status = validString(b.status, 20, 'Status', { required: true });
    if (!['active', 'suspended'].includes(status)) fail(400, 'Status must be active or suspended');
    const result = db.prepare('UPDATE users SET status=? WHERE id=?').run(status, userId);
    if (!result.changes) fail(404, 'User not found');
    if (status === 'suspended') {
      db.prepare('DELETE FROM user_sessions WHERE user_id=?').run(userId);
    }
    audit('admin', 1, 'user.status_update', 'user', userId, { status });
    return reply(res, 200, { ok: true, userId, status });
  }

  // Admin Safety Reports Moderation
  if (method === 'GET' && pathOnly === '/api/admin/safety-reports') {
    requireAdmin(req);
    const status = u.searchParams.get('status');
    let q = 'SELECT s.*, u.email as reporter_email, u.name as reporter_name FROM travel_safety_reports s JOIN users u ON u.id = s.user_id';
    const params = [];
    if (status && status !== 'all') {
      q += ' WHERE s.status=?';
      params.push(status);
    }
    q += ' ORDER BY s.created_at DESC LIMIT 100';
    const rows = db.prepare(q).all(...params).map(r => ({
      id: r.id,
      userId: r.user_id,
      reporterName: r.reporter_name,
      reporterEmail: r.reporter_email,
      category: r.category,
      title: r.title,
      description: r.description,
      locationName: r.location_name,
      lat: r.lat,
      lon: r.lon,
      photo: r.photo,
      status: r.status,
      adminNote: r.admin_note,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    return reply(res, 200, { reports: rows, count: rows.length });
  }

  const safetyModMatch = /^\/api\/admin\/safety-reports\/([a-f0-9-]{36})$/.exec(pathOnly);
  if (safetyModMatch && method === 'PATCH') {
    requireAdmin(req);
    const id = safetyModMatch[1];
    const b = await jsonBody(req);
    const status = validString(b.status, 20, 'Status', { required: true });
    if (!['pending', 'verified', 'rejected', 'resolved'].includes(status)) {
      fail(400, 'Status must be pending, verified, rejected, or resolved');
    }
    const adminNote = validString(b.adminNote || '', 1000, 'Admin note');
    const t = new Date().toISOString();
    const result = db.prepare('UPDATE travel_safety_reports SET status=?, admin_note=?, updated_at=? WHERE id=?').run(status, adminNote, t, id);
    if (!result.changes) fail(404, 'Safety report not found');
    audit('admin', 1, 'safety_report.moderate', 'safety_report', id, { status, adminNote });
    return reply(res, 200, { ok: true, id, status, adminNote });
  }

  // Admin Campaigns CMS
  if (method === 'POST' && pathOnly === '/api/admin/campaigns') {
    requireAdmin(req);
    const b = await jsonBody(req);
    const title = validString(b.title, 150, 'Title', { required: true });
    const subtitle = validString(b.subtitle || '', 250, 'Subtitle');
    const bannerUrl = validString(b.bannerUrl || '', 256, 'Banner URL');
    const targetPlaceSlug = b.targetPlaceSlug ? validString(b.targetPlaceSlug, 65, 'Place slug') : null;
    const targetUrl = validString(b.targetUrl || '', 300, 'Target URL');
    const category = validString(b.category || '', 30, 'Category');
    const region = validString(b.region || '', 30, 'Region');
    const badge = validString(b.badge || '', 50, 'Badge');
    const priority = Number(b.priority) || 0;
    const id = crypto.randomUUID();
    const t = new Date().toISOString();
    db.prepare('INSERT INTO campaigns(id, title, subtitle, banner_url, target_place_slug, target_url, category, region, badge, priority, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, title, subtitle, bannerUrl, targetPlaceSlug, targetUrl, category, region, badge, priority, t, t);
    audit('admin', 1, 'campaign.create', 'campaign', id, { title });
    return reply(res, 201, { id, title });
  }

  const campDelMatch = /^\/api\/admin\/campaigns\/([a-f0-9-]{36})$/.exec(pathOnly);
  if (campDelMatch && method === 'DELETE') {
    requireAdmin(req);
    const id = campDelMatch[1];
    db.prepare('DELETE FROM campaigns WHERE id=?').run(id);
    audit('admin', 1, 'campaign.delete', 'campaign', id);
    return reply(res, 200, { ok: true });
  }

  // Admin SME Stats & General Stats
  if (method === 'GET' && pathOnly === '/api/admin/sme-stats') {
    requireAdmin(req);
    const eventCounts = db.prepare('SELECT event_type, COUNT(*) as cnt FROM place_events GROUP BY event_type').all();
    const countsMap = { view: 0, direction: 0, phone: 0, website: 0, favorite: 0, add_trip: 0, sme_impression: 0 };
    for (const r of eventCounts) {
      countsMap[r.event_type] = r.cnt;
    }
    const topSmes = db.prepare(`
      SELECT p.slug, p.name_en, p.name_th, p.spotlight_badge, COUNT(e.id) as total_interactions
      FROM places p
      LEFT JOIN place_events e ON e.place_slug = p.slug
      WHERE p.is_sme = 1
      GROUP BY p.slug
      ORDER BY total_interactions DESC, p.updated_at DESC
      LIMIT 10
    `).all();
    return reply(res, 200, {
      totalImpressions: countsMap.sme_impression,
      totalViews: countsMap.view,
      totalDirections: countsMap.direction,
      totalSaves: countsMap.favorite,
      totalTripAdds: countsMap.add_trip,
      topSmes
    });
  }

  if (method === 'GET' && pathOnly === '/api/admin/stats') {
    requireAdmin(req);
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const totalPlaces = db.prepare('SELECT COUNT(*) as c FROM places').get().c;
    const publishedPlaces = db.prepare("SELECT COUNT(*) as c FROM places WHERE status='published'").get().c;
    const smePlaces = db.prepare("SELECT COUNT(*) as c FROM places WHERE status='published' AND is_sme=1").get().c;
    const verifiedSafety = db.prepare("SELECT COUNT(*) as c FROM travel_safety_reports WHERE status='verified'").get().c;
    const pendingSafety = db.prepare("SELECT COUNT(*) as c FROM travel_safety_reports WHERE status='pending'").get().c;
    return reply(res, 200, {
      stats: {
        totalUsers,
        totalPlaces,
        publishedPlaces,
        smePlaces,
        verifiedSafetyReports: verifiedSafety,
        pendingSafetyReports: pendingSafety
      }
    });
  }

  // Admin Business Submissions & Claims Moderation
  if (method === 'GET' && pathOnly === '/api/admin/business-submissions') {
    requireAdmin(req);
    const rows = db.prepare("SELECT s.*,b.name as business_name,b.type as business_type,u.email as owner_email FROM business_submissions s JOIN businesses b ON b.id=s.business_id JOIN users u ON u.id=b.owner_id WHERE s.status='pending' ORDER BY s.updated_at ASC").all();
    return reply(res, 200, { submissions: rows.map(r => ({ ...submissionPublic(r), businessName: r.business_name, businessType: r.business_type, ownerEmail: r.owner_email })) });
  }

  const subAdminMatch = /^\/api\/admin\/business-submissions\/([a-f0-9-]{36})$/.exec(pathOnly);
  if (subAdminMatch && method === 'PATCH') {
    requireAdmin(req);
    const id = subAdminMatch[1];
    const b = await jsonBody(req);
    const decision = validString(b.status, 20, 'Status', { required: true });
    if (!['approved', 'rejected'].includes(decision)) fail(400, 'Status must be approved or rejected');
    const adminNote = validString(b.adminNote || '', 1000, 'Admin note');
    const row = db.prepare("SELECT * FROM business_submissions WHERE id=? AND status='pending'").get(id);
    if (!row) fail(404, 'Pending submission not found');
    if (decision === 'approved') {
      approveSubmission(row, adminNote);
    } else {
      const t = new Date().toISOString();
      db.prepare("UPDATE business_submissions SET status='rejected',admin_note=?,reviewed_at=?,updated_at=? WHERE id=?").run(adminNote, t, t, id);
    }
    audit('admin', 1, 'business_submission.moderate', 'business_submission', id, { decision, adminNote });
    return reply(res, 200, { ok: true, id, status: decision });
  }

  if (method === 'GET' && pathOnly === '/api/admin/business-claims') {
    requireAdmin(req);
    const rows = db.prepare("SELECT b.*,u.email as owner_email FROM businesses b JOIN users u ON u.id=b.owner_id WHERE b.status='pending' ORDER BY b.created_at ASC").all();
    return reply(res, 200, { businesses: rows.map(r => ({ ...businessPublic(r), ownerEmail: r.owner_email })) });
  }

  const claimModMatch = /^\/api\/admin\/business-claims\/([a-f0-9-]{36})$/.exec(pathOnly);
  if (claimModMatch && method === 'PATCH') {
    requireAdmin(req);
    const id = claimModMatch[1];
    const b = await jsonBody(req);
    const decision = validString(b.status, 20, 'Status', { required: true });
    if (!['approved', 'rejected', 'suspended'].includes(decision)) fail(400, 'Status must be approved, rejected, or suspended');
    const adminNote = validString(b.adminNote || '', 1000, 'Admin note');
    const t = new Date().toISOString();
    const result = db.prepare('UPDATE businesses SET status=?,admin_note=?,updated_at=? WHERE id=?').run(decision, adminNote, t, id);
    if (!result.changes) fail(404, 'Business claim not found');
    audit('admin', 1, 'business.moderate', 'business', id, { decision, adminNote });
    return reply(res, 200, { ok: true, id, status: decision });
  }

  return false;
}

module.exports = { handleAdminRoutes };
