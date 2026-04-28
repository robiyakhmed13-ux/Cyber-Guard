import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePhase3Auth } from "@/context/Phase3AuthContext";
import { phase3Request } from "@/lib/phase3-api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Lock, Monitor, RefreshCw, ShieldAlert, Zap } from "lucide-react";

interface Incident {
  id: number;
  threat_type: string;
  severity: string;
  source_ip: string;
  target_asset: string;
  status: string;
  description?: string;
  created_at: string;
}

// Endpoint-relevant threat types
const endpointThreatTypes = ["malware", "ransomware", "insider_threat", "brute_force", "apt", "data_breach"];

const severityColor = (s: string) => {
  if (s === "critical") return "text-red-400 border-red-400/40";
  if (s === "high") return "text-orange-400 border-orange-400/40";
  if (s === "medium") return "text-yellow-400 border-yellow-400/40";
  return "text-primary border-primary/40";
};

interface EndpointStatus {
  name: string;
  alerts: number;
  highestSeverity: string;
  status: "clean" | "at_risk" | "compromised";
  lastSeen: string;
}

const EndpointSecurity = () => {
  const { user, token, isAuthenticated, isHydrated } = usePhase3Auth();
  const { toast } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [queuingJob, setQueuingJob] = useState(false);
  const [jobResult, setJobResult] = useState<string | null>(null);

  const canWrite = isAuthenticated && user?.role !== "viewer";

  const load = async () => {
    setLoading(true);
    try {
      const res = await phase3Request<{ data: Incident[] }>("/incidents?limit=100");
      setIncidents(res.data.data ?? []);
    } catch {
      /* backend offline */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated) load();
  }, [isHydrated]);

  // Derive endpoint inventory from incident data
  const endpointAlerts = incidents.filter((i) => endpointThreatTypes.includes(i.threat_type));

  const endpointMap = new Map<string, EndpointStatus>();
  endpointAlerts.forEach((inc) => {
    const asset = inc.target_asset || "unknown";
    const existing = endpointMap.get(asset);
    const isHigher = (a: string, b: string) => {
      const order = ["low", "medium", "high", "critical"];
      return order.indexOf(a) > order.indexOf(b ?? "low");
    };
    const isCompromised = inc.status !== "closed";
    endpointMap.set(asset, {
      name: asset,
      alerts: (existing?.alerts ?? 0) + 1,
      highestSeverity: isHigher(inc.severity, existing?.highestSeverity ?? "low") ? inc.severity : (existing?.highestSeverity ?? inc.severity),
      status: isCompromised ? (inc.severity === "critical" || inc.severity === "high" ? "compromised" : "at_risk") : (existing?.status === "compromised" || existing?.status === "at_risk" ? existing.status : "clean"),
      lastSeen: inc.created_at,
    });
  });
  const endpoints = Array.from(endpointMap.values());

  const cleanCount = endpoints.filter((e) => e.status === "clean").length;
  const atRiskCount = endpoints.filter((e) => e.status === "at_risk").length;
  const compromisedCount = endpoints.filter((e) => e.status === "compromised").length;

  const runEndpointScan = async () => {
    if (!token) return;
    setQueuingJob(true);
    try {
      await phase3Request("/async/produce", {
        method: "POST",
        token,
        body: JSON.stringify({
          type: "scan_processing",
          priority: "high",
          payload: {
            scope: "endpoint_edr_scan",
            endpoints: endpoints.length,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      setJobResult("Scan queued successfully. The background processor will analyse all endpoint telemetry.");
      toast({ title: "EDR Scan queued", description: `Scanning ${endpoints.length} endpoints.` });
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setQueuingJob(false);
    }
  };

  const statusBadge = (s: EndpointStatus["status"]) => {
    if (s === "compromised") return <Badge variant="outline" className="text-xs font-mono text-red-400 border-red-400/40">compromised</Badge>;
    if (s === "at_risk") return <Badge variant="outline" className="text-xs font-mono text-yellow-400 border-yellow-400/40">at risk</Badge>;
    return <Badge variant="outline" className="text-xs font-mono text-green-400 border-green-400/40">clean</Badge>;
  };

  return (
    <div className="container py-10 pb-16 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Monitor className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-mono cyber-text-glow">Endpoint Security</h1>
          <p className="text-sm text-muted-foreground">
            EDR alerts and endpoint inventory derived from live incident data.
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
              Log in to run endpoint scans and see full EDR alert history.
            </p>
            <Button asChild size="sm"><Link to="/login?returnTo=/endpoint-security">Login</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Endpoints Tracked", value: endpoints.length, color: "text-foreground" },
          { label: "Clean", value: cleanCount, color: "text-green-400" },
          { label: "At Risk", value: atRiskCount, color: "text-yellow-400" },
          { label: "Compromised", value: compromisedCount, color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="pt-4 pb-3 text-center">
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scan action */}
      {canWrite && (
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Run EDR Scan</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Queues a background scan job that analyses endpoint telemetry across all tracked assets.
              </p>
              {jobResult && (
                <p className="text-xs text-primary font-mono mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {jobResult}
                </p>
              )}
            </div>
            <Button className="gap-2" onClick={runEndpointScan} disabled={queuingJob}>
              <Zap className="h-4 w-4" />
              {queuingJob ? "Queuing scan..." : "Start EDR Scan"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory" className="gap-2">
            <Monitor className="h-4 w-4" /> Endpoint Inventory ({endpoints.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <ShieldAlert className="h-4 w-4" /> EDR Alerts ({endpointAlerts.length})
          </TabsTrigger>
        </TabsList>

        {/* Endpoint Inventory */}
        <TabsContent value="inventory" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              {endpoints.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono">
                  No endpoints tracked yet. Log incidents with target assets (malware, ransomware, etc.) to populate this inventory.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono text-xs">Endpoint</TableHead>
                        <TableHead className="font-mono text-xs">Status</TableHead>
                        <TableHead className="font-mono text-xs">Alerts</TableHead>
                        <TableHead className="font-mono text-xs">Highest Severity</TableHead>
                        <TableHead className="font-mono text-xs">Last Event</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {endpoints.map((ep) => (
                        <TableRow key={ep.name}>
                          <TableCell className="font-mono text-xs font-medium">{ep.name}</TableCell>
                          <TableCell>{statusBadge(ep.status)}</TableCell>
                          <TableCell className="font-mono text-xs">{ep.alerts}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-mono ${severityColor(ep.highestSeverity)}`}>
                              {ep.highestSeverity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {new Date(ep.lastSeen).toLocaleString()}
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

        {/* EDR Alerts */}
        <TabsContent value="alerts" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              {endpointAlerts.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono">
                  No EDR alerts yet. Log malware, ransomware, or insider_threat incidents from Incident Response.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono text-xs">Threat</TableHead>
                        <TableHead className="font-mono text-xs">Severity</TableHead>
                        <TableHead className="font-mono text-xs">Endpoint</TableHead>
                        <TableHead className="font-mono text-xs">Source IP</TableHead>
                        <TableHead className="font-mono text-xs">Status</TableHead>
                        <TableHead className="font-mono text-xs">Detected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {endpointAlerts.map((inc) => (
                        <TableRow key={inc.id}>
                          <TableCell className="font-mono text-xs font-medium">{inc.threat_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-mono ${severityColor(inc.severity)}`}>
                              {inc.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{inc.target_asset}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{inc.source_ip}</TableCell>
                          <TableCell className="font-mono text-xs capitalize">{inc.status}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {new Date(inc.created_at).toLocaleString()}
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
      </Tabs>
    </div>
  );
};

export default EndpointSecurity;
