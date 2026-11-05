/* Traval shared tool — map gestures for mouse AND touch (owner: Tommy)
 * One handler for mouse, finger and pen (Pointer Events):
 *   drag with one pointer → pan, two fingers → pinch zoom, mouse wheel / trackpad → zoom.
 * It knows nothing about map projection: it only reports movement, the map decides.
 * Delegated on document, so it keeps working after the page re-renders the map element.
 * Browser only: window.TravalMapGestures.attach(selector, handlers) → detach()
 */
(function(global) {
  'use strict';
  if (!global || !global.document) return;

  const IGNORE = 'button, a, input, select, textarea, [data-no-pan]';
  const DRAG_THRESHOLD_PX = 6;   // smaller moves count as a tap
  const PINCH_STEP = 1.6;        // finger distance ratio for one zoom level
  const WHEEL_STEP = 100;        // accumulated wheel delta for one zoom level
  const WHEEL_COOLDOWN_MS = 180;

  /**
   * handlers: {
   *   onPanStart(frame), onPan(dx, dy, frame), onPanEnd(moved, frame),
   *   onZoom(step, frame)   // step = +1 (in) or -1 (out)
   * }
   */
  function attach(selector, handlers = {}) {
    const doc = global.document;
    const style = doc.createElement('style');
    // Stop the browser scrolling or zooming the page while a finger moves the map.
    style.textContent = `${selector}{touch-action:none;-webkit-user-select:none;user-select:none}`;
    doc.head.appendChild(style);

    const pointers = new Map(); // pointerId → {x, y}
    let frame = null, startX = 0, startY = 0, moved = false, panning = false;
    let pinchBase = 0, wheelAcc = 0, wheelAt = 0;

    const distance = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    function onDown(e) {
      const target = e.target.closest ? e.target.closest(selector) : null;
      if (!target || (e.target.closest && e.target.closest(IGNORE))) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (frame && frame !== target) return;
      frame = target;
      pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
      try { target.setPointerCapture(e.pointerId); } catch {}
      if (pointers.size === 1) {
        startX = e.clientX; startY = e.clientY; moved = false; panning = true;
        handlers.onPanStart && handlers.onPanStart(frame);
      } else if (pointers.size === 2) {
        // Second finger: stop panning, start pinching.
        if (panning) { panning = false; handlers.onPanEnd && handlers.onPanEnd(moved, frame); }
        pinchBase = distance();
      }
    }

    function onMove(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
      if (pointers.size >= 2) {
        const d = distance();
        if (pinchBase > 0 && d / pinchBase >= PINCH_STEP) { pinchBase = d; handlers.onZoom && handlers.onZoom(1, frame); }
        else if (pinchBase > 0 && pinchBase / d >= PINCH_STEP) { pinchBase = d; handlers.onZoom && handlers.onZoom(-1, frame); }
        return;
      }
      if (!panning) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      moved = true;
      handlers.onPan && handlers.onPan(dx, dy, frame);
    }

    function onUp(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        if (panning) handlers.onPanEnd && handlers.onPanEnd(moved, frame);
        panning = false; pinchBase = 0; frame = null;
      } else if (pointers.size === 1) {
        // One finger left after a pinch: continue as a fresh pan from here.
        const [p] = [...pointers.values()];
        startX = p.x; startY = p.y; moved = false; panning = true; pinchBase = 0;
        handlers.onPanStart && handlers.onPanStart(frame);
      }
    }

    function onWheel(e) {
      const target = e.target.closest ? e.target.closest(selector) : null;
      if (!target) return;
      e.preventDefault();
      wheelAcc += e.deltaY;
      const now = Date.now();
      if (Math.abs(wheelAcc) < WHEEL_STEP || now - wheelAt < WHEEL_COOLDOWN_MS) return;
      wheelAt = now;
      const step = wheelAcc < 0 ? 1 : -1;
      wheelAcc = 0;
      handlers.onZoom && handlers.onZoom(step, target);
    }

    doc.addEventListener('pointerdown', onDown);
    global.addEventListener('pointermove', onMove);
    global.addEventListener('pointerup', onUp);
    global.addEventListener('pointercancel', onUp);
    doc.addEventListener('wheel', onWheel, {passive: false});

    return function detach() {
      doc.removeEventListener('pointerdown', onDown);
      global.removeEventListener('pointermove', onMove);
      global.removeEventListener('pointerup', onUp);
      global.removeEventListener('pointercancel', onUp);
      doc.removeEventListener('wheel', onWheel);
      style.remove();
    };
  }

  global.TravalMapGestures = {attach};
})(typeof window !== 'undefined' ? window : null);
