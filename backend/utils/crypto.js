'use strict';
const crypto = require('node:crypto');
const { SESS_AGE, USER_SESS_AGE, REQUIRE_VERIFICATION } = require('../config');
const { db } = require('../db/connection');

const limits = new Map();

function pwHash(password, salt) {
  return crypto.scryptSync(password, salt, 64, { maxmem: 128 * 1024 * 1024 }).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function cookieFor(token, req) {
  const parts = [`unfold_admin=${token || ''}`, 'HttpOnly', 'SameSite=Strict', 'Path=/api/admin', `Max-Age=${token ? SESS_AGE : 0}`];
  if (req.socket.encrypted) parts.push('Secure');
  return parts.join('; ');
}

function newSession(res, req) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions(token_hash,expires_at) VALUES(?,?)').run(hashToken(token), Math.floor(Date.now() / 1000) + SESS_AGE);
  res.setHeader('Set-Cookie', cookieFor(token, req));
}

function tokenOf(req) {
  const m = /(?:^|;\s*)unfold_admin=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  return m?.[1] || null;
}

function isAdmin(req) {
  const token = tokenOf(req);
  if (!token) return false;
  const s = db.prepare('SELECT expires_at FROM sessions WHERE token_hash=?').get(hashToken(token));
  return !!s && s.expires_at > Date.now() / 1000;
}

function requireAdmin(req) {
  if (!isAdmin(req)) {
    const err = new Error('Sign in as an admin first');
    err.status = 401;
    throw err;
  }
}

function userCookie(token, req) {
  const parts = [`unfold_user=${token || ''}`, 'HttpOnly', 'SameSite=Strict', 'Path=/', `Max-Age=${token ? USER_SESS_AGE : 0}`];
  if (req.socket.encrypted) parts.push('Secure');
  return parts.join('; ');
}

function userToken(req) {
  return /(?:^|;\s*)unfold_user=([a-f0-9]{64})/.exec(req.headers.cookie || '')?.[1] || null;
}

function userSession(req) {
  const token = userToken(req);
  if (!token) return null;
  return db.prepare('SELECT u.id,u.name,u.email,u.email_verified,u.status FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?')
    .get(hashToken(token), Math.floor(Date.now() / 1000)) || null;
}

function userPublic(user) {
  return user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: !!user.email_verified,
    status: user.status || 'active'
  } : null;
}

function requireUser(req) {
  const user = userSession(req);
  if (!user) {
    const err = new Error('Sign in to continue');
    err.status = 401;
    throw err;
  }
  if (user.status === 'suspended') {
    const err = new Error('Your account has been suspended. Please contact Admin.');
    err.status = 403;
    throw err;
  }
  return user;
}

function issueUserSession(req, res, id) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO user_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)')
    .run(hashToken(token), id, Math.floor(Date.now() / 1000) + USER_SESS_AGE);
  res.setHeader('Set-Cookie', userCookie(token, req));
}

function attemptAllowed(ip) {
  const now = Date.now(), entry = limits.get(ip) || { count: 0, reset: now + 15 * 60_000 };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + 15 * 60_000;
  }
  entry.count++;
  limits.set(ip, entry);
  return entry.count <= 8;
}

function allowUserAttempt(req, label) {
  if (!attemptAllowed(label + ':' + (req.socket.remoteAddress || 'local'))) {
    const err = new Error('Too many attempts; try again in 15 minutes');
    err.status = 429;
    throw err;
  }
}

function validateEmail(input) {
  const email = String(input || '').trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error('Invalid email address');
    err.status = 400;
    throw err;
  }
  return email;
}

function newAccountToken(userId, purpose) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('DELETE FROM account_tokens WHERE user_id=? AND purpose=?').run(userId, purpose);
  db.prepare('INSERT INTO account_tokens(token_hash,user_id,purpose,expires_at,created_at) VALUES(?,?,?,?,?)')
    .run(hashToken(token), userId, purpose, Math.floor(Date.now() / 1000) + (purpose === 'verify' ? 86400 : 1800), new Date().toISOString());
  return token;
}

function consumeToken(token, purpose) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    const err = new Error('Invalid or expired link');
    err.status = 400;
    throw err;
  }
  const key = hashToken(token);
  const row = db.prepare('SELECT * FROM account_tokens WHERE token_hash=? AND purpose=? AND expires_at>?').get(key, purpose, Math.floor(Date.now() / 1000));
  if (!row) {
    const err = new Error('Invalid or expired link');
    err.status = 400;
    throw err;
  }
  db.prepare('DELETE FROM account_tokens WHERE token_hash=?').run(key);
  return row.user_id;
}

async function sendAccountMail(req, email, purpose, token) {
  const link = `http://127.0.0.1:${req.socket.localPort || 5173}/?${purpose === 'verify' ? 'verify' : 'reset'}=${token}#profile`;
  const key = process.env.UNFOLD_RESEND_API_KEY;
  const from = process.env.UNFOLD_EMAIL_FROM;
  if (Boolean(key) !== Boolean(from)) {
    const err = new Error('Set both UNFOLD_RESEND_API_KEY and UNFOLD_EMAIL_FROM');
    err.status = 503;
    throw err;
  }
  if (!key) {
    console.log(`[DEV MAIL ${purpose.toUpperCase()}] ${email} ${link}`);
    return 'dev-console';
  }
  const host = process.env.UNFOLD_PUBLIC_URL;
  if (!host || !/^https:\/\/[^/?#]+$/.test(host)) {
    const err = new Error('UNFOLD_PUBLIC_URL must be an HTTPS origin for email delivery');
    err.status = 503;
    throw err;
  }
  const external = host + `/?${purpose === 'verify' ? 'verify' : 'reset'}=${token}#profile`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: purpose === 'verify' ? 'Verify your unfold email' : 'Reset your unfold password',
      text: `Open this one-time link to ${purpose === 'verify' ? 'verify your email address' : 'reset your password'}:\n${external}\n\nIf you did not request this, ignore this email.`
    })
  });
  if (!response.ok) {
    console.error('Email provider rejected request, status', response.status);
    const err = new Error('Email service is temporarily unavailable');
    err.status = 503;
    throw err;
  }
  return 'email';
}

module.exports = {
  pwHash,
  hashToken,
  cookieFor,
  newSession,
  tokenOf,
  isAdmin,
  requireAdmin,
  userCookie,
  userToken,
  userSession,
  userPublic,
  requireUser,
  issueUserSession,
  attemptAllowed,
  allowUserAttempt,
  validateEmail,
  newAccountToken,
  consumeToken,
  sendAccountMail
};
