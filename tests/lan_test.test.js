'use strict';
// Tommy (2026-11-23): phone testing on the same Wi-Fi (RUN-PHONE-TEST.bat, TRAVAL_LAN_TEST=1).
// Private network addresses are accepted only when the switch is on; public host names never are.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

function startServer(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js'), '0'], { env: { ...process.env, PORT: '0', UNFOLD_NO_BROWSER: '1', ...env }, stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Server start timeout')); }, 15000);
    child.stdout.on('data', c => { out += c; const m = out.match(/http:\/\/127\.0\.0\.1:(\d+)/); if (m && /Press Ctrl\+C/.test(out)) { clearTimeout(timer); resolve({ child, port: Number(m[1]), get out() { return out; } }); } });
  });
}
// Ask the server with a chosen Host header (what a phone would send), over the loopback connection.
function get(port, host, p = '/api/health') {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, path: p, headers: { Host: host } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    r.on('error', reject); r.end();
  });
}

test('phone test mode: private Wi-Fi addresses only, and only when switched on', async t => {
  const dir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'goaround-lan-off-'));
  const off = await startServer({ UNFOLD_DATA_DIR: dir1 });
  t.after(() => { off.child.kill(); fs.rmSync(dir1, { recursive: true, force: true }); });
  assert.equal(await get(off.port, `127.0.0.1:${off.port}`), 200);
  assert.equal(await get(off.port, `192.168.1.20:${off.port}`), 403, 'normal start: this computer only');
  assert.doesNotMatch(off.out, /PHONE TEST/);

  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'goaround-lan-on-'));
  const on = await startServer({ UNFOLD_DATA_DIR: dir2, TRAVAL_LAN_TEST: '1' });
  t.after(() => { on.child.kill(); fs.rmSync(dir2, { recursive: true, force: true }); });
  assert.equal(await get(on.port, `192.168.1.20:${on.port}`), 200, 'home Wi-Fi address accepted');
  assert.equal(await get(on.port, `10.0.0.5:${on.port}`), 200);
  assert.equal(await get(on.port, `172.20.1.2:${on.port}`), 200);
  assert.equal(await get(on.port, `8.8.8.8:${on.port}`), 403, 'public address refused');
  assert.equal(await get(on.port, `evil.example:${on.port}`), 403, 'host names refused (DNS rebinding)');
  assert.equal(await get(on.port, `192.168.1.20.evil.example:${on.port}`), 403);
  assert.match(on.out, /PHONE TEST/);
});
