/**
 * Utility Script: Import Public Places from OpenStreetMap (Overpass API)
 * Zero Cost · Public Domain Data · Direct SQLite Integration
 * 
 * Usage:
 *   node scripts/import_osm_places.js [province_lat] [province_lon] [radius_km] [category]
 * Example:
 *   node scripts/import_osm_places.js 18.7904 98.9853 15 cafe
 */
const { db } = require('../backend/server.js');

async function importFromOSM(lat = 18.7904, lon = 98.9853, radiusKm = 10, category = 'tourism') {
  console.log(`[OSM Importer] Searching public ${category} places within ${radiusKm}km around (${lat}, ${lon})...`);

  // Calculate bounding box
  const delta = radiusKm / 111;
  const bbox = `${lat - delta},${lon - delta},${lat + delta},${lon + delta}`;

  const queryTag = category === 'cafe' ? '["amenity"="cafe"]' :
                   category === 'food' ? '["amenity"="restaurant"]' :
                   category === 'temple' ? '["amenity"="place_of_worship"]' :
                   '["tourism"~"viewpoint|attraction|museum|theme_park"]';

  const overpassQuery = `
    [out:json][timeout:25];
    (
      node${queryTag}(${bbox});
    );
    out body 25;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'TravalPlatform/2.7' } });
    if (!res.ok) throw new Error(`Overpass API responded with HTTP ${res.status}`);
    const data = await res.json();
    const elements = data.elements || [];

    console.log(`[OSM Importer] Found ${elements.length} places from OpenStreetMap.`);

    let added = 0;
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO places(
        slug, name_en, name_th, location_en, location_th,
        category, region, lat, lon, visit, description_en, description_th,
        cover, gallery_json, featured, status, is_sme, price_currency, created_at, updated_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    const now = new Date().toISOString();

    for (const el of elements) {
      const name = el.tags?.name || el.tags?.['name:th'] || el.tags?.['name:en'];
      if (!name) continue;

      const nameTh = el.tags?.['name:th'] || name;
      const nameEn = el.tags?.['name:en'] || name;
      const slug = 'osm-' + el.id;

      const placeCat = category === 'cafe' || category === 'food' ? 'food' : 'nature';

      insertStmt.run(
        slug,
        nameEn,
        nameTh,
        'Thailand',
        'ประเทศไทย',
        placeCat,
        'north',
        el.lat,
        el.lon,
        '1–2h',
        el.tags?.description || 'Public landmark from OpenStreetMap.',
        el.tags?.['description:th'] || 'สถานที่ท่องเที่ยวและจุดพักผ่อนสาธารณะจาก OpenStreetMap',
        'assets/terraced-fields.webp',
        JSON.stringify(['assets/terraced-fields.webp']),
        0,
        'published',
        0,
        'THB',
        now,
        now
      );
      added++;
    }

    console.log(`[OSM Importer] Successfully imported ${added} new places into SQLite!`);
    console.log(`Run 'node backend/server.js' to see them on your Traval map.`);
  } catch (err) {
    console.error(`[OSM Importer Error] ${err.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const lat = parseFloat(args[0]) || 18.7904;
  const lon = parseFloat(args[1]) || 98.9853;
  const rad = parseFloat(args[2]) || 10;
  const cat = args[3] || 'tourism';
  importFromOSM(lat, lon, rad, cat).then(() => process.exit(0));
}

module.exports = { importFromOSM };
