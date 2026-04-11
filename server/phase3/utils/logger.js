/**
 * Logger - Logging and Monitoring (Phase III Component 8)
 * 
 * Uses Winston for structured logging with:
 * - Console output (colorized)
 * - File-based logging (error + combined)
 * - Request/response logging
 * - Performance monitoring
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'cyberguard-phase3' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    }),
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1
            ? ` ${JSON.stringify(meta)}`
            : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  ]
});

// Performance monitor
const performanceMetrics = {
  requests: { total: 0, success: 0, error: 0 },
  responseTimes: [],
  dbQueries: { sqlite: 0, nedb: 0 },
  cacheOps: { hits: 0, misses: 0, sets: 0 },
  startTime: Date.now()
};

logger.trackRequest = (duration, statusCode) => {
  performanceMetrics.requests.total++;
  if (statusCode < 400) performanceMetrics.requests.success++;
  else performanceMetrics.requests.error++;
  performanceMetrics.responseTimes.push(duration);
  if (performanceMetrics.responseTimes.length > 1000) {
    performanceMetrics.responseTimes = performanceMetrics.responseTimes.slice(-500);
  }
};

logger.trackDbQuery = (type) => {
  if (type === 'sqlite') performanceMetrics.dbQueries.sqlite++;
  else if (type === 'nedb') performanceMetrics.dbQueries.nedb++;
};

logger.trackCache = (type) => {
  if (performanceMetrics.cacheOps[type] !== undefined) {
    performanceMetrics.cacheOps[type]++;
  }
};

logger.getMetrics = () => {
  const times = performanceMetrics.responseTimes;
  const avg = times.length > 0
    ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)
    : 0;
  const sorted = [...times].sort((a, b) => a - b);
  const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)].toFixed(2) : 0;

  return {
    uptime: `${((Date.now() - performanceMetrics.startTime) / 1000).toFixed(0)}s`,
    requests: performanceMetrics.requests,
    responseTime: { averageMs: avg, p95Ms: p95, samples: times.length },
    database: performanceMetrics.dbQueries,
    cache: performanceMetrics.cacheOps
  };
};

module.exports = logger;
