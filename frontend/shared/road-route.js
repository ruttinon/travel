/* Traval shared tool — road route client (owner: Tommy)
 * Gets real road distance, time and the route line from our server (POST /api/routes).
 * If the server or the routing service is unavailable, it falls back to a straight-line
 * estimate using UnfoldTripEngine.km (no second distance formula), marked source:'estimate'.
 * Loads in the browser as window.TravalRoute and in Node via require().
 */
(function(global, factory) {
  const engine = (global && global.UnfoldTripEngine) ||
    (typeof require === 'function' ? require('../planner/trip-engine.js') : null);
  const api = factory(engine);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.TravalRoute = api;
})(typeof window !== 'undefined' ? window : null, function(engine) {
  'use strict';

  // Straight-line fallback: roads are longer than a straight line, cities are slow.
  const ESTIMATE = Object.freeze({
    driving: {kmh: 20, detour: 1.35},
    taxi:    {kmh: 20, detour: 1.35},
    walking: {kmh: 4.5, detour: 1.25},
    transit: {kmh: 18, detour: 1.3}
  });
  const ENDPOINT = '/api/routes';
  const memo = new Map();

  const valid = p => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon));
  const keyOf = (places, mode) => mode + '|' + places.map(p => `${Number(p.lat).toFixed(5)},${Number(p.lon).toFixed(5)}`).join(';');

  /** Straight-line estimate between consecutive places. */
  function estimate(places, travelMode = 'driving') {
    const pts = places.filter(valid);
    const speed = ESTIMATE[travelMode] || ESTIMATE.driving;
    const legs = pts.slice(1).map((p, i) => {
      const km = engine ? engine.km(pts[i], p) : NaN;
      const distanceKm = Math.round(km * speed.detour * 100) / 100;
      return {distanceKm, travelMinutes: Math.round(distanceKm / speed.kmh * 600) / 10};
    });
    return {
      source: 'estimate', travelMode,
      distanceKm: Math.round(legs.reduce((s, l) => s + l.distanceKm, 0) * 100) / 100,
      travelMinutes: Math.round(legs.reduce((s, l) => s + l.travelMinutes, 0) * 10) / 10,
      legs,
      line: pts.map(p => [Number(p.lat), Number(p.lon)])
    };
  }

  /**
   * Road route through places in order.
   * options.request(url, init) lets callers inject fetch (tests, or a page's own request helper).
   * Always resolves: a road result, or an estimate with `reason` explaining why.
   */
  async function route(places, travelMode = 'driving', options = {}) {
    const pts = (places || []).filter(valid);
    if (pts.length < 2) return null;
    const key = keyOf(pts, travelMode);
    if (memo.has(key)) return memo.get(key);
    if (travelMode === 'transit') return {...estimate(pts, travelMode), reason: 'no_road_route'};
    const request = options.request || (typeof fetch === 'function' ? fetch : null);
    let result;
    try {
      const res = await request(ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({travelMode, points: pts.map(p => ({lat: Number(p.lat), lon: Number(p.lon)}))})
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.source !== 'road') throw new Error(data.code || ('HTTP ' + res.status));
      result = data;
    } catch (err) {
      result = {...estimate(pts, travelMode), reason: String(err && err.message || 'routing_unavailable')};
    }
    if (memo.size > 100) memo.clear();
    if (result.source === 'road') memo.set(key, result); // never cache a fallback: retry next time
    return result;
  }

  return {ENDPOINT, ESTIMATE, estimate, route};
});
