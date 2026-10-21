'use strict';
const { CURRENCIES } = require('../config');
const { db } = require('../db/connection');
const { fail, validString } = require('../utils/http');
const { getRow, publishedPlace } = require('./place-service');

function normalizeItinerary(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) fail(400, 'Invalid trip');
  const title = validString(b.title, 100, 'Trip name', { required: true }),
    days = Number(b.days),
    hoursPerDay = Number(b.hoursPerDay);
  if (!Number.isInteger(days) || days < 1 || days > 7) fail(400, 'Days must be 1 to 7');
  if (!Number.isInteger(hoursPerDay) || hoursPerDay < 2 || hoursPerDay > 12) fail(400, 'Hours per day must be 2 to 12');
  const currency = validString(b.currency || 'THB', 3, 'Currency'),
    travelMode = validString(b.travelMode || 'driving', 12, 'Travel mode');
  if (!CURRENCIES.has(currency)) fail(400, 'Invalid currency');
  if (!['driving', 'walking', 'transit'].includes(travelMode)) fail(400, 'Invalid travel mode');
  const budget = b.budget === '' || b.budget == null ? null : Number(b.budget);
  if (budget !== null && (!Number.isFinite(budget) || budget < 0 || budget > 100_000_000)) fail(400, 'Invalid budget');
  if (!Array.isArray(b.groups) || b.groups.length !== days) fail(400, 'One group required per day');
  const groups = b.groups.map(g => {
    if (!Array.isArray(g) || g.length > 15) fail(400, 'Invalid day group');
    return g.map(id => {
      if (typeof id !== 'string' || !/[a-z0-9-]{1,65}/.test(id) || id.length > 65 || !/^[a-z0-9-]+$/.test(id)) fail(400, 'Invalid place');
      publishedPlace(id);
      return id;
    });
  });
  const flat = groups.flat();
  if (flat.length > 30 || new Set(flat).size !== flat.length) fail(400, 'Maximum 30 unique published places per trip');
  const budgetBreakdown = {};
  if (b.budgetBreakdown && typeof b.budgetBreakdown === 'object' && !Array.isArray(b.budgetBreakdown)) {
    for (const [k, v] of Object.entries(b.budgetBreakdown)) {
      if (['transport', 'fuel', 'food', 'stay', 'activities', 'other'].includes(k) && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100_000_000) {
        budgetBreakdown[k] = Number(v);
      }
    }
  }
  return { title, days, hoursPerDay, currency, travelMode, budget, groups, budgetBreakdown };
}

function itineraryPublic(row) {
  const groups = JSON.parse(row.days_json).map(g => g.filter(id => {
    const p = getRow.get(id);
    return !!p && p.status === 'published';
  }));
  const budgetBreakdown = (() => { try { return JSON.parse(row.budget_breakdown_json || '{}'); } catch { return {}; } })();
  return {
    id: row.id,
    title: row.title,
    days: row.days,
    hoursPerDay: row.hours_per_day,
    budget: row.budget,
    currency: row.currency,
    travelMode: row.travel_mode,
    budgetBreakdown,
    groups,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function collectionList(userId, kind) {
  return db.prepare("SELECT c.place_slug FROM user_collections c JOIN places p ON p.slug=c.place_slug WHERE c.user_id=? AND c.kind=? AND p.status='published' ORDER BY c.position ASC")
    .all(userId, kind)
    .map(r => r.place_slug);
}

module.exports = {
  normalizeItinerary,
  itineraryPublic,
  collectionList
};
