'use strict';
const { reply, jsonBody } = require('../utils/http');
const { audit } = require('../utils/audit');
const { userSession } = require('../utils/crypto');
const { generateAiTripPlan } = require('../services/ai-engine');

async function handleAiRoutes(req, res, pathOnly, method, u) {
  if (method === 'POST' && pathOnly === '/api/ai/advisor') {
    const b = await jsonBody(req);
    const plan = generateAiTripPlan(b);
    const user = userSession(req);
    audit(user ? 'user' : 'anonymous', user?.id || 'guest', 'ai.generate_plan', 'ai', 'advisor', {
      destination: b.destination,
      days: b.days,
      type: plan.type
    });
    return reply(res, 200, { ok: true, plan });
  }

  return false;
}

module.exports = { handleAiRoutes };
