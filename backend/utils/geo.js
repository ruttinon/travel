'use strict';
const { fail } = require('./http');

function parsedCoord(raw, label, min, max) {
  const val = Number(raw);
  if (raw == null || raw === '' || !Number.isFinite(val) || val < min || val > max) {
    fail(400, `Invalid ${label}`);
  }
  return val;
}

function kmBetween(a, b, c, d) {
  const rad = Math.PI / 180,
    dlat = (c - a) * rad,
    dlon = (d - b) * rad;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(dlon / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

module.exports = {
  parsedCoord,
  kmBetween
};
