/* Traval shared tool — trip cost estimates (owner: Tommy)
 * One place for taxi-meter and fuel maths so the traveler app, the planner and
 * the server never keep their own copies. Estimates only: no tolls, no surcharges.
 * Loads in the browser as window.TravalCost and in Node via require().
 */
(function(global, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.TravalCost = api;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';

  // Greater Bangkok taxi meter, in effect since 2023 (Department of Land Transport).
  // The first km is covered by the flag fall; each band is charged per km travelled inside it.
  const TAXI_METER = Object.freeze({
    currency: 'THB',
    flagFall: 35,
    flagFallKm: 1,
    bands: Object.freeze([
      {fromKm: 1,  toKm: 10,       perKm: 6.5},
      {fromKm: 10, toKm: 20,       perKm: 7},
      {fromKm: 20, toKm: 40,       perKm: 8},
      {fromKm: 40, toKm: 60,       perKm: 8.5},
      {fromKm: 60, toKm: 80,       perKm: 9},
      {fromKm: 80, toKm: Infinity, perKm: 10.5}
    ]),
    trafficPerMinute: 3
  });

  // Example defaults; the app may pass its own values.
  const FUEL_DEFAULTS = Object.freeze({kmPerLitre: 12, pricePerLitre: 35});
  // Rush-hour multiplier applied to free-flow travel time for the upper estimate.
  const DEFAULT_TRAFFIC_FACTOR = 1.5;

  const finite = n => Number.isFinite(Number(n)) && Number(n) >= 0;

  /** Meter fare in THB for one taxi ride (not rounded). */
  function taxiFare(distanceKm, trafficMinutes = 0) {
    if (!finite(distanceKm)) return null;
    const km = Number(distanceKm);
    let fare = TAXI_METER.flagFall;
    for (const band of TAXI_METER.bands) {
      if (km > band.fromKm) fare += (Math.min(km, band.toKm) - band.fromKm) * band.perKm;
    }
    return fare + (finite(trafficMinutes) ? Number(trafficMinutes) : 0) * TAXI_METER.trafficPerMinute;
  }

  /** Low–high THB range for one taxi ride: empty roads → rush-hour traffic. */
  function taxiFareRange(distanceKm, travelMinutes, trafficFactor = DEFAULT_TRAFFIC_FACTOR) {
    const low = taxiFare(distanceKm, 0);
    if (low === null) return null;
    const extra = finite(travelMinutes) ? Number(travelMinutes) * Math.max(0, Number(trafficFactor) - 1) : 0;
    return {min: Math.round(low), max: Math.round(taxiFare(distanceKm, extra)), currency: TAXI_METER.currency};
  }

  /** Fuel cost in THB for driving a private car. */
  function fuelCost(distanceKm, options = {}) {
    if (!finite(distanceKm)) return null;
    const kmPerLitre = Number(options.kmPerLitre) > 0 ? Number(options.kmPerLitre) : FUEL_DEFAULTS.kmPerLitre;
    const price = finite(options.pricePerLitre) ? Number(options.pricePerLitre) : FUEL_DEFAULTS.pricePerLitre;
    return Math.round(Number(distanceKm) / kmPerLitre * price);
  }

  /**
   * Cost of a whole trip. Each leg is its own taxi ride (the meter restarts at every stop).
   * legs: [{distanceKm, travelMinutes}], travelMode: 'driving' | 'taxi' | 'walking' | 'transit'
   * Returns {taxi:{min,max}, fuel, currency} — walking costs 0, transit is not estimated (null).
   */
  function tripCost(legs, travelMode = 'driving', options = {}) {
    const list = Array.isArray(legs) ? legs.filter(l => l && finite(l.distanceKm)) : [];
    if (travelMode === 'walking') return {taxi: {min: 0, max: 0}, fuel: 0, currency: 'THB'};
    if (travelMode === 'transit') return {taxi: null, fuel: null, currency: 'THB'};
    let min = 0, max = 0, fuel = 0;
    for (const leg of list) {
      const range = taxiFareRange(leg.distanceKm, leg.travelMinutes, options.trafficFactor);
      min += range.min; max += range.max;
      fuel += fuelCost(leg.distanceKm, options);
    }
    return {taxi: {min, max}, fuel, currency: 'THB'};
  }

  return {TAXI_METER, FUEL_DEFAULTS, DEFAULT_TRAFFIC_FACTOR, taxiFare, taxiFareRange, fuelCost, tripCost};
});
