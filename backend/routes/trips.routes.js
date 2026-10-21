'use strict';
const crypto = require('node:crypto');
const { db } = require('../db/connection');
const { reply, fail, jsonBody } = require('../utils/http');
const { requireUser } = require('../utils/crypto');
const { audit } = require('../utils/audit');
const { kmBetween } = require('../utils/geo');
const { getRow, getPublic, rowToPlace, publishedPlace } = require('../services/place-service');
const { normalizeItinerary, itineraryPublic } = require('../services/trip-service');

async function handleTripsRoutes(req, res, pathOnly, method, u) {
  // Itineraries
  if (pathOnly === '/api/me/itineraries') {
    const user = requireUser(req);
    if (method === 'GET') {
      const rows = db.prepare('SELECT * FROM user_itineraries WHERE user_id=? ORDER BY updated_at DESC').all(user.id);
      return reply(res, 200, { itineraries: rows.map(itineraryPublic) });
    }
    if (method === 'POST') {
      const b = await jsonBody(req);
      const plan = normalizeItinerary(b);
      const id = crypto.randomUUID(), t = new Date().toISOString();
      const count = db.prepare('SELECT COUNT(*) AS c FROM user_itineraries WHERE user_id=?').get(user.id).c;
      if (count >= 20) fail(400, 'Maximum 20 saved trips per account');
      db.prepare('INSERT INTO user_itineraries(id,user_id,title,days,hours_per_day,currency,budget,travel_mode,days_json,created_at,updated_at,budget_breakdown_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
        .run(id, user.id, plan.title, plan.days, plan.hoursPerDay, plan.currency, plan.budget, plan.travelMode, JSON.stringify(plan.groups), t, t, JSON.stringify(plan.budgetBreakdown || {}));
      audit('user', user.id, 'itinerary.create', 'itinerary', id, { title: plan.title, days: plan.days });
      return reply(res, 201, { itinerary: itineraryPublic(db.prepare('SELECT * FROM user_itineraries WHERE id=?').get(id)) });
    }
  }

  const itinMatch = /^\/api\/me\/itineraries\/([a-f0-9-]{36})(?:\/add-stop)?$/.exec(pathOnly);
  if (itinMatch) {
    const user = requireUser(req);
    const id = itinMatch[1];
    const isAddStop = pathOnly.endsWith('/add-stop');
    const row = db.prepare('SELECT * FROM user_itineraries WHERE id=? AND user_id=?').get(id, user.id);
    if (!row) fail(404, 'Saved trip not found');

    if (isAddStop && method === 'POST') {
      const b = await jsonBody(req);
      const dayIndex = Number(b.dayIndex);
      const placeSlug = String(b.placeSlug || '').trim();
      publishedPlace(placeSlug);
      const currentGroups = JSON.parse(row.days_json);
      if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex >= currentGroups.length) {
        fail(400, 'Invalid dayIndex for this itinerary');
      }
      if (currentGroups[dayIndex].includes(placeSlug)) {
        return reply(res, 200, { ok: true, message: 'Place already in this day', itinerary: itineraryPublic(row) });
      }
      currentGroups[dayIndex].push(placeSlug);
      const t = new Date().toISOString();
      db.prepare('UPDATE user_itineraries SET days_json=?, updated_at=? WHERE id=?').run(JSON.stringify(currentGroups), t, id);
      const updated = db.prepare('SELECT * FROM user_itineraries WHERE id=?').get(id);
      audit('user', user.id, 'itinerary.add_stop', 'itinerary', id, { dayIndex, placeSlug });
      return reply(res, 200, { ok: true, itinerary: itineraryPublic(updated) });
    }

    if (method === 'GET') {
      return reply(res, 200, { itinerary: itineraryPublic(row) });
    }
    if (method === 'PUT') {
      const b = await jsonBody(req);
      const plan = normalizeItinerary(b);
      const t = new Date().toISOString();
      db.prepare('UPDATE user_itineraries SET title=?,days=?,hours_per_day=?,currency=?,budget=?,travel_mode=?,days_json=?,updated_at=?,budget_breakdown_json=? WHERE id=?')
        .run(plan.title, plan.days, plan.hoursPerDay, plan.currency, plan.budget, plan.travelMode, JSON.stringify(plan.groups), t, JSON.stringify(plan.budgetBreakdown || {}), id);
      audit('user', user.id, 'itinerary.update', 'itinerary', id, { title: plan.title, days: plan.days });
      return reply(res, 200, { itinerary: itineraryPublic(db.prepare('SELECT * FROM user_itineraries WHERE id=?').get(id)) });
    }
    if (method === 'DELETE') {
      db.prepare('DELETE FROM user_itineraries WHERE id=?').run(id);
      audit('user', user.id, 'itinerary.delete', 'itinerary', id);
      return reply(res, 200, { ok: true });
    }
  }

  // Cost Estimation: GET /api/trips/estimate-cost
  if (method === 'GET' && pathOnly === '/api/trips/estimate-cost') {
    const q = u.searchParams;
    const distanceKm = Math.max(1, Number(q.get('distanceKm') || 10));
    const days = Math.max(1, Number(q.get('days') || 1));
    const placesCount = Math.max(1, Number(q.get('placesCount') || 3));
    const currency = q.get('currency') || 'THB';
    const style = q.get('style') || 'standard';

    const taxiBase = 35;
    const taxiRatePerKm = distanceKm <= 10 ? 6.5 : distanceKm <= 20 ? 7.0 : 8.0;
    const estimatedTaxiMin = Math.round(taxiBase + (distanceKm * taxiRatePerKm));
    const estimatedTaxiMax = Math.round(estimatedTaxiMin * 1.35);

    const fuelRatePerKm = 3.2;
    const fuelMin = Math.round(distanceKm * fuelRatePerKm);
    const fuelMax = Math.round(fuelMin * 1.25);

    const stayPerNight = style === 'budget' ? 650 : style === 'luxury' ? 3200 : 1350;
    const foodPerDay = style === 'budget' ? 350 : style === 'luxury' ? 1500 : 700;
    const totalStay = (days - 1) * stayPerNight;
    const totalFood = days * foodPerDay;
    const totalTransport = estimatedTaxiMin;
    const activitiesEst = placesCount * 120;
    const totalEst = totalStay + totalFood + totalTransport + activitiesEst;

    return reply(res, 200, {
      currency,
      distanceKm,
      days,
      placesCount,
      taxiFare: { min: estimatedTaxiMin, max: estimatedTaxiMax, unit: currency, note: 'คำนวณตามอัตรามิเตอร์มาตรฐานกรมการขนส่งทางบก' },
      fuelCost: { min: fuelMin, max: fuelMax, unit: currency, note: 'อิงอัตราสิ้นเปลืองน้ำมันเฉลี่ย 12-14 กม./ลิตร' },
      estimate: {
        totalEstimatedCost: totalEst,
        breakdown: {
          accommodations: totalStay,
          foodAndDining: totalFood,
          transportation: totalTransport,
          activitiesAndEntry: activitiesEst,
          emergencyCushion: Math.round(totalEst * 0.1)
        }
      }
    });
  }

  // Stopover Recommendations: POST /api/trips/recommend-sme
  if (method === 'POST' && pathOnly === '/api/trips/recommend-sme') {
    const b = await jsonBody(req);
    const inputPlaces = Array.isArray(b.places) ? b.places : Array.isArray(b.stops) ? b.stops.map(s => s.id || s.slug || s) : [];
    const maxDetourKm = Math.min(25, Math.max(1, Number(b.maxDetourKm) || 8));
    const categoryFilter = b.category && b.category !== 'all' ? b.category : null;

    const waypoints = inputPlaces.map(slug => getRow.get(slug)).filter(p => p && p.status === 'published' && p.lat !== null && p.lon !== null);
    if (!waypoints.length) {
      return reply(res, 200, { recommendations: [], stopovers: [], count: 0, note: 'No valid published waypoints provided' });
    }

    const allSmes = getPublic.all().filter(p => p.is_sme === 1 && p.lat !== null && p.lon !== null);
    const candidateMap = new Map();

    for (const sme of allSmes) {
      if (inputPlaces.includes(sme.slug)) continue;
      if (categoryFilter && sme.category !== categoryFilter) continue;

      let minDetour = Infinity;
      let closestWaypoint = null;

      for (const wp of waypoints) {
        const d = kmBetween(wp.lat, wp.lon, sme.lat, sme.lon);
        if (d < minDetour) {
          minDetour = d;
          closestWaypoint = wp.name_en;
        }
      }

      if (minDetour <= maxDetourKm) {
        candidateMap.set(sme.slug, {
          place: rowToPlace(sme),
          detourKm: Math.round(minDetour * 10) / 10,
          nearWaypoint: closestWaypoint,
          spotlightBadge: sme.spotlight_badge || (sme.is_sme ? 'Local SME' : '')
        });
      }
    }

    const recommendations = Array.from(candidateMap.values())
      .sort((a, b) => a.detourKm - b.detourKm)
      .slice(0, 10);

    return reply(res, 200, {
      count: recommendations.length,
      recommendations,
      stopovers: recommendations
    });
  }

  return false;
}

module.exports = { handleTripsRoutes };
