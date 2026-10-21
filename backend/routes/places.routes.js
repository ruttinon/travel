'use strict';
const { db } = require('../db/connection');
const { reply, fail, jsonBody } = require('../utils/http');
const { requireUser } = require('../utils/crypto');
const { audit } = require('../utils/audit');
const { parsedCoord, kmBetween } = require('../utils/geo');
const { CATEGORIES, CURRENCIES } = require('../config');
const { getRow, getPublic, rowToPlace, publishedPlace } = require('../services/place-service');
const { pickReviews, reviewPublic, normalReview } = require('../services/review-service');
const { collectionList } = require('../services/trip-service');

function getNearby(u) {
  const q = u.searchParams,
    lat = parsedCoord(q.get('lat'), 'latitude', -85, 85),
    lon = parsedCoord(q.get('lon'), 'longitude', -180, 180);
  const radiusKm = parsedCoord(q.get('radiusKm') ?? '25', 'radius', 0.1, 300);
  const category = q.get('category') || 'all';
  if (category !== 'all' && !CATEGORIES.has(category)) fail(400, 'Invalid category');
  const currency = q.get('currency') || 'THB';
  if (!CURRENCIES.has(currency)) fail(400, 'Invalid currency');
  const rawPrice = q.get('maxPrice');
  const maxPrice = rawPrice === null ? null : parsedCoord(rawPrice, 'price', 0, 10_000_000);
  const localOnly = q.get('localOnly') === '1' || q.get('localOnly') === 'true' || q.get('smeOnly') === '1';
  const list = getPublic.all().filter(p => p.lat !== null && p.lon !== null && (category === 'all' || p.category === category) && (!localOnly || p.is_sme === 1))
    .map(p => ({ place: rowToPlace(p), distanceKm: kmBetween(lat, lon, p.lat, p.lon) }))
    .filter(x => x.distanceKm <= radiusKm && (maxPrice === null || (x.place.priceFrom !== null && x.place.currency === currency && x.place.priceFrom <= maxPrice)))
    .sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 100)
    .map(x => ({ ...x.place, distanceKm: Math.round(x.distanceKm * 10) / 10 }));
  return { places: list, count: list.length, radiusKm, currency, unit: 'km', localOnly };
}

async function handlePlacesRoutes(req, res, pathOnly, method, u) {
  if (method === 'GET' && pathOnly === '/api/places') {
    const list = getPublic.all().map(p => rowToPlace(p));
    return reply(res, 200, { places: list });
  }

  if (method === 'GET' && pathOnly === '/api/places/spotlight') {
    const list = getPublic.all()
      .filter(p => p.is_sme === 1 && p.spotlight_badge !== '')
      .map(p => rowToPlace(p));
    return reply(res, 200, { places: list, count: list.length });
  }

  if (method === 'GET' && pathOnly === '/api/places/sme') {
    const category = u.searchParams.get('category');
    const region = u.searchParams.get('region');
    const list = getPublic.all()
      .filter(p => p.is_sme === 1)
      .filter(p => !category || p.category === category)
      .filter(p => !region || p.region === region)
      .map(p => rowToPlace(p));
    return reply(res, 200, { places: list, count: list.length });
  }

  if (method === 'GET' && pathOnly === '/api/places/nearby') {
    return reply(res, 200, getNearby(u));
  }

  // Reviews: GET /api/places/:slug/reviews
  const revMatch = /^\/api\/places\/([a-z0-9-]{1,65})\/reviews$/.exec(pathOnly);
  if (revMatch) {
    const slug = revMatch[1];
    publishedPlace(slug);
    if (method === 'GET') {
      const rows = pickReviews.all(slug).map(r => reviewPublic(r));
      return reply(res, 200, { reviews: rows });
    }
    if (method === 'POST') {
      const user = requireUser(req);
      const b = await jsonBody(req);
      const payload = normalReview(b, user.id);
      const id = crypto.randomUUID(), t = new Date().toISOString();
      const prev = db.prepare('SELECT id FROM reviews WHERE user_id=? AND place_slug=?').get(user.id, slug);
      if (prev) fail(409, 'You have already reviewed this place. Edit is not supported.');
      db.prepare("INSERT INTO reviews(id,user_id,place_slug,stars,text,photo,status,created_at,updated_at) VALUES(?,?,?,?,?,?, 'pending', ?,?)")
        .run(id, user.id, slug, payload.stars, payload.text, payload.photo, t, t);
      audit('user', user.id, 'review.submit', 'place', slug, { reviewId: id, stars: payload.stars });
      return reply(res, 201, {
        review: { id, placeId: slug, name: user.name, ...payload, status: 'pending', createdAt: t, updatedAt: t }
      });
    }
  }

  // Collections
  if (method === 'GET' && pathOnly === '/api/me/collections') {
    const user = requireUser(req);
    return reply(res, 200, {
      saved: collectionList(user.id, 'saved'),
      trip: collectionList(user.id, 'trip')
    });
  }

  if (method === 'PUT' && pathOnly === '/api/me/collections') {
    const user = requireUser(req);
    const b = await jsonBody(req);
    if (!b || typeof b !== 'object' || Array.isArray(b)) fail(400, 'Invalid collections');
    const parse = (arr, kind) => {
      if (!Array.isArray(arr) || arr.length > 50) fail(400, `Too many items in ${kind}`);
      const clean = [];
      for (const id of arr) {
        if (typeof id !== 'string' || !/^[a-z0-9-]{1,65}$/.test(id)) fail(400, 'Invalid place ID');
        if (clean.includes(id)) continue;
        if (getRow.get(id)?.status === 'published') clean.push(id);
      }
      return clean;
    };
    const saved = parse(b.saved, 'saved'), trip = parse(b.trip, 'trip');
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('DELETE FROM user_collections WHERE user_id=?').run(user.id);
      const ins = db.prepare('INSERT INTO user_collections(user_id,place_slug,kind,position) VALUES(?,?,?,?)');
      saved.forEach((id, i) => ins.run(user.id, id, 'saved', i));
      trip.forEach((id, i) => ins.run(user.id, id, 'trip', i));
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    audit('user', user.id, 'collections.sync', 'user', user.id, { saved: saved.length, trip: trip.length });
    return reply(res, 200, { saved, trip });
  }

  return false;
}

module.exports = { handlePlacesRoutes };
