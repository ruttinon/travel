'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { UPLOADS } = require('../config');

function reply(res, status, body, headers = {}) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': String(data.length),
    ...headers
  });
  res.end(data);
}

function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  throw e;
}

function validString(v, max, label, { required = false } = {}) {
  if (v == null) v = '';
  if (typeof v !== 'string') fail(400, `${label} must be text`);
  const s = v.trim();
  if (s.length > max || (required && !s)) fail(400, `${label} is required or too long`);
  return s;
}

function imagePath(value) {
  const v = validString(value, 256, 'image');
  if (!v) return '';
  if (!/^\/uploads\/[a-f0-9-]{36}\.(?:png|jpg|webp)$/.test(v)) fail(400, 'Image must come from the Admin upload tool');
  if (!fs.existsSync(path.join(UPLOADS, path.basename(v)))) fail(400, 'Uploaded image no longer exists');
  return v;
}

function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  let u;
  try {
    u = new URL(origin);
  } catch {
    fail(403, 'Invalid origin');
  }
  const host = req.headers.host;
  if (u.host !== host || !['http:', 'https:'].includes(u.protocol)) {
    fail(403, 'Cross-origin requests are not allowed');
  }
}

function checkHost(req) {
  const host = (req.headers.host || '').toLowerCase();
  if (!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)) {
    fail(403, 'This local server accepts localhost only');
  }
}

async function jsonBody(req) {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
    fail(415, 'Send application/json');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8_000_000) fail(413, 'Request too large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    fail(400, 'Invalid JSON body');
  }
}

function uploadImageTo(body, destination = UPLOADS, prefix = '/uploads/') {
  const data = validString(body?.dataUrl, 8_000_000, 'dataUrl', { required: true });
  const match = /^data:image\/(png|jpeg|webp);base64,([a-z0-9+/=]+)$/i.exec(data);
  if (!match) fail(400, 'Only PNG, JPEG, and WebP images accepted');
  const buf = Buffer.from(match[2], 'base64');
  if (buf.length < 64 || buf.length > 5 * 1024 * 1024) fail(400, 'Image must be 64 bytes to 5 MB');
  const tag = match[1].toLowerCase(),
    detected = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff ? 'jpeg'
      : buf.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ? 'png'
      : buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : null;
  if (detected !== tag) fail(400, 'Invalid image signature');
  const ext = tag === 'jpeg' ? 'jpg' : tag;
  const filename = crypto.randomUUID() + '.' + ext;
  fs.writeFileSync(path.join(destination, filename), buf, { flag: 'wx' });
  return { url: prefix + filename, size: buf.length };
}

function uploadImage(body) {
  return uploadImageTo(body);
}

module.exports = {
  reply,
  fail,
  validString,
  imagePath,
  checkOrigin,
  checkHost,
  jsonBody,
  uploadImageTo,
  uploadImage
};
