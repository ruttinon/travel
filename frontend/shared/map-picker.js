/* Traval shared tool — pick a location on a small map (owner: Tommy)
 *
 * For forms that need a place's latitude/longitude (business owner "add my shop", admin place editor).
 * The pin stays in the middle; the user drags the map (mouse or finger) until the pin sits on the place,
 * or taps/clicks a spot to move it there. Zoom with the +/− buttons, mouse wheel or two fingers.
 * Optional search box uses our own place search (GET /api/map/search, OpenStreetMap data) — no Google API.
 *
 *   const picker = TravalMapPicker.attach(document.getElementById('bizMiniMap'), {
 *     lat: 13.7465, lon: 100.4930, zoom: 15,
 *     onChange(lat, lon) { ... }          // called when the user lets go / taps / searches
 *   });
 *   picker.set(lat, lon, zoom?)           // move the pin from code (typed numbers, GPS)
 *   picker.get()                          // {lat, lon, zoom}
 *
 * Map images: OpenStreetMap raster tiles (same as the traveler map's MAP_TILE_URL). Change TILE_URL here
 * (or pass options.tileUrl) when we move to our own/another tile server. Credit "© OpenStreetMap contributors" is shown.
 */
(function (global, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.TravalMapPicker = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const TILE = 256;
  const MIN_ZOOM = 5, MAX_ZOOM = 19;
  const THAILAND = { lat: 13.7563, lon: 100.5018, zoom: 6 };

  // Web Mercator: lat/lon <-> world pixels at zoom z
  function toPx(lat, lon, z) {
    const s = TILE * Math.pow(2, z);
    const sin = Math.sin(Math.max(-85.05, Math.min(85.05, lat)) * Math.PI / 180);
    return { x: (lon + 180) / 360 * s, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s };
  }
  function toLatLon(x, y, z) {
    const s = TILE * Math.pow(2, z);
    const lon = x / s * 360 - 180;
    const n = Math.PI - 2 * Math.PI * y / s;
    return { lat: 180 / Math.PI * Math.atan(Math.sinh(n)), lon: ((lon + 540) % 360) - 180 };
  }
  const round6 = n => Math.round(n * 1e6) / 1e6;
  const valid = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 85 && Math.abs(lon) <= 180;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function attach(el, options = {}) {
    if (!el) throw new Error('TravalMapPicker: no element');
    const tileUrl = options.tileUrl || TILE_URL;
    let lat = Number(options.lat), lon = Number(options.lon);
    let zoom = Math.round(Number(options.zoom) || 15);
    if (!valid(lat, lon)) { lat = THAILAND.lat; lon = THAILAND.lon; zoom = THAILAND.zoom; }

    el.innerHTML = `
      <div class="tmp-tiles" style="position:absolute;inset:0;"></div>
      <div class="tmp-pin" aria-hidden="true" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);pointer-events:none;font-size:30px;line-height:1;filter:drop-shadow(0 3px 5px rgba(0,0,0,.45));">📍</div>
      <div style="position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:4px;">
        <button type="button" class="tmp-zoom" data-step="1" aria-label="Zoom in" style="width:30px;height:30px;border-radius:8px;border:1px solid #ccd;background:#fff;font-size:18px;font-weight:700;cursor:pointer;">+</button>
        <button type="button" class="tmp-zoom" data-step="-1" aria-label="Zoom out" style="width:30px;height:30px;border-radius:8px;border:1px solid #ccd;background:#fff;font-size:18px;font-weight:700;cursor:pointer;">−</button>
      </div>
      ${options.search === false ? '' : `
      <form class="tmp-search" style="position:absolute;top:8px;left:8px;right:48px;max-width:320px;">
        <input type="search" placeholder="${esc(options.searchPlaceholder || 'ค้นหาสถานที่ / Search a place')}" style="width:100%;box-sizing:border-box;padding:7px 10px;border-radius:8px;border:1px solid #ccd;font-size:13px;background:#fff;">
        <div class="tmp-results" style="display:none;margin-top:4px;background:#fff;border:1px solid #ccd;border-radius:8px;max-height:150px;overflow:auto;font-size:13px;"></div>
      </form>`}
      <span style="position:absolute;bottom:4px;right:6px;background:rgba(255,255,255,.85);font-size:10px;padding:1px 6px;border-radius:6px;color:#333;pointer-events:none;">© OpenStreetMap contributors</span>`;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';
    const tilesEl = el.querySelector('.tmp-tiles');

    function draw() {
      const w = el.clientWidth || 300, h = el.clientHeight || 180;
      const c = toPx(lat, lon, zoom);
      const left = c.x - w / 2, top = c.y - h / 2;
      const n = Math.pow(2, zoom);
      const x0 = Math.floor(left / TILE), x1 = Math.floor((left + w) / TILE);
      const y0 = Math.max(0, Math.floor(top / TILE)), y1 = Math.min(n - 1, Math.floor((top + h) / TILE));
      let html = '';
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const wx = ((tx % n) + n) % n;
          const src = tileUrl.replace('{z}', zoom).replace('{x}', wx).replace('{y}', ty);
          html += `<img src="${esc(src)}" alt="" draggable="false" style="position:absolute;left:${Math.round(tx * TILE - left)}px;top:${Math.round(ty * TILE - top)}px;width:${TILE}px;height:${TILE}px;user-select:none;pointer-events:none;">`;
        }
      }
      tilesEl.innerHTML = html;
    }
    function changed() { if (typeof options.onChange === 'function') options.onChange(round6(lat), round6(lon)); }
    function setZoom(z) { zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z)); draw(); }

    // ---- pointer: drag to pan, tap to move the pin there, two fingers to zoom ----
    const pointers = new Map();
    let drag = null, pinch = null, wheel = 0;
    el.addEventListener('pointerdown', e => {
      if (e.target.closest('button, input, .tmp-results')) return;
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        const c = toPx(lat, lon, zoom);
        drag = { sx: e.clientX, sy: e.clientY, cx: c.x, cy: c.y, moved: false };
        el.style.cursor = 'grabbing';
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) };
        drag = null;
      }
    });
    el.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d / pinch.d > 1.6) { setZoom(zoom + 1); pinch.d = d; }
        else if (d / pinch.d < 0.6) { setZoom(zoom - 1); pinch.d = d; }
        return;
      }
      if (!drag) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (!drag.moved) return;
      const p = toLatLon(drag.cx - dx, drag.cy - dy, zoom);
      lat = p.lat; lon = p.lon; draw();
    });
    function up(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      el.style.cursor = 'grab';
      if (pinch) { if (pointers.size < 2) { pinch = null; changed(); } return; }
      if (!drag) return;
      if (!drag.moved && e.type === 'pointerup') {
        // tap / click: move the pin to that spot
        const r = el.getBoundingClientRect();
        const c = toPx(lat, lon, zoom);
        const p = toLatLon(c.x + (e.clientX - r.left - r.width / 2), c.y + (e.clientY - r.top - r.height / 2), zoom);
        lat = p.lat; lon = p.lon; draw();
      }
      drag = null;
      changed();
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => {
      e.preventDefault();
      wheel += e.deltaY;
      if (Math.abs(wheel) >= 100) { setZoom(zoom + (wheel < 0 ? 1 : -1)); wheel = 0; }
    }, { passive: false });
    el.querySelectorAll('.tmp-zoom').forEach(b => b.addEventListener('click', () => setZoom(zoom + Number(b.dataset.step))));

    // ---- search (our OpenStreetMap place list) ----
    const form = el.querySelector('.tmp-search');
    if (form) {
      const input = form.querySelector('input');
      const results = form.querySelector('.tmp-results');
      let found = [];
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const q = input.value.trim();
        if (q.length < 2) return;
        try {
          const c = { lat, lon };
          const res = await fetch(`/api/map/search?q=${encodeURIComponent(q)}&lat=${c.lat}&lon=${c.lon}`);
          const data = await res.json();
          found = (data.places || []).slice(0, 8);
        } catch (err) { found = []; }
        results.innerHTML = found.length
          ? found.map((p, i) => `<div data-i="${i}" style="padding:6px 10px;cursor:pointer;border-bottom:1px solid #eee;">${esc(p.th || p.en)}<small style="color:#777;"> · ${esc(p.locTh || p.locEn || '')}</small></div>`).join('')
          : '<div style="padding:6px 10px;color:#777;">ไม่พบ / Not found — ลากแผนที่หาเองได้</div>';
        results.style.display = 'block';
      });
      results.addEventListener('click', e => {
        const row = e.target.closest('[data-i]');
        if (!row) return;
        const p = found[Number(row.dataset.i)];
        results.style.display = 'none';
        if (p) { lat = Number(p.lat); lon = Number(p.lon); zoom = Math.max(zoom, 17); draw(); changed(); }
      });
    }

    if (typeof ResizeObserver === 'function') new ResizeObserver(draw).observe(el);
    draw();

    return {
      set(newLat, newLon, newZoom) {
        newLat = Number(newLat); newLon = Number(newLon);
        if (!valid(newLat, newLon)) return false;
        lat = newLat; lon = newLon;
        if (Number.isFinite(Number(newZoom))) zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(Number(newZoom))));
        draw();
        return true;
      },
      get() { return { lat: round6(lat), lon: round6(lon), zoom }; }
    };
  }

  return { TILE_URL, attach, toPx, toLatLon };
});
