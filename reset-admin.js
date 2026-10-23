'use strict';
// Script to set or reset the Master Admin password on the local machine.
// Usage: node reset-admin.js [optional_new_password]

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const DATA = path.resolve(
  process.env.UNFOLD_DATA_DIR ||
  (fs.existsSync(path.join(ROOT, 'data', 'unfold.sqlite'))
    ? path.join(ROOT, 'data')
    : process.platform === 'win32' && process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'unfold-travel', 'data')
      : path.join(ROOT, 'data'))
);

const DB_FILE = path.join(DATA, 'unfold.sqlite');
if (!fs.existsSync(DB_FILE)) {
  console.error('[ERROR] Database file not found at:', DB_FILE);
  console.error('Please run START-WINDOWS.cmd once to initialize the platform.');
  process.exit(1);
}

const newPassword = process.argv[2] || 'Admin@12345678';
if (newPassword.length < 8) {
  console.error('[ERROR] Password must be at least 8 characters long.');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const passwordHash = crypto.scryptSync(newPassword, salt, 64, { maxmem: 128 * 1024 * 1024 }).toString('hex');

const db = new DatabaseSync(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY CHECK(id=1),
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  );
`);

const existing = db.prepare('SELECT id FROM admins WHERE id=1').get();
const now = new Date().toISOString();

if (existing) {
  db.prepare('UPDATE admins SET salt=?, password_hash=?, created_at=? WHERE id=1').run(salt, passwordHash, now);
} else {
  db.prepare('INSERT INTO admins(id, salt, password_hash, created_at) VALUES(1, ?, ?, ?)').run(salt, passwordHash, now);
}

// Clear all active admin sessions so a fresh login is required
db.prepare('DELETE FROM sessions').run();
db.close();

console.log('');
console.log('========================================================================');
console.log('   🎉 UNFOLD / TRAVAL — รีเซ็ตรหัสผ่านผู้ดูแลระบบ (ADMIN) สำเร็จแล้ว!    ');
console.log('========================================================================');
console.log(' 📍 ลิงก์เข้าสู่ระบบ Admin:  http://127.0.0.1:5173/admin.html');
console.log(' 👤 บัญชีผู้ใช้ (Username):  admin (หรือปล่อยว่าง)');
console.log(` 🔑 รหัสผ่าน (Password):     ${newPassword}`);
console.log('========================================================================');
console.log(' 👉 ตอนนี้คุณสามารถเปิดหน้า http://127.0.0.1:5173/admin.html แล้วเข้าใช้งานได้ทันที');
console.log('');
