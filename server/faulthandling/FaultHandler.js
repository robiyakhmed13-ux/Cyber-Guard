/**
 * FaultHandler - Fault Handling and Recovery Mechanisms
 * 
 * Implements:
 * - Service timeout handling
 * - Retry mechanism (exponential backoff)
 * - Exception handling
 * - Graceful user notification
 * - Error logging
 * - Circuit breaker pattern
 * - Compensation logic
 * - Failover strategy
 * - Fault simulation for demonstration
 */

class FaultHandler {
  constructor() {
    // Error log storage
    this.errorLogs = [];
    this.maxLogSize = 1000;

    // Circuit breaker state for each service
    this.circuitBreakers = new Map();
    this.CB_THRESHOLD = 5;       // failures before opening
    this.CB_TIMEOUT = 30000;     // ms before half-open
    this.CB_HALF_OPEN_MAX = 2;   // test requests in half-open

    // Initialize circuit breakers for known services
    ['ThreatAnalysisService', 'NetworkScanService', 'ComplianceCheckService'].forEach(service => {
      this.circuitBreakers.set(service, {
        state: 'closed',        // closed | open | half-open
        failures: 0,
        successes: 0,
        lastFailure: null,
        openedAt: null,
        halfOpenRequests: 0
      });
    });
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async withRetry(fn, options = {}) {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, serviceName = 'unknown' } = options;

    // Check circuit breaker
    if (serviceName !== 'unknown' && !this.isCircuitAllowed(serviceName)) {
      throw new Error(`Circuit breaker OPEN for ${serviceName}. Service is temporarily unavailable.`);
    }

    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          fn(),
          this.timeout(5000) // 5 second timeout
        ]);

        // Success: record and reset circuit breaker
        if (serviceName !== 'unknown') {
          this.recordSuccess(serviceName);
        }
        return result;
      } catch (error) {
        lastError = error;
        
        this.logError(serviceName, error, {
          attempt: attempt + 1,
          maxRetries,
          willRetry: attempt < maxRetries
        });

        // Record failure for circuit breaker
        if (serviceName !== 'unknown') {
          this.recordFailure(serviceName, error);
        }

        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
            maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Timeout wrapper
   */
  timeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    });
  }

  /**
   * Circuit Breaker: Check if request is allowed
   */
  isCircuitAllowed(serviceName) {
    const cb = this.circuitBreakers.get(serviceName);
    if (!cb) return true;

    switch (cb.state) {
      case 'closed':
        return true;
      case 'open':
        // Check if timeout has elapsed
        if (Date.now() - cb.openedAt > this.CB_TIMEOUT) {
          cb.state = 'half-open';
          cb.halfOpenRequests = 0;
          return true;
        }
        return false;
      case 'half-open':
        return cb.halfOpenRequests < this.CB_HALF_OPEN_MAX;
      default:
        return true;
    }
  }

  /**
   * Circuit Breaker: Record success
   */
  recordSuccess(serviceName) {
    const cb = this.circuitBreakers.get(serviceName);
    if (!cb) return;

    cb.successes++;

    if (cb.state === 'half-open') {
      // Successful half-open request: close circuit
      cb.state = 'closed';
      cb.failures = 0;
      cb.halfOpenRequests = 0;
    }
  }

  /**
   * Circuit Breaker: Record failure
   */
  recordFailure(serviceName, error) {
    const cb = this.circuitBreakers.get(serviceName);
    if (!cb) return;

    cb.failures++;
    cb.lastFailure = new Date().toISOString();

    if (cb.state === 'half-open') {
      // Failed half-open request: reopen circuit
      cb.state = 'open';
      cb.openedAt = Date.now();
    } else if (cb.state === 'closed' && cb.failures >= this.CB_THRESHOLD) {
      // Too many failures: open circuit
      cb.state = 'open';
      cb.openedAt = Date.now();
    }
  }

  /**
   * Log error with context
   */
  logError(source, error, context = {}) {
    const logEntry = {
      id: `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      source,
      message: error.message,
      stack: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : null,
      context,
      timestamp: new Date().toISOString(),
      severity: this.classifyError(error)
    };

    this.errorLogs.push(logEntry);

    // Trim log if too large
    if (this.errorLogs.length > this.maxLogSize) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogSize);
    }

    console.error(`[FAULT] ${source}: ${error.message}`, context);
    return logEntry;
  }

  /**
   * Get error logs
   */
  getLogs(options = {}) {
    const { limit = 50, source, severity } = options;
    let logs = [...this.errorLogs];

    if (source) logs = logs.filter(l => l.source === source);
    if (severity) logs = logs.filter(l => l.severity === severity);

    return {
      logs: logs.slice(-limit),
      total: this.errorLogs.length,
      bySeverity: {
        critical: this.errorLogs.filter(l => l.severity === 'critical').length,
        error: this.errorLogs.filter(l => l.severity === 'error').length,
        warning: this.errorLogs.filter(l => l.severity === 'warning').length,
        info: this.errorLogs.filter(l => l.severity === 'info').length
      }
    };
  }

  /**
   * Get circuit breaker status for all services
   */
  getCircuitBreakerStatus() {
    const status = {};
    this.circuitBreakers.forEach((cb, service) => {
      status[service] = {
        state: cb.state,
        failures: cb.failures,
        successes: cb.successes,
        lastFailure: cb.lastFailure,
        ...(cb.state === 'open' && {
          willRetryAt: new Date(cb.openedAt + this.CB_TIMEOUT).toISOString(),
          remainingMs: Math.max(0, (cb.openedAt + this.CB_TIMEOUT) - Date.now())
        })
      };
    });
    return {
      services: status,
      config: {
        failureThreshold: this.CB_THRESHOLD,
        timeoutMs: this.CB_TIMEOUT,
        halfOpenMaxRequests: this.CB_HALF_OPEN_MAX
      }
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers() {
    this.circuitBreakers.forEach(cb => {
      cb.state = 'closed';
      cb.failures = 0;
      cb.successes = 0;
      cb.lastFailure = null;
      cb.openedAt = null;
      cb.halfOpenRequests = 0;
    });
  }

  /**
   * Simulate fault scenarios for demonstration
   */
  async simulateFault(scenario) {
    switch (scenario) {
      case 'timeout':
        // Simulate a service timeout
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Service timeout: ThreatAnalysis did not respond within 5000ms')), 100);
        });
        break;

      case 'service_unavailable':
        throw new Error('Service unavailable: NetworkScanService is not responding (HTTP 503)');

      case 'data_corruption':
        throw new Error('Data integrity error: Response checksum mismatch from ComplianceCheckService');

      case 'network_error':
        throw new Error('Network error: Connection refused to service at 10.0.1.50:8443');

      case 'rate_limit':
        throw new Error('Rate limit exceeded: Too many requests to ThreatAnalysisService (429)');

      case 'circuit_breaker':
        // Trigger circuit breaker by simulating multiple failures
        for (let i = 0; i < this.CB_THRESHOLD + 1; i++) {
          this.recordFailure('ThreatAnalysisService', new Error('Simulated failure'));
        }
        return {
          scenario: 'circuit_breaker',
          result: 'Circuit breaker opened for ThreatAnalysisService',
          status: this.getCircuitBreakerStatus()
        };

      case 'compensation':
        // Demonstrate compensation logic
        return {
          scenario: 'compensation',
          originalAction: 'Block IP 192.168.1.100',
          compensationAction: 'Unblock IP 192.168.1.100',
          reason: 'False positive detected after analysis',
          steps: [
            { action: 'Revert firewall rule', status: 'completed' },
            { action: 'Restore network access', status: 'completed' },
            { action: 'Update threat database', status: 'completed' },
            { action: 'Notify affected users', status: 'completed' }
          ]
        };

      default:
        throw new Error(`Unknown fault scenario: ${scenario}`);
    }
  }

  /**
   * Graceful user-friendly error messages
   */
  getUserFriendlyMessage(error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('timeout')) {
      return 'The service is taking longer than expected. Please try again in a moment.';
    }
    if (msg.includes('unavailable') || msg.includes('503')) {
      return 'The service is temporarily unavailable. Our team has been notified and is working on it.';
    }
    if (msg.includes('circuit breaker')) {
      return 'This service is currently experiencing issues. It will be automatically retried shortly.';
    }
    if (msg.includes('rate limit') || msg.includes('429')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    if (msg.includes('network')) {
      return 'A network connectivity issue occurred. Please check your connection and try again.';
    }
    if (msg.includes('integrity') || msg.includes('checksum')) {
      return 'A data validation error occurred. The request is being retried automatically.';
    }
    return 'An unexpected error occurred. Our team has been notified.';
  }

  /**
   * Get recovery action for an error
   */
  getRecoveryAction(error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('timeout')) return { action: 'retry', delay: '5 seconds' };
    if (msg.includes('unavailable')) return { action: 'failover', target: 'backup_service' };
    if (msg.includes('circuit breaker')) return { action: 'wait', duration: `${this.CB_TIMEOUT / 1000}s` };
    if (msg.includes('rate limit')) return { action: 'backoff', delay: '30 seconds' };
    if (msg.includes('network')) return { action: 'reconnect', attempts: 3 };
    return { action: 'escalate', target: 'operations_team' };
  }

  /**
   * Classify error severity
   */
  classifyError(error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('critical') || msg.includes('data') || msg.includes('integrity')) return 'critical';
    if (msg.includes('timeout') || msg.includes('unavailable')) return 'error';
    if (msg.includes('rate limit') || msg.includes('circuit')) return 'warning';
    return 'error';
  }
}

module.exports = FaultHandler;
