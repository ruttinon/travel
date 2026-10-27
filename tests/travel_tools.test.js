'use strict';
// Tommy: tests for the shared travel tools (frontend/shared/*) and road routing (backend/routing.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const cost = require('../frontend/shared/travel-cost.js');
const links = require('../frontend/shared/maps-links.js');
const roadRoute = require('../frontend/shared/road-route.js');
const routing = require('../backend/routing.js');

/* ---------- travel-cost.js ---------- */
test('taxi fare follows the Bangkok meter bands', () => {
  assert.equal(cost.taxiFare(0.5), 35);                         // inside the flag fall
  assert.equal(cost.taxiFare(1), 35);
  assert.equal(cost.taxiFare(12, 10), 35 + 9 * 6.5 + 2 * 7 + 30); // 137.5
  assert.equal(cost.taxiFare(25), 35 + 58.5 + 70 + 5 * 8);       // 203.5
  assert.equal(cost.taxiFare(100), 35 + 58.5 + 70 + 160 + 170 + 180 + 20 * 10.5); // all bands
  assert.equal(cost.taxiFare(-1), null);
});

test('taxi range, fuel and whole-trip cost', () => {
  assert.deepEqual(cost.taxiFareRange(12, 20, 1.5), {min: 108, max: 138, currency: 'THB'});
  assert.equal(cost.fuelCost(24, {kmPerLitre: 12, pricePerLitre: 35}), 70);
  const legs = [{distanceKm: 1.5, travelMinutes: 6}, {distanceKm: 0.6, travelMinutes: 3}];
  const trip = cost.tripCost(legs, 'driving', {trafficFactor: 1});
  assert.equal(trip.taxi.min, 38 + 35, 'each leg is its own ride, so the flag fall is charged per leg');
  assert.deepEqual(cost.tripCost(legs, 'walking').taxi, {min: 0, max: 0});
  assert.equal(cost.tripCost(legs, 'transit').taxi, null);
});

/* ---------- maps-links.js ---------- */
const watPho = {id: 'wat-pho', en: 'Wat Pho', locEn: 'Bangkok', lat: 13.7465, lon: 100.493};
const watArun = {id: 'wat-arun', en: 'Wat Arun', locEn: 'Bangkok', lat: 13.7437, lon: 100.4888, googlePlaceId: 'ChIJTEST123'};

test('directions link uses our coordinates, or the Place ID when we have one', () => {
  const one = links.directionsUrl([watPho], 'walking');
  assert.match(one, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=13\.746500%2C100\.493000&travelmode=walking$/);
  const withId = links.directionsUrl([watPho, watArun], 'taxi');
  assert.match(withId, /origin=13\.746500%2C100\.493000/);
  assert.match(withId, /destination_place_id=ChIJTEST123/);
  assert.match(withId, /travelmode=driving/, 'taxi is driving for Google');
  const many = links.directionsUrl(Array.from({length: 14}, (_, i) => ({...watPho, lat: 13.7 + i / 1000})), 'driving');
  assert.equal(decodeURIComponent(many.match(/waypoints=([^&]+)/)[1]).split('|').length, links.MAX_WAYPOINTS);
});

test('place link opens the Google page for reviews', () => {
  assert.equal(links.placeUrl(watArun), 'https://www.google.com/maps/search/?api=1&query=Wat%20Arun%2C%20Bangkok&query_place_id=ChIJTEST123');
  assert.equal(links.placeUrl(watPho), 'https://www.google.com/maps/search/?api=1&query=Wat%20Pho%2C%20Bangkok');
});

/* ---------- road-route.js (browser client) ---------- */
test('route client returns the road result, and falls back to an estimate when routing fails', async () => {
  const road = {source: 'road', distanceKm: 0.9, travelMinutes: 4, legs: [{distanceKm: 0.9, travelMinutes: 4}], line: [[13.7465, 100.493], [13.7437, 100.4888]]};
  const ok = await roadRoute.route([watPho, watArun], 'driving', {request: async () => ({ok: true, status: 200, json: async () => road})});
  assert.equal(ok.source, 'road');
  const down = await roadRoute.route([watPho, {...watArun, lat: 13.75}], 'driving', {request: async () => { throw new Error('offline'); }});
  assert.equal(down.source, 'estimate');
  assert.equal(down.legs.length, 1);
  assert.ok(down.distanceKm > 0.5 && down.distanceKm < 1.2, 'straight line × detour factor');
  assert.equal(await roadRoute.route([watPho], 'driving'), null, 'one stop is not a route');
});

/* ---------- backend/routing.js ---------- */
const osrmReply = {code: 'Ok', routes: [{distance: 1234, duration: 300,
  legs: [{distance: 1234, duration: 300}], geometry: {coordinates: [[100.493, 13.7465], [100.4888, 13.7437]]}}]};

test('routing validates input and maps travel modes', async () => {
  routing._resetForTests();
  assert.throws(() => routing.parsePoints([{lat: 1, lon: 1}]), /at least 2/);
  assert.throws(() => routing.parsePoints([{lat: 1, lon: 1}, {lat: 'x', lon: 2}]), /Point 2/);
  assert.throws(() => routing.parseTravelMode('boat'), /travelMode/);
  const transit = await routing.handleRouteRequest({points: [watPho, watArun], travelMode: 'transit'}, 'a');
  assert.equal(transit.status, 422);
});

test('routing converts OSRM to team field names, tries the next server, and caches', async () => {
  routing._resetForTests();
  const calls = [];
  const fakeFetch = async url => {
    calls.push(url);
    if (calls.length === 1) return {ok: false, status: 502, json: async () => ({})}; // first server down
    return {ok: true, status: 200, json: async () => osrmReply};
  };
  const r = await routing.roadRoute([watPho, watArun], 'taxi', {fetchImpl: fakeFetch});
  assert.deepEqual({source: r.source, distanceKm: r.distanceKm, travelMinutes: r.travelMinutes, travelMode: r.travelMode},
    {source: 'road', distanceKm: 1.23, travelMinutes: 5, travelMode: 'taxi'});
  assert.deepEqual(r.line[0], [13.7465, 100.493], 'line is [lat, lon]');
  assert.equal(calls.length, 2);
  const again = await routing.roadRoute([watPho, watArun], 'driving', {fetchImpl: fakeFetch});
  assert.equal(again.cached, true);
  assert.equal(calls.length, 2, 'second request served from cache');
});

/* ---------- server: POST /api/routes and the shared files ---------- */
test('server serves the shared tools and answers /api/routes', async t => {
  const fakeOsrm = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(osrmReply));
  });
  await new Promise(r => fakeOsrm.listen(0, '127.0.0.1', r));
  const osrmUrl = `http://127.0.0.1:${fakeOsrm.address().port}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traval-routes-'));
  const proc = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    env: {...process.env, UNFOLD_DATA_DIR: dir, UNFOLD_NO_BROWSER: '1', PORT: '0', TRAVAL_OSRM_CAR: osrmUrl, TRAVAL_OSRM_FOOT: osrmUrl},
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => { proc.kill(); fakeOsrm.close(); fs.rmSync(dir, {recursive: true, force: true}); });
  const base = await new Promise((resolve, reject) => {
    let buf = '';
    proc.stdout.on('data', c => { buf += c; const m = /http:\/\/127\.0\.0\.1:(\d+)\//.exec(buf); if (m) resolve(`http://127.0.0.1:${m[1]}`); });
    proc.once('exit', code => reject(new Error('server exited ' + code)));
  });

  for (const file of ['map-gestures.js', 'road-route.js', 'travel-cost.js', 'maps-links.js', 'trip-engine.js']) {
    const res = await fetch(`${base}/${file}`);
    assert.equal(res.status, 200, file);
  }
  const post = body => fetch(`${base}/api/routes`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const ok = await post({points: [watPho, watArun], travelMode: 'walking'});
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.equal(data.source, 'road');
  assert.equal(data.legs.length, 1);
  assert.equal((await post({points: [watPho]})).status, 400);
});
