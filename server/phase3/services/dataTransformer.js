/**
 * Data Transformation Service - Phase III Component 7
 * 
 * Implements:
 * - JSON to JSON transformation (restructuring, mapping, aggregation)
 * - JSON to XML conversion
 * - XML to JSON conversion
 * - API response restructuring
 * - Format normalization for interoperability
 */

const { Builder, parseString } = require('xml2js');
const logger = require('../utils/logger');

class DataTransformer {
  /**
   * JSON to JSON - Restructure incident data for external API
   */
  static incidentToExternalFormat(incident) {
    return {
      externalId: incident.incident_id,
      classification: {
        type: incident.threat_type,
        level: incident.severity,
        category: DataTransformer.mapThreatCategory(incident.threat_type)
      },
      source: {
        ipAddress: incident.source_ip,
        geoLocation: null // Placeholder for geo lookup
      },
      target: {
        asset: incident.target_asset,
        type: 'infrastructure'
      },
      lifecycle: {
        currentStatus: incident.status,
        reportedAt: incident.created_at,
        lastUpdated: incident.updated_at,
        assignedTo: incident.assigned_username || null
      },
      metadata: {
        format: 'CyberGuard-External-v3',
        exportedAt: new Date().toISOString()
      }
    };
  }

  /**
   * JSON to JSON - Aggregate statistics for dashboard
   */
  static aggregateStats(incidents) {
    const grouped = {};
    incidents.forEach(inc => {
      const key = inc.severity;
      if (!grouped[key]) grouped[key] = { count: 0, items: [] };
      grouped[key].count++;
      grouped[key].items.push(inc.incident_id);
    });

    return {
      summary: {
        total: incidents.length,
        bySeverity: grouped,
        openCount: incidents.filter(i => i.status === 'open').length,
        resolvedCount: incidents.filter(i => i.status === 'closed').length
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * JSON to XML - Convert incident to XML format
   */
  static jsonToXml(data, rootElement = 'data') {
    const builder = new Builder({
      rootName: rootElement,
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ' }
    });
    return builder.buildObject(data);
  }

  /**
   * XML to JSON - Parse XML string to JSON
   */
  static xmlToJson(xmlString) {
    return new Promise((resolve, reject) => {
      parseString(xmlString, {
        explicitArray: false,
        mergeAttrs: true,
        trim: true
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  /**
   * Convert incident to STIX-like format (Structured Threat Information eXpression)
   */
  static incidentToStixFormat(incident) {
    return {
      type: 'bundle',
      id: `bundle--${incident.incident_id}`,
      spec_version: '2.1',
      objects: [
        {
          type: 'incident',
          id: `incident--${incident.incident_id}`,
          created: incident.created_at,
          modified: incident.updated_at,
          name: `${incident.threat_type} incident on ${incident.target_asset}`,
          description: incident.description || `${incident.threat_type} detected from ${incident.source_ip}`,
          severity: DataTransformer.mapSeverityToScore(incident.severity),
          incident_types: [incident.threat_type],
          status: DataTransformer.mapStatusToStix(incident.status)
        },
        {
          type: 'ipv4-addr',
          id: `ipv4-addr--${Date.now()}`,
          value: incident.source_ip
        }
      ]
    };
  }

  /**
   * Flatten nested scan results for CSV/tabular export
   */
  static flattenScanResult(scanResult) {
    const rows = [];
    if (scanResult.portDetails) {
      scanResult.portDetails.forEach(port => {
        rows.push({
          scan_id: scanResult.scan_id,
          target_ip: scanResult.target_ip,
          scan_type: scanResult.scan_type,
          port: port.port,
          protocol: port.protocol,
          service: port.service,
          state: port.state,
          risk: port.risk,
          scanned_at: scanResult.created_at
        });
      });
    }
    return rows;
  }

  /**
   * API Response wrapper - standardize all API responses
   */
  static wrapResponse(data, meta = {}) {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v3',
        ...meta
      }
    };
  }

  static wrapError(message, code = 500, details = null) {
    return {
      success: false,
      error: { message, code, details },
      meta: { timestamp: new Date().toISOString(), version: 'v3' }
    };
  }

  // Helper methods
  static mapThreatCategory(threatType) {
    const categories = {
      ransomware: 'malware', malware: 'malware',
      phishing: 'social_engineering', spear_phishing: 'social_engineering',
      ddos: 'availability', dos: 'availability',
      sql_injection: 'injection', xss: 'injection',
      brute_force: 'credential_access',
      zero_day: 'exploit'
    };
    return categories[threatType] || 'unknown';
  }

  static mapSeverityToScore(severity) {
    const scores = { low: 25, medium: 50, high: 75, critical: 100 };
    return scores[severity] || 0;
  }

  static mapStatusToStix(status) {
    const mapping = {
      open: 'new', investigating: 'in-progress',
      contained: 'in-progress', eradicated: 'in-progress',
      recovered: 'resolved', closed: 'resolved'
    };
    return mapping[status] || 'unknown';
  }
}

module.exports = DataTransformer;
