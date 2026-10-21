'use strict';
const crypto = require('node:crypto');
const { CATEGORIES, REGIONS, CURRENCIES } = require('../config');
const { db } = require('../db/connection');
const { fail, validString, imagePath } = require('../utils/http');

const getRow = db.prepare('SELECT * FROM places WHERE slug=?');
const getPublic = db.prepare("SELECT * FROM places WHERE status='published' ORDER BY featured DESC,updated_at DESC");
const getAdmin = db.prepare('SELECT * FROM places ORDER BY updated_at DESC');

function normalize(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) fail(400, 'Invalid place');
  const r = {
    name_en: validString(p.en, 120, 'English name', { required: true }),
    name_th: validString(p.th, 120, 'Thai name'),
    location_en: validString(p.locEn, 160, 'English location', { required: true }),
    location_th: validString(p.locTh, 160, 'Thai location'),
    category: validString(p.category, 20, 'category'),
    region: validString(p.region, 20, 'region'),
    lat: p.lat === '' || p.lat == null ? null : Number(p.lat),
    lon: p.lon === '' || p.lon == null ? null : Number(p.lon),
    visit: validString(p.visit, 40, 'visit'),
    description_en: validString(p.storyEn, 2000, 'English description'),
    description_th: validString(p.storyTh, 2000, 'Thai description'),
    cover: imagePath(p.photo),
    gallery: [],
    featured: p.featured === true ? 1 : 0,
    status: p.status === 'published' ? 'published' : 'draft',
    price_from: p.priceFrom === '' || p.priceFrom == null ? null : Number(p.priceFrom),
    price_currency: validString(p.currency || 'THB', 3, 'Currency'),
    is_sme: p.isSme === true || p.is_sme === 1 || p.is_sme === '1' ? 1 : 0,
    sme_type: validString(p.smeType || p.sme_type, 40, 'SME type'),
    spotlight_badge: validString(p.spotlightBadge || p.spotlight_badge, 50, 'Spotlight badge'),
    local_story_th: validString(p.localStoryTh || p.local_story_th, 3000, 'Local story TH'),
    local_story_en: validString(p.localStoryEn || p.local_story_en, 3000, 'Local story EN'),
    contact_phone: validString(p.contactPhone || p.contact_phone, 40, 'Contact phone'),
    contact_website: validString(p.contactWebsite || p.contact_website, 300, 'Contact website'),
    contact_line: validString(p.contactLine || p.contact_line, 100, 'Contact LINE'),
    opening_hours_json: typeof p.openingHours === 'object' ? JSON.stringify(p.openingHours) : validString(p.opening_hours_json || '{}', 2000, 'Opening hours'),
    google_place_id: validString(p.googlePlaceId || p.google_place_id, 120, 'Google Place ID'),
    is_sponsored: p.isSponsored === true || p.is_sponsored === 1 || p.is_sponsored === '1' ? 1 : 0
  };
  if (!CATEGORIES.has(r.category)) fail(400, 'Invalid category');
  if (!CURRENCIES.has(r.price_currency)) fail(400, 'Unsupported currency');
  if (r.price_from !== null && (!Number.isFinite(r.price_from) || r.price_from < 0 || r.price_from > 10_000_000)) fail(400, 'Invalid starting price');
  if (!REGIONS.has(r.region)) fail(400, 'Invalid region');
  if (r.lat !== null && (!Number.isFinite(r.lat) || r.lat < -85 || r.lat > 85)) fail(400, 'Invalid latitude');
  if (r.lon !== null && (!Number.isFinite(r.lon) || r.lon < -180 || r.lon > 180)) fail(400, 'Invalid longitude');
  const rawGallery = p.gallery == null ? [] : p.gallery;
  if (!Array.isArray(rawGallery) || rawGallery.length > 8) fail(400, 'Gallery accepts up to 8 photos');
  r.gallery = [...new Set(rawGallery.map(imagePath).filter(Boolean))];
  if (r.status === 'published' && (r.lat === null || r.lon === null || !r.cover)) fail(400, 'Publishing requires coordinates and a photo');
  return r;
}

function rowToPlace(row, includeAdmin = false) {
  const result = {
    id: row.slug,
    en: row.name_en,
    th: row.name_th || row.name_en,
    locEn: row.location_en,
    locTh: row.location_th || row.location_en,
    category: row.category,
    region: row.region,
    lat: row.lat,
    lon: row.lon,
    visit: row.visit,
    storyEn: row.description_en,
    storyTh: row.description_th || row.description_en,
    photo: row.cover,
    gallery: JSON.parse(row.gallery_json || '[]'),
    featured: !!row.featured,
    priceFrom: row.price_from ?? null,
    currency: row.price_currency || 'THB',
    isSme: !!row.is_sme,
    smeType: row.sme_type || '',
    spotlightBadge: row.spotlight_badge || '',
    localStoryTh: row.local_story_th || '',
    localStoryEn: row.local_story_en || '',
    contactPhone: row.contact_phone || '',
    contactWebsite: row.contact_website || '',
    contactLine: row.contact_line || '',
    openingHours: (() => { try { return JSON.parse(row.opening_hours_json || '{}'); } catch { return {}; } })(),
    googlePlaceId: row.google_place_id || '',
    isSponsored: !!row.is_sponsored
  };
  if (includeAdmin) Object.assign(result, { status: row.status, createdAt: row.created_at, updatedAt: row.updated_at });
  return result;
}

function publishedPlace(id) {
  const row = getRow.get(id);
  if (!row || row.status !== 'published') fail(404, 'Published place not found');
  return row;
}

function slugFor(name) {
  const base = name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 46) || 'place';
  let s = base;
  while (getRow.get(s)) s = base + '-' + crypto.randomBytes(3).toString('hex');
  return s;
}

function saveNew(p) {
  const t = new Date().toISOString(), slug = slugFor(p.name_en);
  db.prepare('INSERT INTO places(slug,name_en,name_th,location_en,location_th,category,region,lat,lon,visit,description_en,description_th,cover,gallery_json,featured,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(slug, p.name_en, p.name_th, p.location_en, p.location_th, p.category, p.region, p.lat, p.lon, p.visit, p.description_en, p.description_th, p.cover, JSON.stringify(p.gallery), p.featured, p.status, t, t);
  db.prepare('UPDATE places SET price_from=?,price_currency=?,is_sme=?,sme_type=?,spotlight_badge=?,local_story_th=?,local_story_en=?,contact_phone=?,contact_website=?,contact_line=?,opening_hours_json=?,google_place_id=?,is_sponsored=? WHERE slug=?')
    .run(p.price_from, p.price_currency, p.is_sme, p.sme_type, p.spotlight_badge, p.local_story_th, p.local_story_en, p.contact_phone, p.contact_website, p.contact_line, p.opening_hours_json, p.google_place_id, p.is_sponsored, slug);
  return rowToPlace(getRow.get(slug), true);
}

function saveExisting(slug, p) {
  const result = db.prepare('UPDATE places SET name_en=?,name_th=?,location_en=?,location_th=?,category=?,region=?,lat=?,lon=?,visit=?,description_en=?,description_th=?,cover=?,gallery_json=?,featured=?,status=?,updated_at=? WHERE slug=?')
    .run(p.name_en, p.name_th, p.location_en, p.location_th, p.category, p.region, p.lat, p.lon, p.visit, p.description_en, p.description_th, p.cover, JSON.stringify(p.gallery), p.featured, p.status, new Date().toISOString(), slug);
  if (!result.changes) fail(404, 'Place not found');
  db.prepare('UPDATE places SET price_from=?,price_currency=?,is_sme=?,sme_type=?,spotlight_badge=?,local_story_th=?,local_story_en=?,contact_phone=?,contact_website=?,contact_line=?,opening_hours_json=?,google_place_id=?,is_sponsored=? WHERE slug=?')
    .run(p.price_from, p.price_currency, p.is_sme, p.sme_type, p.spotlight_badge, p.local_story_th, p.local_story_en, p.contact_phone, p.contact_website, p.contact_line, p.opening_hours_json, p.google_place_id, p.is_sponsored, slug);
  return rowToPlace(getRow.get(slug), true);
}

module.exports = {
  getRow,
  getPublic,
  getAdmin,
  normalize,
  rowToPlace,
  publishedPlace,
  slugFor,
  saveNew,
  saveExisting
};
