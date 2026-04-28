const logger = require('../utils/logger');

const PHASE5_API_BASE = process.env.PHASE5_API_BASE || 'http://localhost:8000';

class Phase5Service {
  static defaultIocType(threatType = '') {
    const mapping = {
      ransomware: 'hash_sha256',
      malware: 'hash_md5',
      phishing: 'email',
      spear_phishing: 'email',
      ddos: 'ip',
      brute_force: 'ip',
      credential_stuffing: 'ip',
      sql_injection: 'url',
      xss: 'url',
      data_exfiltration: 'filename',
      insider_threat: 'filename',
      zero_day: 'domain',
      botnet: 'ip'
    };
    return mapping[threatType] || 'domain';
  }

  static async request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 12000);

    try {
      const response = await fetch(`${PHASE5_API_BASE}${path}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.detail || data.message || `Phase V request failed with status ${response.status}`);
        error.statusCode = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Phase V service request failed', { path, error: error.message });
      if (!error.statusCode) {
        error.statusCode = 503;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  static normalizePayload(payload = {}) {
    return {
      threat_type: payload.threat_type || 'phishing',
      severity: payload.severity || 'medium',
      source_ip: payload.source_ip || '0.0.0.0',
      target_asset: payload.target_asset || 'unknown-asset',
      ioc_type: payload.ioc_type || this.defaultIocType(payload.threat_type),
      ioc_source: payload.ioc_source || 'internal',
      status: payload.status || 'open',
      description: payload.description || '',
      related_iocs: Number(payload.related_iocs ?? 1),
      open_ports: Number(payload.open_ports ?? 0)
    };
  }

  static async getHealth() {
    return this.request('/health');
  }

  static async getModelInfo() {
    return this.request('/model/info');
  }

  static async predictRisk(payload) {
    return this.request('/predict-risk', {
      method: 'POST',
      body: this.normalizePayload(payload)
    });
  }

  static async getOntologyTriples(query = {}) {
    const params = new URLSearchParams();
    if (query.subject) params.set('subject', query.subject);
    if (query.predicate) params.set('predicate', query.predicate);
    if (query.object) params.set('object', query.object);
    if (query.limit) params.set('limit', String(query.limit));
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/ontology/triples${suffix}`);
  }

  static async queryOntology(query = {}) {
    const params = new URLSearchParams();
    if (query.threat_type) params.set('threat_type', query.threat_type);
    if (query.asset) params.set('asset', query.asset);
    if (query.risk_level) params.set('risk_level', query.risk_level);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/ontology/query${suffix}`);
  }

  static async enrichIncident(payload) {
    return this.request('/enrich-incident', {
      method: 'POST',
      body: {
        incident_id: payload.incident_id || payload.id || 'unknown',
        ...this.normalizePayload(payload)
      }
    });
  }

  static async llmRecommendation(payload) {
    return this.request('/llm/recommendation', {
      method: 'POST',
      body: payload
    });
  }
}

module.exports = Phase5Service;
