'use strict';
const path = require('node:path');
const crypto = require('node:crypto');
const { UPLOADS } = require('../config');
const { db } = require('../db/connection');
const { reply, fail, jsonBody, uploadImageTo } = require('../utils/http');
const { requireUser } = require('../utils/crypto');
const { audit } = require('../utils/audit');
const {
  businessPublic,
  businessOf,
  requireBusiness,
  businessInfo,
  submissionPublic,
  validateSubmission,
  ownerPlaces
} = require('../services/business-service');

async function handleBusinessRoutes(req, res, pathOnly, method, u) {
  if (method === 'POST' && pathOnly === '/api/business/register') {
    const user = requireUser(req);
    const existing = businessOf(user.id);
    if (existing) fail(409, 'You already registered a business profile');
    const info = businessInfo(await jsonBody(req));
    const id = crypto.randomUUID(), t = new Date().toISOString();
    db.prepare('INSERT INTO businesses(id,owner_id,name,type,contact_email,phone,website,description,status,admin_note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, user.id, info.name, info.type, info.contactEmail, info.phone, info.website, info.description, 'pending', '', t, t);
    audit('user', user.id, 'business.register', 'business', id, { name: info.name });
    return reply(res, 201, { business: businessPublic(db.prepare('SELECT * FROM businesses WHERE id=?').get(id)) });
  }

  if (method === 'GET' && pathOnly === '/api/business/me') {
    const user = requireUser(req);
    const b = businessOf(user.id);
    return reply(res, 200, { business: businessPublic(b) });
  }

  if (method === 'PATCH' && pathOnly === '/api/business/profile') {
    const { user, business } = requireBusiness(req);
    const info = businessInfo(await jsonBody(req));
    const t = new Date().toISOString();
    db.prepare('UPDATE businesses SET name=?,type=?,contact_email=?,phone=?,website=?,description=?,updated_at=? WHERE id=?')
      .run(info.name, info.type, info.contactEmail, info.phone, info.website, info.description, t, business.id);
    audit('user', user.id, 'business.update_profile', 'business', business.id);
    return reply(res, 200, { business: businessPublic(db.prepare('SELECT * FROM businesses WHERE id=?').get(business.id)) });
  }

  if (method === 'GET' && pathOnly === '/api/business/places') {
    const { business } = requireBusiness(req);
    return reply(res, 200, { places: ownerPlaces(business.id) });
  }

  if (method === 'POST' && pathOnly === '/api/business/upload') {
    const { user, business } = requireBusiness(req);
    const b = await jsonBody(req);
    const uploaded = uploadImageTo(b, UPLOADS, '/uploads/');
    const filename = path.basename(uploaded.url);
    db.prepare('INSERT INTO business_media(filename,business_id,created_at) VALUES(?,?,?)')
      .run(filename, business.id, new Date().toISOString());
    audit('user', user.id, 'business.upload_photo', 'business', business.id, { filename });
    return reply(res, 201, uploaded);
  }

  if (method === 'GET' && pathOnly === '/api/business/submissions') {
    const { business } = requireBusiness(req);
    const rows = db.prepare('SELECT * FROM business_submissions WHERE business_id=? ORDER BY updated_at DESC').all(business.id);
    return reply(res, 200, { submissions: rows.map(submissionPublic) });
  }

  if (method === 'POST' && pathOnly === '/api/business/submissions') {
    const { user, business } = requireBusiness(req);
    const b = await jsonBody(req);
    if (!b || typeof b !== 'object' || Array.isArray(b)) fail(400, 'Invalid submission payload');
    const action = String(b.action || '').trim();
    const placeSlug = b.placeId ? String(b.placeId).trim() : null;
    const tempRow = { action, place_slug: placeSlug, payload_json: JSON.stringify(b.payload || {}), evidence: b.evidence || '', status: 'draft' };
    const validated = validateSubmission(business, tempRow, false);
    const id = crypto.randomUUID(), t = new Date().toISOString();
    const baseUpdated = validated.place?.updated_at || '';
    db.prepare('INSERT INTO business_submissions(id,business_id,action,place_slug,payload_json,evidence,base_updated_at,status,admin_note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, business.id, action, placeSlug, JSON.stringify(validated.payload || {}), validated.evidence || '', baseUpdated, 'draft', '', t, t);
    audit('user', user.id, 'business.submission_create', 'business_submission', id, { action });
    return reply(res, 201, { submission: submissionPublic(db.prepare('SELECT * FROM business_submissions WHERE id=?').get(id)) });
  }

  const subItemMatch = /^\/api\/business\/submissions\/([a-f0-9-]{36})(?:\/submit)?$/.exec(pathOnly);
  if (subItemMatch) {
    const { user, business } = requireBusiness(req);
    const id = subItemMatch[1];
    const isSubmitAction = pathOnly.endsWith('/submit');
    const row = db.prepare('SELECT * FROM business_submissions WHERE id=? AND business_id=?').get(id, business.id);
    if (!row) fail(404, 'Submission not found');

    if (method === 'GET' && !isSubmitAction) {
      return reply(res, 200, { submission: submissionPublic(row) });
    }
    if (method === 'PUT' && !isSubmitAction) {
      if (row.status !== 'draft') fail(409, 'Only draft submissions can be edited');
      const b = await jsonBody(req);
      const tempRow = { action: row.action, place_slug: row.place_slug, payload_json: JSON.stringify(b.payload || {}), evidence: b.evidence || '', status: 'draft' };
      const validated = validateSubmission(business, tempRow, false);
      const t = new Date().toISOString();
      const baseUpdated = validated.place?.updated_at || row.base_updated_at;
      db.prepare('UPDATE business_submissions SET payload_json=?,evidence=?,base_updated_at=?,updated_at=? WHERE id=?')
        .run(JSON.stringify(validated.payload || {}), validated.evidence || '', baseUpdated, t, id);
      audit('user', user.id, 'business.submission_update', 'business_submission', id);
      return reply(res, 200, { submission: submissionPublic(db.prepare('SELECT * FROM business_submissions WHERE id=?').get(id)) });
    }
    if (method === 'POST' && isSubmitAction) {
      if (row.status !== 'draft') fail(409, 'Only draft submissions can be submitted for review');
      validateSubmission(business, row, true);
      const t = new Date().toISOString();
      db.prepare("UPDATE business_submissions SET status='pending',updated_at=? WHERE id=?").run(t, id);
      audit('user', user.id, 'business.submission_submit', 'business_submission', id);
      return reply(res, 200, { submission: submissionPublic(db.prepare('SELECT * FROM business_submissions WHERE id=?').get(id)) });
    }
    if (method === 'DELETE' && !isSubmitAction) {
      if (!['draft', 'rejected'].includes(row.status)) fail(409, 'Cannot delete an active or approved submission');
      db.prepare('DELETE FROM business_submissions WHERE id=?').run(id);
      audit('user', user.id, 'business.submission_delete', 'business_submission', id);
      return reply(res, 200, { ok: true });
    }
  }

  return false;
}

module.exports = { handleBusinessRoutes };
