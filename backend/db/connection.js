'use strict';
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { DATA } = require('../config');
const { initSchema } = require('./schema');

const dbPath = path.join(DATA, 'unfold.sqlite');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
initSchema(db);

module.exports = { db, dbPath };
