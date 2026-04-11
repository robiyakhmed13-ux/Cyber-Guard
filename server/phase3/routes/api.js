/**
 * API Routes - Phase III Component 3
 * 
 * RESTful API design with:
 * - Standard HTTP methods (GET, POST, PUT, DELETE)
 * - Structured JSON request/response
 * - Appropriate HTTP status codes
 * - Clear endpoint design
 * - Authentication and validation middleware
 */

const express = require('express');
const router = express.Router();
const {
  AuthController,
  IncidentController,
  ThreatIntelController,
  SystemController
} = require('../controllers');
const {
  authenticateToken,
  optionalAuth,
  authorize,
  validationRules,
  validate,
  authLimiter,
  sanitizeMiddleware
} = require('../middleware/security');
const cacheService = require('../services/cacheService');

// Apply sanitization to all routes
router.use(sanitizeMiddleware);

// ============================================================
// Auth Routes
// ============================================================
router.post('/auth/register',
  authLimiter,
  validationRules.createUser,
  validate,
  AuthController.register
);

router.post('/auth/login',
  authLimiter,
  validationRules.login,
  validate,
  AuthController.login
);

// ============================================================
// Incident Routes (SQLite CRUD)
// ============================================================
router.post('/incidents',
  authenticateToken,
  validationRules.createIncident,
  validate,
  IncidentController.create
);

router.get('/incidents',
  optionalAuth,
  IncidentController.getAll
);

router.get('/incidents/statistics',
  optionalAuth,
  IncidentController.getStatistics
);

router.get('/incidents/:id',
  optionalAuth,
  IncidentController.getById
);

router.put('/incidents/:id',
  authenticateToken,
  validationRules.updateIncident,
  validate,
  IncidentController.update
);

router.delete('/incidents/:id',
  authenticateToken,
  authorize('admin'),
  IncidentController.delete
);

// Data transformation endpoints
router.get('/incidents/:id/xml',
  optionalAuth,
  IncidentController.getAsXml
);

router.get('/incidents/:id/external',
  optionalAuth,
  IncidentController.getAsExternalFormat
);

router.get('/incidents/:id/stix',
  optionalAuth,
  IncidentController.getAsStix
);

// ============================================================
// Threat Intelligence Routes (NeDB CRUD)
// ============================================================
router.post('/threat-intel',
  authenticateToken,
  validationRules.createThreatIntel,
  validate,
  ThreatIntelController.create
);

router.get('/threat-intel',
  optionalAuth,
  ThreatIntelController.getAll
);

router.get('/threat-intel/search',
  optionalAuth,
  ThreatIntelController.search
);

router.get('/threat-intel/:id',
  optionalAuth,
  ThreatIntelController.getById
);

router.put('/threat-intel/:id',
  authenticateToken,
  ThreatIntelController.update
);

router.delete('/threat-intel/:id',
  authenticateToken,
  authorize('admin', 'analyst'),
  ThreatIntelController.delete
);

router.get('/threat-intel/:id/xml',
  optionalAuth,
  ThreatIntelController.getAsXml
);

// ============================================================
// Async Processing Routes
// ============================================================
router.post('/async/produce',
  authenticateToken,
  SystemController.produceJob
);

router.post('/async/consume',
  authenticateToken,
  SystemController.consumeJobs
);

router.get('/async/stats',
  optionalAuth,
  SystemController.getAsyncStats
);

router.post('/async/simulate-offline',
  authenticateToken,
  SystemController.simulateOffline
);

// ============================================================
// Cache Routes
// ============================================================
router.get('/cache/stats',
  optionalAuth,
  SystemController.getCacheStats
);

router.get('/cache/performance',
  optionalAuth,
  SystemController.getCachePerformance
);

router.delete('/cache/clear',
  authenticateToken,
  authorize('admin'),
  SystemController.clearCache
);

// ============================================================
// Data Transformation Routes
// ============================================================
router.post('/transform/xml-to-json',
  authenticateToken,
  SystemController.convertXmlToJson
);

// ============================================================
// System / Monitoring Routes
// ============================================================
router.get('/health', SystemController.getHealth);
router.get('/metrics', optionalAuth, SystemController.getMetrics);
router.get('/audit-log', authenticateToken, authorize('admin'), SystemController.getAuditLog);
router.get('/system-events', optionalAuth, SystemController.getSystemEvents);

module.exports = router;
