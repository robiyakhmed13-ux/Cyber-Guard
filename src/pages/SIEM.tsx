import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePhase3Auth } from "@/context/Phase3AuthContext";
import { phase3Request } from "@/lib/phase3-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Database, Lock, RefreshCw, ScrollText } from "lucide-react";

interface SystemEvent {
  _id?: string;
  event_type?: string;
  severity?: string;
  details?: unknown;
  timestamp?: string;
}

interface AuditRecord {
  id: number;
  action: string;
  resource: string;
  resource_id?: string;
  created_at: string;
}

interface Metrics {
  uptime?: string;
  requests?: { total?: number; success?: number; error?: number };
  responseTime?: { averageMs?: string | number };
  database?: { sqlite?: number; nedb?: number };
}

const severityColor = (s?: string) => {
  if (s === "critical") return "text-red-400 border-red-400/40";
  if (s === "high" || s === "error") return "text-orange-400 border-orange-400/40";
  if (s === "warning" || s === "medium") return "text-yellow-400 border-yellow-400/40";
  return "text-primary border-primary/40";
};

const SIEM = () => {
  const { user, token, isAuthenticated, isHydrated } = usePhase3Auth();

  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [auditLog, setAuditLog] = useState<AuditRecord[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const canSeeAudit = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const [evRes, metricsRes] = await Promise.all([
        phase3Request<SystemEvent[]>("/system-events?limit=50"),
        phase3Request<Metrics>("/metrics"),
      ]);
      setEvents(evRes.data ?? []);
      setMetrics(metricsRes.data);

      if (canSeeAudit && token) {
        const auditRes = await phase3Request<AuditRecord[]>("/audit-log?limit=50", { token });
        setAuditLog(auditRes.data ?? []);
      }
    } catch {
      /* backend offline */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated) {
      load();
      const t = setInterval(load, 15000);
      return () => clearInterval(t);
    }
  }, [isHydrated, canSeeAudit, token]);

  const visibleEvents = events.filter((e) => {
    const matchSev = filterSeverity === "all" || e.severity === filterSeverity;
    const matchSearch =
      !search ||
      String(e.event_type ?? "").toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(e.details ?? "").toLowerCase().includes(search.toLowerCase());
    return matchSev && matchSearch;
  });

  return (
    <div className="container py-10 pb-16 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScrollText className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-mono cyber-text-glow">SIEM — Event Log</h1>
          <p className="text-sm text-muted-foreground">
            Live system events and audit trail. Auto-refreshes every 15 seconds.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="ml-auto gap-2" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Auth gate */}
      {!isAuthenticated && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 flex flex-wrap items-center gap-4">
            <Lock className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground flex-1">
              Log in to see the full event log. Audit trail requires <strong>admin</strong> role.
            </p>
            <Button asChild size="sm">
              <Link to="/login?returnTo=/siem">Login</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metrics row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Uptime", value: metrics.uptime ?? "—", color: "text-primary" },
            { label: "Total Requests", value: metrics.requests?.total ?? 0, color: "text-foreground" },
            { label: "Avg Response", value: `${metrics.responseTime?.averageMs ?? 0}ms`, color: "text-yellow-400" },
            { label: "Errors", value: metrics.requests?.error ?? 0, color: "text-red-400" },
          ].map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="pt-4 pb-3 text-center">
                <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events" className="gap-2">
            <Activity className="h-4 w-4" /> System Events ({events.length})
          </TabsTrigger>
          {canSeeAudit && (
            <TabsTrigger value="audit" className="gap-2">
              <Database className="h-4 w-4" /> Audit Log ({auditLog.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* System Events */}
        <TabsContent value="events" className="space-y-3 mt-4">
          <div className="flex gap-2 flex-wrap">
            <Input
              className="max-w-xs font-mono text-sm"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground font-mono self-center ml-auto">
              {visibleEvents.length} of {events.length} events
            </span>
          </div>

          <Card className="border-border/60">
            <CardContent className="p-0">
              {loading && events.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono animate-pulse">
                  Loading events...
                </div>
              ) : visibleEvents.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono">
                  {events.length === 0
                    ? "No events yet. Start the backend — events are generated automatically."
                    : "No events match the filter."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono text-xs">Event Type</TableHead>
                        <TableHead className="font-mono text-xs">Severity</TableHead>
                        <TableHead className="font-mono text-xs">Details</TableHead>
                        <TableHead className="font-mono text-xs">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleEvents.map((ev, idx) => (
                        <TableRow key={ev._id ?? idx}>
                          <TableCell className="font-mono text-xs font-medium">
                            {ev.event_type ?? "unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-mono ${severityColor(ev.severity)}`}>
                              {ev.severity ?? "info"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground max-w-[260px] truncate">
                            {typeof ev.details === "object"
                              ? JSON.stringify(ev.details)
                              : String(ev.details ?? "—")}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit log (admin only) */}
        {canSeeAudit && (
          <TabsContent value="audit" className="mt-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-primary flex items-center gap-2">
                  <Database className="h-4 w-4" /> Admin Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {auditLog.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground font-mono">
                    No audit records yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-mono text-xs">#</TableHead>
                          <TableHead className="font-mono text-xs">Action</TableHead>
                          <TableHead className="font-mono text-xs">Resource</TableHead>
                          <TableHead className="font-mono text-xs">Resource ID</TableHead>
                          <TableHead className="font-mono text-xs">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLog.map((rec) => (
                          <TableRow key={rec.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{rec.id}</TableCell>
                            <TableCell className="font-mono text-xs font-medium text-primary">{rec.action}</TableCell>
                            <TableCell className="font-mono text-xs">{rec.resource}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{rec.resource_id ?? "—"}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(rec.created_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {isAuthenticated && !canSeeAudit && (
        <p className="text-xs text-muted-foreground font-mono">
          Audit trail is only visible to the <strong>admin</strong> role.
        </p>
      )}
    </div>
  );
};

export default SIEM;
