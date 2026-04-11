import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  Database,
  FileCode2,
  Lock,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  Workflow,
  Zap,
} from "lucide-react";

const API_BASE = "http://localhost:3002/api/v3";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

interface IncidentRecord {
  id: number;
  incident_id: string;
  threat_type: string;
  severity: string;
  source_ip: string;
  target_asset: string;
  status: string;
  created_at: string;
}

interface ThreatIntelRecord {
  _id: string;
  ioc_type: string;
  ioc_value: string;
  severity: string;
  source?: string;
  created_at: string;
}

const sampleXml = `<incident><threat_type>ransomware</threat_type><severity>critical</severity></incident>`;

const DataManagementDashboard = () => {
  const [token, setToken] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [cacheStats, setCacheStats] = useState<Record<string, unknown> | null>(null);
  const [asyncStats, setAsyncStats] = useState<Record<string, unknown> | null>(null);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelRecord[]>([]);
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);
  const [cachePerf, setCachePerf] = useState<Record<string, unknown> | null>(null);
  const [transformResult, setTransformResult] = useState<Record<string, unknown> | null>(null);
  const [xmlInput, setXmlInput] = useState(sampleXml);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const setLoadingState = (key: string, value: boolean) => {
    setLoading((current) => ({ ...current, [key]: value }));
  };

  const fetchJson = async <T,>(path: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Request failed");
    }
    return data as ApiEnvelope<T>;
  };

  const loadDashboard = async () => {
    try {
      const [healthRes, metricsRes, cacheRes, asyncRes, incidentRes, intelRes, eventsRes] = await Promise.all([
        fetchJson<Record<string, unknown>>("/health"),
        fetchJson<Record<string, unknown>>("/metrics"),
        fetchJson<Record<string, unknown>>("/cache/stats"),
        fetchJson<Record<string, unknown>>("/async/stats"),
        fetchJson<{ data: IncidentRecord[] }>("/incidents?limit=5"),
        fetchJson<{ data: ThreatIntelRecord[] }>("/threat-intel?limit=5"),
        fetchJson<Array<Record<string, unknown>>>("/system-events?limit=5"),
      ]);

      setConnected(true);
      setHealth(healthRes.data);
      setMetrics(metricsRes.data);
      setCacheStats(cacheRes.data);
      setAsyncStats(asyncRes.data);
      setIncidents(incidentRes.data.data || []);
      setThreatIntel(intelRes.data.data || []);
      setEvents(eventsRes.data || []);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const timer = window.setInterval(loadDashboard, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const loginAsAdmin = async () => {
    setLoadingState("login", true);
    try {
      const result = await fetchJson<{ token: string }>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "Admin123!" }),
      });
      setToken(result.data.token);
    } finally {
      setLoadingState("login", false);
    }
  };

  const createIncident = async () => {
    if (!token) {
      return;
    }

    setLoadingState("incident", true);
    try {
      await fetchJson<IncidentRecord>("/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threat_type: "ransomware",
          severity: "high",
          source_ip: `10.0.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`,
          target_asset: `server-${Math.floor(Math.random() * 20) + 1}`,
          description: "Phase III live demo incident",
        }),
      });
      await loadDashboard();
    } finally {
      setLoadingState("incident", false);
    }
  };

  const enqueueJob = async () => {
    if (!token) {
      return;
    }

    setLoadingState("job", true);
    try {
      await fetchJson("/async/produce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "report_generation",
          payload: { format: "json", trigger: "dashboard-demo" },
          priority: "high",
        }),
      });
      await loadDashboard();
    } finally {
      setLoadingState("job", false);
    }
  };

  const runCacheBenchmark = async () => {
    setLoadingState("cache", true);
    try {
      const result = await fetchJson<Record<string, unknown>>("/cache/performance");
      setCachePerf(result.data);
    } finally {
      setLoadingState("cache", false);
    }
  };

  const convertXml = async () => {
    if (!token) {
      return;
    }

    setLoadingState("transform", true);
    try {
      const result = await fetchJson<Record<string, unknown>>("/transform/xml-to-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ xml: xmlInput }),
      });
      setTransformResult(result.data);
    } finally {
      setLoadingState("transform", false);
    }
  };

  const statCardClass = "rounded border border-border bg-card p-4";

  return (
    <div>
      <PageHeader
        title="Data Management Layer"
        subtitle="Phase III dashboard for database integration, REST APIs, caching, async jobs, security, and data transformation."
      />
      <div className="container space-y-8 pb-16">
        <div className={`flex items-center gap-3 rounded border p-3 ${connected ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>
          <div className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-primary animate-pulse" : "bg-destructive"}`} />
          <span className="font-mono text-xs">
            {connected ? "Connected to Phase III server on localhost:3002" : "Phase III server offline. Start it with: cd server/phase3 && npm install && npm start"}
          </span>
          <Button variant="ghost" size="sm" className="ml-auto gap-2" onClick={loadDashboard}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <ScrollReveal>
          <div className="grid gap-4 md:grid-cols-4">
            <div className={statCardClass}>
              <div className="mb-2 flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4" /> Health</div>
              <div className="font-mono text-xs text-muted-foreground">{String((health?.status as string) || "offline")}</div>
            </div>
            <div className={statCardClass}>
              <div className="mb-2 flex items-center gap-2 text-primary"><Database className="h-4 w-4" /> Incidents</div>
              <div className="font-mono text-xl">{incidents.length}</div>
              <div className="text-xs text-muted-foreground">Latest relational records</div>
            </div>
            <div className={statCardClass}>
              <div className="mb-2 flex items-center gap-2 text-primary"><Workflow className="h-4 w-4" /> Async Queue</div>
              <div className="font-mono text-xl">{String((asyncStats?.queue as { total?: number } | undefined)?.total ?? 0)}</div>
              <div className="text-xs text-muted-foreground">Persisted jobs tracked in NeDB</div>
            </div>
            <div className={statCardClass}>
              <div className="mb-2 flex items-center gap-2 text-primary"><Zap className="h-4 w-4" /> Cache Hit Rate</div>
              <div className="font-mono text-xl">{String((cacheStats?.hitRate as string) || "0%")}</div>
              <div className="text-xs text-muted-foreground">TTL + tag invalidation</div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-mono text-sm text-primary"><Lock className="h-4 w-4" /> Secure API Actions</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Use the seeded admin account to demonstrate token-based authorization, validated writes, and audit logging.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={loginAsAdmin} disabled={loading.login} className="gap-2">
                  {loading.login ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Login as Admin
                </Button>
                <Button onClick={createIncident} disabled={!token || loading.incident} variant="secondary" className="gap-2">
                  {loading.incident ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Create Incident
                </Button>
                <Button onClick={enqueueJob} disabled={!token || loading.job} variant="secondary" className="gap-2">
                  {loading.job ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Workflow className="h-4 w-4" />} Queue Job
                </Button>
                <Button onClick={runCacheBenchmark} disabled={loading.cache} variant="outline" className="gap-2">
                  {loading.cache ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TimerReset className="h-4 w-4" />} Run Cache Benchmark
                </Button>
              </div>
              <div className="mt-4 rounded border border-border bg-background p-3 font-mono text-xs text-muted-foreground">
                Token status: {token ? "authenticated" : "not authenticated"}
                <br />Default credentials: admin / Admin123!
              </div>
              {cachePerf && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded border border-border p-3 text-center">
                    <div className="text-xs text-muted-foreground">Uncached Avg</div>
                    <div className="font-mono text-primary">{String(cachePerf.uncached && (cachePerf.uncached as { averageMs?: string }).averageMs)} ms</div>
                  </div>
                  <div className="rounded border border-border p-3 text-center">
                    <div className="text-xs text-muted-foreground">Cached Avg</div>
                    <div className="font-mono text-primary">{String(cachePerf.cached && (cachePerf.cached as { averageMs?: string }).averageMs)} ms</div>
                  </div>
                  <div className="rounded border border-border p-3 text-center">
                    <div className="text-xs text-muted-foreground">Speedup</div>
                    <div className="font-mono text-primary">{String(cachePerf.speedup || "n/a")}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-mono text-sm text-primary"><FileCode2 className="h-4 w-4" /> Data Transformation</h2>
              <div className="space-y-3">
                <Input value="JSON -> XML -> JSON" readOnly className="font-mono text-xs" />
                <Textarea value={xmlInput} onChange={(event) => setXmlInput(event.target.value)} rows={6} className="font-mono text-xs" />
                <Button onClick={convertXml} disabled={!token || loading.transform} className="gap-2">
                  {loading.transform ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileCode2 className="h-4 w-4" />} Convert XML to JSON
                </Button>
                <pre className="max-h-56 overflow-auto rounded border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
                  {JSON.stringify(transformResult || { note: "Transformation result will appear here." }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-mono text-sm text-primary"><Database className="h-4 w-4" /> SQLite Incident Records</h2>
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div key={incident.id} className="rounded border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3 font-mono text-xs">
                      <span className="text-primary">{incident.incident_id}</span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{incident.severity}</span>
                    </div>
                    <div className="mt-2 text-muted-foreground">{incident.threat_type} targeting {incident.target_asset}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{incident.source_ip} • {incident.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-mono text-sm text-primary"><Activity className="h-4 w-4" /> NoSQL Threat Intelligence</h2>
              <div className="space-y-3">
                {threatIntel.map((record) => (
                  <div key={record._id} className="rounded border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3 font-mono text-xs">
                      <span className="text-primary">{record.ioc_type}</span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{record.severity}</span>
                    </div>
                    <div className="mt-2 break-all text-muted-foreground">{record.ioc_value}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{record.source || "unknown source"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-mono text-sm text-primary"><Workflow className="h-4 w-4" /> Logging and Monitoring</h2>
              <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
                {JSON.stringify(metrics || { note: "Metrics unavailable while the server is offline." }, null, 2)}
              </pre>
            </div>
            <div className="rounded border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 font-mono text-sm text-primary"><Activity className="h-4 w-4" /> Recent System Events</h2>
              <div className="space-y-3">
                {events.map((event, index) => (
                  <div key={`${String(event.timestamp)}-${index}`} className="rounded border border-border p-3 text-sm">
                    <div className="font-mono text-xs text-primary">{String(event.event_type || "event")}</div>
                    <div className="mt-1 text-muted-foreground">{JSON.stringify(event.details || {})}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{String(event.timestamp || "")}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default DataManagementDashboard;
