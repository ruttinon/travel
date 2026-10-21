'use strict';
const { db } = require('../db/connection');

const writeAudit = db.prepare('INSERT INTO audit_events(occurred_at,actor_type,actor_id,action,entity_type,entity_id,context_json) VALUES(?,?,?,?,?,?,?)');

function audit(actorType, actorId, action, entityType, entityId, context = {}) {
  writeAudit.run(new Date().toISOString(), actorType, String(actorId), action, entityType, String(entityId), JSON.stringify(context));
}

function placeAuditSummary(row) {
  return row ? { name: row.name_en, status: row.status, category: row.category } : null;
}

module.exports = {
  audit,
  placeAuditSummary
};
