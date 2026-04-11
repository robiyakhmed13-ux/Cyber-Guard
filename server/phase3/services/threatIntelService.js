const { ThreatIntelModel } = require('../models/nedbModels');
const { AuditLogModel } = require('../models/sqliteModels');
const cacheService = require('./cacheService');
const DataTransformer = require('./dataTransformer');

class ThreatIntelService {
  static async create(payload, metadata = {}) {
    const record = await ThreatIntelModel.create(payload);
    cacheService.invalidateByTag('threat-intel');

    AuditLogModel.create({
      user_id: metadata.userId || null,
      action: 'create',
      resource: 'threat-intel',
      resource_id: record._id,
      ip_address: metadata.ip
    });

    return record;
  }

  static async getAll(filters = {}) {
    const cacheKey = `threat-intel:list:${JSON.stringify(filters)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return { result: cached, cache: 'hit' };
    }

    const result = await ThreatIntelModel.findAll(filters);
    cacheService.set(cacheKey, result, { ttl: 30000, tags: ['threat-intel'] });
    return { result, cache: 'miss' };
  }

  static async getById(id) {
    const record = await ThreatIntelModel.findById(id);
    if (!record) {
      const error = new Error('Threat intelligence record not found');
      error.statusCode = 404;
      throw error;
    }

    return record;
  }

  static async update(id, payload, metadata = {}) {
    const updated = await ThreatIntelModel.update(id, payload);
    if (!updated) {
      const error = new Error('Threat intelligence record not found');
      error.statusCode = 404;
      throw error;
    }

    cacheService.invalidateByTag('threat-intel');
    AuditLogModel.create({
      user_id: metadata.userId || null,
      action: 'update',
      resource: 'threat-intel',
      resource_id: id,
      details: payload,
      ip_address: metadata.ip
    });

    return updated;
  }

  static async delete(id, metadata = {}) {
    const deleted = await ThreatIntelModel.delete(id);
    if (!deleted) {
      const error = new Error('Threat intelligence record not found');
      error.statusCode = 404;
      throw error;
    }

    cacheService.invalidateByTag('threat-intel');
    AuditLogModel.create({
      user_id: metadata.userId || null,
      action: 'delete',
      resource: 'threat-intel',
      resource_id: id,
      ip_address: metadata.ip
    });

    return { deleted: true };
  }

  static async search(searchTerm = '') {
    return ThreatIntelModel.search(searchTerm);
  }

  static async getAsXml(id) {
    const record = await this.getById(id);
    return DataTransformer.jsonToXml(record, 'threatIntelligence');
  }
}

module.exports = ThreatIntelService;
