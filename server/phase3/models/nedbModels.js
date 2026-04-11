/**
 * NeDB Models - NoSQL Data Access Layer (Phase III Component 1 & 2)
 * 
 * Document-based storage for semi-structured data:
 * - Threat Intelligence (varying IOC formats)
 * - System Events (time-series metrics)
 * - Scan Results (deeply nested results)
 * - Job Queue (async processing persistence)
 */

const { nedbCollections } = require('../config/database');
const logger = require('../utils/logger');

// ============================================================
// Threat Intelligence Model (NoSQL)
// ============================================================
class ThreatIntelModel {
  static async create(data) {
    logger.trackDbQuery('nedb');
    return await nedbCollections.threatIntel.insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  static async findAll(filters = {}) {
    logger.trackDbQuery('nedb');
    const query = {};
    if (filters.ioc_type) query.ioc_type = filters.ioc_type;
    if (filters.severity) query.severity = filters.severity;
    if (filters.source) query.source = filters.source;

    const docs = await nedbCollections.threatIntel
      .find(query)
      .sort({ created_at: -1 })
      .limit(filters.limit || 50);
    const total = await nedbCollections.threatIntel.count(query);
    return { data: docs, total };
  }

  static async findById(id) {
    logger.trackDbQuery('nedb');
    return await nedbCollections.threatIntel.findOne({ _id: id });
  }

  static async update(id, data) {
    logger.trackDbQuery('nedb');
    data.updated_at = new Date().toISOString();
    const count = await nedbCollections.threatIntel.update(
      { _id: id }, { $set: data }, {}
    );
    if (count > 0) return await this.findById(id);
    return null;
  }

  static async delete(id) {
    logger.trackDbQuery('nedb');
    const count = await nedbCollections.threatIntel.remove({ _id: id }, {});
    return count > 0;
  }

  static async search(searchTerm) {
    logger.trackDbQuery('nedb');
    const regex = new RegExp(searchTerm, 'i');
    return await nedbCollections.threatIntel.find({
      $or: [
        { ioc_value: regex },
        { description: regex },
        { tags: regex }
      ]
    }).limit(50);
  }
}

// ============================================================
// System Events Model (NoSQL - Time-series like)
// ============================================================
class SystemEventModel {
  static async create(data) {
    logger.trackDbQuery('nedb');
    return await nedbCollections.systemEvents.insert({
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    });
  }

  static async findByTimeRange(startTime, endTime, eventType = null) {
    logger.trackDbQuery('nedb');
    const query = {
      timestamp: { $gte: startTime, $lte: endTime }
    };
    if (eventType) query.event_type = eventType;

    return await nedbCollections.systemEvents
      .find(query)
      .sort({ timestamp: -1 })
      .limit(500);
  }

  static async getRecent(limit = 50) {
    logger.trackDbQuery('nedb');
    return await nedbCollections.systemEvents
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  static async getEventCounts() {
    logger.trackDbQuery('nedb');
    const all = await nedbCollections.systemEvents.find({});
    const counts = {};
    all.forEach(evt => {
      counts[evt.event_type] = (counts[evt.event_type] || 0) + 1;
    });
    return counts;
  }
}

// ============================================================
// Scan Results Model (NoSQL - Nested documents)
// ============================================================
class ScanResultModel {
  static async create(data) {
    logger.trackDbQuery('nedb');
    return await nedbCollections.scanResults.insert({
      ...data,
      scan_id: data.scan_id || `SCAN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString()
    });
  }

  static async findByScanId(scanId) {
    logger.trackDbQuery('nedb');
    return await nedbCollections.scanResults.findOne({ scan_id: scanId });
  }

  static async findAll(filters = {}) {
    logger.trackDbQuery('nedb');
    const query = {};
    if (filters.target_ip) query.target_ip = filters.target_ip;
    if (filters.scan_type) query.scan_type = filters.scan_type;

    return await nedbCollections.scanResults
      .find(query)
      .sort({ created_at: -1 })
      .limit(filters.limit || 50);
  }

  static async delete(scanId) {
    logger.trackDbQuery('nedb');
    const count = await nedbCollections.scanResults.remove({ scan_id: scanId }, {});
    return count > 0;
  }
}

// ============================================================
// Job Queue Model (NoSQL - Async processing persistence)
// ============================================================
class JobQueueModel {
  static async enqueue(job) {
    logger.trackDbQuery('nedb');
    return await nedbCollections.jobQueue.insert({
      job_id: `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: job.type,
      payload: job.payload,
      priority: job.priority || 'normal',
      status: 'pending',
      attempts: 0,
      max_attempts: job.max_attempts || 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      error: null
    });
  }

  static async dequeue(batchSize = 5) {
    logger.trackDbQuery('nedb');
    const jobs = await nedbCollections.jobQueue
      .find({ status: 'pending' })
      .sort({ priority: -1, created_at: 1 })
      .limit(batchSize);

    for (const job of jobs) {
      await nedbCollections.jobQueue.update(
        { _id: job._id },
        { $set: { status: 'processing', started_at: new Date().toISOString(), updated_at: new Date().toISOString() } }
      );
      job.status = 'processing';
    }
    return jobs;
  }

  static async complete(jobId, result = null) {
    logger.trackDbQuery('nedb');
    return await nedbCollections.jobQueue.update(
      { job_id: jobId },
      { $set: { status: 'completed', result, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() } }
    );
  }

  static async fail(jobId, error) {
    logger.trackDbQuery('nedb');
    const job = await nedbCollections.jobQueue.findOne({ job_id: jobId });
    if (!job) return null;

    const newAttempts = (job.attempts || 0) + 1;
    const newStatus = newAttempts >= job.max_attempts ? 'dead_letter' : 'pending';

    return await nedbCollections.jobQueue.update(
      { job_id: jobId },
      { $set: { status: newStatus, attempts: newAttempts, error, updated_at: new Date().toISOString() } }
    );
  }

  static async getStats() {
    logger.trackDbQuery('nedb');
    const all = await nedbCollections.jobQueue.find({});
    const stats = { pending: 0, processing: 0, completed: 0, dead_letter: 0, total: all.length };
    all.forEach(j => { if (stats[j.status] !== undefined) stats[j.status]++; });
    return stats;
  }

  static async getAll(filters = {}) {
    logger.trackDbQuery('nedb');
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    return await nedbCollections.jobQueue
      .find(query)
      .sort({ created_at: -1 })
      .limit(filters.limit || 50);
  }
}

module.exports = { ThreatIntelModel, SystemEventModel, ScanResultModel, JobQueueModel };
