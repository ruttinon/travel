'use strict';
const path = require('node:path');
const crypto = require('node:crypto');
const { SAFETY_UPLOADS } = require('../config');
const { db } = require('../db/connection');
const { reply, fail, validString, jsonBody, uploadImageTo } = require('../utils/http');
const { requireUser } = require('../utils/crypto');
const { audit } = require('../utils/audit');
const { parsedCoord } = require('../utils/geo');

async function handleSafetyRoutes(req, res, pathOnly, method, u) {
  if (method === 'POST' && pathOnly === '/api/safety/upload') {
    const user = requireUser(req);
    const b = await jsonBody(req);
    const uploaded = uploadImageTo(b, SAFETY_UPLOADS, '/safety-media/');
    const filename = path.basename(uploaded.url);
    db.prepare('INSERT INTO safety_media(filename, owner_id, created_at) VALUES(?,?,?)')
      .run(filename, user.id, new Date().toISOString());
    return reply(res, 201, { photoUrl: uploaded.url, size: uploaded.size });
  }

  if (method === 'POST' && pathOnly === '/api/safety/reports') {
    const user = requireUser(req);
    const b = await jsonBody(req);
    const category = validString(b.category, 30, 'Category', { required: true });
    if (!['overcharging', 'transport', 'scam', 'danger', 'other'].includes(category)) {
      fail(400, 'Invalid safety category');
    }
    const title = validString(b.title, 150, 'Title', { required: true });
    const description = validString(b.description, 2000, 'Description', { required: true });
    const locationName = validString(b.locationName, 200, 'Location name', { required: true });
    const lat = parsedCoord(b.lat ?? 13.7563, 'latitude', -85, 85);
    const lon = parsedCoord(b.lon ?? 100.5018, 'longitude', -180, 180);

    let photo = '';
    if (b.photo) {
      photo = validString(b.photo, 256, 'Photo URL');
      if (!/^\/safety-media\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(photo)) {
        fail(400, 'Photo must be uploaded via /api/safety/upload');
      }
    }

    const id = crypto.randomUUID();
    const t = new Date().toISOString();
    db.prepare('INSERT INTO travel_safety_reports(id, user_id, category, title, description, location_name, lat, lon, photo, status, admin_note, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, user.id, category, title, description, locationName, lat, lon, photo, 'pending', '', t, t);

    audit('user', user.id, 'safety_report.create', 'safety_report', id, { category, title });
    return reply(res, 201, {
      report: { id, category, title, description, locationName, lat, lon, photo, status: 'pending', createdAt: t }
    });
  }

  if (method === 'GET' && pathOnly === '/api/safety/reports') {
    const category = u.searchParams.get('category');
    let query = "SELECT id, category, title, description, location_name, lat, lon, photo, created_at FROM travel_safety_reports WHERE status='verified'";
    const params = [];
    if (category) {
      query += ' AND category=?';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC LIMIT 100';
    const rows = db.prepare(query).all(...params).map(r => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      locationName: r.location_name,
      lat: r.lat,
      lon: r.lon,
      photo: r.photo,
      createdAt: r.created_at
    }));
    return reply(res, 200, { count: rows.length, reports: rows });
  }

  return false;
}

module.exports = { handleSafetyRoutes };
