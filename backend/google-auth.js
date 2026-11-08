'use strict';
/* Tommy: Sign in with Google — server-side check (owner: Tommy)
 *
 * The login page gets a signed "ID token" from Google's own button and sends it to POST /api/auth/social
 * as { provider: 'google', credential }. This file proves the token is real before anyone is logged in:
 *   - signed by Google (RS256, Google's public keys from GOOGLE_CERTS_URL, cached as Google says)
 *   - made for OUR app (aud = TRAVAL_GOOGLE_CLIENT_ID), issued by accounts.google.com, not expired
 *   - the Google account's email is verified
 * Only then are the email, name and picture taken — from the token, never from what the browser typed.
 *
 * Setting (free, no billing): TRAVAL_GOOGLE_CLIENT_ID=<your-id>.apps.googleusercontent.com
 * Not set → "demo mode": the team's old type-an-email box still works, but ONLY for requests made on
 * this same computer (tests, local development). Anything else is refused, so a server that goes online
 * without the setting cannot be used to log in as someone else.
 * No npm packages: node:crypto verifies the signature.
 */
const crypto = require('node:crypto');

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
const CLOCK_SKEW_SEC = 60;
const MIN_REFETCH_MS = 60 * 1000;
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const CLIENT_ID_SHAPE = /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
let warnedBadId = '';

function clientId() {
  // Forgive copy-paste slips: spaces and quotes around the ID (Windows `set X="..."` keeps the quotes).
  const id = String(process.env.TRAVAL_GOOGLE_CLIENT_ID || '').trim().replace(/^["']+|["']+$/g, '').trim();
  if (id && !CLIENT_ID_SHAPE.test(id)) {
    // Not a real Google Client ID (e.g. the example text was pasted): stay in demo mode and say why, once.
    if (warnedBadId !== id) {
      warnedBadId = id;
      console.warn(`[GOOGLE LOGIN] TRAVAL_GOOGLE_CLIENT_ID "${id}" is not a Google Client ID (it should end in .apps.googleusercontent.com). Google sign-in is OFF until it is fixed.`);
    }
    return '';
  }
  return id;
}

/** What the login page needs to know: GET /api/auth/google/config */
function publicConfig() {
  const id = clientId();
  return { clientId: id, demo: !id };
}

function authError(message, status = 401) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function b64urlJson(part) {
  try { return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')); }
  catch { throw authError('Google sign-in token is not readable'); }
}

// ---- Google's public keys (they rotate; Cache-Control says how long a copy is good for) ----
let keyCache = { keys: new Map(), expires: 0, fetchedAt: 0 };

async function defaultFetchKeys() {
  // TRAVAL_GOOGLE_CERTS_URL exists only so the automated tests can use their own keys — never set it in real use.
  const res = await fetch(process.env.TRAVAL_GOOGLE_CERTS_URL || GOOGLE_CERTS_URL, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw authError('Could not reach Google to check the sign-in. Try again.', 503);
  const maxAge = /max-age=(\d+)/i.exec(res.headers.get('cache-control') || '');
  const body = await res.json();
  return { jwks: body.keys || [], maxAgeSec: maxAge ? Number(maxAge[1]) : 3600 };
}

async function keyFor(kid, fetchKeys, now) {
  const fresh = now < keyCache.expires;
  if (fresh && keyCache.keys.has(kid)) return keyCache.keys.get(kid);
  // Unknown key id: Google may have rotated — refetch, but not more than once a minute.
  if (!fresh || now - keyCache.fetchedAt > MIN_REFETCH_MS) {
    let got;
    try { got = await fetchKeys(); }
    catch (e) { throw e.status ? e : authError('Could not reach Google to check the sign-in. Try again.', 503); }
    const keys = new Map();
    for (const jwk of got.jwks) {
      if (jwk && jwk.kid && jwk.kty === 'RSA') keys.set(jwk.kid, crypto.createPublicKey({ key: jwk, format: 'jwk' }));
    }
    keyCache = { keys, expires: now + got.maxAgeSec * 1000, fetchedAt: now };
  }
  const key = keyCache.keys.get(kid);
  if (!key) throw authError('Google sign-in token was not signed by Google');
  return key;
}

/**
 * Check a Google ID token. Returns { sub, email, name, picture } or throws (status 401/503).
 * opts.clientId, opts.now (ms) and opts.fetchKeys are for tests.
 */
async function verifyIdToken(token, opts = {}) {
  const audience = opts.clientId ?? clientId();
  const now = opts.now ?? Date.now();
  const fetchKeys = opts.fetchKeys || defaultFetchKeys;
  if (!audience) throw authError('Google sign-in is not set up on this server (TRAVAL_GOOGLE_CLIENT_ID)', 503);
  if (typeof token !== 'string' || token.length > 4096) throw authError('Missing Google sign-in token');
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(p => !/^[A-Za-z0-9_-]+$/.test(p))) throw authError('Google sign-in token is not readable');

  const header = b64urlJson(parts[0]);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw authError('Google sign-in token was not signed by Google');
  const key = await keyFor(header.kid, fetchKeys, now);
  const signed = crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), key, Buffer.from(parts[2], 'base64url'));
  if (!signed) throw authError('Google sign-in token was not signed by Google');

  const c = b64urlJson(parts[1]);
  const nowSec = Math.floor(now / 1000);
  if (!ISSUERS.has(c.iss)) throw authError('Google sign-in token was not issued by Google');
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (!aud.includes(audience)) throw authError('Google sign-in token was made for a different app');
  if (!Number.isFinite(c.exp) || c.exp + CLOCK_SKEW_SEC < nowSec) throw authError('Google sign-in has expired. Please sign in again.');
  if (Number.isFinite(c.iat) && c.iat - CLOCK_SKEW_SEC > nowSec) throw authError('Google sign-in token is not valid yet');
  if (typeof c.sub !== 'string' || !c.sub) throw authError('Google sign-in token has no account id');
  if (typeof c.email !== 'string' || !c.email) throw authError('Your Google account did not share an email address');
  if (c.email_verified !== true && c.email_verified !== 'true') throw authError('Please verify your email with Google first');

  return {
    sub: c.sub,
    email: c.email.toLowerCase(),
    name: typeof c.name === 'string' ? c.name : '',
    picture: typeof c.picture === 'string' && /^https:\/\//.test(c.picture) ? c.picture : ''
  };
}

/** True only for a request made on this computer itself, with no proxy in between. */
function isLocalRequest(req) {
  const h = req.headers || {};
  if (h['x-forwarded-for'] || h['forwarded'] || h['x-real-ip']) return false;
  return LOOPBACK.has(req.socket && req.socket.remoteAddress);
}

/**
 * Used by POST /api/auth/social when provider is 'google'.
 * Returns the trusted fields to log in with ({ email, name, providerId, avatarUrl }),
 * or null in local demo mode (no client ID set, request from this computer) to keep the old behaviour.
 */
async function googleLoginFields(body, req, opts = {}) {
  const configured = (opts.clientId ?? clientId()) !== '';
  if (!configured) {
    if (isLocalRequest(req)) return null;
    throw authError('Google sign-in is not set up on this server yet (TRAVAL_GOOGLE_CLIENT_ID)', 503);
  }
  const g = await verifyIdToken(body && body.credential, opts);
  return { email: g.email, name: (g.name || g.email.split('@')[0]).slice(0, 60), providerId: 'google:' + g.sub, avatarUrl: g.picture };
}

function _resetKeyCache() { keyCache = { keys: new Map(), expires: 0, fetchedAt: 0 }; }

module.exports = { GOOGLE_CERTS_URL, clientId, publicConfig, verifyIdToken, googleLoginFields, isLocalRequest, _resetKeyCache };
