/**
 * SQLite Models - Data Access Layer (Phase III Component 1)
 * Uses sql.js (pure JavaScript SQLite) with parameterized queries
 */

const { runQuery, runExec, getLastInsertId } = require('../config/database');

class IncidentModel {
  static create(data) {
    runExec(
      `INSERT INTO incidents (incident_id, threat_type, severity, source_ip, target_asset, status, assigned_to, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.incident_id, data.threat_type, data.severity, data.source_ip, data.target_asset,
       data.status || 'open', data.assigned_to || null, data.description || null]
    );
    const id = getLastInsertId();
    return { id, incident_id: data.incident_id };
  }

  static findById(id) {
    const rows = runQuery(
      `SELECT i.*, u.username as assigned_username FROM incidents i
       LEFT JOIN users u ON i.assigned_to = u.id WHERE i.id = ?`, [id]
    );
    return rows[0] || null;
  }

  static findByIncidentId(incidentId) {
    const rows = runQuery(
      `SELECT i.*, u.username as assigned_username FROM incidents i
       LEFT JOIN users u ON i.assigned_to = u.id WHERE i.incident_id = ?`, [incidentId]
    );
    return rows[0] || null;
  }

  static findAll(filters = {}) {
    let sql = `SELECT i.*, u.username as assigned_username FROM incidents i
               LEFT JOIN users u ON i.assigned_to = u.id WHERE 1=1`;
    const params = [];

    if (filters.status) { sql += ' AND i.status = ?'; params.push(filters.status); }
    if (filters.severity) { sql += ' AND i.severity = ?'; params.push(filters.severity); }
    if (filters.threat_type) { sql += ' AND i.threat_type = ?'; params.push(filters.threat_type); }

    const limit = Math.min(parseInt(filters.limit) || 50, 100);
    const offset = parseInt(filters.offset) || 0;
    sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const data = runQuery(sql, params);
    const totalRows = runQuery('SELECT COUNT(*) as count FROM incidents');
    return { data, total: totalRows[0]?.count || 0, limit, offset };
  }

  static update(id, data) {
    const fields = [];
    const params = [];
    ['threat_type', 'severity', 'source_ip', 'target_asset', 'status', 'assigned_to', 'description'].forEach(f => {
      if (data[f] !== undefined) { fields.push(`${f} = ?`); params.push(data[f]); }
    });
    if (fields.length === 0) return null;
    fields.push("updated_at = datetime('now')");
    params.push(id);
    runExec(`UPDATE incidents SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  static delete(id) {
    const before = runQuery('SELECT COUNT(*) as c FROM incidents WHERE id = ?', [id]);
    if (!before[0]?.c) return false;
    runExec('DELETE FROM incidents WHERE id = ?', [id]);
    return true;
  }

  static getStatistics() {
    const bySeverity = runQuery('SELECT severity, COUNT(*) as count FROM incidents GROUP BY severity');
    const byStatus = runQuery('SELECT status, COUNT(*) as count FROM incidents GROUP BY status');
    const byThreatType = runQuery('SELECT threat_type, COUNT(*) as count FROM incidents GROUP BY threat_type ORDER BY count DESC LIMIT 10');
    const totalRows = runQuery('SELECT COUNT(*) as count FROM incidents');
    return { total: totalRows[0]?.count || 0, bySeverity, byStatus, byThreatType };
  }
}

class UserModel {
  static create(data) {
    runExec(
      `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [data.username, data.email, data.password_hash, data.role || 'analyst']
    );
    const id = getLastInsertId();
    return { id, username: data.username };
  }

  static findByUsername(username) {
    const rows = runQuery('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  }

  static findById(id) {
    const rows = runQuery('SELECT id, username, email, role, is_active, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static findAll() {
    return runQuery('SELECT id, username, email, role, is_active, created_at FROM users');
  }

  static update(id, data) {
    const fields = [];
    const params = [];
    ['email', 'role', 'is_active'].forEach(f => {
      if (data[f] !== undefined) { fields.push(`${f} = ?`); params.push(data[f]); }
    });
    if (fields.length === 0) return null;
    fields.push("updated_at = datetime('now')");
    params.push(id);
    runExec(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  static delete(id) {
    const before = runQuery('SELECT COUNT(*) as c FROM users WHERE id = ?', [id]);
    if (!before[0]?.c) return false;
    runExec('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }
}

class ThreatSignatureModel {
  static create(data) {
    runExec(
      `INSERT INTO threat_signatures (signature_id, name, category, severity, pattern, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.signature_id, data.name, data.category, data.severity, data.pattern, data.is_active ?? 1]
    );
    const id = getLastInsertId();
    return { id, signature_id: data.signature_id };
  }

  static findAll(filters = {}) {
    let sql = 'SELECT * FROM threat_signatures WHERE 1=1';
    const params = [];
    if (filters.category) { sql += ' AND category = ?'; params.push(filters.category); }
    if (filters.severity) { sql += ' AND severity = ?'; params.push(filters.severity); }
    sql += ' ORDER BY created_at DESC';
    return runQuery(sql, params);
  }

  static findById(id) {
    const rows = runQuery('SELECT * FROM threat_signatures WHERE id = ?', [id]);
    return rows[0] || null;
  }
}

class AuditLogModel {
  static create(data) {
    runExec(
      `INSERT INTO audit_log (user_id, action, resource, resource_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.user_id || null, data.action, data.resource, data.resource_id || null,
       data.details ? JSON.stringify(data.details) : null, data.ip_address || null]
    );
  }

  static findAll(filters = {}) {
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    if (filters.user_id) { sql += ' AND user_id = ?'; params.push(filters.user_id); }
    if (filters.action) { sql += ' AND action = ?'; params.push(filters.action); }
    if (filters.resource) { sql += ' AND resource = ?'; params.push(filters.resource); }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(filters.limit) || 100);
    return runQuery(sql, params);
  }
}

module.exports = { IncidentModel, UserModel, ThreatSignatureModel, AuditLogModel };
