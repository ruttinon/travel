'use strict';
const crypto = require('node:crypto');
const { REQUIRE_VERIFICATION } = require('../config');
const { db } = require('../db/connection');
const { reply, fail, validString, jsonBody } = require('../utils/http');
const {
  pwHash,
  userPublic,
  userSession,
  requireUser,
  issueUserSession,
  allowUserAttempt,
  validateEmail,
  newAccountToken,
  consumeToken,
  sendAccountMail,
  userCookie
} = require('../utils/crypto');
const { audit } = require('../utils/audit');

async function handleAuthRoutes(req, res, pathOnly, method, u) {
  if (method === 'POST' && pathOnly === '/api/auth/register') {
    allowUserAttempt(req, 'reg');
    const b = await jsonBody(req);
    const email = validateEmail(b.email);
    const name = validString(b.name, 80, 'Display name', { required: true });
    const pw = validString(b.password, 120, 'Password', { required: true });
    if (pw.length < 8) fail(400, 'Password must be at least 8 characters');
    const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (exists) fail(409, 'An account already exists with this email address');
    const salt = crypto.randomBytes(16).toString('hex'), id = crypto.randomUUID();
    const verified = REQUIRE_VERIFICATION ? 0 : 1;
    db.prepare('INSERT INTO users(id,name,email,salt,password_hash,email_verified,created_at) VALUES(?,?,?,?,?,?,?)')
      .run(id, name, email, salt, pwHash(pw, salt), verified, new Date().toISOString());
    let verificationSent = false;
    if (!verified) {
      const token = newAccountToken(id, 'verify');
      await sendAccountMail(req, email, 'verify', token);
      verificationSent = true;
    }
    issueUserSession(req, res, id);
    audit('user', id, 'auth.register', 'user', id, { verificationSent });
    const user = db.prepare('SELECT id,name,email,email_verified FROM users WHERE id=?').get(id);
    return reply(res, 201, { user: userPublic(user), verificationSent });
  }

  if (method === 'POST' && pathOnly === '/api/auth/login') {
    allowUserAttempt(req, 'login');
    const b = await jsonBody(req);
    const email = validateEmail(b.email);
    const pw = validString(b.password, 120, 'Password', { required: true });
    const row = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!row || pwHash(pw, row.salt) !== row.password_hash) fail(401, 'Invalid email or password');
    if (row.status === 'suspended') fail(403, 'Your account has been suspended. Please contact Admin.');
    issueUserSession(req, res, row.id);
    audit('user', row.id, 'auth.login', 'user', row.id);
    return reply(res, 200, { user: userPublic(row) });
  }

  if (method === 'GET' && pathOnly === '/api/auth/me') {
    const user = userSession(req);
    return reply(res, 200, { user: userPublic(user) });
  }

  if (method === 'POST' && pathOnly === '/api/auth/logout') {
    const user = userSession(req);
    res.setHeader('Set-Cookie', userCookie('', req));
    if (user) audit('user', user.id, 'auth.logout', 'user', user.id);
    return reply(res, 200, { ok: true });
  }

  if (method === 'POST' && pathOnly === '/api/auth/verify-request') {
    const user = requireUser(req);
    allowUserAttempt(req, 'vreq:' + user.id);
    if (user.emailVerified) return reply(res, 200, { ok: true, alreadyVerified: true });
    const token = newAccountToken(user.id, 'verify');
    await sendAccountMail(req, user.email, 'verify', token);
    audit('user', user.id, 'auth.verify_request', 'user', user.id);
    return reply(res, 200, { ok: true });
  }

  if (method === 'GET' && pathOnly === '/api/auth/verify') {
    const token = u.searchParams.get('token');
    const userId = consumeToken(token, 'verify');
    db.prepare('UPDATE users SET email_verified=1 WHERE id=?').run(userId);
    audit('user', userId, 'auth.verified', 'user', userId);
    return reply(res, 200, { ok: true, verified: true });
  }

  if (method === 'POST' && pathOnly === '/api/auth/forgot-password') {
    allowUserAttempt(req, 'forgot');
    const b = await jsonBody(req);
    const email = validateEmail(b.email);
    const user = db.prepare('SELECT id,email FROM users WHERE email=?').get(email);
    if (user) {
      const token = newAccountToken(user.id, 'reset');
      await sendAccountMail(req, user.email, 'reset', token);
      audit('user', user.id, 'auth.forgot_password', 'user', user.id);
    }
    return reply(res, 200, { ok: true, message: 'If an account exists, a reset link was generated.' });
  }

  if (method === 'POST' && pathOnly === '/api/auth/reset-password') {
    allowUserAttempt(req, 'reset');
    const b = await jsonBody(req);
    const token = validString(b.token, 64, 'Token', { required: true });
    const pw = validString(b.password, 120, 'New password', { required: true });
    if (pw.length < 8) fail(400, 'Password must be at least 8 characters');
    const userId = consumeToken(token, 'reset');
    const salt = crypto.randomBytes(16).toString('hex');
    db.prepare('UPDATE users SET salt=?,password_hash=? WHERE id=?').run(salt, pwHash(pw, salt), userId);
    db.prepare('DELETE FROM user_sessions WHERE user_id=?').run(userId);
    audit('user', userId, 'auth.reset_password', 'user', userId);
    return reply(res, 200, { ok: true, reset: true });
  }

  if (method === 'PATCH' && pathOnly === '/api/auth/profile') {
    const user = requireUser(req);
    const b = await jsonBody(req);
    const name = validString(b.name, 80, 'Display name', { required: true });
    db.prepare('UPDATE users SET name=? WHERE id=?').run(name, user.id);
    audit('user', user.id, 'auth.profile_update', 'user', user.id);
    const updated = db.prepare('SELECT id,name,email,email_verified,status FROM users WHERE id=?').get(user.id);
    return reply(res, 200, { user: userPublic(updated) });
  }

  // PDPA Right to Erasure: Permanent account and personal data deletion
  if (method === 'DELETE' && pathOnly === '/api/me/account') {
    const user = requireUser(req);
    const userId = user.id;
    audit('user', userId, 'user.account_deleted_pdpa', 'user', userId, { email: user.email });
    db.prepare('DELETE FROM users WHERE id=?').run(userId);
    res.setHeader('Set-Cookie', userCookie('', req));
    return reply(res, 200, { ok: true, message: 'Account and associated personal data erased successfully in accordance with PDPA.' });
  }

  return false;
}

module.exports = { handleAuthRoutes };
