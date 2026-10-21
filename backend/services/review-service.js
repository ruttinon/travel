'use strict';
const { db } = require('../db/connection');
const { fail, validString } = require('../utils/http');
const { userSession, isAdmin } = require('../utils/crypto');

const pickReviews = db.prepare("SELECT r.*,u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.place_slug=? AND r.status='approved' ORDER BY r.updated_at DESC LIMIT 100");

function reviewPublic(r, own = false) {
  const item = {
    id: r.id,
    placeId: r.place_slug,
    name: r.name,
    stars: r.stars,
    text: r.text,
    photo: r.photo,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
  if (!own) delete item.status;
  return item;
}

function safeReviewImage(photo, userId) {
  if (!photo) return '';
  const m = /^\/review-media\/([a-f0-9-]{36}\.(?:png|jpg|webp))$/.exec(photo);
  if (!m) fail(400, 'Use a photo uploaded through the review form');
  const found = db.prepare('SELECT owner_id FROM review_media WHERE filename=?').get(m[1]);
  if (!found || found.owner_id !== userId) fail(403, 'Review photo belongs to another user or is missing');
  return photo;
}

function reviewFileAccess(req, fileName) {
  const entry = db.prepare('SELECT owner_id FROM review_media WHERE filename=?').get(fileName);
  if (!entry) return false;
  const user = userSession(req);
  if (user?.id === entry.owner_id || isAdmin(req)) return true;
  return !!db.prepare("SELECT 1 FROM reviews r WHERE r.photo=? AND r.status='approved' AND EXISTS(SELECT 1 FROM places p WHERE p.slug=r.place_slug AND p.status='published')").get('/review-media/' + fileName);
}

function normalReview(b, userId) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) fail(400, 'Invalid review');
  const stars = Number(b.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) fail(400, 'Rating must be 1 to 5 stars');
  const body = validString(b.text, 1500, 'Review text', { required: true });
  if (body.length < 10) fail(400, 'Review must be at least 10 characters');
  const photo = safeReviewImage(b.photo, userId);
  return { stars, text: body, photo };
}

module.exports = {
  pickReviews,
  reviewPublic,
  safeReviewImage,
  reviewFileAccess,
  normalReview
};
