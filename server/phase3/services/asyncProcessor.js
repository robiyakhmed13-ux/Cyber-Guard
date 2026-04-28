/**
 * Async Processor - Phase III Component 4
 * 
 * Event-driven asynchronous data processing:
 * - Producer/Consumer pattern
 * - Background job processing
 * - Persistent message handling (NeDB-backed)
 * - Retry with dead-letter queue
 * - Process messages after service downtime
 */

const EventEmitter = require('events');
const { JobQueueModel } = require('../models/nedbModels');
const { SystemEventModel } = require('../models/nedbModels');
const Phase5Service = require('./phase5Service');
const logger = require('../utils/logger');

class AsyncProcessor extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.processInterval = null;
    this.handlers = new Map();
    this.stats = {
      produced: 0,
      consumed: 0,
      failed: 0,
      retried: 0
    };

    // Register built-in job handlers
    this.registerHandler('threat_analysis', this.handleThreatAnalysis.bind(this));
    this.registerHandler('scan_processing', this.handleScanProcessing.bind(this));
    this.registerHandler('report_generation', this.handleReportGeneration.bind(this));
    this.registerHandler('notification', this.handleNotification.bind(this));
    this.registerHandler('data_cleanup', this.handleDataCleanup.bind(this));
  }

  /**
   * Register a job handler for a specific job type
   */
  registerHandler(jobType, handler) {
    this.handlers.set(jobType, handler);
    logger.info(`Async handler registered: ${jobType}`);
  }

  /**
   * PRODUCER: Enqueue a job for async processing
   */
  async produce(jobType, payload, priority = 'normal') {
    const job = await JobQueueModel.enqueue({
      type: jobType,
      payload,
      priority
    });

    this.stats.produced++;
    this.emit('job:produced', job);

    // Log system event
    await SystemEventModel.create({
      event_type: 'job_produced',
      severity: 'info',
      details: { job_id: job.job_id, type: jobType, priority }
    });

    logger.info(`Job produced: ${job.job_id} [${jobType}]`);
    return job;
  }

  /**
   * CONSUMER: Process pending jobs
   */
  async consume(batchSize = 5) {
    const jobs = await JobQueueModel.dequeue(batchSize);

    for (const job of jobs) {
      const handler = this.handlers.get(job.type);
      if (!handler) {
        logger.warn(`No handler for job type: ${job.type}`);
        await JobQueueModel.fail(job.job_id, `No handler registered for type: ${job.type}`);
        this.stats.failed++;
        continue;
      }

      try {
        logger.info(`Processing job: ${job.job_id} [${job.type}]`);
        const result = await handler(job.payload);
        await JobQueueModel.complete(job.job_id, result);
        this.stats.consumed++;
        this.emit('job:completed', { job_id: job.job_id, result });

        await SystemEventModel.create({
          event_type: 'job_completed',
          severity: 'info',
          details: { job_id: job.job_id, type: job.type }
        });
      } catch (error) {
        logger.error(`Job failed: ${job.job_id}`, { error: error.message });
        await JobQueueModel.fail(job.job_id, error.message);
        this.stats.failed++;
        this.stats.retried++;
        this.emit('job:failed', { job_id: job.job_id, error: error.message });

        await SystemEventModel.create({
          event_type: 'job_failed',
          severity: 'error',
          details: { job_id: job.job_id, type: job.type, error: error.message }
        });
      }
    }

    return jobs.length;
  }

  /**
   * Start background processing loop
   */
  start(intervalMs = 5000) {
    if (this.isRunning) return;
    this.isRunning = true;

    this.processInterval = setInterval(async () => {
      try {
        await this.consume();
      } catch (err) {
        logger.error('Async processor error', { error: err.message });
      }
    }, intervalMs);

    logger.info(`Async processor started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop background processing
   */
  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    this.isRunning = false;
    logger.info('Async processor stopped');
  }

  /**
   * Simulate offline/online scenario
   */
  async simulateOffline(count = 5) {
    const produced = [];
    for (let i = 0; i < count; i++) {
      const job = await this.produce('notification', {
        type: 'alert',
        message: `Alert #${i + 1} produced while consumer was offline`,
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        timestamp: new Date().toISOString()
      });
      produced.push(job.job_id);
    }
    return {
      status: `${count} jobs produced while consumer was offline`,
      jobIds: produced,
      note: 'Jobs are persisted in NeDB and will be processed when consumer comes back online'
    };
  }

  /**
   * Get processor statistics
   */
  async getStats() {
    const queueStats = await JobQueueModel.getStats();
    return {
      processor: {
        isRunning: this.isRunning,
        ...this.stats,
        registeredHandlers: Array.from(this.handlers.keys())
      },
      queue: queueStats
    };
  }

  // ============================================================
  // Built-in Job Handlers
  // ============================================================

  async handleThreatAnalysis(payload) {
    try {
      const analysis = await Phase5Service.enrichIncident({
        incident_id: payload.incident_id || `ASYNC-${Date.now()}`,
        threat_type: payload.threat_type,
        severity: payload.severity || 'medium',
        source_ip: payload.source_ip,
        target_asset: payload.target_asset || 'async-asset',
        status: payload.status || 'open',
        ioc_type: payload.ioc_type || Phase5Service.defaultIocType(payload.threat_type),
        ioc_source: payload.ioc_source || 'internal',
        description: payload.description || '',
        related_iocs: payload.related_iocs || 1,
        open_ports: payload.open_ports || 0
      });

      return {
        analyzed: true,
        threatType: payload.threat_type,
        predictedRisk: analysis.predicted_risk,
        confidence: analysis.confidence,
        recommendations: analysis.semantic_context.recommendations,
        mitigations: analysis.semantic_context.mitigations,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.warn('Phase V analysis unavailable, using fallback async analysis', { error: error.message });
      await this.delay(200 + Math.random() * 300);
      return {
        analyzed: true,
        threatType: payload.threat_type,
        predictedRisk: payload.severity || 'medium',
        confidence: 0.5,
        recommendations: ['Review the incident manually', 'Verify IOC coverage'],
        mitigations: ['Collect evidence and isolate affected assets if needed'],
        processedAt: new Date().toISOString(),
        fallback: true
      };
    }
  }

  async handleScanProcessing(payload) {
    await this.delay(300 + Math.random() * 500);
    return {
      scanned: true,
      target: payload.target_ip,
      vulnerabilities: Math.floor(Math.random() * 10),
      processedAt: new Date().toISOString()
    };
  }

  async handleReportGeneration(payload) {
    await this.delay(500 + Math.random() * 500);
    return {
      reportGenerated: true,
      format: payload.format || 'json',
      sections: ['summary', 'incidents', 'metrics', 'recommendations'],
      processedAt: new Date().toISOString()
    };
  }

  async handleNotification(payload) {
    await this.delay(50 + Math.random() * 100);
    return {
      notified: true,
      channel: payload.channel || 'system',
      message: payload.message,
      processedAt: new Date().toISOString()
    };
  }

  async handleDataCleanup(payload) {
    await this.delay(100 + Math.random() * 200);
    return {
      cleaned: true,
      target: payload.target || 'expired_data',
      recordsProcessed: Math.floor(Math.random() * 100),
      processedAt: new Date().toISOString()
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AsyncProcessor();
