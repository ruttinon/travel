'use strict';
// Tommy (2026-11-06): the demo Facebook box and the phone code shown in the browser only work on this computer.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

function startServer(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js'), '0'], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Server start timeout')); }, 15000);
    child.stdout.on('data', c => { out += c; const m = out.match(/http:\/\/127\.0\.0\.1:(\d+)/); if (m) { clearTimeout(timer); resolve({ child, url: `http://127.0.0.1:${m[1]}` }); } });
  });
}

test('Facebook demo and phone codes: this computer only; other devices are refused', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traval-demo-login-'));
  const srv = await startServer({ UNFOLD_DATA_DIR: dir, TRAVAL_GOOGLE_CLIENT_ID: '' });
  t.after(() => { srv.child.kill(); fs.rmSync(dir, { recursive: true, force: true }); });
  const post = (p, body, remote) => fetch(srv.url + p, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: srv.url, ...(remote ? { 'X-Forwarded-For': '203.0.113.7' } : {}) }, body: JSON.stringify(body) });

  // From another device (behind a proxy / online): refused, and no code is ever sent back.
  let r = await post('/api/auth/social', { provider: 'facebook', email: 'victim@example.com' }, true);
  assert.equal(r.status, 503);
  r = await post('/api/auth/phone/otp-request', { phone: '0812345678' }, true);
  assert.equal(r.status, 503);
  assert.equal((await r.json()).devOtp, undefined);

  // On this computer (development): the demo still works for the team's testing.
  r = await post('/api/auth/social', { provider: 'facebook', email: 'fb.demo@example.com', name: 'FB Demo' });
  assert.equal(r.status, 201);
  r = await post('/api/auth/phone/otp-request', { phone: '0812345678' });
  const otp = (await r.json()).devOtp;
  assert.match(otp, /^\d{6}$/);
  r = await post('/api/auth/phone/otp-verify', { phone: '0812345678', otp });
  assert.equal(r.status, 201);
});
