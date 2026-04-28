import { useEffect, useState } from "react";
import { usePhase3Auth } from "@/context/Phase3AuthContext";
import { phase3Request } from "@/lib/phase3-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, Database, RefreshCw, Wifi, XCircle } from "lucide-react";

interface Metrics {
  uptime?: string;
  requests?: { total?: number; success?: number; error?: number };
  responseTime?: { averageMs?: string | number; p95Ms?: string | number };
  database?: { sqlite?: number; nedb?: number };
}

interface Health {
  status?: string;
  uptime?: number;
  databases?: { sqlite?: string; nedb?: string };
  cache?: { entries?: number; hitRate?: string };
  asyncProcessor?: { isRunning?: boolean; produced?: number; consumed?: number };
}

interface CacheStats {
  entries?: number;
  hits?: number;
  misses?: number;
  hitRate?: string;
  invalidations?: number;
}

const metricCard = (label: string, value: string | number, sub?: string, color = "text-foreground") => (
  <Card className="border-border/60">
    <CardContent className="pt-4 pb-3">
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground font-mono mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground font-mono mt-0.5">{sub}</div>}
    </CardContent>
  </Card>
);

const NetworkMonitoring = () => {
  const { isHydrated } = usePhase3Auth();

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [cache, setCache] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [metricsRes, healthRes, cacheRes] = await Promise.all([
        phase3Request<Metrics>("/metrics"),
        phase3Request<Health>("/health"),
        phase3Request<CacheStats>("/cache/stats"),
      ]);
      setMetrics(metricsRes.data);
      setHealth(healthRes.data);
      setCache(cacheRes.data);
      setLastUpdated(new Date());
    } catch {
      /* backend offline */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated) {
      load();
      const t = setInterval(load, 10000);
      return () => clearInterval(t);
    }
  }, [isHydrated]);

  const online = health?.status === "healthy" || health?.status === "ok";

  return (
    <div className="container py-10 pb-16 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Wifi className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-mono cyber-text-glow">Network Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Live system health, request metrics, and cache performance. Refreshes every 10s.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground font-mono">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button variant="ghost" size="sm" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Connection status */}
      <div
        className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
          online
            ? "border-primary/30 bg-primary/5"
            : "border-destructive/30 bg-destructive/5"
        }`}
      >
        {online ? (
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive shrink-0" />
        )}
        <div>
          <p className="text-sm font-mono font-medium">
            Backend status:{" "}
            <span className={online ? "text-primary" : "text-destructive"}>
              {health?.status ?? "offline"}
            </span>
          </p>
          {!online && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Start the backend: <span className="text-primary">cd server/phase3 &amp;&amp; npm start</span>
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className={`ml-auto font-mono ${online ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}`}
        >
          {online ? "online" : "offline"}
        </Badge>
      </div>

      {/* Request metrics */}
      <section>
        <h2 className="font-mono text-sm text-primary mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" /> Request Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricCard("Total Requests", metrics?.requests?.total ?? "—")}
          {metricCard("Successful", metrics?.requests?.success ?? "—", undefined, "text-green-400")}
          {metricCard("Errors", metrics?.requests?.error ?? "—", undefined, "text-red-400")}
          {metricCard("Avg Response", `${metrics?.responseTime?.averageMs ?? "—"}ms`, `p95: ${metrics?.responseTime?.p95Ms ?? "—"}ms`, "text-yellow-400")}
        </div>
      </section>

      {/* System health */}
      <section>
        <h2 className="font-mono text-sm text-primary mb-3 flex items-center gap-2">
          <Wifi className="h-4 w-4" /> System Health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricCard("Uptime", metrics?.uptime ?? "—", undefined, "text-primary")}
          {metricCard(
            "SQLite DB",
            health?.databases?.sqlite ?? "—",
            `${metrics?.database?.sqlite ?? 0} queries`,
            health?.databases?.sqlite === "connected" ? "text-green-400" : "text-muted-foreground"
          )}
          {metricCard(
            "NeDB Store",
            health?.databases?.nedb ?? "—",
            `${metrics?.database?.nedb ?? 0} queries`,
            health?.databases?.nedb === "connected" ? "text-green-400" : "text-muted-foreground"
          )}
          {metricCard(
            "Async Processor",
            health?.asyncProcessor?.isRunning ? "running" : "stopped",
            `${health?.asyncProcessor?.produced ?? 0} produced / ${health?.asyncProcessor?.consumed ?? 0} consumed`,
            health?.asyncProcessor?.isRunning ? "text-green-400" : "text-muted-foreground"
          )}
        </div>
      </section>

      {/* Cache performance */}
      <section>
        <h2 className="font-mono text-sm text-primary mb-3 flex items-center gap-2">
          <Database className="h-4 w-4" /> Cache Performance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricCard("Hit Rate", cache?.hitRate ?? "—", undefined, "text-primary")}
          {metricCard("Cache Entries", cache?.entries ?? "—")}
          {metricCard("Hits", cache?.hits ?? "—", undefined, "text-green-400")}
          {metricCard("Misses", cache?.misses ?? "—", undefined, "text-orange-400")}
        </div>
      </section>

      {/* Protocol reference */}
      <section>
        <h2 className="font-mono text-sm text-primary mb-3">Monitored Protocols</h2>
        <div className="flex flex-wrap gap-2">
          {["TCP/IP", "UDP", "HTTP/S", "DNS", "SMTP", "FTP", "SSH", "SNMP", "ICMP", "TLS", "DHCP", "ARP"].map((p) => (
            <span
              key={p}
              className="bg-secondary text-secondary-foreground font-mono text-xs px-3 py-1 rounded border border-border"
            >
              {p}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};

export default NetworkMonitoring;
