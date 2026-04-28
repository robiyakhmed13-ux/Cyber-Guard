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
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  Siren,
  Trash2,
  XCircle,
} from "lucide-react";

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
  if (s === "critical") return "text-red-400 border-red-400/40";
  if (s === "high") return "text-orange-400 border-orange-400/40";
  if (s === "medium") return "text-yellow-400 border-yellow-400/40";
  return "text-primary border-primary/40";
};

const statusColor = (s: string) => {
  if (s === "open") return "text-red-400";
  if (s === "investigating") return "text-yellow-400";
  if (s === "closed") return "text-green-400";
  return "text-muted-foreground";
};

const blank = {
  threat_type: "ransomware",
  severity: "high",
  source_ip: "",
  target_asset: "",
  description: "",
};

const IncidentResponse = () => {
  const { user, token, isAuthenticated, isHydrated } = usePhase3Auth();
  const { toast } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const canWrite = isAuthenticated && user?.role !== "viewer";
  const canDelete = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const res = await phase3Request<{ data: Incident[]; total: number }>("/incidents?limit=50");
      setIncidents(res.data.data ?? []);
    } catch {
      // backend may be offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated) load();
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
      toast({ title: "Incident created", description: `${form.threat_type} on ${form.target_asset}` });
      setForm(blank);
      await load();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    if (!token) return;
    try {
      await phase3Request(`/incidents/${id}`, { method: "PUT", token, body: JSON.stringify({ status }) });
      toast({ title: "Status updated", description: status });
      await load();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  };

  const deleteIncident = async (id: number) => {
    if (!token) return;
    try {
      await phase3Request(`/incidents/${id}`, { method: "DELETE", token });
      toast({ title: "Incident deleted" });
      await load();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  };

  const visible = incidents.filter((i) => {
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    const matchSearch =
      !search ||
      i.threat_type.includes(search.toLowerCase()) ||
      i.target_asset.toLowerCase().includes(search.toLowerCase()) ||
      i.source_ip.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="container py-10 pb-16 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Siren className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-mono cyber-text-glow">Incident Response</h1>
          <p className="text-sm text-muted-foreground">Create, triage, and close security incidents in real time.</p>
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
              You are viewing in <strong>read-only mode</strong>. Log in as <strong>admin</strong> or <strong>analyst</strong> to create and manage incidents.
            </p>
            <Button asChild size="sm">
              <Link to="/login?returnTo=/incident-response">Login</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: incidents.length, color: "text-foreground" },
          { label: "Open", value: incidents.filter((i) => i.status === "open").length, color: "text-red-400" },
          { label: "Investigating", value: incidents.filter((i) => i.status === "investigating").length, color: "text-yellow-400" },
          { label: "Closed", value: incidents.filter((i) => i.status === "closed").length, color: "text-green-400" },
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
        {/* Create form */}
        {canWrite && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" /> New Incident
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Threat Type</label>
                  <Select value={form.threat_type} onValueChange={(v) => setForm({ ...form, threat_type: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["ransomware", "phishing", "malware", "ddos", "brute_force", "sql_injection", "xss", "data_breach", "insider_threat", "apt"].map((t) => (
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
                    placeholder="192.168.1.100"
                    value={form.source_ip}
                    onChange={(e) => setForm({ ...form, source_ip: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Target Asset</label>
                  <Input
                    className="mt-1 font-mono text-sm"
                    placeholder="web-server-01"
                    value={form.target_asset}
                    onChange={(e) => setForm({ ...form, target_asset: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Textarea
                    className="mt-1 text-sm"
                    rows={3}
                    placeholder="What was observed..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Incident"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Incident table */}
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Input
              className="max-w-xs font-mono text-sm"
              placeholder="Search by type, asset, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border/60">
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono animate-pulse">
                  Loading incidents...
                </div>
              ) : visible.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono">
                  {incidents.length === 0 ? "No incidents yet. Start the backend and create one." : "No incidents match the filter."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono text-xs">Type</TableHead>
                        <TableHead className="font-mono text-xs">Severity</TableHead>
                        <TableHead className="font-mono text-xs">Asset</TableHead>
                        <TableHead className="font-mono text-xs">Status</TableHead>
                        <TableHead className="font-mono text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((inc) => (
                        <TableRow key={inc.id}>
                          <TableCell className="font-mono text-xs">{inc.threat_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-mono ${severityColor(inc.severity)}`}>
                              {inc.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{inc.target_asset}</TableCell>
                          <TableCell className={`font-mono text-xs ${statusColor(inc.status)}`}>{inc.status}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {canWrite && inc.status === "open" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs gap-1"
                                  onClick={() => updateStatus(inc.id, "investigating")}
                                >
                                  <AlertTriangle className="h-3 w-3" /> Investigate
                                </Button>
                              )}
                              {canWrite && inc.status === "investigating" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs gap-1 text-green-400 border-green-400/40"
                                  onClick={() => updateStatus(inc.id, "closed")}
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Close
                                </Button>
                              )}
                              {canWrite && inc.status === "closed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs gap-1"
                                  onClick={() => updateStatus(inc.id, "open")}
                                >
                                  <XCircle className="h-3 w-3" /> Reopen
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                  onClick={() => deleteIncident(inc.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
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
          {!canWrite && isAuthenticated && (
            <p className="text-xs text-muted-foreground font-mono px-1">
              Viewer role — read only. Log in as admin or analyst to manage incidents.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentResponse;
