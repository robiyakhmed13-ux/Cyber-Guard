/**
 * Database Configuration - Phase III
 * 
 * Relational Database: SQLite (via sql.js - pure JavaScript)
 * Non-Relational Database: NeDB (MongoDB-like embedded document store)
 */

const initSqlJs = require('sql.js');
const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let sqliteDb = null;
const DB_PATH = path.join(DATA_DIR, 'cyberguard.db');

async function initSQLite() {
  const SQL = await initSqlJs();
  let fileBuffer = null;
  if (fs.existsSync(DB_PATH)) {
    fileBuffer = fs.readFileSync(DB_PATH);
  }
  sqliteDb = new SQL.Database(fileBuffer || undefined);
  sqliteDb.run('PRAGMA foreign_keys = ON');

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'analyst' CHECK(role IN ('admin','analyst','viewer')),
      is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT, incident_id TEXT UNIQUE NOT NULL,
      threat_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('low','medium','high','critical')),
      source_ip TEXT NOT NULL, target_asset TEXT NOT NULL,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','investigating','contained','eradicated','recovered','closed')),
      assigned_to INTEGER REFERENCES users(id), description TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS threat_signatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT, signature_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL, category TEXT NOT NULL, severity TEXT NOT NULL,
      pattern TEXT NOT NULL, is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS incident_signatures (
      incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
      signature_id INTEGER REFERENCES threat_signatures(id) ON DELETE CASCADE,
      matched_at TEXT DEFAULT (datetime('now')), confidence REAL DEFAULT 0.0,
      PRIMARY KEY (incident_id, signature_id))`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL, resource TEXT NOT NULL, resource_id TEXT,
      details TEXT, ip_address TEXT, created_at TEXT DEFAULT (datetime('now')))`
  ];
  tables.forEach(t => sqliteDb.run(t));

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)',
    'CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity)',
    'CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_signatures_category ON threat_signatures(category)'
  ];
  indexes.forEach(idx => sqliteDb.run(idx));

  saveSQLite();
  logger.info('SQLite database initialized with schema');
}

function saveSQLite() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

function getDb() { return sqliteDb; }

function runQuery(sql, params = []) {
  logger.trackDbQuery('sqlite');
  const stmt = sqliteDb.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) { results.push(stmt.getAsObject()); }
  stmt.free();
  return results;
}

function runExec(sql, params = []) {
  logger.trackDbQuery('sqlite');
  if (params.length) {
    const stmt = sqliteDb.prepare(sql);
    stmt.run(params);
    stmt.free();
  } else {
    sqliteDb.run(sql);
  }
  saveSQLite();
}

function getLastInsertId() {
  const r = runQuery('SELECT last_insert_rowid() as id');
  return r[0]?.id;
}

// NeDB Collections
const nedbCollections = {
  threatIntel: Datastore.create({ filename: path.join(DATA_DIR, 'threat_intel.db'), autoload: true }),
  systemEvents: Datastore.create({ filename: path.join(DATA_DIR, 'system_events.db'), autoload: true }),
  scanResults: Datastore.create({ filename: path.join(DATA_DIR, 'scan_results.db'), autoload: true }),
  jobQueue: Datastore.create({ filename: path.join(DATA_DIR, 'job_queue.db'), autoload: true })
};

async function initNeDB() {
  await nedbCollections.threatIntel.ensureIndex({ fieldName: 'ioc_type' });
  await nedbCollections.threatIntel.ensureIndex({ fieldName: 'severity' });
  await nedbCollections.systemEvents.ensureIndex({ fieldName: 'event_type' });
  await nedbCollections.systemEvents.ensureIndex({ fieldName: 'timestamp' });
  await nedbCollections.scanResults.ensureIndex({ fieldName: 'scan_id', unique: true });
  await nedbCollections.jobQueue.ensureIndex({ fieldName: 'status' });
  logger.info('NeDB collections initialized with indexes');
}

module.exports = { getDb, initSQLite, saveSQLite, runQuery, runExec, getLastInsertId, nedbCollections, initNeDB };
