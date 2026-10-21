'use strict';
// Traval Project Entry Point
// Backend modules and API router are located in backend/
const backend = require('./backend/server.js');

if (require.main === module) {
  const arg = Number(process.env.PORT || 5173);
  backend.listen(Number.isInteger(arg) && arg >= 0 && arg < 65536 ? arg : 5173, process.env.PORT ? 0 : 12);
}

module.exports = backend;
