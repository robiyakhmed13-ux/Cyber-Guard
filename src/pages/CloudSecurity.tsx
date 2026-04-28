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
import { CheckCircle2, Cloud, Lock, Plus, RefreshCw, Trash2, Zap } from "lucide-react";

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

// Cloud-relevant threat/misconfiguration types
const cloudThreatTypes = ["misconfiguration", "data_breach", "open_port", "insecure_api", "weak_credentials", "xss"];

const severityColor = (s: string) => {
  if (s === "critical") return "text-red-400 border-red-400/40";
  if (s === "high") return "text-orange-400 border-orange-400/40";
  if (s === "medium") return "text-yellow-400 border-yellow-400/40";
  return "text-primary border-primary/40";
};

const platforms = ["AWS", "Microsoft Azure", "Google Cloud", "Oracle Cloud", "IBM Cloud", "Kubernetes", "Docker", "Terraform"];

const blank = {
  threat_type: "misconfiguration",
  severity: "high",
  source_ip: "cloud-scanner",
  target_asset: "",
  description: "",
};

const CloudSecurity = () => {
  const { user, token, isAuthenticated, isHydrated } = usePhase3Auth();
  const { toast } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [queuingJob, setQueuingJob] = useState(false);
  const [auditQueued, setAuditQueued] = useState(false);

  const canWrite = isAuthenticated && user?.role !== "viewer";
  const canDelete = user?.role === "admin";

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

  const cloudIssues = incidents.filter((i) => cloudThreatTypes.includes(i.threat_type));
  const openIssues = cloudIssues.filter((i) => i.status !== "closed");
  const resolvedIssues = cloudIssues.filter((i) => i.status === "closed");

  const visible = cloudIssues.filter((i) =>
    filterSeverity === "all" ? true : i.severity === filterSeverity
  );

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
      toast({ title: "Issue logged", description: `${form.threat_type} on ${form.target_asset}` });
      setForm(blank);
      await load();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resolveIssue = async (id: number) => {
    if (!token) return;
    try {
      await phase3Request(`/incidents/${id}`, { method: "PUT", token, body: JSON.stringify({ status: "closed" }) });
      toast({ title: "Issue resolved" });
      await load();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  };

  const deleteIssue = async (id: number) => {
    if (!token) return;
    try {
      await phase3Request(`/incidents/${id}`, { method: "DELETE", token });
      toast({ title: "Removed" });
      await load();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  };

  const runCloudAudit = async () => {
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
            scope: "cloud_security_posture",
            platforms: platforms,
            open_issues: openIssues.length,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      setAuditQueued(true);
      toast({ title: "Cloud audit queued", description: "CSPM scan job created for all platforms." });
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setQueuingJob(false);
    }
  };

  // Posture score: % of cloud issues resolved
  const postureScore = cloudIssues.length === 0
    ? 100
    : Math.round((resolvedIssues.length / cloudIssues.length) * 100);

  const postureColor = postureScore >= 80 ? "text-green-400" : postureScore >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="container py-10 pb-16 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Cloud className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-mono cyber-text-glow">Cloud Security</h1>
          <p className="text-sm text-muted-foreground">
            Track cloud misconfigurations, run CSPM audits, and measure your security posture.
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
              Log in to log misconfigurations and run cloud audit jobs.
            </p>
            <Button asChild size="sm"><Link to="/login?returnTo=/cloud-security">Login</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Posture + stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60 col-span-1">
          <CardContent className="pt-4 pb-3 text-center">
            <div className={`text-3xl font-bold font-mono ${postureColor}`}>{postureScore}%</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Posture Score</div>
          </CardContent>
        </Card>
        {[
          { label: "Total Issues", value: cloudIssues.length, color: "text-foreground" },
          { label: "Open", value: openIssues.length, color: "text-red-400" },
          { label: "Resolved", value: resolvedIssues.length, color: "text-green-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="pt-4 pb-3 text-center">
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CSPM Audit action */}
      {canWrite && (
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4 flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Cloud Security Posture Scan (CSPM)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Queues a background audit job that checks all cloud platforms for misconfigurations against CIS benchmarks.
              </p>
              {auditQueued && (
                <p className="text-xs text-primary font-mono mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Audit queued — check the Workspace &rarr; Operations tab for results.
                </p>
              )}
            </div>
            <Button className="gap-2" onClick={runCloudAudit} disabled={queuingJob}>
              <Zap className="h-4 w-4" />
              {queuingJob ? "Queuing..." : "Run CSPM Audit"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6 items-start">
        {/* Log issue form */}
        {canWrite && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" /> Log Cloud Issue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Issue Type</label>
                  <Select value={form.threat_type} onValueChange={(v) => setForm({ ...form, threat_type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cloudThreatTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
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
                  <label className="text-xs font-medium text-muted-foreground">Cloud Resource</label>
                  <Input
                    className="mt-1 font-mono text-sm"
                    placeholder="s3-bucket-prod / k8s-cluster-01"
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
                    placeholder="Describe the misconfiguration or finding..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Logging..." : "Log Issue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Issues table */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground font-mono self-center ml-auto">
              {visible.length} issues
            </span>
          </div>

          <Card className="border-border/60">
            <CardContent className="p-0">
              {loading && cloudIssues.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono animate-pulse">
                  Loading cloud issues...
                </div>
              ) : visible.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono">
                  {cloudIssues.length === 0
                    ? "No cloud issues logged. Use the form to log a misconfiguration."
                    : "No issues match the filter."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono text-xs">Type</TableHead>
                        <TableHead className="font-mono text-xs">Severity</TableHead>
                        <TableHead className="font-mono text-xs">Resource</TableHead>
                        <TableHead className="font-mono text-xs">Status</TableHead>
                        <TableHead className="font-mono text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((inc) => (
                        <TableRow key={inc.id}>
                          <TableCell className="font-mono text-xs">{inc.threat_type.replace(/_/g, " ")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-mono ${severityColor(inc.severity)}`}>
                              {inc.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{inc.target_asset}</TableCell>
                          <TableCell className="font-mono text-xs capitalize">{inc.status}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {canWrite && inc.status !== "closed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs gap-1 text-green-400 border-green-400/40"
                                  onClick={() => resolveIssue(inc.id)}
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Resolve
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => deleteIssue(inc.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform tags */}
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-2">Monitored Platforms</p>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <span key={p} className="bg-secondary font-mono text-xs px-3 py-1 rounded border border-border text-secondary-foreground">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudSecurity;
