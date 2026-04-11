/**
 * CorrelationManager - Stateful Service Interaction with Correlation
 * 
 * Implements:
 * - Concurrent user request handling
 * - Response-to-process correlation via unique business IDs
 * - Unique business identifiers (Incident ID, Transaction ID)
 * - Conversational state across service calls
 * - Session lifecycle management
 */

const { v4: uuidv4 } = require('uuid');

class CorrelationManager {
  constructor() {
    this.sessions = new Map(); // correlationId -> session state
    this.clientIndex = new Map(); // clientId -> [correlationIds]
  }

  /**
   * Create a new correlated session
   * 
   * Correlation Key Design:
   * - Format: CG-{timestamp}-{random} (e.g., CG-1709123456-a1b2c3d4)
   * - Guarantees uniqueness via timestamp + UUID fragment
   * - Human-readable prefix for debugging
   */
  createSession(clientId, businessContext = {}) {
    const correlationId = `CG-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const session = {
      correlationId,
      clientId,
      businessContext,
      state: 'created',
      stateHistory: [
        {
          state: 'created',
          timestamp: new Date().toISOString(),
          data: null
        }
      ],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ttl: 3600000, // 1 hour session TTL
      metadata: {
        requestCount: 0,
        lastRequestAt: null,
        servicesCalled: []
      }
    };

    this.sessions.set(correlationId, session);

    // Index by client
    if (!this.clientIndex.has(clientId)) {
      this.clientIndex.set(clientId, []);
    }
    this.clientIndex.get(clientId).push(correlationId);

    return session;
  }

  /**
   * Update session state - maintains conversational state across service calls
   * 
   * State Management:
   * created → analysis_in_progress → analysis_complete → 
   * response_in_progress → completed
   */
  updateSession(correlationId, newState, data = null) {
    const session = this.sessions.get(correlationId);
    if (!session) return null;

    session.state = newState;
    session.lastUpdated = new Date().toISOString();
    session.stateHistory.push({
      state: newState,
      timestamp: new Date().toISOString(),
      data: data ? { ...data } : null
    });
    session.metadata.requestCount++;
    session.metadata.lastRequestAt = new Date().toISOString();

    return session;
  }

  /**
   * Get session by correlation ID
   */
  getSession(correlationId) {
    const session = this.sessions.get(correlationId);
    if (!session) return null;

    // Check TTL
    if (Date.now() - new Date(session.createdAt).getTime() > session.ttl) {
      session.state = 'expired';
    }

    return session;
  }

  /**
   * List all active sessions
   */
  listSessions() {
    const sessions = [];
    this.sessions.forEach((session, id) => {
      sessions.push({
        correlationId: id,
        clientId: session.clientId,
        state: session.state,
        stateHistoryLength: session.stateHistory.length,
        createdAt: session.createdAt,
        lastUpdated: session.lastUpdated,
        requestCount: session.metadata.requestCount
      });
    });

    return {
      sessions,
      total: sessions.length,
      active: sessions.filter(s => !['completed', 'expired', 'failed'].includes(s.state)).length
    };
  }

  /**
   * Simulate concurrent requests with correlation
   * Demonstrates handling of simultaneous client requests
   */
  async simulateConcurrentRequests() {
    const clients = ['client-A', 'client-B', 'client-C'];
    const results = [];

    // Create sessions for all clients simultaneously
    const sessions = clients.map(clientId => 
      this.createSession(clientId, { type: 'concurrent-test' })
    );

    // Simulate concurrent state updates
    const updatePromises = sessions.map(async (session, index) => {
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

      // Each client goes through different states at different speeds
      await delay(Math.random() * 100);
      this.updateSession(session.correlationId, 'analyzing', {
        step: 1,
        client: clients[index]
      });

      await delay(Math.random() * 150);
      this.updateSession(session.correlationId, 'processing', {
        step: 2,
        client: clients[index]
      });

      await delay(Math.random() * 100);
      this.updateSession(session.correlationId, 'completed', {
        step: 3,
        client: clients[index],
        result: `Result for ${clients[index]}`
      });

      return this.getSession(session.correlationId);
    });

    const completedSessions = await Promise.all(updatePromises);

    return {
      description: 'Concurrent request simulation with 3 clients',
      clients: clients,
      results: completedSessions.map(s => ({
        correlationId: s.correlationId,
        clientId: s.clientId,
        finalState: s.state,
        stateTransitions: s.stateHistory.length,
        states: s.stateHistory.map(h => h.state)
      })),
      note: 'Each client maintained independent state through correlation IDs despite concurrent execution'
    };
  }

  /**
   * Get sessions by client ID
   */
  getSessionsByClient(clientId) {
    const correlationIds = this.clientIndex.get(clientId) || [];
    return correlationIds.map(id => this.getSession(id)).filter(Boolean);
  }

  /**
   * Clean up expired sessions
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    this.sessions.forEach((session, id) => {
      if (now - new Date(session.createdAt).getTime() > session.ttl) {
        this.sessions.delete(id);
        cleaned++;
      }
    });

    return { cleaned, remaining: this.sessions.size };
  }
}

module.exports = CorrelationManager;
