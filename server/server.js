// ─── Server Entry Point ──────────────────────────────────────────────────────
const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`
  ┌─────────────────────────────────────────────────┐
  │  Student Organization Management System         │
  │  Environment : ${config.nodeEnv.padEnd(32)}│
  │  Port        : ${String(config.port).padEnd(32)}│
  │  API Base    : /api/v1${' '.repeat(25)}│
  │  Swagger     : /api-docs${' '.repeat(23)}│
  │  Health      : /health${' '.repeat(25)}│
  └─────────────────────────────────────────────────┘
  `);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received – shutting down gracefully …`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
