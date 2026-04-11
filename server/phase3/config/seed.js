/**
 * Database Seeder - Populate databases with sample data
 */

const { IncidentModel, UserModel, ThreatSignatureModel } = require('../models/sqliteModels');
const { ThreatIntelModel, SystemEventModel } = require('../models/nedbModels');
const { nedbCollections } = require('./database');
const { hashPassword } = require('../middleware/security');
const logger = require('../utils/logger');

async function seedDatabase() {
  logger.info('Seeding database with sample data...');

  if (!UserModel.findByUsername('admin')) {
    const adminHash = await hashPassword('Admin123!');
    const analystHash = await hashPassword('Analyst123!');
    UserModel.create({ username: 'admin', email: 'admin@cyberguard.com', password_hash: adminHash, role: 'admin' });
    UserModel.create({ username: 'analyst1', email: 'analyst1@cyberguard.com', password_hash: analystHash, role: 'analyst' });
    UserModel.create({ username: 'viewer1', email: 'viewer1@cyberguard.com', password_hash: analystHash, role: 'viewer' });
    logger.info('Users seeded');
  } else {
    logger.info('Users already exist, skipping');
  }

  const threats = ['ransomware', 'phishing', 'ddos', 'malware', 'sql_injection', 'xss', 'brute_force'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['open', 'investigating', 'contained', 'closed'];

  for (let i = 0; i < 15; i++) {
    try {
      IncidentModel.create({
        incident_id: `INC-SEED-${String(i + 1).padStart(4, '0')}`,
        threat_type: threats[Math.floor(Math.random() * threats.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        source_ip: `${10 + Math.floor(Math.random() * 240)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        target_asset: `server-${String.fromCharCode(65 + Math.floor(Math.random() * 10))}${Math.floor(Math.random() * 100)}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        description: 'Automated detection of suspicious activity targeting infrastructure'
      });
    } catch (e) {
      // Skip duplicate seed incidents.
    }
  }
  logger.info('Incidents seeded');

  const sigCategories = ['malware', 'network', 'web', 'authentication'];
  for (let i = 0; i < 10; i++) {
    try {
      ThreatSignatureModel.create({
        signature_id: `SIG-${String(i + 1).padStart(4, '0')}`,
        name: `Signature-${['Trojan', 'Worm', 'Backdoor', 'Scanner', 'BruteForce', 'SQLi', 'XSS', 'Phish', 'C2', 'Exfil'][i]}`,
        category: sigCategories[Math.floor(Math.random() * sigCategories.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        pattern: `pattern_rule_${i + 1}`,
        is_active: 1
      });
    } catch (e) {
      // Skip duplicate signatures.
    }
  }
  logger.info('Threat signatures seeded');

  const threatIntelCount = await nedbCollections.threatIntel.count({});
  if (threatIntelCount === 0) {
    const iocTypes = ['ip', 'domain', 'hash', 'url', 'email'];
    for (let i = 0; i < 10; i++) {
      const iocType = iocTypes[Math.floor(Math.random() * iocTypes.length)];
      const values = {
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        domain: `malicious-${i}.evil.com`,
        hash: `${Math.random().toString(16).substring(2, 34)}`,
        url: `https://malware-${i}.example.com/payload`,
        email: `attacker${i}@phishing.com`
      };

      await ThreatIntelModel.create({
        ioc_type: iocType,
        ioc_value: values[iocType],
        severity: severities[Math.floor(Math.random() * severities.length)],
        source: ['OSINT', 'Internal', 'VirusTotal', 'AbuseIPDB'][Math.floor(Math.random() * 4)],
        tags: ['apt', 'botnet', 'c2', 'dropper'].slice(0, Math.floor(Math.random() * 3) + 1),
        description: `Known ${iocType} indicator associated with threat activity`,
        first_seen: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
        last_seen: new Date().toISOString()
      });
    }
    logger.info('Threat intel seeded');
  } else {
    logger.info('Threat intel already exists, skipping');
  }

  const systemEventCount = await nedbCollections.systemEvents.count({});
  if (systemEventCount === 0) {
    const eventTypes = ['login', 'scan_complete', 'alert_triggered', 'config_change', 'backup_complete'];
    for (let i = 0; i < 20; i++) {
      await SystemEventModel.create({
        event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        severity: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
        source: 'system',
        details: { message: `System event #${i + 1}` },
        timestamp: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString()
      });
    }
    logger.info('System events seeded');
  } else {
    logger.info('System events already exist, skipping');
  }

  logger.info('Database seeding complete!');
}

module.exports = seedDatabase;
