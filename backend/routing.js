'use strict';
/* Traval backend — road routing (owner: Tommy)
 * Asks an OSRM routing server (built on OpenStreetMap) for real road distance, time and
 * the route line. The browser never calls OSRM directly: it calls POST /api/routes, so the
 * routing server can be swapped for our own later by changing one setting.
 *
 * Settings (environment variables, comma-separated lists are tried in order):
 *   TRAVAL_OSRM_CAR   default: FOSSGIS public server, then the OSRM demo server
 *   TRAVAL_OSRM_FOOT  default: FOSSGIS public foot server
 * The public servers are for development and light use only. For launch, run our own OSRM.
 *
 * PDPA: coordinates are used for the request only. They are never logged or stored in the
 * database; the short in-memory cache forgets them after CACHE_TTL_MS.
 */

const list = (value, fallback) => String(value || fallback).split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
const SERVERS = Object.freeze({
  car: list(process.env.TRAVAL_OSRM_CAR, 'https://routing.openstreetmap.de/routed-car,https://router.project-osrm.org'),
  foot: list(process.env.TRAVAL_OSRM_FOOT, 'https://routing.openstreetmap.de/routed-foot')
});
// Team travelMode values → OSRM profile. 'transit' has no road route (the browser estimates it).
const PROFILE_FOR_MODE = Object.freeze({driving: 'car', taxi: 'car', walking: 'foot'});
const TRAVEL_MODES = Object.freeze(['driving', 'taxi', 'walking', 'transit']);

const MAX_POINTS = 25;
const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX = 300;
const RATE_LIMIT = {windowMs: 60 * 1000, max: 60}; // per client address

class RouteError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

/** Validate [{lat, lon}, …] from the request body. */
function parsePoints(raw) {
  if (!Array.isArray(raw) || raw.length < 2) throw new RouteError(400, 'invalid_points', 'Send at least 2 points');
  if (raw.length > MAX_POINTS) throw new RouteError(400, 'invalid_points', `Send at most ${MAX_POINTS} points`);
  return raw.map((p, i) => {
    const lat = Number(p && p.lat), lon = Number(p && p.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180) {
      throw new RouteError(400, 'invalid_points', `Point ${i + 1} needs a valid lat and lon`);
    }
    return {lat, lon};
  });
}

function parseTravelMode(raw) {
  const mode = String(raw || 'driving');
  if (!TRAVEL_MODES.includes(mode)) throw new RouteError(400, 'invalid_mode', 'travelMode must be driving, taxi, walking or transit');
  return mode;
}

const cache = new Map();
function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) { cache.delete(key); return null; }
  return hit.value;
}
function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, {at: Date.now(), value});
}

const hits = new Map();
function allowClient(address) {
  const now = Date.now(), key = address || 'local';
  const recent = (hits.get(key) || []).filter(t => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) { hits.set(key, recent); return false; }
  recent.push(now); hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}

const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

/** Ask OSRM for the road route through all points, in order. */
async function roadRoute(points, travelMode, {fetchImpl = fetch, timeoutMs = TIMEOUT_MS} = {}) {
  const profile = PROFILE_FOR_MODE[travelMode];
  if (!profile) throw new RouteError(422, 'no_road_route', 'No road route for this travel mode');
  const coords = points.map(p => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  const key = profile + '|' + coords;
  const cached = cacheGet(key);
  if (cached) return {...cached, travelMode, cached: true};

  for (const base of SERVERS[profile]) {
    try {
      const res = await fetchImpl(`${base}/route/v1/driving/${coords}?overview=simplified&geometries=geojson&steps=false`, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {'User-Agent': 'Traval/2.7 (development; road routing)'}
      });
      if (!res.ok) continue;
      const data = await res.json();
      const r = data && data.code === 'Ok' && data.routes && data.routes[0];
      if (!r) continue;
      const value = {
        source: 'road',
        distanceKm: round(r.distance / 1000, 2),
        travelMinutes: round(r.duration / 60, 1),
        legs: r.legs.map(l => ({distanceKm: round(l.distance / 1000, 2), travelMinutes: round(l.duration / 60, 1)})),
        // Team convention: [lat, lon] pairs.
        line: (r.geometry && r.geometry.coordinates || []).map(([lon, lat]) => [round(lat, 6), round(lon, 6)]),
        server: new URL(base).host
      };
      cacheSet(key, value);
      return {...value, travelMode};
    } catch { /* try the next server */ }
  }
  throw new RouteError(503, 'routing_unavailable', 'Road routing is unavailable right now');
}

/**
 * Handle POST /api/routes. Returns {status, body} so server.js can stay a one-line hook.
 * body: {points: [{lat, lon}, …], travelMode}
 */
async function handleRouteRequest(body, clientAddress, options) {
  try {
    if (!allowClient(clientAddress)) throw new RouteError(429, 'rate_limited', 'Too many route requests; wait a minute');
    const points = parsePoints(body && body.points);
    const travelMode = parseTravelMode(body && body.travelMode);
    return {status: 200, body: await roadRoute(points, travelMode, options)};
  } catch (err) {
    if (err instanceof RouteError) return {status: err.status, body: {error: err.message, code: err.code}};
    return {status: 503, body: {error: 'Road routing is unavailable right now', code: 'routing_unavailable'}};
  }
}

module.exports = {SERVERS, TRAVEL_MODES, PROFILE_FOR_MODE, parsePoints, parseTravelMode, roadRoute, handleRouteRequest, RouteError,
  _resetForTests() { cache.clear(); hits.clear(); }};
