'use strict';
const path = require('node:path');
const { BUSINESS_TYPES } = require('../config');
const { db } = require('../db/connection');
const { fail, validString } = require('../utils/http');
const { requireUser, validateEmail } = require('../utils/crypto');
const { getRow, normalize, rowToPlace, publishedPlace, saveNew, saveExisting } = require('./place-service');

function businessPublic(row) {
  return row ? {
    id: row.id,
    name: row.name,
    type: row.type,
    contactEmail: row.contact_email,
    phone: row.phone,
    website: row.website,
    description: row.description,
    status: row.status,
    note: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } : null;
}

function businessOf(userId) {
  return db.prepare('SELECT * FROM businesses WHERE owner_id=?').get(userId) || null;
}

function requireBusiness(req, approved = false) {
  const user = requireUser(req), business = businessOf(user.id);
  if (!business) fail(403, 'Create a business profile first');
  if (approved && business.status !== 'approved') fail(403, 'Your business is waiting for Admin approval');
  return { user, business };
}

function businessInfo(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'Invalid business profile');
  const name = validString(body.name, 120, 'Business name', { required: true });
  const type = validString(body.type, 24, 'Business type', { required: true });
  if (!BUSINESS_TYPES.has(type)) fail(400, 'Invalid business type');
  const contactEmail = validateEmail(body.contactEmail);
  const phone = validString(body.phone, 40, 'Phone');
  if (phone && !/^[+0-9() .-]{6,40}$/.test(phone)) fail(400, 'Invalid phone');
  const website = validString(body.website, 300, 'Website');
  if (website) {
    let url;
    try { url = new URL(website); } catch { fail(400, 'Website must be a complete https URL'); }
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) fail(400, 'Use an HTTPS website without credentials');
  }
  const description = validString(body.description, 1000, 'Business details');
  return { name, type, contactEmail, phone, website, description };
}

function submissionPublic(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    action: row.action,
    placeId: row.place_slug,
    payload: JSON.parse(row.payload_json),
    evidence: row.evidence,
    baseUpdatedAt: row.base_updated_at,
    status: row.status,
    note: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at
  };
}

function businessMediaAllowed(businessId, placeSlug, placePayload) {
  const urls = [placePayload.photo, ...(placePayload.gallery || [])].filter(Boolean);
  let original = [];
  if (placeSlug) {
    const prev = getRow.get(placeSlug);
    if (prev) original = [prev.cover, ...JSON.parse(prev.gallery_json)];
  }
  for (const url of urls) {
    if (original.includes(url)) continue;
    const item = db.prepare('SELECT business_id FROM business_media WHERE filename=?').get(path.basename(url));
    if (!item || item.business_id !== businessId) fail(403, 'Upload your own place photos before submitting');
  }
}

function normalizeBusinessPlace(businessId, placeSlug, payload, { forSubmission = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail(400, 'Invalid place data');
  const normalized = normalize({ ...payload, featured: false, status: 'draft' });
  businessMediaAllowed(businessId, placeSlug, { photo: normalized.cover, gallery: normalized.gallery });
  if (forSubmission && (normalized.lat === null || normalized.lon === null || !normalized.cover)) {
    fail(400, 'Add a real cover photo and coordinates before submitting');
  }
  return { ...payload, status: 'draft', featured: false, photo: normalized.cover, gallery: normalized.gallery };
}

function checkSubmissionAccess(business, action, placeSlug) {
  if (!['create', 'edit', 'claim'].includes(action)) fail(400, 'Invalid submission type');
  if (action === 'create') {
    if (placeSlug) fail(400, 'New place cannot have a place ID');
    return null;
  }
  if (!/^[a-z0-9-]{1,65}$/.test(placeSlug || '')) fail(400, 'Choose a valid place');
  const place = publishedPlace(placeSlug);
  const link = db.prepare('SELECT business_id FROM place_owners WHERE place_slug=?').get(placeSlug);
  if (action === 'edit' && link?.business_id !== business.id) fail(403, 'Only the verified owner can propose an edit');
  if (action === 'claim' && link) fail(409, 'This place is already managed by a business');
  return place;
}

function validateSubmission(business, row, forSubmission = false) {
  const place = checkSubmissionAccess(business, row.action, row.place_slug);
  if (row.action === 'claim') {
    const statement = validString(row.evidence, 2000, 'Ownership evidence', { required: forSubmission });
    if (forSubmission && statement.length < 40) fail(400, 'Explain your ownership with at least 40 characters of verifiable details');
    return { evidence: statement, place };
  }
  const payload = normalizeBusinessPlace(business.id, row.action === 'edit' ? row.place_slug : null, JSON.parse(row.payload_json), { forSubmission });
  return { payload, place };
}

function approveSubmission(row, adminNote) {
  const business = db.prepare('SELECT * FROM businesses WHERE id=?').get(row.business_id);
  if (!business || business.status !== 'approved') fail(409, 'Business must be approved first');
  const { payload, place } = validateSubmission(business, row, true);
  const t = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE');
  try {
    if (row.action === 'create') {
      const p = normalize({ ...payload, status: 'published', featured: false });
      const newPlace = saveNew(p);
      db.prepare('INSERT INTO place_owners(place_slug,business_id,attached_at) VALUES(?,?,?)').run(newPlace.id, business.id, t);
      db.prepare('UPDATE business_submissions SET place_slug=? WHERE id=?').run(newPlace.id, row.id);
    } else if (row.action === 'edit') {
      const current = getRow.get(row.place_slug);
      if (!current || current.updated_at !== row.base_updated_at) fail(409, 'Place changed after submission; please request an updated proposal');
      const p = normalize({ ...payload, status: 'published', featured: !!current.featured });
      saveExisting(row.place_slug, p);
    } else if (row.action === 'claim') {
      if (!place || db.prepare('SELECT 1 FROM place_owners WHERE place_slug=?').get(row.place_slug)) fail(409, 'Place already claimed or removed');
      db.prepare('INSERT INTO place_owners(place_slug,business_id,attached_at) VALUES(?,?,?)').run(row.place_slug, business.id, t);
    }
    db.prepare("UPDATE business_submissions SET status='approved',admin_note=?,reviewed_at=?,updated_at=? WHERE id=? AND status='pending'").run(adminNote, t, t, row.id);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function ownerPlaces(businessId) {
  return db.prepare('SELECT p.* FROM places p JOIN place_owners o ON o.place_slug=p.slug WHERE o.business_id=? ORDER BY p.updated_at DESC').all(businessId).map(x => rowToPlace(x, true));
}

module.exports = {
  businessPublic,
  businessOf,
  requireBusiness,
  businessInfo,
  submissionPublic,
  businessMediaAllowed,
  normalizeBusinessPlace,
  checkSubmissionAccess,
  validateSubmission,
  approveSubmission,
  ownerPlaces
};
