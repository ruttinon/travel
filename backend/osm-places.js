'use strict';
/* Traval backend — OpenStreetMap places for all of Thailand (owner: Tommy)
 *
 * A base layer of ~70,000 named places (temples, attractions, parks, beaches, cafés, hotels…)
 * so the map is never empty. Kept apart from the team's own `places` table on purpose:
 *  - its own file, DATA/osm-places.sqlite: backups and doctor.js are unchanged, and a monthly
 *    re-import simply replaces the file;
 *  - ODbL (OpenStreetMap licence) data stays separate from our own SME data;
 *  - Discover / Home keep showing only curated places; OSM places appear on the map and in search.
 * The browser never downloads all of them: it asks for the visible map area (GET /api/map/places).
 *
 * Data © OpenStreetMap contributors (ODbL 1.0) — the map shows this credit.
 */
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const FILE_NAME = 'osm-places.sqlite';
const MAX_RESULTS = 400;          // pins per map request
const GRID = 10;                  // spread results over a GRID×GRID grid so one busy street can't hide the rest
const MIN_SEARCH_CHARS = 2;
const CATEGORIES = ['nature', 'food', 'stay', 'culture'];

// Lower = shown first when an area has more places than MAX_RESULTS.
const KIND_RANK = {
  attraction: 1, temple: 1, museum: 1, viewpoint: 1, waterfall: 1, beach: 1, national_park: 1, palace: 1,
  ruins: 2, archaeological_site: 2, market: 2, park: 2, cave: 2, hot_spring: 2, zoo: 2, aquarium: 2, theme_park: 2, peak: 2, gallery: 2, monument: 2,
  garden: 3, memorial: 3, worship: 3, bay: 3, nature_reserve: 3, fort: 3, food_court: 3,
  cafe: 4, restaurant: 4,
  resort: 5, hotel: 5, guest_house: 5, hostel: 5, motel: 5, chalet: 5, camp_site: 5
};

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS osm_places (
    rid INTEGER PRIMARY KEY,
    id TEXT NOT NULL UNIQUE,            -- osm-n123 / osm-w123 / osm-r123
    name_en TEXT NOT NULL, name_th TEXT NOT NULL,
    kind TEXT NOT NULL, category TEXT NOT NULL, rank INTEGER NOT NULL,
    lat REAL NOT NULL, lon REAL NOT NULL,
    province TEXT NOT NULL, province_en TEXT NOT NULL, province_th TEXT NOT NULL, region TEXT NOT NULL,
    website TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', opening_hours TEXT NOT NULL DEFAULT '', wikidata TEXT NOT NULL DEFAULT ''
  );
  CREATE VIRTUAL TABLE IF NOT EXISTS osm_places_area USING rtree(rid, min_lon, max_lon, min_lat, max_lat);
  CREATE VIRTUAL TABLE IF NOT EXISTS osm_places_search USING fts5(name_en, name_th, content='osm_places', content_rowid='rid', tokenize='trigram');
  CREATE TABLE IF NOT EXISTS osm_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

let db = null;
function open(dataDir) {
  if (db) return db;
  const file = path.join(dataDir, FILE_NAME);
  if (!fs.existsSync(file)) return null; // not imported yet: the map simply shows curated places only
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA query_only=ON;');
  return db;
}
function close() { if (db) { db.close(); db = null; } }

function toPlace(r) {
  return {
    id: r.id, source: 'osm', en: r.name_en, th: r.name_th, kind: r.kind, category: r.category,
    lat: r.lat, lon: r.lon, locEn: r.province_en, locTh: r.province_th, province: r.province, region: r.region,
    website: r.website || '', phone: r.phone || '', openingHours: r.opening_hours || ''
  };
}

class OsmError extends Error { constructor(status, message) { super(message); this.status = status; } }

function parseBbox(raw) {
  const v = String(raw || '').split(',').map(Number);
  if (v.length !== 4 || !v.every(Number.isFinite)) throw new OsmError(400, 'bbox must be minLon,minLat,maxLon,maxLat');
  const [minLon, minLat, maxLon, maxLat] = v;
  if (minLon >= maxLon || minLat >= maxLat || Math.abs(minLat) > 90 || Math.abs(maxLat) > 90) throw new OsmError(400, 'Invalid bbox');
  if (maxLon - minLon > 12 || maxLat - minLat > 12) throw new OsmError(400, 'Area too large; zoom in');
  return {minLon, minLat, maxLon, maxLat};
}

/** Places inside the visible map area, at most MAX_RESULTS, spread over the area, most interesting first. */
function placesInArea(dataDir, query) {
  const conn = open(dataDir);
  if (!conn) return {places: [], total: 0, truncated: false, imported: false};
  const b = parseBbox(query.bbox);
  const category = query.category && query.category !== 'all' ? String(query.category) : null;
  if (category && !CATEGORIES.includes(category)) throw new OsmError(400, 'Invalid category');
  const limit = Math.max(1, Math.min(MAX_RESULTS, Number(query.limit) || MAX_RESULTS));
  const rows = conn.prepare(`SELECT p.* FROM osm_places_area a JOIN osm_places p ON p.rid=a.rid
      WHERE a.min_lon>=? AND a.max_lon<=? AND a.min_lat>=? AND a.max_lat<=? ${category ? 'AND p.category=?' : ''}
      ORDER BY p.rank, p.rid LIMIT 20000`)
    .all(...[b.minLon, b.maxLon, b.minLat, b.maxLat, ...(category ? [category] : [])]);
  if (rows.length <= limit) return {places: rows.map(toPlace), total: rows.length, truncated: false, imported: true};
  // Too many: take the best-ranked places from each grid cell in turn, so pins cover the whole view.
  const cells = new Map();
  const w = (b.maxLon - b.minLon) / GRID, h = (b.maxLat - b.minLat) / GRID;
  for (const r of rows) {
    const key = Math.min(GRID - 1, Math.floor((r.lon - b.minLon) / w)) * GRID + Math.min(GRID - 1, Math.floor((r.lat - b.minLat) / h));
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(r); // rows arrive best rank first
  }
  const picked = [];
  for (let round = 0; picked.length < limit; round++) {
    let added = false;
    for (const list of cells.values()) {
      if (round < list.length) { picked.push(list[round]); added = true; if (picked.length >= limit) break; }
    }
    if (!added) break;
  }
  return {places: picked.map(toPlace), total: rows.length, truncated: true, imported: true};
}

/** Name search in Thai or English. Optional lat/lon puts nearer places first. */
function search(dataDir, query) {
  const conn = open(dataDir);
  const q = String(query.q || '').trim().slice(0, 80);
  if (!conn || q.length < MIN_SEARCH_CHARS) return {places: [], imported: !!conn};
  const limit = Math.max(1, Math.min(50, Number(query.limit) || 20));
  let rows;
  if (q.length >= 3) {
    // trigram index: substring match, works for Thai (no spaces between words)
    const phrase = '"' + q.replace(/"/g, '""') + '"';
    rows = conn.prepare(`SELECT p.* FROM osm_places_search s JOIN osm_places p ON p.rid=s.rowid
        WHERE osm_places_search MATCH ? ORDER BY p.rank LIMIT 500`).all(phrase);
  } else {
    rows = conn.prepare(`SELECT * FROM osm_places WHERE name_en LIKE ? OR name_th LIKE ? ORDER BY rank LIMIT 500`).all(q + '%', q + '%');
  }
  // Best match first: exact name, then name starting with the text, then containing it;
  // within each group the more interesting kind, then (if a position is given) the nearer place, then the shorter name.
  const lower = q.toLowerCase();
  const match = r => {
    const names = [r.name_en.toLowerCase(), r.name_th];
    return names.includes(lower) ? 0 : names.some(n => n.startsWith(lower)) ? 1 : 2;
  };
  const lat = Number(query.lat), lon = Number(query.lon), near = Number.isFinite(lat) && Number.isFinite(lon);
  const dist = r => near ? (r.lat - lat) ** 2 + ((r.lon - lon) * Math.cos(lat * Math.PI / 180)) ** 2 : 0;
  rows.sort((a, b) => match(a) - match(b) || (near ? dist(a) - dist(b) : a.rank - b.rank) || a.name_en.length - b.name_en.length);
  return {places: rows.slice(0, limit).map(toPlace), imported: true};
}

function stats(dataDir) {
  const conn = open(dataDir);
  if (!conn) return {imported: false};
  const meta = Object.fromEntries(conn.prepare('SELECT key,value FROM osm_meta').all().map(r => [r.key, r.value]));
  return {imported: true, count: conn.prepare('SELECT count(*) AS n FROM osm_places').get().n, ...meta};
}

/** Route handler for server.js. Returns null when the route isn't ours. */
function handle(dataDir, route, method, searchParams) {
  if (method !== 'GET' || !route.startsWith('/api/map/')) return null;
  const query = Object.fromEntries(searchParams);
  try {
    if (route === '/api/map/places') return {status: 200, body: placesInArea(dataDir, query)};
    if (route === '/api/map/search') return {status: 200, body: search(dataDir, query)};
    if (route === '/api/map/osm-status') return {status: 200, body: stats(dataDir)};
  } catch (err) {
    if (err instanceof OsmError) return {status: err.status, body: {error: err.message}};
    throw err;
  }
  return null;
}

/**
 * Build DATA/osm-places.sqlite from the NDJSON(.gz) made by scripts/osm/build_thailand_places.py.
 * Writes to a temporary file first and swaps it in, so a failed import never breaks the app.
 */
function importFile(dataDir, sourceFile) {
  const zlib = require('node:zlib');
  let text = fs.readFileSync(sourceFile);
  if (sourceFile.endsWith('.gz')) text = zlib.gunzipSync(text);
  const lines = text.toString('utf8').split('\n').filter(Boolean);
  const target = path.join(dataDir, FILE_NAME), temp = target + '.importing';
  for (const f of [temp, temp + '-wal', temp + '-shm']) fs.rmSync(f, {force: true});
  const out = new DatabaseSync(temp);
  out.exec(SCHEMA);
  const insert = out.prepare(`INSERT OR IGNORE INTO osm_places(id,name_en,name_th,kind,category,rank,lat,lon,province,province_en,province_th,region,website,phone,opening_hours,wikidata)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const area = out.prepare('INSERT INTO osm_places_area(rid,min_lon,max_lon,min_lat,max_lat) VALUES(?,?,?,?,?)');
  let count = 0, skipped = 0;
  out.exec('BEGIN');
  for (const line of lines) {
    let p;
    try { p = JSON.parse(line); } catch { skipped++; continue; }
    if (!p.id || !p.en || !Number.isFinite(p.lat) || !Number.isFinite(p.lon) || !CATEGORIES.includes(p.category)) { skipped++; continue; }
    // OSM is edited by the public: keep only safe shapes for fields the app turns into links or prints.
    const web = /^https?:\/\/[^\s"'<>]+$/i.test(p.web || '') ? p.web : '';
    const tel = String(p.tel || '').replace(/[^0-9+()\-\s;,]/g, '').trim().slice(0, 60);
    const hours = String(p.hours || '').replace(/[<>"`]/g, '').slice(0, 200);
    const r = insert.run(p.id, String(p.en).slice(0, 200), String(p.th || p.en).slice(0, 200), p.kind, p.category, KIND_RANK[p.kind] || 4,
      p.lat, p.lon, p.province || '', p.provinceEn || '', p.provinceTh || '', p.region || '', web, tel, hours, p.wd || '');
    if (r.changes) { area.run(r.lastInsertRowid, p.lon, p.lon, p.lat, p.lat); count++; } else skipped++;
  }
  out.exec("INSERT INTO osm_places_search(osm_places_search) VALUES('rebuild')");
  const meta = out.prepare('INSERT OR REPLACE INTO osm_meta(key,value) VALUES(?,?)');
  meta.run('importedAt', new Date().toISOString());
  meta.run('source', path.basename(sourceFile));
  meta.run('licence', 'Data © OpenStreetMap contributors, ODbL 1.0');
  out.exec('COMMIT');
  out.exec('PRAGMA journal_mode=DELETE; VACUUM;');
  out.close();
  close(); // release the old file if this process had it open
  fs.renameSync(temp, target);
  return {count, skipped, file: target};
}

module.exports = {FILE_NAME, MAX_RESULTS, KIND_RANK, parseBbox, placesInArea, search, stats, handle, importFile, close};
