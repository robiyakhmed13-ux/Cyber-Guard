const { AuditLogModel } = require('../models/sqliteModels');
const { SystemEventModel } = require('../models/nedbModels');
const cacheService = require('./cacheService');
const asyncProcessor = require('./asyncProcessor');
const DataTransformer = require('./dataTransformer');
const logger = require('../utils/logger');

class SystemService {
  static getHealth() {
    return {
      status: 'healthy',
      phase: 'III',
      components: {
        sqlite: 'active',
        nedb: 'active',
        cache: 'active',
        asyncProcessor: asyncProcessor.isRunning ? 'active' : 'inactive',
        logging: 'active'
      }
    };
  }

  static getMetrics() {
    return logger.getMetrics();
  }

  static getCacheStats() {
    return cacheService.getStats();
  }

  static async getCachePerformance() {
    return cacheService.performanceComparison();
  }

  static clearCache(metadata = {}) {
    cacheService.clear();
    AuditLogModel.create({
      user_id: metadata.userId || null,
      action: 'clear',
      resource: 'cache',
      resource_id: 'global',
      ip_address: metadata.ip
    });
    return { cleared: true };
  }

  static async getAsyncStats() {
    return asyncProcessor.getStats();
  }

  static async produceJob(payload) {
    return asyncProcessor.produce(payload.type, payload.payload, payload.priority);
  }

  static async consumeJobs(batchSize = 5) {
    const processed = await asyncProcessor.consume(batchSize);
    return { processed };
  }

  static async simulateOffline(count = 5) {
    return asyncProcessor.simulateOffline(count);
  }

  static async convertXmlToJson(xml) {
    return DataTransformer.xmlToJson(xml);
  }

  static getAuditLog(filters = {}) {
    return AuditLogModel.findAll(filters);
  }

  static async getSystemEvents(limit = 50) {
    return SystemEventModel.getRecent(limit);
  }
}

module.exports = SystemService;
