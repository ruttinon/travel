'use strict';
// Tommy: OpenStreetMap place layer (backend/osm-places.js + scripts/osm/import_osm_places.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const osm = require('../backend/osm-places.js');

const SAMPLE = [
  {id: 'osm-w1', en: 'Wat Arun', th: 'วัดอรุณราชวราราม', kind: 'temple', category: 'culture', lat: 13.7437, lon: 100.4888, province: 'TH-10', provinceEn: 'Bangkok', provinceTh: 'กรุงเทพมหานคร', region: 'central'},
  {id: 'osm-n2', en: 'Wat Pho', th: 'วัดพระเชตุพนวิมลมังคลาราม', kind: 'temple', category: 'culture', lat: 13.7465, lon: 100.4930, province: 'TH-10', provinceEn: 'Bangkok', provinceTh: 'กรุงเทพมหานคร', region: 'central', tel: '+66 2 226 0335'},
  {id: 'osm-n3', en: 'Somewhere Cafe', th: 'ร้านกาแฟ', kind: 'cafe', category: 'food', lat: 13.7470, lon: 100.4940, province: 'TH-10', provinceEn: 'Bangkok', provinceTh: 'กรุงเทพมหานคร', region: 'central'},
  {id: 'osm-n4', en: 'Doi Suthep', th: 'ดอยสุเทพ', kind: 'peak', category: 'nature', lat: 18.8166, lon: 98.8924, province: 'TH-50', provinceEn: 'Chiang Mai', provinceTh: 'เชียงใหม่', region: 'north'},
  {id: 'osm-n5', en: 'Bad row', category: 'not-a-category', lat: 1, lon: 1}
];

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traval-osm-'));
  const file = path.join(dir, 'places.ndjson.gz');
  fs.writeFileSync(file, zlib.gzipSync(SAMPLE.map(p => JSON.stringify(p)).join('\n') + '\nnot json\n'));
  t.after(() => { osm.close(); fs.rmSync(dir, {recursive: true, force: true}); });
  return {dir, file};
}

test('import builds the place file and skips bad rows', t => {
  const {dir, file} = fixture(t);
  const r = osm.importFile(dir, file);
  assert.equal(r.count, 4);
  assert.equal(r.skipped, 2);
  assert.ok(fs.existsSync(path.join(dir, osm.FILE_NAME)));
  assert.equal(osm.stats(dir).count, 4);
});

test('area query returns only places in view, best first, in team field names', t => {
  const {dir, file} = fixture(t);
  osm.importFile(dir, file);
  const res = osm.placesInArea(dir, {bbox: '100.48,13.74,100.50,13.75'});
  assert.deepEqual(res.places.map(p => p.id), ['osm-w1', 'osm-n2', 'osm-n3'], 'temples rank before the cafe; Chiang Mai is outside');
  const p = res.places[1];
  assert.deepEqual({source: p.source, lat: p.lat, lon: p.lon, locEn: p.locEn, region: p.region, phone: p.phone},
    {source: 'osm', lat: 13.7465, lon: 100.493, locEn: 'Bangkok', region: 'central', phone: '+66 2 226 0335'});
  assert.deepEqual(osm.placesInArea(dir, {bbox: '100.48,13.74,100.50,13.75', category: 'food'}).places.map(p => p.id), ['osm-n3']);
  assert.equal(osm.placesInArea(dir, {bbox: '100.48,13.74,100.50,13.75', limit: 1}).truncated, true);
  assert.throws(() => osm.placesInArea(dir, {bbox: '90,0,120,30'}), /zoom in/);
  assert.throws(() => osm.placesInArea(dir, {bbox: 'x'}), /bbox/);
});

test('search works in Thai and English, nearest first when a position is given', t => {
  const {dir, file} = fixture(t);
  osm.importFile(dir, file);
  assert.deepEqual(osm.search(dir, {q: 'วัดอรุณ'}).places.map(p => p.id), ['osm-w1']);
  assert.deepEqual(osm.search(dir, {q: 'suthep'}).places.map(p => p.id), ['osm-n4']);
  assert.deepEqual(osm.search(dir, {q: 'Wat', lat: 13.7465, lon: 100.493}).places.map(p => p.id), ['osm-n2', 'osm-w1']);
  assert.deepEqual(osm.search(dir, {q: 'W'}).places, [], 'one letter is too short');
});

test('before any import the map API answers with an empty, honest result', () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'traval-osm-empty-'));
  osm.close();
  const out = osm.handle(empty, '/api/map/places', 'GET', new URLSearchParams({bbox: '100.48,13.74,100.50,13.75'}));
  assert.deepEqual(out, {status: 200, body: {places: [], total: 0, truncated: false, imported: false}});
  assert.equal(osm.handle(empty, '/api/places', 'GET', new URLSearchParams()), null, 'other routes are not ours');
  assert.equal(osm.handle(empty, '/api/map/places', 'GET', new URLSearchParams({bbox: 'bad'})).status, 200, 'not imported: no validation needed');
  fs.rmSync(empty, {recursive: true, force: true});
});

test('public OSM text is cleaned on import, so it cannot become a script or a fake link', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'traval-osm-xss-'));
  t.after(() => { osm.close(); fs.rmSync(dir, {recursive: true, force: true}); });
  const evil = {id: 'osm-n9', en: 'Evil Cafe', th: 'ร้าน', kind: 'cafe', category: 'food', lat: 13.75, lon: 100.5,
    province: 'TH-10', provinceEn: 'Bangkok', provinceTh: 'กรุงเทพมหานคร', region: 'central',
    hours: '<img src=x onerror=alert(1)>', tel: '"onmouseover=alert(1) 02-123-4567', web: 'javascript:alert(1)'};
  const file = path.join(dir, 'evil.ndjson');
  fs.writeFileSync(file, JSON.stringify(evil) + '\n');
  osm.importFile(dir, file);
  const [p] = osm.placesInArea(dir, {bbox: '100.4,13.7,100.6,13.8'}).places;
  assert.doesNotMatch(p.openingHours, /[<>"]/);
  assert.match(p.phone, /^[0-9+()\-\s;,]*$/, 'only phone characters: no quotes or letters that could break out of tel: links');
  assert.equal(p.website, '');
});
