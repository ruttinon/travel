/* Tommy: Sign in with Google — login page side (owner: Tommy)
 *
 * Used by the login page and the register page (button id="btn-google"; data-google-text="signup_with" on register).
 * When the server has a Google Client ID (GET /api/auth/google/config), this swaps the page's Google
 * button for Google's official one. Google shows its own sign-in window, gives us a signed token,
 * and we send only that token to POST /api/auth/social — the server checks it with Google
 * (backend/google-auth.js) and takes the email/name from it.
 * No Client ID (local development) → nothing changes: the team's demo box stays.
 * Free: Google Identity Services has no usage charge.
 */
(function () {
  'use strict';
  var GIS_SRC = 'https://accounts.google.com/gsi/client';

  // Tommy (UX pass 2026-11-06): after signing in, go back to the page that sent the user here
  // (e.g. /login.html?next=/business.html). Only paths on this site are accepted ("/x", never "//x" or "https:").
  window.travalNext = function () {
    var next = new URLSearchParams(window.location.search).get('next') || '';
    return /^\/(?![\/\\])[\w\-./#?=&%]*$/.test(next) ? next : 'profile.html';
  };

  function showError(message) {
    var box = document.getElementById('auth-error-msg') || document.getElementById('reg-error-msg');
    if (!box) { window.alert(message); return; }
    box.textContent = message;
    box.style.display = 'block';
  }

  function loadGoogleScript() {
    return new Promise(function (resolve, reject) {
      if (window.google && window.google.accounts && window.google.accounts.id) return resolve();
      var s = document.createElement('script');
      s.src = GIS_SRC;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Could not load Google sign-in')); };
      document.head.appendChild(s);
    });
  }

  async function onCredential(response) {
    try {
      var res = await fetch('/api/auth/social', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', credential: response && response.credential })
      });
      var json = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(json.error || 'Google sign-in failed');
      window.location.href = window.travalNext();
    } catch (err) {
      showError(err.message);
    }
  }

  async function start() {
    var button = document.getElementById('btn-google');
    if (!button) return;
    var cfg;
    try {
      var r = await fetch('/api/auth/google/config', { cache: 'no-store', credentials: 'same-origin' });
      cfg = await r.json();
    } catch (e) { return; } // server unreachable: leave the page as it is
    if (!cfg || !cfg.clientId) return; // demo mode (local only) — keep the team's button

    try { await loadGoogleScript(); }
    catch (e) {
      button.onclick = function () { showError('Google sign-in could not load. Check your internet connection and refresh.'); };
      return;
    }
    var width = Math.round(Math.max(200, Math.min(400, button.offsetWidth || 240)));
    var slot = document.createElement('div');
    slot.id = 'google-signin-slot';
    slot.style.display = 'flex';
    slot.style.justifyContent = 'center';
    slot.style.alignItems = 'center';
    slot.style.flex = '1'; // same space as the button it replaces (register page row)
    button.hidden = true;
    button.style.display = 'none';
    button.insertAdjacentElement('afterend', slot);

    google.accounts.id.initialize({
      client_id: cfg.clientId,
      callback: onCredential,
      ux_mode: 'popup',
      context: button.dataset.googleText === 'signup_with' ? 'signup' : 'signin',
      cancel_on_tap_outside: true
    });
    google.accounts.id.renderButton(slot, {
      type: 'standard', theme: 'outline', size: 'large', text: button.dataset.googleText || 'continue_with',
      shape: 'pill', logo_alignment: 'left', width: width
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
