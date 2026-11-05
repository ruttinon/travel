'use strict';
// Tommy: Sign in with Google — backend/google-auth.js and its hook in POST /api/auth/social.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const g = require('../backend/google-auth.js');

const CLIENT = 'test-client.apps.googleusercontent.com';
const NOW = Date.UTC(2026, 9, 28, 6, 0, 0);
const googleKey = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const otherKey = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = (k, kid) => ({ ...k.publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' });
const keysOf = (...list) => async () => ({ jwks: list, maxAgeSec: 3600 });

function token(claims = {}, { key = googleKey, kid = 'k1', alg = 'RS256' } = {}) {
  const nowSec = Math.floor((claims.__now ?? NOW) / 1000);
  delete claims.__now;
  const body = { iss: 'https://accounts.google.com', aud: CLIENT, sub: '1234567890', email: 'Somchai@Gmail.com',
    email_verified: true, name: 'Somchai', picture: 'https://lh3.googleusercontent.com/a/x', iat: nowSec, exp: nowSec + 3600, ...claims };
  const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const head = enc({ alg, kid, typ: 'JWT' }) + '.' + enc(body);
  return head + '.' + crypto.sign('RSA-SHA256', Buffer.from(head), key.privateKey).toString('base64url');
}
const check = (t, extra = {}) => g.verifyIdToken(t, { clientId: CLIENT, now: NOW, fetchKeys: keysOf(jwk(googleKey, 'k1')), ...extra });

test('a real Google token is accepted and the account details come from the token', async () => {
  g._resetKeyCache();
  assert.deepEqual(await check(token()), { sub: '1234567890', email: 'somchai@gmail.com', name: 'Somchai', picture: 'https://lh3.googleusercontent.com/a/x' });
});

test('fake, foreign, expired or unverified tokens are refused', async () => {
  const cases = [
    ['signed by someone else', token({}, { key: otherKey }), /not signed by Google/],
    ['made for another app', token({ aud: 'someone-else.apps.googleusercontent.com' }), /different app/],
    ['not from Google', token({ iss: 'https://evil.example' }), /not issued by Google/],
    ['expired', token({ exp: Math.floor(NOW / 1000) - 3600 }), /expired/],
    ['email not verified', token({ email_verified: false }), /verify your email/],
    ['no email', token({ email: '' }), /did not share an email/],
    ['wrong algorithm', token({}, { alg: 'HS256' }), /not signed by Google/],
    ['unknown key id', token({}, { kid: 'nope' }), /not signed by Google/],
    ['garbage', 'abc.def', /not readable/],
    ['missing', undefined, /Missing/]
  ];
  for (const [label, t, msg] of cases) {
    g._resetKeyCache();
    await assert.rejects(check(t), e => msg.test(e.message) && e.status === 401, label);
  }
  // A token with its claims edited after signing (e.g. someone swaps in another email) fails the signature.
  const [h, , s] = token().split('.');
  const forged = h + '.' + Buffer.from(JSON.stringify({ iss: 'https://accounts.google.com', aud: CLIENT, sub: '1', email: 'victim@gmail.com', email_verified: true, exp: 9e9 })).toString('base64url') + '.' + s;
  g._resetKeyCache();
  await assert.rejects(check(forged), /not signed by Google/);
});

test('Google key rotation: unknown key → fetch again, but at most once a minute', async () => {
  g._resetKeyCache();
  let calls = 0;
  const rotating = async () => { calls++; return { jwks: calls === 1 ? [jwk(googleKey, 'k1')] : [jwk(googleKey, 'k1'), jwk(otherKey, 'k2')], maxAgeSec: 3600 }; };
  await check(token(), { fetchKeys: rotating });
  await check(token(), { fetchKeys: rotating });
  assert.equal(calls, 1, 'cached');
  await assert.rejects(check(token({}, { key: otherKey, kid: 'k2' }), { fetchKeys: rotating, now: NOW + 10_000 }), /not signed/);
  assert.equal(calls, 1, 'no refetch within a minute');
  assert.equal((await check(token({ __now: NOW + 120_000 }, { key: otherKey, kid: 'k2' }), { fetchKeys: rotating, now: NOW + 120_000 })).sub, '1234567890');
  assert.equal(calls, 2);
});

test('without a Client ID only this computer may use the old demo box', async () => {
  const req = (addr, headers = {}) => ({ socket: { remoteAddress: addr }, headers });
  assert.equal(await g.googleLoginFields({ email: 'a@b.c' }, req('127.0.0.1'), { clientId: '' }), null);
  assert.equal(await g.googleLoginFields({ email: 'a@b.c' }, req('::1'), { clientId: '' }), null);
  await assert.rejects(g.googleLoginFields({ email: 'a@b.c' }, req('203.0.113.9'), { clientId: '' }), e => e.status === 503);
  await assert.rejects(g.googleLoginFields({ email: 'a@b.c' }, req('127.0.0.1', { 'x-forwarded-for': '203.0.113.9' }), { clientId: '' }), e => e.status === 503, 'behind a proxy is not local');
  // With a Client ID a typed email is never enough.
  await assert.rejects(g.googleLoginFields({ email: 'victim@gmail.com' }, req('127.0.0.1'), { clientId: CLIENT }), /Missing Google sign-in token/);
});

// ---- Through the real server: POST /api/auth/social with a Client ID set ----
function startServer(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js'), '0'], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Server start timeout')); }, 15000);
    child.stdout.on('data', c => { out += c; const m = out.match(/http:\/\/127\.0\.0\.1:(\d+)/); if (m) { clearTimeout(timer); resolve({ child, url: `http://127.0.0.1:${m[1]}` }); } });
  });
}

test('server: Google login needs a real token; the typed email is ignored', async t => {
  const certs = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=600' }); res.end(JSON.stringify({ keys: [jwk(googleKey, 'k1')] })); });
  await new Promise(r => certs.listen(0, '127.0.0.1', r));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traval-google-'));
  const srv = await startServer({ UNFOLD_DATA_DIR: dir, TRAVAL_GOOGLE_CLIENT_ID: CLIENT, TRAVAL_GOOGLE_CERTS_URL: `http://127.0.0.1:${certs.address().port}/certs` });
  t.after(() => { srv.child.kill(); certs.close(); fs.rmSync(dir, { recursive: true, force: true }); });
  const post = body => fetch(`${srv.url}/api/auth/social`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: srv.url }, body: JSON.stringify(body) });

  assert.deepEqual(await (await fetch(`${srv.url}/api/auth/google/config`)).json(), { clientId: CLIENT, demo: false });

  let res = await post({ provider: 'google', email: 'victim@gmail.com', name: 'Attacker' });
  assert.equal(res.status, 401, 'old fake login is refused');

  const now = Date.now();
  res = await post({ provider: 'google', credential: token({ __now: now }), email: 'victim@gmail.com', name: 'Attacker' });
  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.user.email, 'somchai@gmail.com', 'email from the Google token, not the typed one');
  assert.equal(json.user.name, 'Somchai');
  const cookie = res.headers.get('set-cookie').split(';')[0];
  const me = await (await fetch(`${srv.url}/api/auth/me`, { headers: { Cookie: cookie } })).json();
  assert.equal(me.user.provider, 'google');

  res = await post({ provider: 'google', credential: token({ __now: now }) });
  assert.equal(res.status, 200, 'second login reuses the same account');
});
