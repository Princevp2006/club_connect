// ─── Express Application ─────────────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const prisma = require('./lib/prisma');

const app = express();

// ── Security & Parsing ──────────────────────────────
app.use(helmet());
const corsOrigins = config.cors.origin && config.cors.origin.includes(',')
  ? config.cors.origin.split(',').map((o) => o.trim())
  : config.cors.origin;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ─────────────────────────────────────────
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// ── Swagger ─────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Student Org API Docs',
}));

// Serve raw spec JSON for programmatic access
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Health Check ────────────────────────────────────
/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     servers:
 *       - url: /
 *     responses:
 *       200:
 *         description: Healthy
 *       503:
 *         description: Unhealthy
 */
app.get('/health', async (_req, res) => {
  try {
    // Check SQL Server connectivity
    await prisma.$queryRaw`SELECT 1 AS ok`;
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (err) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: config.nodeEnv === 'production' ? undefined : err.message,
    });
  }
});

// ── API Routes ──────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 Catch-all ───────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: 'Route not found',
  });
});

// ── Error Handler (must be last) ────────────────────
app.use(errorHandler);

module.exports = app;
