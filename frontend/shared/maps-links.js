/* Traval shared tool — Google Maps links (owner: Tommy)
 * Builds "Navigate" and "See on Google Maps" links. These are plain Google Maps URLs:
 * free, no API key, and they do not fall under the Places API storage rules.
 * Rule: use the place's googlePlaceId when we have it, otherwise our own lat/lon.
 * Loads in the browser as window.TravalLinks and in Node via require().
 */
(function(global, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.TravalLinks = api;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';

  const MAX_WAYPOINTS = 9; // Google Maps URL limit for stops between origin and destination

  /** Our travelMode values → Google's travelmode values. */
  function googleTravelMode(travelMode) {
    return travelMode === 'walking' ? 'walking' : travelMode === 'transit' ? 'transit' : 'driving';
  }

  const hasCoords = p => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon));
  const coords = p => `${Number(p.lat).toFixed(6)},${Number(p.lon).toFixed(6)}`;
  const label = p => [p && (p.en || p.th), p && (p.locEn || p.locTh)].filter(Boolean).join(', ');
  const enc = encodeURIComponent;

  /**
   * Turn-by-turn navigation in Google Maps.
   * places: one place (destination only, Google starts from the user's position)
   *         or several (first = origin, last = destination, middle = waypoints, max 9).
   */
  function directionsUrl(places, travelMode = 'driving') {
    const list = (Array.isArray(places) ? places : [places]).filter(p => hasCoords(p) || (p && p.googlePlaceId));
    if (!list.length) return '';
    const dest = list[list.length - 1];
    const params = ['api=1'];
    if (list.length > 1) params.push('origin=' + enc(hasCoords(list[0]) ? coords(list[0]) : label(list[0])));
    if (dest.googlePlaceId) {
      params.push('destination=' + enc(label(dest) || coords(dest)), 'destination_place_id=' + enc(dest.googlePlaceId));
    } else {
      params.push('destination=' + enc(coords(dest)));
    }
    const middle = list.slice(1, -1).slice(0, MAX_WAYPOINTS);
    if (middle.length) params.push('waypoints=' + enc(middle.map(p => hasCoords(p) ? coords(p) : label(p)).join('|')));
    params.push('travelmode=' + googleTravelMode(travelMode));
    return 'https://www.google.com/maps/dir/?' + params.join('&');
  }

  /** Open the place on Google Maps (its page shows Google's reviews). */
  function placeUrl(place) {
    if (!place) return '';
    const name = label(place);
    if (place.googlePlaceId) {
      return `https://www.google.com/maps/search/?api=1&query=${enc(name || coords(place))}&query_place_id=${enc(place.googlePlaceId)}`;
    }
    if (name) return `https://www.google.com/maps/search/?api=1&query=${enc(name)}`;
    return hasCoords(place) ? `https://www.google.com/maps/search/?api=1&query=${enc(coords(place))}` : '';
  }

  return {MAX_WAYPOINTS, googleTravelMode, directionsUrl, placeUrl};
});
