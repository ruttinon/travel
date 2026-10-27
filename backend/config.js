'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');

// Data directory resolution:
// 1. Process environment UNFOLD_DATA_DIR (for tests)
// 2. Project local './data' (preferred and transparent)
// 3. Fallback to Windows LOCALAPPDATA if local data is not found
function resolveDataDir() {
  if (process.env.UNFOLD_DATA_DIR) {
    return path.resolve(process.env.UNFOLD_DATA_DIR);
  }
  const localDir = path.join(ROOT, 'data');
  return localDir;
}

const DATA = resolveDataDir();
const UPLOADS = path.join(DATA, 'uploads');
const REVIEW_UPLOADS = path.join(DATA, 'review-media');
const SAFETY_UPLOADS = path.join(DATA, 'safety-media');
const SERVER_PID_FILE = path.join(DATA, 'server.pid');

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });
fs.mkdirSync(REVIEW_UPLOADS, { recursive: true });
fs.mkdirSync(SAFETY_UPLOADS, { recursive: true });

const PAGE_FILES = {
  'index.html': 'frontend/traveler/index.html',
  'app.js': 'frontend/traveler/app.js',
  'styles.css': 'frontend/traveler/styles.css',
  'sw.js': 'frontend/traveler/sw.js',
  'manifest.webmanifest': 'frontend/traveler/manifest.webmanifest',
  'admin.html': 'frontend/admin/admin.html',
  'admin.js': 'frontend/admin/admin.js',
  'admin.css': 'frontend/admin/admin.css',
  'admin-v26.css': 'frontend/admin/admin-v26.css',
  'audit.html': 'frontend/admin/audit.html',
  'audit.js': 'frontend/admin/audit.js',
  'audit.css': 'frontend/admin/audit.css',
  'moderation.html': 'frontend/admin/moderation.html',
  'moderation.js': 'frontend/admin/moderation.js',
  'moderation.css': 'frontend/admin/moderation.css',
  'review-v26.css': 'frontend/admin/review-v26.css',
  'business.html': 'frontend/business/business.html',
  'business.js': 'frontend/business/business.js',
  'business.css': 'frontend/business/business.css',
  'business-v26.css': 'frontend/business/business-v26.css',
  'business-admin.html': 'frontend/business/business-admin.html',
  'business-admin.js': 'frontend/business/business-admin.js',
  'business-admin.css': 'frontend/business/business-admin.css',
  'planner.html': 'frontend/planner/planner.html',
  'planner.js': 'frontend/planner/planner.js',
  'planner.css': 'frontend/planner/planner.css',
  'planner-showcase.html': 'frontend/planner/planner.html',
  'admin-showcase.html': 'frontend/admin/admin.html',
  'business-showcase.html': 'frontend/business/business.html',
  'planner-legacy.html': 'frontend/planner/planner-legacy.html',
  'admin-legacy.html': 'frontend/admin/admin-legacy.html',
  'business-legacy.html': 'frontend/business/business-legacy.html',
  'trip-engine.js': 'frontend/planner/trip-engine.js'
};

const CATEGORIES = new Set(['nature', 'food', 'stay', 'culture']);
const REGIONS = new Set(['north', 'south', 'central', 'northeast', 'east', 'west', 'world']);
const CURRENCIES = new Set(['THB', 'USD', 'EUR', 'JPY', 'GBP']);
const BUSINESS_TYPES = new Set(['food', 'stay', 'experience', 'other']);

const USER_SESS_AGE = 14 * 24 * 60 * 60; // 14 days
const SESS_AGE = 12 * 60 * 60; // 12 hours
const SETUP_TOKEN = crypto.randomBytes(9).toString('hex');
const REQUIRE_VERIFICATION = process.env.UNFOLD_REQUIRE_EMAIL_VERIFICATION === '1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon'
};

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code !== 'ESRCH';
  }
}

function lockDataDirectory() {
  try {
    fs.writeFileSync(SERVER_PID_FILE, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    let pid;
    try {
      pid = JSON.parse(fs.readFileSync(SERVER_PID_FILE, 'utf8')).pid;
    } catch {
      throw new Error('Existing server.pid is unreadable; inspect the data directory before starting');
    }
    if (pidAlive(pid)) {
      throw new Error('Another unfold server appears to be running with this database (PID ' + pid + '). Close it first.');
    }
    fs.rmSync(SERVER_PID_FILE);
    fs.writeFileSync(SERVER_PID_FILE, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), { flag: 'wx' });
  }
}

function unlockDataDirectory() {
  try {
    const entry = JSON.parse(fs.readFileSync(SERVER_PID_FILE, 'utf8'));
    if (entry.pid === process.pid) fs.unlinkSync(SERVER_PID_FILE);
  } catch {}
}

module.exports = {
  ROOT,
  DATA,
  UPLOADS,
  REVIEW_UPLOADS,
  SAFETY_UPLOADS,
  SERVER_PID_FILE,
  PAGE_FILES,
  CATEGORIES,
  REGIONS,
  CURRENCIES,
  BUSINESS_TYPES,
  USER_SESS_AGE,
  SESS_AGE,
  SETUP_TOKEN,
  REQUIRE_VERIFICATION,
  MIME,
  lockDataDirectory,
  unlockDataDirectory
};
