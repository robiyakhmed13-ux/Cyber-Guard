const { v4: uuidv4 } = require('uuid');
const { IncidentModel, AuditLogModel } = require('../models/sqliteModels');
const cacheService = require('./cacheService');
const asyncProcessor = require('./asyncProcessor');
const DataTransformer = require('./dataTransformer');

class IncidentService {
  static create(payload, metadata = {}) {
    const incidentId = `INC-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const createdIncident = IncidentModel.create({ ...payload, incident_id: incidentId });

    cacheService.invalidateByTag('incidents');
    asyncProcessor.produce('threat_analysis', {
      incident_id: incidentId,
      threat_type: payload.threat_type,
      source_ip: payload.source_ip
    });

    AuditLogModel.create({
      user_id: metadata.userId || null,
      action: 'create',
      resource: 'incidents',
      resource_id: incidentId,
      ip_address: metadata.ip
    });

    return IncidentModel.findById(createdIncident.id) || createdIncident;
  }

  static getAll(filters = {}) {
    const cacheKey = `incidents:list:${JSON.stringify(filters)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return { result: cached, cache: 'hit' };
    }

    const result = IncidentModel.findAll(filters);
    cacheService.set(cacheKey, result, { ttl: 30000, tags: ['incidents'] });
    return { result, cache: 'miss' };
  }

  static getById(id) {
    const cacheKey = `incidents:${id}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return { result: cached, cache: 'hit' };
    }

    const incident = IncidentModel.findById(id);
    if (!incident) {
      const error = new Error('Incident not found');
      error.statusCode = 404;
      throw error;
    }

    cacheService.set(cacheKey, incident, { ttl: 60000, tags: ['incidents'], sliding: true });
    return { result: incident, cache: 'miss' };
  }

  static update(id, payload, metadata = {}) {
    const updated = IncidentModel.update(id, payload);
    if (!updated) {
      const error = new Error('Incident not found');
      error.statusCode = 404;
      throw error;
    }

    cacheService.invalidateByTag('incidents');
    AuditLogModel.create({
      user_id: metadata.userId || null,
      action: 'update',
      resource: 'incidents',
      resource_id: String(id),
      details: payload,
      ip_address: metadata.ip
    });

    return updated;
  }

  static delete(id, metadata = {}) {
    const deleted = IncidentModel.delete(id);
    if (!deleted) {
      const error = new Error('Incident not found');
      error.statusCode = 404;
      throw error;
    }

    cacheService.invalidateByTag('incidents');
    AuditLogModel.create({
      user_id: metadata.userId || null,
      action: 'delete',
      resource: 'incidents',
      resource_id: String(id),
      ip_address: metadata.ip
    });

    return { deleted: true };
  }

  static getStatistics() {
    const cacheKey = 'incidents:statistics';
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return { result: cached, cache: 'hit' };
    }

    const stats = IncidentModel.getStatistics();
    cacheService.set(cacheKey, stats, { ttl: 15000, tags: ['incidents'] });
    return { result: stats, cache: 'miss' };
  }

  static getAsXml(id) {
    const incident = IncidentModel.findById(id);
    if (!incident) {
      const error = new Error('Incident not found');
      error.statusCode = 404;
      throw error;
    }

    return DataTransformer.jsonToXml(incident, 'incident');
  }

  static getAsExternalFormat(id) {
    const incident = IncidentModel.findById(id);
    if (!incident) {
      const error = new Error('Incident not found');
      error.statusCode = 404;
      throw error;
    }

    return DataTransformer.incidentToExternalFormat(incident);
  }

  static getAsStix(id) {
    const incident = IncidentModel.findById(id);
    if (!incident) {
      const error = new Error('Incident not found');
      error.statusCode = 404;
      throw error;
    }

    return DataTransformer.incidentToStixFormat(incident);
  }
}

module.exports = IncidentService;
