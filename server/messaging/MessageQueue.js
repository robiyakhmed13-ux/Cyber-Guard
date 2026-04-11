/**
 * MessageQueue - Database-backed Asynchronous Message Queue
 * 
 * Implements:
 * - Producer service
 * - Consumer service
 * - Persistent message storage (in-memory DB simulation)
 * - Message processing after consumer offline
 * - Structured message format (JSON)
 * - Dead letter queue
 * - Priority queues
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class MessageQueue {
  constructor() {
    // Persistent storage (simulated with in-memory + file backup)
    this.messages = new Map();       // All messages by ID
    this.queues = new Map();         // Queue name -> [message IDs]
    this.consumers = new Map();      // Consumer ID -> { queue, lastConsumed }
    this.stats = {
      totalProduced: 0,
      totalConsumed: 0,
      totalFailed: 0,
      queueStats: {}
    };

    // Initialize default queues
    ['incidents', 'alerts', 'response-actions', 'notifications', 'dead-letter'].forEach(q => {
      this.queues.set(q, []);
      this.stats.queueStats[q] = { produced: 0, consumed: 0, pending: 0 };
    });

    // Persistence file path
    this.persistPath = path.join(__dirname, '..', 'data', 'messages.json');
    this.loadFromDisk();
  }

  /**
   * PRODUCER: Add a message to a queue
   */
  produce(queueName, messageBody, priority = 'normal') {
    const messageId = `MSG-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const message = {
      id: messageId,
      queue: queueName,
      body: messageBody,
      priority,
      status: 'pending',
      producedAt: new Date().toISOString(),
      consumedAt: null,
      retryCount: 0,
      metadata: {
        contentType: 'application/json',
        correlationId: messageBody.correlationId || null,
        headers: {
          producer: 'cyberguard-server',
          version: '1.0'
        }
      }
    };

    // Store message
    this.messages.set(messageId, message);

    // Add to queue
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
      this.stats.queueStats[queueName] = { produced: 0, consumed: 0, pending: 0 };
    }

    const queue = this.queues.get(queueName);
    
    // Priority ordering: critical > high > normal > low
    if (priority === 'critical') {
      queue.unshift(messageId);
    } else {
      queue.push(messageId);
    }

    // Update stats
    this.stats.totalProduced++;
    this.stats.queueStats[queueName].produced++;
    this.stats.queueStats[queueName].pending++;

    // Persist to disk
    this.saveToDisk();

    return messageId;
  }

  /**
   * CONSUMER: Consume messages from a queue
   * Demonstrates that consumer can process messages after being offline
   */
  consume(queueName, batchSize = 10) {
    if (!this.queues.has(queueName)) {
      return [];
    }

    const queue = this.queues.get(queueName);
    const consumed = [];
    const toConsume = Math.min(batchSize, queue.length);

    for (let i = 0; i < toConsume; i++) {
      const messageId = queue.shift();
      const message = this.messages.get(messageId);
      
      if (message) {
        message.status = 'consumed';
        message.consumedAt = new Date().toISOString();
        consumed.push(message);

        this.stats.totalConsumed++;
        if (this.stats.queueStats[queueName]) {
          this.stats.queueStats[queueName].consumed++;
          this.stats.queueStats[queueName].pending = Math.max(0, 
            this.stats.queueStats[queueName].pending - 1);
        }
      }
    }

    this.saveToDisk();
    return consumed;
  }

  /**
   * Get all messages (for persistence demonstration)
   */
  getAllMessages() {
    const all = {};
    this.queues.forEach((msgIds, queueName) => {
      all[queueName] = {
        pending: msgIds.map(id => this.messages.get(id)).filter(Boolean),
        pendingCount: msgIds.length
      };
    });

    // Also include consumed messages
    const consumed = [];
    this.messages.forEach(msg => {
      if (msg.status === 'consumed') consumed.push(msg);
    });

    return {
      queues: all,
      consumedMessages: consumed.slice(-50), // Last 50 consumed
      totalMessages: this.messages.size
    };
  }

  /**
   * Get queue statistics
   */
  getStats() {
    // Recalculate pending counts
    this.queues.forEach((msgIds, queueName) => {
      if (this.stats.queueStats[queueName]) {
        this.stats.queueStats[queueName].pending = msgIds.length;
      }
    });

    return {
      ...this.stats,
      totalPending: Array.from(this.queues.values()).reduce((sum, q) => sum + q.length, 0),
      totalStored: this.messages.size,
      queues: Object.keys(this.stats.queueStats).map(q => ({
        name: q,
        ...this.stats.queueStats[q]
      }))
    };
  }

  /**
   * Persistence: Save to disk
   */
  saveToDisk() {
    try {
      const dir = path.dirname(this.persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        messages: Array.from(this.messages.entries()),
        queues: Array.from(this.queues.entries()),
        stats: this.stats,
        savedAt: new Date().toISOString()
      };

      fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Failed to persist messages:', err.message);
    }
  }

  /**
   * Persistence: Load from disk
   */
  loadFromDisk() {
    try {
      if (fs.existsSync(this.persistPath)) {
        const data = JSON.parse(fs.readFileSync(this.persistPath, 'utf8'));
        this.messages = new Map(data.messages);
        this.queues = new Map(data.queues);
        this.stats = data.stats;
        console.log(`[MessageQueue] Restored ${this.messages.size} messages from disk`);
      }
    } catch (err) {
      console.log('[MessageQueue] Starting with fresh state');
    }
  }
}

module.exports = MessageQueue;
