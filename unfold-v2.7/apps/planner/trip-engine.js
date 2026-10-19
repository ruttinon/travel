/* Trip planning is an offline planning aid, NOT a live routing / ETA service.
 * Pure, deterministic functions shared by the browser and Node test suite. */
(function(global, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.UnfoldTripEngine = api;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  const rad = n => n * Math.PI / 180;
  function km(a, b) {
    const la = Number(a && a.lat), lo = Number(a && a.lon);
    const lb = Number(b && b.lat), lob = Number(b && b.lon);
    if (![la, lo, lb, lob].every(Number.isFinite)) return Infinity;
    if (Math.abs(la) > 90 || Math.abs(lb) > 90 || Math.abs(lo) > 180 || Math.abs(lob) > 180) return Infinity;
    const dl = rad(lb - la), dn = rad(lob - lo);
    const h = Math.sin(dl / 2) ** 2 + Math.cos(rad(la)) * Math.cos(rad(lb)) * Math.sin(dn / 2) ** 2;
    return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function country(p) {
    const parts = String(p && (p.locEn || p.locTh) || '').split(',').map(s => s.trim()).filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1].toLocaleLowerCase('en') : '';
  }
  function visitHours(p) {
    const s = String(p && p.visit || '').toLowerCase();
    const numbers = (s.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (/day/.test(s) && numbers.length) return Math.min(10, Math.max(3, numbers[0] * 6));
    if (/half/.test(s)) return 4;
    if (numbers.length && /(h|hour|ชม)/.test(s)) return Math.max(.5, Math.min(10, numbers.length > 1 ? (numbers[0] + numbers[1]) / 2 : numbers[0]));
    return 2; // scheduling allowance for missing data, NOT measured visit duration
  }
  function sameCountry(a, b) {
    const x = country(a), y = country(b);
    return !x || !y || x === y;
  }
  function distanceLimit(mode) {
    return mode === 'walking' ? 10 : mode === 'transit' ? 35 : 110;
  }
  function orderedPlaces(places) {
    const remaining = [...places], out = [];
    while (remaining.length) {
      if (!out.length) { out.push(remaining.shift()); continue; }
      const last = out[out.length - 1];
      let best = 0, score = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const p = remaining[i];
        const s = (sameCountry(last, p) ? 0 : 100000) + km(last, p);
        if (s < score) { score = s; best = i; }
      }
      out.push(remaining.splice(best, 1)[0]);
    }
    return out;
  }
  function plan(places, options) {
    const days = Math.max(1, Math.min(7, Number(options.days) || 1));
    const limit = distanceLimit(options.travelMode), target = Number(options.hoursPerDay) || 7;
    const groups = Array.from({length: days}, () => []);
    const unassigned = [], issues = [];
    const arranged = orderedPlaces(places.filter(p => p && typeof p.id === 'string'));
    const byId = new Map(arranged.map(p => [p.id, p]));
    let d = 0, used = 0;
    for (const p of arranged) {
      if (d >= days) { unassigned.push(p.id); continue; }
      const day = groups[d];
      const first = day.length ? byId.get(day[0]) : null;
      const last = day.length ? byId.get(day[day.length - 1]) : null;
      const span = Math.max(first ? km(first, p) : 0, last ? km(last, p) : 0);
      const needNewDay = day.length && (
        used + visitHours(p) > target || day.length >= 15 || !sameCountry(first, p) ||
        span > limit
      );
      if (needNewDay) { d++; used = 0; }
      if (d >= days) { unassigned.push(p.id); continue; }
      groups[d].push(p.id); used += visitHours(p);
      if (visitHours(p) > target) issues.push(`${p.en || p.th || 'A location'} may need more than your daily visit-time allowance.`);
    }
    const allCountries = [...new Set(arranged.map(country).filter(Boolean))];
    if (allCountries.length > 1) issues.push('Your selections span multiple countries. Inter-country transport and border entry are NOT arranged by this planner.');
    if (unassigned.length) issues.push(`${unassigned.length} selected ${unassigned.length === 1 ? 'place needs' : 'places need'} more days, fewer stops, or a different travel mode. Unassigned places have not been included.`);
    return {groups, unassigned, issues};
  }
  function groupWarnings(groups, allPlaces, travelMode) {
    const byId = new Map(allPlaces.map(p => [p.id, p]));
    const issues = [];
    groups.forEach((day, i) => {
      const ps = day.map(id => byId.get(id)).filter(Boolean);
      if (ps.length < 2) return;
      if (ps.some(p => !sameCountry(ps[0], p))) {
        issues.push(`Day ${i + 1} spans different countries. Check flights, borders and travel permits; no usable local route is guaranteed.`);
      } else if (ps.some((p, j) => j > 0 && km(ps[j - 1], p) > distanceLimit(travelMode))) {
        issues.push(`Day ${i + 1} has distant stops. Travel times and available roads must be checked before booking.`);
      }
    });
    const activeDays = groups.map((g, i) => ({index:i,places:g.map(id => byId.get(id)).filter(Boolean)})).filter(x => x.places.length);
    for (let i = 1; i < activeDays.length; i++) {
      const before = activeDays[i-1], next = activeDays[i];
      const a = before.places[before.places.length-1], b = next.places[0];
      if (!sameCountry(a,b)) issues.push(`Transfer between Day ${before.index+1} and Day ${next.index+1} crosses countries. Flights, border entry and transfer times are not included.`);
      else if (km(a,b) > distanceLimit(travelMode) * 1.5) issues.push(`Transfer between Day ${before.index+1} and Day ${next.index+1} is long. Allow extra travel time and check route availability.`);
    }
    return issues;
  }
  return {km, country, visitHours, plan, groupWarnings, sameCountry, distanceLimit};
});
