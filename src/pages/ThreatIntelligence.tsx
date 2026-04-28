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
import { Lock, Plus, Radar, RefreshCw, Trash2 } from "lucide-react";

interface ThreatIntel {
  _id: string;
  ioc_type: string;
  ioc_value: string;
  severity: string;
  source?: string;
  description?: string;
  created_at: string;
}

const severityColor = (s: string) => {
  if (s === "critical") return "text-red-400 border-red-400/40";
  if (s === "high") return "text-orange-400 border-orange-400/40";
  if (s === "medium") return "text-yellow-400 border-yellow-400/40";
  return "text-primary border-primary/40";
};

const blank = {
  ioc_type: "domain",
  ioc_value: "",
  severity: "high",
  source: "OSINT",
  description: "",
};

const ThreatIntelligence = () => {
  const { user, token, isAuthenticated, isHydrated } = usePhase3Auth();
  const { toast } = useToast();

  const [intel, setIntel] = useState<ThreatIntel[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  const canWrite = isAuthenticated && user?.role !== "viewer";
  const canDelete = isAuthenticated && user?.role !== "viewer";

  const load = async () => {
    setLoading(true);
    try {
      const res = await phase3Request<{ data: ThreatIntel[]; total: number }>("/threat-intel?limit=50");
      setIntel(res.data.data ?? []);
    } catch {
      /* backend offline */
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
      await phase3Request("/threat-intel", {
        method: "POST",
        token,
        body: JSON.stringify(form),
      });
      toast({ title: "IOC added", description: `${form.ioc_type}: ${form.ioc_value}` });
      setForm(blank);
      await load();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await phase3Request(`/threat-intel/${id}`, { method: "DELETE", token });
      toast({ title: "IOC removed" });
      await load();
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  };

  const visible = intel.filter((i) => {
    const matchType = filterType === "all" || i.ioc_type === filterType;
    const matchSearch = !search || i.ioc_value.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const iocTypes = [...new Set(intel.map((i) => i.ioc_type))];

  return (
    <div className="container py-10 pb-16 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Radar className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-mono cyber-text-glow">Threat Intelligence</h1>
          <p className="text-sm text-muted-foreground">Manage indicators of compromise (IOCs) from global threat feeds.</p>
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
              Log in as <strong>admin</strong> or <strong>analyst</strong> to add or delete IOC records.
            </p>
            <Button asChild size="sm">
              <Link to="/login?returnTo=/threat-intelligence">Login</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total IOCs", value: intel.length, color: "text-foreground" },
          { label: "Critical", value: intel.filter((i) => i.severity === "critical").length, color: "text-red-400" },
          { label: "High", value: intel.filter((i) => i.severity === "high").length, color: "text-orange-400" },
          { label: "Types", value: iocTypes.length, color: "text-primary" },
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
        {/* Add IOC form */}
        {canWrite && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" /> Add IOC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">IOC Type</label>
                  <Select value={form.ioc_type} onValueChange={(v) => setForm({ ...form, ioc_type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["domain", "ip", "url", "hash_md5", "hash_sha256", "email", "filename", "registry_key"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">IOC Value</label>
                  <Input
                    className="mt-1 font-mono text-sm"
                    placeholder={form.ioc_type === "ip" ? "192.168.0.1" : form.ioc_type === "domain" ? "evil.example.com" : "value..."}
                    value={form.ioc_value}
                    onChange={(e) => setForm({ ...form, ioc_value: e.target.value })}
                    required
                  />
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
                  <label className="text-xs font-medium text-muted-foreground">Source</label>
                  <Input
                    className="mt-1 font-mono text-sm"
                    placeholder="OSINT / VirusTotal / Internal"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Textarea
                    className="mt-1 text-sm"
                    rows={3}
                    placeholder="Context about this indicator..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Indicator"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* IOC table */}
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Input
              className="max-w-xs font-mono text-sm"
              placeholder="Search by value..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {iocTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border/60">
            <CardContent className="p-0">
              {loading && intel.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono animate-pulse">
                  Loading threat intel...
                </div>
              ) : visible.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground font-mono">
                  {intel.length === 0 ? "No IOCs yet. Start the backend and add one." : "No results match."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono text-xs">Type</TableHead>
                        <TableHead className="font-mono text-xs">Value</TableHead>
                        <TableHead className="font-mono text-xs">Severity</TableHead>
                        <TableHead className="font-mono text-xs">Source</TableHead>
                        <TableHead className="font-mono text-xs">Added</TableHead>
                        {canDelete && <TableHead className="font-mono text-xs w-10" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((ioc) => (
                        <TableRow key={ioc._id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                              {ioc.ioc_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[180px] truncate" title={ioc.ioc_value}>
                            {ioc.ioc_value}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-mono ${severityColor(ioc.severity)}`}>
                              {ioc.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {ioc.source || "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {new Date(ioc.created_at).toLocaleDateString()}
                          </TableCell>
                          {canDelete && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(ioc._id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          )}
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

export default ThreatIntelligence;
