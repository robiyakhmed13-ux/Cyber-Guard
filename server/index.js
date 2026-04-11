/**
 * CyberGuard Enterprise Integration Server
 * 
 * Phase II: Service-Oriented Enterprise Integration System
 * 
 * Components:
 * 1. Business Process Orchestration (Custom Workflow Engine)
 * 2. Message-Based Asynchronous Integration (Database-backed Message Queue)
 * 3. Stateful Service Interaction with Correlation
 * 4. Enterprise Caching Strategy
 * 5. Service Contracts (OpenAPI/Swagger)
 * 6. Fault Handling and Recovery Mechanisms
 */

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ============================================================
// COMPONENT 4: Enterprise Caching Strategy
// ============================================================
const CacheManager = require('./caching/CacheManager');
const cache = new CacheManager();

// ============================================================
// COMPONENT 2: Message Queue (Database-backed)
// ============================================================
const MessageQueue = require('./messaging/MessageQueue');
const messageQueue = new MessageQueue();

// ============================================================
// COMPONENT 3: Correlation Manager
// ============================================================
const CorrelationManager = require('./correlation/CorrelationManager');
const correlationManager = new CorrelationManager();

// ============================================================
// COMPONENT 1: Workflow Orchestration Engine
// ============================================================
const WorkflowEngine = require('./orchestration/WorkflowEngine');
const workflowEngine = new WorkflowEngine(messageQueue, correlationManager, cache);

// ============================================================
// COMPONENT 6: Fault Handling
// ============================================================
const FaultHandler = require('./faulthandling/FaultHandler');
const faultHandler = new FaultHandler();

// ============================================================
// COMPONENT 5: OpenAPI Specification
// ============================================================
const swaggerSpec = require('./contracts/openapi.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================================
// Partner Service Simulators (3 required services)
// ============================================================
const ThreatAnalysisService = require('./services/ThreatAnalysisService');
const NetworkScanService = require('./services/NetworkScanService');
const ComplianceCheckService = require('./services/ComplianceCheckService');

const threatService = new ThreatAnalysisService(faultHandler);
const networkService = new NetworkScanService(faultHandler);
const complianceService = new ComplianceCheckService(faultHandler);

// ============================================================
// Middleware: Request logging for fault handling
// ============================================================
app.use((req, res, next) => {
  req.requestId = uuidv4();
  req.startTime = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | RequestID: ${req.requestId}`);
  next();
});

// ============================================================
// API ROUTES
// ============================================================

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      orchestration: 'active',
      messaging: 'active',
      caching: 'active',
      correlation: 'active',
      faultHandling: 'active'
    }
  });
});

// ============================================================
// 1. ORCHESTRATION ENDPOINTS
// ============================================================

/**
 * POST /api/orchestration/incident-response
 * Initiates the Incident Response Workflow (BPEL-equivalent)
 * 
 * Workflow: Receive → Parallel(ThreatAnalysis + NetworkScan) → 
 *           Switch(severity) → Sequential(Containment → Eradication → Recovery) → 
 *           Invoke(ComplianceCheck) → Reply
 */
app.post('/api/orchestration/incident-response', async (req, res) => {
  const { threatType, sourceIP, targetAsset, severity } = req.body;

  if (!threatType || !sourceIP || !targetAsset) {
    return res.status(400).json({ error: 'Missing required fields: threatType, sourceIP, targetAsset' });
  }

  try {
    const workflowId = uuidv4();
    const correlationId = `INC-${Date.now()}-${workflowId.substring(0, 8)}`;

    // RECEIVE: Accept the incident report
    const incidentData = {
      workflowId,
      correlationId,
      threatType,
      sourceIP,
      targetAsset,
      severity: severity || 'medium',
      reportedAt: new Date().toISOString()
    };

    // Start workflow execution
    const result = await workflowEngine.executeIncidentResponseWorkflow(incidentData);

    // REPLY: Return the orchestrated result
    res.json({
      status: 'completed',
      correlationId,
      workflowId,
      result,
      executionTime: `${Date.now() - req.startTime}ms`
    });
  } catch (error) {
    faultHandler.logError('orchestration', error, { requestId: req.requestId });
    res.status(500).json({
      error: 'Workflow execution failed',
      message: faultHandler.getUserFriendlyMessage(error),
      requestId: req.requestId
    });
  }
});

// Get workflow status
app.get('/api/orchestration/workflow/:workflowId', (req, res) => {
  const status = workflowEngine.getWorkflowStatus(req.params.workflowId);
  if (!status) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json(status);
});

// List all workflows
app.get('/api/orchestration/workflows', (req, res) => {
  res.json(workflowEngine.listWorkflows());
});

// ============================================================
// 2. MESSAGE QUEUE ENDPOINTS
// ============================================================

// Produce a message
app.post('/api/messages/produce', (req, res) => {
  const { queue, message, priority } = req.body;
  if (!queue || !message) {
    return res.status(400).json({ error: 'Missing required fields: queue, message' });
  }

  const msgId = messageQueue.produce(queue, message, priority || 'normal');
  res.json({ status: 'queued', messageId: msgId, queue });
});

// Consume messages from a queue
app.post('/api/messages/consume', (req, res) => {
  const { queue, batchSize } = req.body;
  if (!queue) {
    return res.status(400).json({ error: 'Missing required field: queue' });
  }

  const messages = messageQueue.consume(queue, batchSize || 10);
  res.json({ queue, messages, count: messages.length });
});

// Get queue statistics
app.get('/api/messages/stats', (req, res) => {
  res.json(messageQueue.getStats());
});

// Get all messages (for demo - shows persistence)
app.get('/api/messages/all', (req, res) => {
  res.json(messageQueue.getAllMessages());
});

// Simulate consumer offline/online
app.post('/api/messages/simulate-offline', (req, res) => {
  const { queue, messagesCount } = req.body;
  // Produce messages while "consumer is offline"
  const produced = [];
  for (let i = 0; i < (messagesCount || 5); i++) {
    const msgId = messageQueue.produce(queue || 'alerts', {
      type: 'threat_alert',
      severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      message: `Alert #${i + 1} generated while consumer was offline`,
      timestamp: new Date().toISOString()
    });
    produced.push(msgId);
  }
  res.json({
    status: 'Messages produced while consumer was offline',
    messageIds: produced,
    note: 'Call POST /api/messages/consume to process these messages when consumer comes back online'
  });
});

// ============================================================
// 3. CORRELATION ENDPOINTS
// ============================================================

// Create a correlated session
app.post('/api/correlation/session', (req, res) => {
  const { clientId, businessContext } = req.body;
  if (!clientId) {
    return res.status(400).json({ error: 'Missing required field: clientId' });
  }

  const session = correlationManager.createSession(clientId, businessContext || {});
  res.json(session);
});

// Update session state
app.put('/api/correlation/session/:correlationId', (req, res) => {
  const { state, data } = req.body;
  const updated = correlationManager.updateSession(req.params.correlationId, state, data);
  if (!updated) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(updated);
});

// Get session by correlation ID
app.get('/api/correlation/session/:correlationId', (req, res) => {
  const session = correlationManager.getSession(req.params.correlationId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

// List all active sessions
app.get('/api/correlation/sessions', (req, res) => {
  res.json(correlationManager.listSessions());
});

// Simulate concurrent requests with correlation
app.post('/api/correlation/simulate-concurrent', async (req, res) => {
  const results = await correlationManager.simulateConcurrentRequests();
  res.json(results);
});

// ============================================================
// 4. CACHING ENDPOINTS
// ============================================================

// Get cache statistics
app.get('/api/cache/stats', (req, res) => {
  res.json(cache.getStats());
});

// Cache performance comparison
app.get('/api/cache/performance', async (req, res) => {
  const results = await cache.performanceComparison();
  res.json(results);
});

// Get cached data (output caching demo)
app.get('/api/cache/dashboard-data', (req, res) => {
  const cacheKey = 'dashboard:summary';
  const startTime = Date.now();

  // Try cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({
      ...cached,
      _meta: {
        source: 'cache',
        responseTime: `${Date.now() - startTime}ms`,
        cacheHit: true
      }
    });
  }

  // Simulate expensive computation
  const data = generateDashboardData();
  cache.set(cacheKey, data, { ttl: 30000, type: 'output' }); // 30s absolute expiry

  res.json({
    ...data,
    _meta: {
      source: 'computed',
      responseTime: `${Date.now() - startTime}ms`,
      cacheHit: false
    }
  });
});

// Data-level caching demo
app.get('/api/cache/threat-data/:threatId', (req, res) => {
  const cacheKey = `threat:${req.params.threatId}`;
  const startTime = Date.now();

  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({
      ...cached,
      _meta: { source: 'data-cache', responseTime: `${Date.now() - startTime}ms`, cacheHit: true }
    });
  }

  // Simulate DB lookup
  const data = {
    threatId: req.params.threatId,
    type: 'malware',
    severity: 'high',
    details: `Detailed analysis for threat ${req.params.threatId}`,
    indicators: ['hash:abc123', 'ip:10.0.0.1', 'domain:evil.com'],
    generatedAt: new Date().toISOString()
  };
  cache.set(cacheKey, data, { ttl: 60000, type: 'data', sliding: true }); // 60s sliding expiry

  res.json({
    ...data,
    _meta: { source: 'database', responseTime: `${Date.now() - startTime}ms`, cacheHit: false }
  });
});

// Invalidate cache
app.delete('/api/cache/invalidate/:key', (req, res) => {
  cache.invalidate(req.params.key);
  res.json({ status: 'invalidated', key: req.params.key });
});

// Clear all cache
app.delete('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({ status: 'cache cleared' });
});

// ============================================================
// 5. SERVICE CONTRACT ENDPOINTS (direct service invocations)
// ============================================================

// Threat Analysis Service
app.post('/api/services/threat-analysis', async (req, res) => {
  try {
    const result = await faultHandler.withRetry(
      () => threatService.analyze(req.body),
      { maxRetries: 3, baseDelay: 1000 }
    );
    res.json(result);
  } catch (error) {
    res.status(503).json({
      error: 'Service unavailable',
      message: faultHandler.getUserFriendlyMessage(error),
      requestId: req.requestId
    });
  }
});

// Network Scan Service
app.post('/api/services/network-scan', async (req, res) => {
  try {
    const result = await faultHandler.withRetry(
      () => networkService.scan(req.body),
      { maxRetries: 3, baseDelay: 1000 }
    );
    res.json(result);
  } catch (error) {
    res.status(503).json({
      error: 'Service unavailable',
      message: faultHandler.getUserFriendlyMessage(error),
      requestId: req.requestId
    });
  }
});

// Compliance Check Service
app.post('/api/services/compliance-check', async (req, res) => {
  try {
    const result = await faultHandler.withRetry(
      () => complianceService.check(req.body),
      { maxRetries: 3, baseDelay: 1000 }
    );
    res.json(result);
  } catch (error) {
    res.status(503).json({
      error: 'Service unavailable',
      message: faultHandler.getUserFriendlyMessage(error),
      requestId: req.requestId
    });
  }
});

// ============================================================
// 6. FAULT HANDLING ENDPOINTS
// ============================================================

// Get error logs
app.get('/api/faults/logs', (req, res) => {
  res.json(faultHandler.getLogs());
});

// Circuit breaker status
app.get('/api/faults/circuit-breaker', (req, res) => {
  res.json(faultHandler.getCircuitBreakerStatus());
});

// Simulate fault scenarios
app.post('/api/faults/simulate', async (req, res) => {
  const { scenario } = req.body;
  try {
    const result = await faultHandler.simulateFault(scenario || 'timeout');
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Fault simulation result',
      scenario: scenario || 'timeout',
      handled: true,
      message: faultHandler.getUserFriendlyMessage(error),
      recovery: faultHandler.getRecoveryAction(error)
    });
  }
});

// Reset circuit breakers
app.post('/api/faults/reset', (req, res) => {
  faultHandler.resetCircuitBreakers();
  res.json({ status: 'Circuit breakers reset' });
});

// ============================================================
// Helper Functions
// ============================================================

function generateDashboardData() {
  // Simulate expensive computation (50ms delay)
  const start = Date.now();
  while (Date.now() - start < 50) {} // Busy wait to simulate work
  
  return {
    totalThreats: Math.floor(Math.random() * 10000) + 5000,
    activeIncidents: Math.floor(Math.random() * 50) + 10,
    resolvedToday: Math.floor(Math.random() * 200) + 100,
    systemHealth: (95 + Math.random() * 5).toFixed(1),
    topThreats: [
      { type: 'Ransomware', count: Math.floor(Math.random() * 100) },
      { type: 'Phishing', count: Math.floor(Math.random() * 200) },
      { type: 'DDoS', count: Math.floor(Math.random() * 50) },
      { type: 'SQL Injection', count: Math.floor(Math.random() * 80) },
      { type: 'XSS', count: Math.floor(Math.random() * 60) }
    ],
    generatedAt: new Date().toISOString()
  };
}

// ============================================================
// Error handling middleware
// ============================================================
app.use((err, req, res, next) => {
  faultHandler.logError('unhandled', err, { requestId: req.requestId, path: req.path });
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred. Our team has been notified.',
    requestId: req.requestId
  });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  CyberGuard Enterprise Integration Server       ║`);
  console.log(`║  Port: ${PORT}                                     ║`);
  console.log(`║  API Docs: http://localhost:${PORT}/api-docs         ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
  console.log(`Active Components:`);
  console.log(`  ✓ Workflow Orchestration Engine`);
  console.log(`  ✓ Message Queue (Database-backed)`);
  console.log(`  ✓ Correlation Manager`);
  console.log(`  ✓ Cache Manager (Output + Data-level)`);
  console.log(`  ✓ Fault Handler (Circuit Breaker + Retry)`);
  console.log(`  ✓ OpenAPI Documentation\n`);
});

module.exports = app;
