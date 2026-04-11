/**
 * CyberGuard Phase III - Data Management & Integration Server
 * 
 * Components:
 * 1. Data Access Layer (Controller → Service → Model)
 * 2. Database Integration (SQLite + NeDB)
 * 3. RESTful API (Express with OpenAPI-style endpoints)
 * 4. Asynchronous Data Processing (Event-driven job queue)
 * 5. Caching Strategy (In-memory with TTL + tag invalidation)
 * 6. Data Security & Validation (JWT, Helmet, sanitization, rate limiting)
 * 7. Data Transformation (JSON↔XML, STIX, external formats)
 * 8. Logging & Monitoring (Winston + metrics)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initSQLite, initNeDB } = require('./config/database');
const apiRoutes = require('./routes/api');
const { apiLimiter, requestLogger } = require('./middleware/security');
const asyncProcessor = require('./services/asyncProcessor');
const logger = require('./utils/logger');
const seedDatabase = require('./config/seed');

const app = express();
const PORT = process.env.PORT || 3002;

// ============================================================
// Global Middleware
// ============================================================
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger); // Request logging
app.use('/api/v3', apiLimiter); // Rate limiting

// ============================================================
// API Routes
// ============================================================
app.use('/api/v3', apiRoutes);

// ============================================================
// Root info endpoint
// ============================================================
app.get('/', (req, res) => {
  res.json({
    name: 'CyberGuard Phase III - Data Management & Integration',
    version: '3.0.0',
    endpoints: {
      api: '/api/v3',
      health: '/api/v3/health',
      docs: 'See README.md for full API documentation'
    },
    components: [
      '1. Data Access Layer (MVC pattern)',
      '2. Database Integration (SQLite + NeDB)',
      '3. RESTful API (Express)',
      '4. Async Processing (Event-driven queue)',
      '5. Caching (In-memory + TTL)',
      '6. Security (JWT + Helmet + Validation)',
      '7. Data Transformation (JSON/XML/STIX)',
      '8. Logging & Monitoring (Winston)'
    ]
  });
});

// ============================================================
// Error Handling Middleware
// ============================================================
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    success: false,
    error: { message: 'Internal server error', code: 500 },
    meta: { timestamp: new Date().toISOString() }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.path} not found`, code: 404 }
  });
});

// ============================================================
// Server Initialization
// ============================================================
async function startServer() {
  try {
    // Initialize databases
    await initSQLite();
    await initNeDB();
    logger.info('Databases initialized');

    // Seed sample data
    await seedDatabase();

    // Start async processor
    asyncProcessor.start(5000);

    // Start server
    app.listen(PORT, () => {
      console.log(`\n╔═══════════════════════════════════════════════════════╗`);
      console.log(`║  CyberGuard Phase III - Data Management Server       ║`);
      console.log(`║  Port: ${PORT}                                          ║`);
      console.log(`║  API Base: http://localhost:${PORT}/api/v3               ║`);
      console.log(`╚═══════════════════════════════════════════════════════╝\n`);
      console.log(`Active Components:`);
      console.log(`  ✓ Data Access Layer (MVC Architecture)`);
      console.log(`  ✓ SQLite Database (Relational)`);
      console.log(`  ✓ NeDB Database (NoSQL Document Store)`);
      console.log(`  ✓ RESTful API (Express + Validation)`);
      console.log(`  ✓ Async Processor (Event-driven Queue)`);
      console.log(`  ✓ Cache Manager (TTL + Tag Invalidation)`);
      console.log(`  ✓ Security (JWT + Helmet + Rate Limiting)`);
      console.log(`  ✓ Data Transformer (JSON/XML/STIX)`);
      console.log(`  ✓ Logger & Monitor (Winston)\n`);
      console.log(`Default credentials:`);
      console.log(`  Admin:   admin / Admin123!`);
      console.log(`  Analyst: analyst1 / Analyst123!\n`);
    });
  } catch (error) {
    logger.error('Server startup failed', { error: error.message });
    process.exit(1);
  }
}

startServer();

module.exports = app;
