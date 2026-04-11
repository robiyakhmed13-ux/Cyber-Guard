import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Activity, Shield, AlertTriangle, Zap, Database, RefreshCw,
  Play, Pause, CheckCircle, XCircle, Clock, Workflow, Server
} from "lucide-react";

const API_BASE = "http://localhost:3001/api";

interface CacheStats {
  overall: { hits: number; misses: number; hitRate: string; entries: number };
  memory: { current: string; utilization: string };
}

interface QueueStats {
  totalProduced: number;
  totalConsumed: number;
  totalPending: number;
  queues: Array<{ name: string; produced: number; consumed: number; pending: number }>;
}

const IntegrationDashboard = () => {
  const [health, setHealth] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<any>(null);
  const [workflowResult, setWorkflowResult] = useState<any>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [concurrentResult, setConcurrentResult] = useState<any>(null);
  const [cachePerf, setCachePerf] = useState<any>(null);
  const [offlineResult, setOfflineResult] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  const fetchData = async (endpoint: string) => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      return await res.json();
    } catch {
      return null;
    }
  };

  const postData = async (endpoint: string, body?: any) => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...(body && { body: JSON.stringify(body) })
      });
      return await res.json();
    } catch {
      return null;
    }
  };

  const refreshAll = async () => {
    const h = await fetchData("/health");
    setConnected(!!h);
    if (h) setHealth(h);

    const w = await fetchData("/orchestration/workflows");
    if (w) setWorkflows(w.workflows || []);

    const q = await fetchData("/messages/stats");
    if (q) setQueueStats(q);

    const c = await fetchData("/cache/stats");
    if (c) setCacheStats(c);

    const cb = await fetchData("/faults/circuit-breaker");
    if (cb) setCircuitBreakers(cb);

    const l = await fetchData("/faults/logs");
    if (l) setLogs(l.logs?.slice(-5) || []);
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const setLoadingKey = (key: string, val: boolean) =>
    setLoading(prev => ({ ...prev, [key]: val }));

  const runWorkflow = async () => {
    setLoadingKey("workflow", true);
    const result = await postData("/orchestration/incident-response", {
      threatType: ["ransomware", "ddos", "phishing", "malware"][Math.floor(Math.random() * 4)],
      sourceIP: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      targetAsset: `server-${String(Math.floor(Math.random() * 20) + 1).padStart(2, "0")}`,
      severity: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)]
    });
    setWorkflowResult(result);
    setLoadingKey("workflow", false);
    refreshAll();
  };

  const runConcurrent = async () => {
    setLoadingKey("concurrent", true);
    const result = await postData("/correlation/simulate-concurrent");
    setConcurrentResult(result);
    setLoadingKey("concurrent", false);
  };

  const runCachePerf = async () => {
    setLoadingKey("cache", true);
    const result = await fetchData("/cache/performance");
    setCachePerf(result);
    setLoadingKey("cache", false);
  };

  const simulateOffline = async () => {
    setLoadingKey("offline", true);
    const result = await postData("/messages/simulate-offline", { queue: "alerts", messagesCount: 5 });
    setOfflineResult(result);
    setLoadingKey("offline", false);
    refreshAll();
  };

  const consumeMessages = async () => {
    setLoadingKey("consume", true);
    await postData("/messages/consume", { queue: "alerts" });
    setLoadingKey("consume", false);
    setOfflineResult(null);
    refreshAll();
  };

  const simulateFault = async (scenario: string) => {
    setLoadingKey(`fault-${scenario}`, true);
    await postData("/faults/simulate", { scenario });
    setLoadingKey(`fault-${scenario}`, false);
    refreshAll();
  };

  const resetCB = async () => {
    await postData("/faults/reset");
    refreshAll();
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const color = status === "active" || status === "healthy" || status === "completed" || status === "closed"
      ? "text-primary bg-primary/20"
      : status === "open" || status === "failed" || status === "critical"
      ? "text-destructive bg-destructive/20"
      : "text-orange-400 bg-orange-400/20";
    return <span className={`text-xs font-mono px-2 py-0.5 rounded ${color}`}>{status}</span>;
  };

  return (
    <div>
      <PageHeader
        title="Enterprise Integration"
        subtitle="Phase II: Service-oriented integration dashboard — orchestration, messaging, caching, correlation, and fault handling."
      />
      <div className="container pb-16 space-y-8">
        {/* Connection Status */}
        <div className={`flex items-center gap-2 p-3 rounded border ${connected ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"}`}>
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-primary animate-pulse" : "bg-destructive"}`} />
          <span className="font-mono text-xs">
            {connected ? "Connected to Integration Server (localhost:3001)" : "Server offline — start with: cd server && npm start"}
          </span>
          <button onClick={refreshAll} className="ml-auto text-xs font-mono text-muted-foreground hover:text-primary flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>

        {/* Service Health */}
        {health && (
          <ScrollReveal>
            <div className="bg-card border border-border rounded p-6">
              <h2 className="font-mono text-sm text-primary mb-4">{"> System_Health"}</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(health.services || {}).map(([name, status]) => (
                  <div key={name} className="border border-border rounded p-3 text-center">
                    <div className="text-xs text-muted-foreground font-mono mb-1">{name}</div>
                    <StatusBadge status={status as string} />
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* 1. Orchestration */}
        <ScrollReveal delay={100}>
          <div className="bg-card border border-border rounded p-6">
            <h2 className="font-mono text-sm text-primary mb-4 flex items-center gap-2">
              <Workflow className="h-4 w-4" /> {"1. Business Process Orchestration"}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              BPEL-equivalent workflow: Receive → Parallel(ThreatAnalysis + NetworkScan) → Switch(severity) → Sequence(Containment → Eradication → Recovery) → ComplianceCheck → Reply
            </p>
            <button
              onClick={runWorkflow}
              disabled={loading.workflow || !connected}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-xs px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
            >
              {loading.workflow ? <><RefreshCw className="h-3 w-3 animate-spin" /> Executing...</> : <><Play className="h-3 w-3" /> Run Incident Response Workflow</>}
            </button>
            {workflowResult && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Workflow {workflowResult.status} in {workflowResult.executionTime}</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  Correlation: {workflowResult.correlationId}
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer font-mono text-primary">View execution log ({workflowResult.result?.executionLog?.length || 0} steps)</summary>
                  <pre className="mt-2 p-3 bg-background rounded border border-border overflow-x-auto text-[10px] leading-relaxed max-h-64 overflow-y-auto">
                    {JSON.stringify(workflowResult.result?.executionLog, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            {workflows.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-mono text-muted-foreground mb-2">Recent Workflows ({workflows.length})</div>
                <div className="space-y-1">
                  {workflows.slice(-3).map(w => (
                    <div key={w.workflowId} className="flex items-center gap-2 text-[10px] font-mono border border-border rounded px-2 py-1">
                      <StatusBadge status={w.status} />
                      <span className="text-muted-foreground truncate">{w.correlationId}</span>
                      <span className="ml-auto text-muted-foreground">{new Date(w.startedAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* 2. Messaging */}
        <ScrollReveal delay={200}>
          <div className="bg-card border border-border rounded p-6">
            <h2 className="font-mono text-sm text-primary mb-4 flex items-center gap-2">
              <Database className="h-4 w-4" /> {"2. Message Queue (Asynchronous)"}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={simulateOffline} disabled={loading.offline || !connected}
                className="inline-flex items-center gap-1 bg-primary/20 text-primary font-mono text-xs px-3 py-1.5 rounded hover:bg-primary/30 disabled:opacity-50">
                {loading.offline ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" />} Produce While Offline
              </button>
              <button onClick={consumeMessages} disabled={loading.consume || !connected}
                className="inline-flex items-center gap-1 bg-primary/20 text-primary font-mono text-xs px-3 py-1.5 rounded hover:bg-primary/30 disabled:opacity-50">
                {loading.consume ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Consume Messages
              </button>
            </div>
            {offlineResult && (
              <div className="mb-3 p-2 bg-orange-400/10 border border-orange-400/30 rounded text-xs font-mono text-orange-400">
                {offlineResult.messageIds?.length} messages queued while consumer was offline
              </div>
            )}
            {queueStats && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="border border-border rounded p-3 text-center">
                  <div className="text-lg font-mono text-primary">{queueStats.totalProduced}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Produced</div>
                </div>
                <div className="border border-border rounded p-3 text-center">
                  <div className="text-lg font-mono text-primary">{queueStats.totalConsumed}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Consumed</div>
                </div>
                <div className="border border-border rounded p-3 text-center">
                  <div className="text-lg font-mono text-orange-400">{queueStats.totalPending}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Pending</div>
                </div>
              </div>
            )}
            {queueStats?.queues && (
              <div className="space-y-1">
                {queueStats.queues.filter(q => q.produced > 0).map(q => (
                  <div key={q.name} className="flex items-center justify-between text-[10px] font-mono border border-border rounded px-2 py-1">
                    <span className="text-muted-foreground">{q.name}</span>
                    <span>{q.produced} / {q.consumed} / <span className="text-orange-400">{q.pending}</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* 3. Correlation */}
        <ScrollReveal delay={300}>
          <div className="bg-card border border-border rounded p-6">
            <h2 className="font-mono text-sm text-primary mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" /> {"3. Stateful Correlation"}
            </h2>
            <button onClick={runConcurrent} disabled={loading.concurrent || !connected}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-xs px-4 py-2 rounded hover:opacity-90 disabled:opacity-50">
              {loading.concurrent ? <><RefreshCw className="h-3 w-3 animate-spin" /> Running...</> : <><Zap className="h-3 w-3" /> Simulate 3 Concurrent Clients</>}
            </button>
            {concurrentResult && (
              <div className="mt-4 space-y-2">
                {concurrentResult.results?.map((r: any) => (
                  <div key={r.correlationId} className="flex items-center gap-2 text-xs font-mono border border-border rounded px-3 py-2">
                    <StatusBadge status={r.finalState} />
                    <span className="text-muted-foreground">{r.clientId}</span>
                    <span className="text-primary">{r.correlationId}</span>
                    <span className="ml-auto text-muted-foreground">
                      {r.states.join(" → ")}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground font-mono">{concurrentResult.note}</p>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* 4. Caching */}
        <ScrollReveal delay={400}>
          <div className="bg-card border border-border rounded p-6">
            <h2 className="font-mono text-sm text-primary mb-4 flex items-center gap-2">
              <Server className="h-4 w-4" /> {"4. Enterprise Caching"}
            </h2>
            <button onClick={runCachePerf} disabled={loading.cache || !connected}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-mono text-xs px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 mb-4">
              {loading.cache ? <><RefreshCw className="h-3 w-3 animate-spin" /> Benchmarking...</> : <><Zap className="h-3 w-3" /> Run Performance Benchmark</>}
            </button>
            {cacheStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="border border-border rounded p-3 text-center">
                  <div className="text-lg font-mono text-primary">{cacheStats.overall.hitRate}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Hit Rate</div>
                </div>
                <div className="border border-border rounded p-3 text-center">
                  <div className="text-lg font-mono text-primary">{cacheStats.overall.entries}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Entries</div>
                </div>
                <div className="border border-border rounded p-3 text-center">
                  <div className="text-lg font-mono text-primary">{cacheStats.memory.current}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Memory Used</div>
                </div>
                <div className="border border-border rounded p-3 text-center">
                  <div className="text-lg font-mono text-primary">{cacheStats.memory.utilization}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">Utilization</div>
                </div>
              </div>
            )}
            {cachePerf && (
              <div className="p-3 bg-background border border-border rounded">
                <div className="text-xs font-mono text-primary mb-2">Performance Comparison (100 iterations)</div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div>
                    <div className="text-muted-foreground">Uncached Avg</div>
                    <div className="text-orange-400">{cachePerf.uncached.averageMs}ms</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Cached Avg</div>
                    <div className="text-primary">{cachePerf.cached.averageMs}ms</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Speedup</div>
                    <div className="text-primary">{cachePerf.speedup}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* 6. Fault Handling */}
        <ScrollReveal delay={500}>
          <div className="bg-card border border-border rounded p-6">
            <h2 className="font-mono text-sm text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {"5. Fault Handling & Recovery"}
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {["timeout", "service_unavailable", "circuit_breaker", "compensation"].map(s => (
                <button key={s} onClick={() => simulateFault(s)} disabled={loading[`fault-${s}`] || !connected}
                  className="inline-flex items-center gap-1 bg-destructive/20 text-destructive font-mono text-[10px] px-3 py-1.5 rounded hover:bg-destructive/30 disabled:opacity-50">
                  {loading[`fault-${s}`] ? <RefreshCw className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                  {s.replace(/_/g, " ")}
                </button>
              ))}
              <button onClick={resetCB} disabled={!connected}
                className="inline-flex items-center gap-1 bg-primary/20 text-primary font-mono text-[10px] px-3 py-1.5 rounded hover:bg-primary/30">
                <RefreshCw className="h-3 w-3" /> Reset CB
              </button>
            </div>
            {circuitBreakers && (
              <div className="space-y-1 mb-4">
                {Object.entries(circuitBreakers.services || {}).map(([name, cb]: [string, any]) => (
                  <div key={name} className="flex items-center justify-between text-xs font-mono border border-border rounded px-3 py-2">
                    <span className="text-muted-foreground">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Failures: {cb.failures}</span>
                      <StatusBadge status={cb.state} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {logs.length > 0 && (
              <div>
                <div className="text-xs font-mono text-muted-foreground mb-2">Recent Error Logs</div>
                <div className="space-y-1">
                  {logs.map(log => (
                    <div key={log.id} className="text-[10px] font-mono border border-border rounded px-2 py-1 flex items-start gap-2">
                      <span className={`px-1 rounded ${log.severity === "critical" ? "bg-destructive/20 text-destructive" : log.severity === "error" ? "bg-orange-400/20 text-orange-400" : "bg-primary/20 text-primary"}`}>
                        {log.severity}
                      </span>
                      <span className="text-muted-foreground truncate">{log.message}</span>
                      <span className="ml-auto text-muted-foreground whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* API Docs Link */}
        <div className="text-center">
          <a
            href="http://localhost:3001/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-primary text-primary font-mono text-xs px-4 py-2 rounded hover:bg-primary/10 transition-colors"
          >
            <Shield className="h-4 w-4" /> Open API Documentation (Swagger)
          </a>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDashboard;
