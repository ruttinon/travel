#!/usr/bin/env node
'use strict';
/* Import Traval's OpenStreetMap place list (owner: Tommy)
 *
 *   node scripts/osm/import_osm_places.js                  (uses scripts/osm/thailand-places.ndjson.gz)
 *   node scripts/osm/import_osm_places.js <other-file.ndjson.gz>
 *
 * Creates DATA/osm-places.sqlite (the same data folder the server uses). Safe to re-run:
 * it builds a fresh file and swaps it in. Stop the server first (Windows locks open files),
 * then start it again.
 * The input file comes from scripts/osm/build_thailand_places.py.
 */
const path = require('node:path');
const fs = require('node:fs');
const osm = require('../../backend/osm-places.js');

// Same rule as backend/server.js: UNFOLD_DATA_DIR, else ./data if present, else %LOCALAPPDATA%\unfold-travel\data
const { DATA } = require('../../backend/server.js');

// The place list ships with the project (3 MB), next to this script.
const source = process.argv[2] || path.join(__dirname, 'thailand-places.ndjson.gz');
if (!fs.existsSync(source)) {
  console.error(`Place file not found: ${source}\nUsage: node scripts/osm/import_osm_places.js <thailand-places.ndjson.gz>`);
  process.exit(1);
}
const started = Date.now();
const result = osm.importFile(DATA, path.resolve(source));
console.log(`Imported ${result.count.toLocaleString()} OpenStreetMap places (${result.skipped} skipped) into ${result.file} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.log('Start the server again to use them.');
process.exit(0);
