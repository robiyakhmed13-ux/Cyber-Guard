import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePhase3Auth } from "@/context/Phase3AuthContext";
import { phase3Request } from "@/lib/phase3-api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Lock, Plus, RefreshCw, Scan, ShieldAlert } from "lucide-react";

interface Incident {
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

const severityColor = (s: string) => {
  if (s === "critical") return "text-red-400 border-red-400/40 bg-red-400/5";
  if (s === "high") return "text-orange-400 border-orange-400/40 bg-orange-400/5";
  if (s === "medium") return "text-yellow-400 border-yellow-400/40 bg-yellow-400/5";
  return "text-primary border-primary/40 bg-primary/5";
};

const blank = {
  threat_type: "malware",
  severity: "high",
  source_ip: "",
  target_asset: "",
  description: "",
};

const ThreatDetection = () => {
  const { user, token, isAuthenticated, isHydrated } = usePhase3Auth();
  const { toast } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("all");

  const canWrite = isAuthenticated && user?.role !== "viewer";

  const load = async () => {
    setLoading(true);
    try {
      const res = await phase3Request<{ data: Incident[]; total: number }>("/incidents?limit=50");
      setIncidents(res.data.data ?? []);
    } catch {
      /* backend may be offline */
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
  }, [isHydrated]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await phase3Request("/incidents", {
        method: "POST",
        token,
        body: JSON.stringify(form),
      });
      toast({ title: "Threat logged", description: `${form.threat_type} — ${form.severity} severity` });
      setForm(blank);
      await load();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const visible = incidents.filter((i) =>
    filterSeverity === "all" ? true : i.severity === filterSeverity
  );

  const criticalCount = incidents.filter((i) => i.severity === "critical").length;
  const highCount = incidents.filter((i) => i.severity === "high").length;
  const openCount = incidents.filter((i) => i.status === "open").length;

  return (
    <div className="container py-10 pb-16 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Scan className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-mono cyber-text-glow">Threat Detection</h1>
          <p className="text-sm text-muted-foreground">Live feed of detected threats. Auto-refreshes every 15 seconds.</p>
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
              Log in as <strong>admin</strong> or <strong>analyst</strong> to report new threats. Viewing live feed in read-only mode.
            </p>
            <Button asChild size="sm">
              <Link to="/login?returnTo=/threat-detection">Login</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Alert summary */}
      {(criticalCount > 0 || highCount > 0) && (
        <div className="flex items-center gap-3 rounded-lg border border-red-400/30 bg-red-400/5 px-4 py-3">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm font-mono">
            <span className="text-red-400 font-bold">{criticalCount} critical</span>
            {", "}
            <span className="text-orange-400 font-bold">{highCount} high</span>
            {" severity threats detected — "}
            <span className="text-muted-foreground">{openCount} still open</span>
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Detected", value: incidents.length, color: "text-foreground" },
          { label: "Critical", value: criticalCount, color: "text-red-400" },
          { label: "High", value: highCount, color: "text-orange-400" },
          { label: "Open", value: openCount, color: "text-yellow-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="pt-4 pb-3 text-center">
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6 items-start">
        {/* Report form */}
        {canWrite && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" /> Report Threat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Threat Type</label>
                  <Select value={form.threat_type} onValueChange={(v) => setForm({ ...form, threat_type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["malware", "ransomware", "apt", "phishing", "ddos", "brute_force", "sql_injection", "xss", "insider_threat", "data_breach"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Severity</label>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "critical"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Source IP</label>
                  <Input
                    className="mt-1 font-mono text-sm"
                    placeholder="10.0.0.1"
                    value={form.source_ip}
                    onChange={(e) => setForm({ ...form, source_ip: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Affected Asset</label>
                  <Input
                    className="mt-1 font-mono text-sm"
                    placeholder="db-server-02"
                    value={form.target_asset}
                    onChange={(e) => setForm({ ...form, target_asset: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Details</label>
                  <Textarea
                    className="mt-1 text-sm"
                    rows={3}
                    placeholder="Describe what was observed..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  <AlertTriangle className="h-4 w-4" />
                  {submitting ? "Reporting..." : "Report Threat"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Live feed */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground font-mono ml-auto">
              Showing {visible.length} of {incidents.length}
            </span>
          </div>

          <Card className="border-border/60">
            <CardContent className="p-0">
              {loading && incidents.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono animate-pulse">
                  Loading threat feed...
                </div>
              ) : visible.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono">
                  {incidents.length === 0
                    ? "No threats detected yet. Start the backend or report one."
                    : "No threats match this severity filter."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono text-xs">Threat</TableHead>
                        <TableHead className="font-mono text-xs">Severity</TableHead>
                        <TableHead className="font-mono text-xs">Source IP</TableHead>
                        <TableHead className="font-mono text-xs">Asset</TableHead>
                        <TableHead className="font-mono text-xs">Status</TableHead>
                        <TableHead className="font-mono text-xs">Detected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((inc) => (
                        <TableRow key={inc.id}>
                          <TableCell className="font-mono text-xs font-medium">{inc.threat_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-mono ${severityColor(inc.severity)}`}>
                              {inc.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{inc.source_ip}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{inc.target_asset}</TableCell>
                          <TableCell className="font-mono text-xs capitalize">{inc.status}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {new Date(inc.created_at).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThreatDetection;
