'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

function spawnServer(dir) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js'), '0'], {
      env: { ...process.env, UNFOLD_DATA_DIR: dir },
      stdio: ['ignore', 'pipe', 'inherit']
    });
    let output = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Server start timeout'));
    }, 15000);

    child.stdout.on('data', chunk => {
      output += chunk.toString();
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve({ child, url: `http://127.0.0.1:${match[1]}` });
      }
    });
  });
}

test('Admin Improvements: Login Reset, Archive/Restore Workflow, and Duplicate Detection', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unfold-admin-test-'));
  let srv;
  try {
    srv = await spawnServer(tempDir);

    // 1. Test local reset password
    let res = await fetch(`${srv.url}/api/admin/reset-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url }
    });
    assert.equal(res.status, 200);
    const resetJson = await res.json();
    assert.equal(resetJson.ok, true);
    assert.equal(resetJson.password, 'Admin@12345678');

    // 2. Test login with reset password
    res = await fetch(`${srv.url}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url },
      body: JSON.stringify({ password: 'Admin@12345678' })
    });
    assert.equal(res.status, 200);
    const cookie = res.headers.get('set-cookie').split(';')[0];

    // 3. Create a place as draft
    const placePayload = {
      en: 'Doi Inthanon Peak',
      th: 'ยอดดอยอินทนนท์',
      locEn: 'Chiang Mai',
      locTh: 'เชียงใหม่',
      category: 'nature',
      region: 'north',
      lat: 18.5888,
      lon: 98.4871,
      status: 'draft'
    };
    res = await fetch(`${srv.url}/api/admin/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url, 'Cookie': cookie },
      body: JSON.stringify(placePayload)
    });
    assert.equal(res.status, 201);
    const placeJson = await res.json();
    const slug = placeJson.place.id;

    // 4. Test Duplicate Detection
    res = await fetch(`${srv.url}/api/admin/places/check-duplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url, 'Cookie': cookie },
      body: JSON.stringify({ en: 'Doi Inthanon Peak', lat: 18.5889, lon: 98.4872 })
    });
    assert.equal(res.status, 200);
    const dupCheck = await res.json();
    assert.ok(dupCheck.duplicates.length >= 1, 'Should detect duplicate by name and coordinates');

    // 5. Test Archive place (Soft delete)
    res = await fetch(`${srv.url}/api/admin/places/${slug}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url, 'Cookie': cookie }
    });
    assert.equal(res.status, 200);
    const archiveJson = await res.json();
    assert.equal(archiveJson.place.status, 'archived');

    // Verify public API does not return archived place
    res = await fetch(`${srv.url}/api/places`);
    const pubJson = await res.json();
    assert.equal(pubJson.places.find(p => p.id === slug), undefined, 'Archived place must not be in public API');

    // 6. Test Restore place
    res = await fetch(`${srv.url}/api/admin/places/${slug}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url, 'Cookie': cookie }
    });
    assert.equal(res.status, 200);
    const restoreJson = await res.json();
    assert.equal(restoreJson.place.status, 'draft');

    // 7. Test Duplicates Scan
    res = await fetch(`${srv.url}/api/admin/places/duplicates`, {
      headers: { 'Cookie': cookie }
    });
    assert.equal(res.status, 200);
    const dupList = await res.json();
    assert.ok(Array.isArray(dupList.pairs));

  } finally {
    if (srv?.child) {
      srv.child.kill();
      await new Promise(r => srv.child.once('exit', r));
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Auth Improvements: 8-char user password and logout-all session revocation', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unfold-auth-test-'));
  let srv;
  try {
    srv = await spawnServer(tempDir);

    // 1. Password with < 8 chars must fail (400)
    let res = await fetch(`${srv.url}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url },
      body: JSON.stringify({ name: 'Somchai', email: 'somchai@test.local', password: '1234567' })
    });
    assert.equal(res.status, 400, 'Password with 7 chars must fail');

    // 2. Password with 8 chars must succeed (201)
    res = await fetch(`${srv.url}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url },
      body: JSON.stringify({ name: 'Somchai', email: 'somchai@test.local', password: 'Pass@123' })
    });
    assert.equal(res.status, 201, 'Password with 8 chars must succeed');
    const cookieDev1 = res.headers.get('set-cookie').split(';')[0];

    // 3. Login again to simulate device 2
    res = await fetch(`${srv.url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url },
      body: JSON.stringify({ email: 'somchai@test.local', password: 'Pass@123' })
    });
    assert.equal(res.status, 200);
    const cookieDev2 = res.headers.get('set-cookie').split(';')[0];

    // Verify both devices are authenticated
    res = await fetch(`${srv.url}/api/auth/me`, { headers: { 'Cookie': cookieDev1 } });
    let me1 = await res.json();
    assert.equal(me1.user.email, 'somchai@test.local');

    res = await fetch(`${srv.url}/api/auth/me`, { headers: { 'Cookie': cookieDev2 } });
    let me2 = await res.json();
    assert.equal(me2.user.email, 'somchai@test.local');

    // 4. Logout from all devices via device 1
    res = await fetch(`${srv.url}/api/auth/logout-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url, 'Cookie': cookieDev1 }
    });
    assert.equal(res.status, 200);
    const logoutJson = await res.json();
    assert.equal(logoutJson.ok, true);

    // 5. Verify both device 1 and device 2 sessions are invalidated
    res = await fetch(`${srv.url}/api/auth/me`, { headers: { 'Cookie': cookieDev1 } });
    me1 = await res.json();
    assert.equal(me1.user, null, 'Device 1 session must be invalidated');

    res = await fetch(`${srv.url}/api/auth/me`, { headers: { 'Cookie': cookieDev2 } });
    me2 = await res.json();
    assert.equal(me2.user, null, 'Device 2 session must be invalidated');

  } finally {
    if (srv?.child) {
      srv.child.kill();
      await new Promise(r => srv.child.once('exit', r));
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Auth: Social Login (Google & Facebook) and Phone OTP Login', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unfold-social-test-'));
  let srv;
  try {
    srv = await spawnServer(tempDir);

    // 1. Google Social Login (new user)
    let res = await fetch(`${srv.url}/api/auth/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url },
      body: JSON.stringify({
        provider: 'google',
        email: 'google.traveler@gmail.com',
        name: 'Google Traveler',
        providerId: 'gid_123456789'
      })
    });
    assert.equal(res.status, 201);
    let socialJson = await res.json();
    assert.equal(socialJson.ok, true);
    assert.equal(socialJson.user.email, 'google.traveler@gmail.com');
    assert.equal(socialJson.user.provider, 'google');
    const googleCookie = res.headers.get('set-cookie').split(';')[0];

    // Verify session works
    res = await fetch(`${srv.url}/api/auth/me`, { headers: { 'Cookie': googleCookie } });
    let me = await res.json();
    assert.equal(me.user.name, 'Google Traveler');
    assert.equal(me.user.provider, 'google');

    // 2. Facebook Social Login (existing email linking or login)
    res = await fetch(`${srv.url}/api/auth/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url },
      body: JSON.stringify({
        provider: 'facebook',
        email: 'google.traveler@gmail.com',
        name: 'Google Traveler (Linked FB)',
        providerId: 'fbid_987654321'
      })
    });
    assert.equal(res.status, 200);
    socialJson = await res.json();
    assert.equal(socialJson.user.email, 'google.traveler@gmail.com');

    // 3. Phone OTP Request
    res = await fetch(`${srv.url}/api/auth/phone/otp-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url },
      body: JSON.stringify({ phone: '0891234567' })
    });
    assert.equal(res.status, 200);
    const otpReq = await res.json();
    assert.equal(otpReq.ok, true);
    assert.ok(otpReq.devOtp, 'Should return dev OTP code');
    const receivedOtp = otpReq.devOtp;

    // 4. Verify with wrong OTP fails (400)
    res = await fetch(`${srv.url}/api/auth/phone/otp-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url },
      body: JSON.stringify({ phone: '0891234567', otp: '000000' })
    });
    assert.equal(res.status, 400);

    // 5. Verify with correct OTP succeeds (201 new user)
    res = await fetch(`${srv.url}/api/auth/phone/otp-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': srv.url },
      body: JSON.stringify({ phone: '0891234567', otp: receivedOtp, name: 'Somsak Mobile' })
    });
    assert.equal(res.status, 201);
    const phoneJson = await res.json();
    assert.equal(phoneJson.ok, true);
    assert.equal(phoneJson.user.name, 'Somsak Mobile');
    assert.equal(phoneJson.user.provider, 'phone');
    assert.equal(phoneJson.user.phone, '+66891234567');
    const phoneCookie = res.headers.get('set-cookie').split(';')[0];

    // Verify authenticated session for phone user
    res = await fetch(`${srv.url}/api/auth/me`, { headers: { 'Cookie': phoneCookie } });
    me = await res.json();
    assert.equal(me.user.phone, '+66891234567');
    assert.equal(me.user.provider, 'phone');

  } finally {
    if (srv?.child) {
      srv.child.kill();
      await new Promise(r => srv.child.once('exit', r));
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});


