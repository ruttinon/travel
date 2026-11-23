'use strict';
// Tommy: the AI trip plan (POST /api/ai/advisor) and cost endpoint use the shared map tools.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const TravalCost = require('../frontend/shared/travel-cost.js');
const TravalRoute = require('../frontend/shared/road-route.js');

function startServer(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js'), '0'], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Server start timeout')); }, 15000);
    child.stdout.on('data', c => { out += c; const m = out.match(/http:\/\/127\.0\.0\.1:(\d+)/); if (m) { clearTimeout(timer); resolve({ child, url: `http://127.0.0.1:${m[1]}` }); } });
  });
}

const PLACES = [
  ['wat-umong', 'Wat Umong', 'วัดอุโมงค์', 'Chiang Mai', 'เชียงใหม่', 18.7832, 98.9516, 0],
  ['doi-suthep', 'Doi Suthep', 'ดอยสุเทพ', 'Chiang Mai', 'เชียงใหม่', 18.8048, 98.9216, 0],
  ['mon-jam', 'Mon Jam', 'ม่อนแจ่ม', 'Mae Rim, Chiang Mai', 'แม่ริม เชียงใหม่', 18.9361, 98.8217, 0],
  ['nimman-cafe', 'Nimman Cafe', 'ร้านกาแฟนิมมาน', 'Chiang Mai', 'เชียงใหม่', 18.7990, 98.9675, 1],
  ['wat-arun', 'Wat Arun', 'วัดอรุณ', 'Bangkok', 'กรุงเทพฯ', 13.7437, 100.4888, 0],
  ['talad-noi', 'Talad Noi', 'ตลาดน้อย', 'Bangkok', 'กรุงเทพฯ', 13.7330, 100.5130, 1]
];

test('AI plan: planner destination ids match, picked places are kept, travel cost uses TravalCost', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traval-plan-'));
  const srv = await startServer({ UNFOLD_DATA_DIR: dir });
  t.after(() => { srv.child.kill(); fs.rmSync(dir, { recursive: true, force: true }); });
  const db = new DatabaseSync(path.join(dir, 'unfold.sqlite'));
  const now = new Date().toISOString();
  const add = db.prepare("INSERT INTO places(slug,name_en,name_th,location_en,location_th,category,region,lat,lon,status,created_at,updated_at,is_sme) VALUES(?,?,?,?,?,'culture','north',?,?,'published',?,?,?)");
  for (const p of PLACES) add.run(...p.slice(0, 7), now, now, p[7]);
  db.close();
  const plan = async body => (await (await fetch(`${srv.url}/api/ai/advisor`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json()).plan;

  // 'chiang-mai' (the planner's option value) must find the Chiang Mai places, not all of Thailand.
  let p = await plan({ destination: 'chiang-mai', destinationName: 'เชียงใหม่', days: 1, travelMode: 'driving', pace: 'moderate' });
  const ids = p.dailyItinerary.flatMap(d => d.places.map(x => x.id));
  assert.ok(ids.length >= 3 && ids.every(id => !['wat-arun', 'talad-noi'].includes(id)), 'only Chiang Mai: ' + ids);
  assert.match(p.title, /เชียงใหม่/);

  // Legs and cost come from the shared tools.
  const day = p.dailyItinerary[0];
  assert.equal(day.legs.length, day.places.length - 1);
  const expected = TravalRoute.estimate(day.places, 'driving');
  assert.deepEqual(day.legs, expected.legs);
  assert.equal(p.budgetBreakdown.transport, TravalCost.tripCost(expected.legs, 'driving').fuel);

  p = await plan({ destination: 'chiang-mai', days: 1, travelMode: 'taxi' });
  const taxi = TravalCost.tripCost(p.dailyItinerary[0].legs, 'driving').taxi;
  assert.equal(p.budgetBreakdown.transport, Math.round((taxi.min + taxi.max) / 2), 'taxi: each leg is its own meter ride');

  // A place picked in the app is kept even when it is in another city.
  p = await plan({ destination: 'chiang-mai', days: 1, travelMode: 'driving', mustVisit: ['wat-arun'] });
  assert.ok(p.dailyItinerary.flatMap(d => d.places.map(x => x.id)).includes('wat-arun'));

  // Cost endpoint: same meter maths as the pages.
  const cost = await (await fetch(`${srv.url}/api/trips/estimate-cost?distanceKm=12&travelMinutes=30`)).json();
  assert.equal(cost.taxiFare.min, Math.round(TravalCost.taxiFare(12)));
  assert.equal(cost.taxiFare.max, TravalCost.taxiFareRange(12, 30).max);
  assert.equal(cost.fuelCost.min, TravalCost.fuelCost(12));
});
