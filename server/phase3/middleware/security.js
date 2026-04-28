/**
 * Security Middleware - Phase III Component 6
 * 
 * Implements:
 * - JWT token-based authentication
 * - Input validation and sanitization
 * - Protection against SQL injection and XSS
 * - Rate limiting
 * - Security headers (Helmet)
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'cyberguard-phase3-secret-key-2026';
const JWT_EXPIRY = '24h';

// ============================================================
// Authentication Middleware
// ============================================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Invalid token attempt', { error: err.message });
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// Optional auth - sets req.user if token present, continues otherwise
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) { /* ignore invalid tokens for optional auth */ }
  }
  next();
}

// Role-based authorization
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', { user: req.user.username, requiredRoles: roles });
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// Hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

// Compare password
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// ============================================================
// Input Sanitization (XSS & SQL Injection Prevention)
// ============================================================
function sanitizeInput(value) {
  if (typeof value !== 'string') return value;
  // Remove potential XSS vectors
  return value
    .replace(/[<>]/g, '') // strip angle brackets
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/['";]/g, '') // strip quotes and semicolons (SQL injection vectors)
    .trim();
}

function sanitizeMiddleware(req, res, next) {
  // Deep sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  // Sanitize query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key]);
      }
    });
  }
  next();
}

function deepSanitize(obj) {
  if (typeof obj === 'string') return sanitizeInput(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[sanitizeInput(key)] = deepSanitize(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

// ============================================================
// Validation Rules
// ============================================================
const validationRules = {
  createIncident: [
    body('threat_type').notEmpty().withMessage('threat_type is required')
      .isString().isLength({ max: 50 }),
    body('severity').isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('severity must be low, medium, high, or critical'),
    body('source_ip').notEmpty().withMessage('source_ip is required')
      .matches(/^[\d.:/a-fA-F]+$/).withMessage('Invalid IP format'),
    body('target_asset').notEmpty().withMessage('target_asset is required')
      .isString().isLength({ max: 100 }),
    body('description').optional().isString().isLength({ max: 2000 })
  ],
  updateIncident: [
    param('id').isInt({ min: 1 }).withMessage('Invalid incident ID'),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('status').optional().isIn(['open', 'investigating', 'contained', 'eradicated', 'recovered', 'closed']),
    body('description').optional().isString().isLength({ max: 2000 })
  ],
  createUser: [
    body('username').notEmpty().isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username: alphanumeric and underscores only'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a number'),
    body('role').optional().isIn(['admin', 'analyst', 'viewer'])
  ],
  login: [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  createThreatIntel: [
    body('ioc_type').notEmpty().isIn(['ip', 'domain', 'hash', 'url', 'email']),
    body('ioc_value').notEmpty().isString().isLength({ max: 500 }),
    body('severity').isIn(['low', 'medium', 'high', 'critical']),
    body('source').optional().isString()
  ]
};

// Validation handler middleware
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', { errors: errors.array(), path: req.path });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

// ============================================================
// Rate Limiting
// ============================================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  // Keep authentication endpoints reachable even when other API traffic is high.
  skip: (req) => req.path === '/auth/login' || req.path === '/auth/register',
  message: { error: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// ============================================================
// Request Logging Middleware
// ============================================================
function requestLogger(req, res, next) {
  const startTime = Date.now();
  req.requestId = require('uuid').v4();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.trackRequest(duration, res.statusCode);
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
  authorize,
  generateToken,
  hashPassword,
  comparePassword,
  sanitizeMiddleware,
  validationRules,
  validate,
  apiLimiter,
  authLimiter,
  requestLogger
};
