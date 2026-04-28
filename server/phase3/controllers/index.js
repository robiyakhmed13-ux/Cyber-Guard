/**
 * Controllers - Phase III
 *
 * Controllers stay thin and delegate business logic to the service layer.
 */

const AuthService = require('../services/authService');
const IncidentService = require('../services/incidentService');
const Phase5Service = require('../services/phase5Service');
const ThreatIntelService = require('../services/threatIntelService');
const SystemService = require('../services/systemService');
const DataTransformer = require('../services/dataTransformer');
const logger = require('../utils/logger');

const AuthController = {
  async register(req, res) {
    try {
      const result = await AuthService.register(req.body, { ip: req.ip });
      logger.info(`User registered: ${result.user.username}`);
      res.status(201).json(DataTransformer.wrapResponse(result));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      logger.error('Registration error', { error: error.message });
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Registration failed', statusCode));
    }
  },

  async login(req, res) {
    try {
      const result = await AuthService.login(req.body, { ip: req.ip });
      res.json(DataTransformer.wrapResponse(result));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      logger.error('Login error', { error: error.message });
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Login failed', statusCode));
    }
  }
};

const IncidentController = {
  create(req, res) {
    try {
      const incident = IncidentService.create(req.body, { userId: req.user?.id, ip: req.ip });
      res.status(201).json(DataTransformer.wrapResponse(incident));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      logger.error('Create incident error', { error: error.message });
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Failed to create incident', statusCode));
    }
  },

  getAll(req, res) {
    try {
      const { result, cache } = IncidentService.getAll(req.query);
      res.json(DataTransformer.wrapResponse(result, { cache }));
    } catch (error) {
      logger.error('Get incidents error', { error: error.message });
      res.status(500).json(DataTransformer.wrapError('Failed to fetch incidents', 500));
    }
  },

  getById(req, res) {
    try {
      const { result, cache } = IncidentService.getById(parseInt(req.params.id, 10));
      res.json(DataTransformer.wrapResponse(result, { cache }));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      logger.error('Get incident error', { error: error.message });
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Failed to fetch incident', statusCode));
    }
  },

  update(req, res) {
    try {
      const updated = IncidentService.update(parseInt(req.params.id, 10), req.body, { userId: req.user?.id, ip: req.ip });
      res.json(DataTransformer.wrapResponse(updated));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      logger.error('Update incident error', { error: error.message });
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Failed to update incident', statusCode));
    }
  },

  delete(req, res) {
    try {
      const deleted = IncidentService.delete(parseInt(req.params.id, 10), { userId: req.user?.id, ip: req.ip });
      res.json(DataTransformer.wrapResponse(deleted));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      logger.error('Delete incident error', { error: error.message });
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Failed to delete incident', statusCode));
    }
  },

  getStatistics(req, res) {
    try {
      const { result, cache } = IncidentService.getStatistics();
      res.json(DataTransformer.wrapResponse(result, { cache }));
    } catch (error) {
      res.status(500).json(DataTransformer.wrapError('Failed to fetch statistics', 500));
    }
  },

  getAsXml(req, res) {
    try {
      const xml = IncidentService.getAsXml(parseInt(req.params.id, 10));
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'XML conversion failed', statusCode));
    }
  },

  getAsExternalFormat(req, res) {
    try {
      const external = IncidentService.getAsExternalFormat(parseInt(req.params.id, 10));
      res.json(DataTransformer.wrapResponse(external));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Transformation failed', statusCode));
    }
  },

  getAsStix(req, res) {
    try {
      const stix = IncidentService.getAsStix(parseInt(req.params.id, 10));
      res.json(DataTransformer.wrapResponse(stix));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'STIX conversion failed', statusCode));
    }
  }
};

const ThreatIntelController = {
  async create(req, res) {
    try {
      const doc = await ThreatIntelService.create(req.body, { userId: req.user?.id, ip: req.ip });
      res.status(201).json(DataTransformer.wrapResponse(doc));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Failed to create threat intel', statusCode));
    }
  },

  async getAll(req, res) {
    try {
      const { result, cache } = await ThreatIntelService.getAll(req.query);
      res.json(DataTransformer.wrapResponse(result, { cache }));
    } catch (error) {
      res.status(500).json(DataTransformer.wrapError('Failed to fetch threat intel', 500));
    }
  },

  async getById(req, res) {
    try {
      const doc = await ThreatIntelService.getById(req.params.id);
      res.json(DataTransformer.wrapResponse(doc));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Failed to fetch record', statusCode));
    }
  },

  async update(req, res) {
    try {
      const updated = await ThreatIntelService.update(req.params.id, req.body, { userId: req.user?.id, ip: req.ip });
      res.json(DataTransformer.wrapResponse(updated));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Failed to update', statusCode));
    }
  },

  async delete(req, res) {
    try {
      const deleted = await ThreatIntelService.delete(req.params.id, { userId: req.user?.id, ip: req.ip });
      res.json(DataTransformer.wrapResponse(deleted));
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Failed to delete', statusCode));
    }
  },

  async search(req, res) {
    try {
      const results = await ThreatIntelService.search(req.query.q || '');
      res.json(DataTransformer.wrapResponse(results));
    } catch (error) {
      res.status(500).json(DataTransformer.wrapError('Search failed', 500));
    }
  },

  async getAsXml(req, res) {
    try {
      const xml = await ThreatIntelService.getAsXml(req.params.id);
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'XML conversion failed', statusCode));
    }
  }
};

const SystemController = {
  getHealth(req, res) {
    res.json(DataTransformer.wrapResponse(SystemService.getHealth()));
  },

  getMetrics(req, res) {
    res.json(DataTransformer.wrapResponse(SystemService.getMetrics()));
  },

  getCacheStats(req, res) {
    res.json(DataTransformer.wrapResponse(SystemService.getCacheStats()));
  },

  async getCachePerformance(req, res) {
    const result = await SystemService.getCachePerformance();
    res.json(DataTransformer.wrapResponse(result));
  },

  clearCache(req, res) {
    const result = SystemService.clearCache({ userId: req.user?.id, ip: req.ip });
    res.json(DataTransformer.wrapResponse(result));
  },

  async getAsyncStats(req, res) {
    const stats = await SystemService.getAsyncStats();
    res.json(DataTransformer.wrapResponse(stats));
  },

  async produceJob(req, res) {
    try {
      const job = await SystemService.produceJob(req.body);
      res.status(201).json(DataTransformer.wrapResponse(job));
    } catch (error) {
      res.status(500).json(DataTransformer.wrapError('Failed to produce job', 500));
    }
  },

  async consumeJobs(req, res) {
    try {
      const result = await SystemService.consumeJobs(req.body.batchSize || 5);
      res.json(DataTransformer.wrapResponse(result));
    } catch (error) {
      res.status(500).json(DataTransformer.wrapError('Failed to consume jobs', 500));
    }
  },

  async simulateOffline(req, res) {
    const result = await SystemService.simulateOffline(req.body.count || 5);
    res.json(DataTransformer.wrapResponse(result));
  },

  async convertXmlToJson(req, res) {
    try {
      const { xml } = req.body;
      if (!xml) {
        return res.status(400).json(DataTransformer.wrapError('XML body required', 400));
      }

      const json = await SystemService.convertXmlToJson(xml);
      res.json(DataTransformer.wrapResponse(json));
    } catch (error) {
      res.status(400).json(DataTransformer.wrapError('Invalid XML', 400));
    }
  },

  getAuditLog(req, res) {
    try {
      const logs = SystemService.getAuditLog(req.query);
      res.json(DataTransformer.wrapResponse(logs));
    } catch (error) {
      res.status(500).json(DataTransformer.wrapError('Failed to fetch audit log', 500));
    }
  },

  async getSystemEvents(req, res) {
    try {
      const events = await SystemService.getSystemEvents(parseInt(req.query.limit, 10) || 50);
      res.json(DataTransformer.wrapResponse(events));
    } catch (error) {
      res.status(500).json(DataTransformer.wrapError('Failed to fetch events', 500));
    }
  }
};

const IntelligenceController = {
  async getHealth(req, res) {
    try {
      const result = await Phase5Service.getHealth();
      res.json(DataTransformer.wrapResponse(result));
    } catch (error) {
      const statusCode = error.statusCode || 503;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Phase V service unavailable', statusCode));
    }
  },

  async getModelInfo(req, res) {
    try {
      const result = await Phase5Service.getModelInfo();
      res.json(DataTransformer.wrapResponse(result));
    } catch (error) {
      const statusCode = error.statusCode || 503;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Failed to fetch model info', statusCode));
    }
  },

  async predictRisk(req, res) {
    try {
      const result = await Phase5Service.predictRisk(req.body);
      res.json(DataTransformer.wrapResponse(result));
    } catch (error) {
      const statusCode = error.statusCode || 503;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Prediction failed', statusCode));
    }
  },

  async getOntologyTriples(req, res) {
    try {
      const result = await Phase5Service.getOntologyTriples(req.query);
      res.json(DataTransformer.wrapResponse(result));
    } catch (error) {
      const statusCode = error.statusCode || 503;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Semantic triple lookup failed', statusCode));
    }
  },

  async queryOntology(req, res) {
    try {
      const result = await Phase5Service.queryOntology(req.query);
      res.json(DataTransformer.wrapResponse(result));
    } catch (error) {
      const statusCode = error.statusCode || 503;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Semantic query failed', statusCode));
    }
  },

  async enrichIncident(req, res) {
    try {
      const incident = IncidentService.getById(parseInt(req.params.id, 10)).result;
      const result = await Phase5Service.enrichIncident(incident);
      res.json(DataTransformer.wrapResponse(result));
    } catch (error) {
      const statusCode = error.statusCode || 503;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'Incident enrichment failed', statusCode));
    }
  },

  async llmRecommendation(req, res) {
    try {
      const result = await Phase5Service.llmRecommendation(req.body);
      res.json(DataTransformer.wrapResponse(result));
    } catch (error) {
      const statusCode = error.statusCode || 503;
      res.status(statusCode).json(DataTransformer.wrapError(error.message || 'LLM recommendation failed', statusCode));
    }
  }
};

module.exports = { AuthController, IncidentController, ThreatIntelController, SystemController, IntelligenceController };
