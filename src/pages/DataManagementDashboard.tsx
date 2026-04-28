import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import ScrollReveal from "@/components/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePhase3Auth } from "@/context/Phase3AuthContext";
import { useToast } from "@/hooks/use-toast";
import { phase3Request } from "@/lib/phase3-api";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Database,
  FileCode2,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

interface IncidentRecord {
  id: number;
  incident_id: string;
  threat_type: string;
  severity: string;
  source_ip: string;
  target_asset: string;
  status: string;
  description?: string;
  created_at: string;
}

interface ThreatIntelRecord {
  _id: string;
  ioc_type: string;
  ioc_value: string;
  severity: string;
  source?: string;
  description?: string;
  created_at: string;
}

interface SystemEventRecord {
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

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}

interface AsyncStats {
  processor?: {
    isRunning?: boolean;
    produced?: number;
    consumed?: number;
    failed?: number;
  };
  queue?: {
    pending?: number;
    processing?: number;
    completed?: number;
    dead_letter?: number;
    total?: number;
  };
}

interface CacheStats {
  hitRate?: string;
  entries?: number;
  hits?: number;
  misses?: number;
  invalidations?: number;
}

interface Metrics {
  uptime?: string;
  requests?: {
    total?: number;
    success?: number;
    error?: number;
  };
  responseTime?: {
    averageMs?: string | number;
    p95Ms?: string | number;
  };
  database?: {
    sqlite?: number;
    nedb?: number;
  };
}

const defaultIncidentForm = {
  threat_type: "ransomware",
  severity: "high",
  source_ip: "192.168.1.120",
  target_asset: "web-server-01",
  description: "Suspicious encryption activity detected on a production asset.",
};

const defaultThreatForm = {
  ioc_type: "domain",
  ioc_value: "malicious-example.evil",
  severity: "high",
  source: "OSINT",
  description: "Indicator collected during incident investigation.",
};

const defaultJobForm = {
  type: "report_generation",
  priority: "high",
  payload: '{"format":"json","trigger":"workspace"}',
};

const sampleXml = `<incident><threat_type>phishing</threat_type><severity>medium</severity><target_asset>mail-gateway</target_asset></incident>`;

const guideCards = [
  {
    title: "Home and Feature Pages",
    description: "These pages explain the project domain, cybersecurity concepts, and the scope of the solution. They are informational pages, not the operational part of the app.",
  },
  {
    title: "Dashboard",
    description: "This page is a visual monitoring demo with charts and security stats. It helps show the idea of a SOC dashboard, but it does not manage real records.",
  },
  {
    title: "Integration",
    description: "This is the Phase II workspace. It demonstrates orchestration, messaging, correlation, and fault handling on the Phase II backend server.",
  },
  {
    title: "Data Management Workspace",
    description: "This is the real Phase III application area. Here you log in, create incidents, work with threat intelligence, run async jobs, test cache behavior, and see protected system data.",
  },
];

const DataManagementDashboard = () => {
  const { user, token, isAuthenticated, isHydrated, logout } = usePhase3Auth();
  const { toast } = useToast();

  const [connected, setConnected] = useState(false);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelRecord[]>([]);
  const [events, setEvents] = useState<SystemEventRecord[]>([]);
  const [auditLog, setAuditLog] = useState<AuditRecord[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [asyncStats, setAsyncStats] = useState<AsyncStats | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [healthStatus, setHealthStatus] = useState("offline");
  const [cacheBenchmark, setCacheBenchmark] = useState<Record<string, unknown> | null>(null);
  const [transformResult, setTransformResult] = useState<Record<string, unknown> | null>(null);
  const [incidentForm, setIncidentForm] = useState(defaultIncidentForm);
  const [threatForm, setThreatForm] = useState(defaultThreatForm);
  const [jobForm, setJobForm] = useState(defaultJobForm);
  const [xmlInput, setXmlInput] = useState(sampleXml);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const canWrite = Boolean(isAuthenticated && user && user.role !== "viewer");
  const canManageThreatIntel = Boolean(isAuthenticated && user && user.role !== "viewer");
  const canDeleteIncidents = user?.role === "admin";
  const canClearCache = user?.role === "admin";
  const canSeeAuditLog = user?.role === "admin";

  const setLoadingState = (key: string, value: boolean) => {
    setLoading((current) => ({ ...current, [key]: value }));
  };

  const loadWorkspace = async (showErrors = false) => {
    try {
      const [healthRes, metricsRes, cacheRes, asyncRes, incidentRes, intelRes, eventsRes] = await Promise.all([
        phase3Request<{ status: string }>("/health"),
        phase3Request<Metrics>("/metrics"),
        phase3Request<CacheStats>("/cache/stats"),
        phase3Request<AsyncStats>("/async/stats"),
        phase3Request<PaginatedResponse<IncidentRecord>>("/incidents?limit=12"),
        phase3Request<PaginatedResponse<ThreatIntelRecord>>("/threat-intel?limit=12"),
        phase3Request<SystemEventRecord[]>("/system-events?limit=8"),
      ]);

      setConnected(true);
      setHealthStatus(healthRes.data.status || "healthy");
      setMetrics(metricsRes.data);
      setCacheStats(cacheRes.data);
      setAsyncStats(asyncRes.data);
      setIncidents(incidentRes.data.data || []);
      setThreatIntel(intelRes.data.data || []);
      setEvents(eventsRes.data || []);

      if (token && canSeeAuditLog) {
        const auditRes = await phase3Request<AuditRecord[]>("/audit-log?limit=8", { token });
        setAuditLog(auditRes.data || []);
      } else {
        setAuditLog([]);
      }
    } catch (error) {
      setConnected(false);
      setHealthStatus("offline");
      if (showErrors) {
        toast({
          title: "Workspace unavailable",
          description: error instanceof Error ? error.message : "Unable to load the Phase III backend.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    loadWorkspace();
    const timer = window.setInterval(() => loadWorkspace(), 10000);
    return () => window.clearInterval(timer);
  }, [isHydrated, token, canSeeAuditLog]);

  const handleProtectedAction = async (key: string, action: () => Promise<void>, successTitle: string, successDescription: string) => {
    setLoadingState(key, true);
    try {
      await action();
      toast({ title: successTitle, description: successDescription });
      await loadWorkspace();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unable to complete the request.",
        variant: "destructive",
      });
    } finally {
      setLoadingState(key, false);
    }
  };

  const createIncident = async () => {
    if (!token) return;
    await phase3Request("/incidents", {
      method: "POST",
      token,
      body: JSON.stringify(incidentForm),
    });
    setIncidentForm(defaultIncidentForm);
  };

  const updateIncidentStatus = async (id: number, status: string) => {
    if (!token) return;
    await phase3Request(`/incidents/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify({ status }),
    });
  };

  const deleteIncident = async (id: number) => {
    if (!token) return;
    await phase3Request(`/incidents/${id}`, { method: "DELETE", token });
  };

  const createThreatIntel = async () => {
    if (!token) return;
    await phase3Request("/threat-intel", {
      method: "POST",
      token,
      body: JSON.stringify(threatForm),
    });
    setThreatForm(defaultThreatForm);
  };

  const deleteThreatIntel = async (id: string) => {
    if (!token) return;
    await phase3Request(`/threat-intel/${id}`, { method: "DELETE", token });
  };

  const produceJob = async () => {
    if (!token) return;
    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(jobForm.payload);
    } catch {
      throw new Error("Job payload must be valid JSON.");
    }
    await phase3Request("/async/produce", {
      method: "POST",
      token,
      body: JSON.stringify({ type: jobForm.type, priority: jobForm.priority, payload: parsedPayload }),
    });
  };

  const consumeJobs = async () => {
    if (!token) return;
    await phase3Request("/async/consume", {
      method: "POST",
      token,
      body: JSON.stringify({ batchSize: 5 }),
    });
  };

  const runCacheBenchmark = async () => {
    const response = await phase3Request<Record<string, unknown>>("/cache/performance");
    setCacheBenchmark(response.data);
  };

  const clearCache = async () => {
    if (!token) return;
    await phase3Request("/cache/clear", { method: "DELETE", token });
    setCacheBenchmark(null);
  };

  const transformXml = async () => {
    if (!token) return;
    const response = await phase3Request<Record<string, unknown>>("/transform/xml-to-json", {
      method: "POST",
      token,
      body: JSON.stringify({ xml: xmlInput }),
    });
    setTransformResult(response.data);
  };

  const roleBadgeVariant = user?.role === "admin" ? "default" : user?.role === "analyst" ? "secondary" : "outline";

  return (
    <div>
      <PageHeader
        title="Phase III Workspace"
        subtitle="This is the real operational part of the project. Use it to understand the roles, manage records, and test the backend features required by the assignment."
      />
      <div className="container space-y-8 pb-16">
        <div className={`rounded-lg border p-4 ${connected ? "border-primary/30 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-primary animate-pulse" : "bg-destructive"}`} />
            <p className="text-sm text-muted-foreground">
              {connected
                ? "Phase III backend is connected. Public data loads automatically, and protected actions are enabled after login."
                : "Phase III backend is offline. Start it with: cd server/phase3 && npm install && npm start"}
            </p>
            <Button variant="ghost" size="sm" className="ml-auto gap-2" onClick={() => loadWorkspace(true)}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="border-primary/40 text-primary">status: {healthStatus}</Badge>
            {isAuthenticated && user ? (
              <>
                <Badge variant={roleBadgeVariant}>role: {user.role}</Badge>
                <Badge variant="outline" className="border-primary/40 text-primary">user: {user.username}</Badge>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={logout}>
                  <LogOut className="h-3.5 w-3.5" /> Logout
                </Button>
              </>
            ) : (
              <Button asChild size="sm" className="h-7 px-3 text-xs">
                <Link to="/login"><Lock className="h-3.5 w-3.5" /> Login to use protected features</Link>
              </Button>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <ScrollReveal>
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary"><Users className="h-5 w-5" /> You are currently in read-only mode</CardTitle>
                <CardDescription>
                  You can explore records and system status, but to create incidents, manage threat intelligence, or run protected operations,
                  sign in with an admin, analyst, or viewer account.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild><Link to="/login">Open Login <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild variant="outline"><Link to="/dashboard">Open Visual Dashboard</Link></Button>
                <Button asChild variant="outline"><Link to="/integration">Open Phase II Integration</Link></Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0 text-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="threat-intel">Threat Intel</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="guide">Project Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ScrollReveal>
              <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader className="pb-3"><CardTitle className="text-base text-primary">Incidents</CardTitle><CardDescription>SQLite operational records</CardDescription></CardHeader><CardContent><div className="font-mono text-3xl">{incidents.length}</div></CardContent></Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-base text-primary">Threat Intel</CardTitle><CardDescription>NoSQL document records</CardDescription></CardHeader><CardContent><div className="font-mono text-3xl">{threatIntel.length}</div></CardContent></Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-base text-primary">Async Jobs</CardTitle><CardDescription>Persistent queue workload</CardDescription></CardHeader><CardContent><div className="font-mono text-3xl">{String(asyncStats?.queue?.total ?? 0)}</div></CardContent></Card>
                <Card><CardHeader className="pb-3"><CardTitle className="text-base text-primary">Cache Hit Rate</CardTitle><CardDescription>Measured runtime performance</CardDescription></CardHeader><CardContent><div className="font-mono text-3xl">{cacheStats?.hitRate || "0%"}</div></CardContent></Card>
              </div>
            </ScrollReveal>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <ScrollReveal delay={100}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /> How to use this workspace</CardTitle>
                    <CardDescription>This page is the Phase III control center, not just a presentation page.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>1. Login through the dedicated login page.</p>
                    <p>2. Use the Incidents tab to create and update cybersecurity incidents.</p>
                    <p>3. Use Threat Intel to store indicators of compromise such as domains, IPs, hashes, or URLs.</p>
                    <p>4. Use Operations to test async jobs, caching, XML conversion, and protected system tools.</p>
                    <p>5. Use the Project Guide tab when you want to understand the purpose of the other pages in the website.</p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><UserCog className="h-5 w-5" /> Current session and capabilities</CardTitle>
                    <CardDescription>The UI changes according to the logged-in role so you can understand what each account is allowed to do.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="rounded-md border border-border bg-background p-4">
                      {user ? (
                        <>
                          <p>Signed in as <span className="font-mono text-primary">{user.username}</span> with role <span className="font-mono text-primary">{user.role}</span>.</p>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            <Badge variant={canWrite ? "default" : "outline"}>Can create incidents: {canWrite ? "Yes" : "No"}</Badge>
                            <Badge variant={canManageThreatIntel ? "default" : "outline"}>Can manage threat intel: {canManageThreatIntel ? "Yes" : "No"}</Badge>
                            <Badge variant={canDeleteIncidents ? "default" : "outline"}>Can delete incidents: {canDeleteIncidents ? "Yes" : "No"}</Badge>
                            <Badge variant={canClearCache ? "default" : "outline"}>Can clear cache: {canClearCache ? "Yes" : "No"}</Badge>
                          </div>
                        </>
                      ) : (
                        <p>No active login session. Use the login page to unlock role-based features.</p>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md border border-border p-3"><p className="font-medium text-foreground">Request metrics</p><p className="mt-2">Requests: {String(metrics?.requests?.total ?? 0)}</p><p>Avg response: {String(metrics?.responseTime?.averageMs ?? "n/a")} ms</p></div>
                      <div className="rounded-md border border-border p-3"><p className="font-medium text-foreground">Database activity</p><p className="mt-2">SQLite queries: {String(metrics?.database?.sqlite ?? 0)}</p><p>NeDB queries: {String(metrics?.database?.nedb ?? 0)}</p></div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={300}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary"><Activity className="h-5 w-5" /> Recent system events</CardTitle>
                  <CardDescription>Operational events captured by the Phase III monitoring layer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {events.map((event, index) => (
                    <div key={`${event.timestamp}-${index}`} className="rounded-md border border-border p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-primary">{event.event_type || "event"}</p>
                        <Badge variant="outline">{event.severity || "info"}</Badge>
                      </div>
                      <p className="mt-2 text-muted-foreground">{JSON.stringify(event.details || {})}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{event.timestamp || ""}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </ScrollReveal>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <ScrollReveal>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><Database className="h-5 w-5" /> Incident form</CardTitle>
                    <CardDescription>Create a new incident record in the relational database. Viewer accounts can only read existing records.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!canWrite && <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">Incident creation is available for admin and analyst accounts. <Link to="/login" className="text-primary underline">Sign in here</Link>.</div>}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><label className="text-sm font-medium">Threat type</label><Input value={incidentForm.threat_type} onChange={(event) => setIncidentForm((current) => ({ ...current, threat_type: event.target.value }))} disabled={!canWrite} /></div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Severity</label>
                        <Select value={incidentForm.severity} onValueChange={(value) => setIncidentForm((current) => ({ ...current, severity: value }))} disabled={!canWrite}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><label className="text-sm font-medium">Source IP</label><Input value={incidentForm.source_ip} onChange={(event) => setIncidentForm((current) => ({ ...current, source_ip: event.target.value }))} disabled={!canWrite} /></div>
                      <div className="space-y-2"><label className="text-sm font-medium">Target asset</label><Input value={incidentForm.target_asset} onChange={(event) => setIncidentForm((current) => ({ ...current, target_asset: event.target.value }))} disabled={!canWrite} /></div>
                    </div>
                    <div className="space-y-2"><label className="text-sm font-medium">Description</label><Textarea rows={4} value={incidentForm.description} onChange={(event) => setIncidentForm((current) => ({ ...current, description: event.target.value }))} disabled={!canWrite} /></div>
                    <Button className="gap-2" disabled={!canWrite || loading.createIncident} onClick={() => handleProtectedAction("createIncident", createIncident, "Incident created", "The new incident was stored in SQLite and the cache was invalidated.")}>{loading.createIncident ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Create Incident</Button>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><AlertTriangle className="h-5 w-5" /> Incident records</CardTitle>
                    <CardDescription>Read, triage, and administratively manage incident records stored in the SQL layer.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead><TableHead>Threat</TableHead><TableHead>Status</TableHead><TableHead>Severity</TableHead><TableHead>Asset</TableHead><TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incidents.map((incident) => (
                          <TableRow key={incident.id}>
                            <TableCell className="font-mono text-xs text-primary">{incident.incident_id}</TableCell>
                            <TableCell>{incident.threat_type}</TableCell>
                            <TableCell>{incident.status}</TableCell>
                            <TableCell>{incident.severity}</TableCell>
                            <TableCell>{incident.target_asset}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {canWrite && (
                                  <>
                                    <Button size="sm" variant="secondary" onClick={() => handleProtectedAction(`incident-investigating-${incident.id}`, () => updateIncidentStatus(incident.id, "investigating"), "Incident updated", `${incident.incident_id} moved to investigating.`)}>Investigate</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleProtectedAction(`incident-close-${incident.id}`, () => updateIncidentStatus(incident.id, "closed"), "Incident updated", `${incident.incident_id} marked as closed.`)}>Close</Button>
                                  </>
                                )}
                                {canDeleteIncidents && (
                                  <Button size="sm" variant="destructive" onClick={() => handleProtectedAction(`incident-delete-${incident.id}`, () => deleteIncident(incident.id), "Incident deleted", `${incident.incident_id} was removed.`)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </TabsContent>

          <TabsContent value="threat-intel" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <ScrollReveal>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><Zap className="h-5 w-5" /> Threat intelligence form</CardTitle>
                    <CardDescription>Create IOC records in the NoSQL collection. This shows the non-relational side of the project.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!canManageThreatIntel && <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">Threat intelligence creation is available for admin and analyst accounts only.</div>}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">IOC type</label>
                        <Select value={threatForm.ioc_type} onValueChange={(value) => setThreatForm((current) => ({ ...current, ioc_type: value }))} disabled={!canManageThreatIntel}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ip">IP</SelectItem>
                            <SelectItem value="domain">Domain</SelectItem>
                            <SelectItem value="hash">Hash</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Severity</label>
                        <Select value={threatForm.severity} onValueChange={(value) => setThreatForm((current) => ({ ...current, severity: value }))} disabled={!canManageThreatIntel}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2"><label className="text-sm font-medium">IOC value</label><Input value={threatForm.ioc_value} onChange={(event) => setThreatForm((current) => ({ ...current, ioc_value: event.target.value }))} disabled={!canManageThreatIntel} /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">Source</label><Input value={threatForm.source} onChange={(event) => setThreatForm((current) => ({ ...current, source: event.target.value }))} disabled={!canManageThreatIntel} /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">Description</label><Textarea rows={4} value={threatForm.description} onChange={(event) => setThreatForm((current) => ({ ...current, description: event.target.value }))} disabled={!canManageThreatIntel} /></div>
                    <Button className="gap-2" disabled={!canManageThreatIntel || loading.createThreatIntel} onClick={() => handleProtectedAction("createThreatIntel", createThreatIntel, "Threat intel created", "A new IOC document was stored in the NoSQL collection.")}>{loading.createThreatIntel ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Create Threat Intel</Button>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><Database className="h-5 w-5" /> Threat intelligence records</CardTitle>
                    <CardDescription>Indicators of compromise stored in the document database and available for investigation workflows.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Severity</TableHead><TableHead>Source</TableHead><TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {threatIntel.map((record) => (
                          <TableRow key={record._id}>
                            <TableCell>{record.ioc_type}</TableCell>
                            <TableCell className="max-w-[280px] break-all font-mono text-xs text-primary">{record.ioc_value}</TableCell>
                            <TableCell>{record.severity}</TableCell>
                            <TableCell>{record.source || "n/a"}</TableCell>
                            <TableCell>
                              {canManageThreatIntel ? (
                                <Button size="sm" variant="destructive" onClick={() => handleProtectedAction(`threat-delete-${record._id}`, () => deleteThreatIntel(record._id), "Threat intel deleted", `${record.ioc_value} was removed.`)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Read only</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <ScrollReveal>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><Workflow className="h-5 w-5" /> Async processing and cache</CardTitle>
                    <CardDescription>Run the operational backend features required by the assignment: queue jobs, consume jobs, benchmark caching, and clear cache.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Job type</label>
                        <Select value={jobForm.type} onValueChange={(value) => setJobForm((current) => ({ ...current, type: value }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="report_generation">Report generation</SelectItem>
                            <SelectItem value="notification">Notification</SelectItem>
                            <SelectItem value="data_cleanup">Data cleanup</SelectItem>
                            <SelectItem value="scan_processing">Scan processing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Priority</label>
                        <Select value={jobForm.priority} onValueChange={(value) => setJobForm((current) => ({ ...current, priority: value }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2"><label className="text-sm font-medium">Payload JSON</label><Textarea rows={5} value={jobForm.payload} onChange={(event) => setJobForm((current) => ({ ...current, payload: event.target.value }))} /></div>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={!canWrite || loading.produceJob} onClick={() => handleProtectedAction("produceJob", produceJob, "Job queued", "The async processor received a new persistent job.")}>Queue Job</Button>
                      <Button variant="secondary" disabled={!canWrite || loading.consumeJobs} onClick={() => handleProtectedAction("consumeJobs", consumeJobs, "Jobs consumed", "Pending jobs were processed by the consumer.")}>Consume Jobs</Button>
                      <Button variant="outline" disabled={loading.cacheBenchmark} onClick={() => handleProtectedAction("cacheBenchmark", runCacheBenchmark, "Benchmark complete", "Cache performance numbers were refreshed.")}>Benchmark Cache</Button>
                      <Button variant="destructive" disabled={!canClearCache || loading.clearCache} onClick={() => handleProtectedAction("clearCache", clearCache, "Cache cleared", "All cache entries were invalidated.")}>Clear Cache</Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md border border-border p-3 text-sm"><p className="font-medium">Queue total</p><p className="mt-2 font-mono text-xl">{String(asyncStats?.queue?.total ?? 0)}</p></div>
                      <div className="rounded-md border border-border p-3 text-sm"><p className="font-medium">Jobs consumed</p><p className="mt-2 font-mono text-xl">{String(asyncStats?.processor?.consumed ?? 0)}</p></div>
                      <div className="rounded-md border border-border p-3 text-sm"><p className="font-medium">Cache entries</p><p className="mt-2 font-mono text-xl">{String(cacheStats?.entries ?? 0)}</p></div>
                    </div>
                    {cacheBenchmark && <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground"><p>Uncached average: {String((cacheBenchmark.uncached as { averageMs?: string } | undefined)?.averageMs || "n/a")} ms</p><p>Cached average: {String((cacheBenchmark.cached as { averageMs?: string } | undefined)?.averageMs || "n/a")} ms</p><p>Speedup: {String(cacheBenchmark.speedup || "n/a")}</p></div>}
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><FileCode2 className="h-5 w-5" /> Transformation and monitoring</CardTitle>
                    <CardDescription>Convert XML to JSON, inspect metrics, and review admin-only audit activity.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><label className="text-sm font-medium">XML input</label><Textarea rows={6} value={xmlInput} onChange={(event) => setXmlInput(event.target.value)} /></div>
                    <div className="flex flex-wrap gap-2"><Button disabled={!canWrite || loading.transformXml} onClick={() => handleProtectedAction("transformXml", transformXml, "Transformation complete", "The backend converted the XML payload into JSON.")}>Convert XML</Button></div>
                    <pre className="max-h-56 overflow-auto rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
{JSON.stringify(transformResult || { note: "Transformation output will appear here." }, null, 2)}
                    </pre>
                    <div className="rounded-md border border-border p-4 text-sm text-muted-foreground"><p>Uptime: {metrics?.uptime || "n/a"}</p><p>Total requests: {String(metrics?.requests?.total ?? 0)}</p><p>95th percentile response time: {String(metrics?.responseTime?.p95Ms ?? "n/a")} ms</p></div>
                    {canSeeAuditLog && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Recent audit log</p>
                        {auditLog.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No recent audit entries yet.</p>
                        ) : (
                          auditLog.map((entry) => (
                            <div key={entry.id} className="rounded-md border border-border p-3 text-sm">
                              <p className="font-mono text-primary">{entry.action} on {entry.resource}</p>
                              <p className="text-xs text-muted-foreground">{entry.created_at}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-6">
            <ScrollReveal>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary"><BookOpen className="h-5 w-5" /> What each part of the website is for</CardTitle>
                  <CardDescription>This tab is here specifically so you can explain the project confidently during your final presentation.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {guideCards.map((card) => (
                    <div key={card.title} className="rounded-md border border-border p-4">
                      <h3 className="font-medium text-foreground">{card.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">Suggested explanation in class</CardTitle>
                  <CardDescription>If your instructor asks how to use the project, this is a clean way to explain it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>- The general pages explain the cybersecurity services and the overall idea of the platform.</p>
                  <p>- The Dashboard route shows visual monitoring and reporting.</p>
                  <p>- The Integration route demonstrates Phase II enterprise integration features.</p>
                  <p>- The Login route is where I use seeded accounts for admin, analyst, and viewer roles.</p>
                  <p>- The Phase III Workspace is where I actually use the backend as an application: create records, manage intelligence, run async processing, test caching, and show protected system data.</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DataManagementDashboard;
