'use strict';
const { db } = require('../db/connection');
const { reply, fail, validString, jsonBody } = require('../utils/http');
const { publishedPlace } = require('../services/place-service');

async function handleCampaignsRoutes(req, res, pathOnly, method, u) {
  if (method === 'GET' && pathOnly === '/api/campaigns') {
    const region = u.searchParams.get('region');
    const category = u.searchParams.get('category');
    let q = "SELECT * FROM campaigns WHERE status='published'";
    const params = [];
    if (region && region !== 'all') {
      q += ' AND (region=? OR region=\'\')';
      params.push(region);
    }
    if (category && category !== 'all') {
      q += ' AND (category=? OR category=\'\')';
      params.push(category);
    }
    q += ' ORDER BY priority DESC, updated_at DESC LIMIT 20';
    const rows = db.prepare(q).all(...params).map(r => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      bannerUrl: r.banner_url,
      targetPlaceSlug: r.target_place_slug,
      targetUrl: r.target_url,
      category: r.category,
      region: r.region,
      badge: r.badge,
      priority: r.priority
    }));
    return reply(res, 200, { campaigns: rows, count: rows.length });
  }

  // Analytics event tracking (Stateless, Privacy-first)
  if (method === 'POST' && pathOnly === '/api/analytics/event') {
    const b = await jsonBody(req);
    const placeSlug = validString(b.placeSlug || b.placeId, 65, 'Place Slug', { required: true });
    publishedPlace(placeSlug);
    const eventType = validString(b.eventType, 30, 'Event Type', { required: true });
    if (!['view', 'direction', 'phone', 'website', 'favorite', 'add_trip', 'sme_impression'].includes(eventType)) {
      fail(400, 'Invalid event type');
    }
    db.prepare('INSERT INTO place_events(place_slug, event_type, created_at) VALUES(?,?,?)')
      .run(placeSlug, eventType, new Date().toISOString());
    return reply(res, 200, { ok: true });
  }

  return false;
}

module.exports = { handleCampaignsRoutes };
