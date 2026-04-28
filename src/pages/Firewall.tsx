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
import { Flame, Lock, Plus, RefreshCw, ShieldCheck, ShieldOff, Trash2, Zap } from "lucide-react";

interface Incident {
  id: number;
  threat_type: string;
  severity: string;
  source_ip: string;
  target_asset: string;
  status: string;
  created_at: string;
}

interface FirewallRule {
  id: number;
  name: string;
  direction: "inbound" | "outbound";
  protocol: string;
  port: string;
  source: string;
  action: "allow" | "block";
  enabled: boolean;
}

// Default pre-seeded rules (UI-only, stored in component state)
const defaultRules: FirewallRule[] = [
  { id: 1, name: "Block all inbound Telnet", direction: "inbound", protocol: "TCP", port: "23", source: "0.0.0.0/0", action: "block", enabled: true },
  { id: 2, name: "Allow HTTPS inbound", direction: "inbound", protocol: "TCP", port: "443", source: "0.0.0.0/0", action: "allow", enabled: true },
  { id: 3, name: "Allow SSH from corp", direction: "inbound", protocol: "TCP", port: "22", source: "10.0.0.0/8", action: "allow", enabled: true },
  { id: 4, name: "Block RDP from internet", direction: "inbound", protocol: "TCP", port: "3389", source: "0.0.0.0/0", action: "block", enabled: true },
  { id: 5, name: "Allow DNS outbound", direction: "outbound", protocol: "UDP", port: "53", source: "any", action: "allow", enabled: true },
  { id: 6, name: "Block SMB external", direction: "outbound", protocol: "TCP", port: "445", source: "any", action: "block", enabled: false },
];

const blankRule = {
  name: "",
  direction: "inbound" as const,
  protocol: "TCP",
  port: "",
  source: "0.0.0.0/0",
  action: "block" as const,
};

// Threat types that represent firewall-relevant attacks
const firewallThreatTypes = ["ddos", "brute_force", "sql_injection", "xss", "open_port", "misconfiguration"];

const Firewall = () => {
  const { user, token, isAuthenticated, isHydrated } = usePhase3Auth();
  const { toast } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [rules, setRules] = useState<FirewallRule[]>(defaultRules);
  const [loading, setLoading] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState(blankRule);
  const [queuingJob, setQueuingJob] = useState(false);

  const canWrite = isAuthenticated && user?.role !== "viewer";
  const nextId = rules.length > 0 ? Math.max(...rules.map((r) => r.id)) + 1 : 1;

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

  const firewallEvents = incidents.filter((i) => firewallThreatTypes.includes(i.threat_type));
  const blocked = firewallEvents.filter((i) => i.status === "closed");
  const active = firewallEvents.filter((i) => i.status !== "closed");

  const toggleRule = (id: number) => {
    if (!canWrite) return;
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    toast({ title: "Rule updated", description: "Firewall rule state changed." });
  };

  const deleteRule = (id: number) => {
    if (!canWrite) return;
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Rule deleted" });
  };

  const addRule = (e: React.FormEvent) => {
    e.preventDefault();
    setRules((prev) => [...prev, { ...newRule, id: nextId, enabled: true }]);
    setNewRule(blankRule);
    setShowAddRule(false);
    toast({ title: "Rule added", description: newRule.name });
  };

  const runFirewallAudit = async () => {
    if (!token) return;
    setQueuingJob(true);
    try {
      await phase3Request("/async/produce", {
        method: "POST",
        token,
        body: JSON.stringify({
          type: "threat_analysis",
          priority: "high",
          payload: { scope: "firewall_audit", rules: rules.length, timestamp: new Date().toISOString() },
        }),
      });
      toast({ title: "Firewall audit queued", description: "Background job created. Check the Workspace for results." });
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setQueuingJob(false);
    }
  };

  return (
    <div className="container py-10 pb-16 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Flame className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-mono cyber-text-glow">Firewall Management</h1>
          <p className="text-sm text-muted-foreground">Manage firewall rules and monitor blocked network threats.</p>
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
              Log in as <strong>admin</strong> or <strong>analyst</strong> to add, toggle, and delete firewall rules.
            </p>
            <Button asChild size="sm"><Link to="/login?returnTo=/firewall">Login</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Rules", value: rules.filter((r) => r.enabled).length, color: "text-primary" },
          { label: "Disabled Rules", value: rules.filter((r) => !r.enabled).length, color: "text-muted-foreground" },
          { label: "Blocked Events", value: blocked.length, color: "text-green-400" },
          { label: "Active Threats", value: active.length, color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="pt-4 pb-3 text-center">
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Firewall Rules */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="font-mono text-sm text-primary">Firewall Rules</h2>
          <div className="ml-auto flex gap-2">
            {canWrite && (
              <>
                <Button variant="outline" size="sm" className="gap-2" onClick={runFirewallAudit} disabled={queuingJob}>
                  <Zap className="h-3.5 w-3.5" />
                  {queuingJob ? "Queuing..." : "Run Audit Job"}
                </Button>
                <Button size="sm" className="gap-2" onClick={() => setShowAddRule((v) => !v)}>
                  <Plus className="h-3.5 w-3.5" />
                  {showAddRule ? "Cancel" : "Add Rule"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Add rule form */}
        {showAddRule && canWrite && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <form onSubmit={addRule} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="col-span-2 md:col-span-3">
                  <label className="text-xs font-medium text-muted-foreground">Rule Name</label>
                  <Input className="mt-1 font-mono text-sm" placeholder="Block SMB from internet" value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Direction</label>
                  <Select value={newRule.direction} onValueChange={(v: "inbound" | "outbound") => setNewRule({ ...newRule, direction: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">Inbound</SelectItem>
                      <SelectItem value="outbound">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Protocol</label>
                  <Select value={newRule.protocol} onValueChange={(v) => setNewRule({ ...newRule, protocol: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["TCP", "UDP", "ICMP", "ANY"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Port</label>
                  <Input className="mt-1 font-mono text-sm" placeholder="80 / 443 / any" value={newRule.port}
                    onChange={(e) => setNewRule({ ...newRule, port: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Source</label>
                  <Input className="mt-1 font-mono text-sm" placeholder="0.0.0.0/0" value={newRule.source}
                    onChange={(e) => setNewRule({ ...newRule, source: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Action</label>
                  <Select value={newRule.action} onValueChange={(v: "allow" | "block") => setNewRule({ ...newRule, action: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="allow">Allow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">Add Rule</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono text-xs">Status</TableHead>
                    <TableHead className="font-mono text-xs">Rule Name</TableHead>
                    <TableHead className="font-mono text-xs">Direction</TableHead>
                    <TableHead className="font-mono text-xs">Protocol</TableHead>
                    <TableHead className="font-mono text-xs">Port</TableHead>
                    <TableHead className="font-mono text-xs">Source</TableHead>
                    <TableHead className="font-mono text-xs">Action</TableHead>
                    {canWrite && <TableHead className="font-mono text-xs w-20">Manage</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id} className={!rule.enabled ? "opacity-50" : ""}>
                      <TableCell>
                        <button onClick={() => toggleRule(rule.id)} title={rule.enabled ? "Click to disable" : "Click to enable"}>
                          {rule.enabled
                            ? <ShieldCheck className="h-4 w-4 text-green-400" />
                            : <ShieldOff className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{rule.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground capitalize">{rule.direction}</TableCell>
                      <TableCell className="font-mono text-xs">{rule.protocol}</TableCell>
                      <TableCell className="font-mono text-xs">{rule.port}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{rule.source}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs font-mono ${rule.action === "block" ? "text-red-400 border-red-400/40" : "text-green-400 border-green-400/40"}`}>
                          {rule.action}
                        </Badge>
                      </TableCell>
                      {canWrite && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => toggleRule(rule.id)}>
                              {rule.enabled ? "Disable" : "Enable"}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => deleteRule(rule.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Blocked traffic events (from backend) */}
      <section className="space-y-3">
        <h2 className="font-mono text-sm text-primary">
          Network Threat Events{" "}
          <span className="text-muted-foreground font-normal">(from incident log)</span>
        </h2>
        <Card className="border-border/60">
          <CardContent className="p-0">
            {firewallEvents.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground font-mono">
                No firewall-related incidents yet. Start the backend and log a DDoS or brute_force incident.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono text-xs">Attack Type</TableHead>
                      <TableHead className="font-mono text-xs">Source IP</TableHead>
                      <TableHead className="font-mono text-xs">Target</TableHead>
                      <TableHead className="font-mono text-xs">Severity</TableHead>
                      <TableHead className="font-mono text-xs">Result</TableHead>
                      <TableHead className="font-mono text-xs">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {firewallEvents.map((inc) => (
                      <TableRow key={inc.id}>
                        <TableCell className="font-mono text-xs font-medium">{inc.threat_type}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{inc.source_ip}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{inc.target_asset}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs font-mono ${
                            inc.severity === "critical" ? "text-red-400 border-red-400/40" :
                            inc.severity === "high" ? "text-orange-400 border-orange-400/40" :
                            "text-yellow-400 border-yellow-400/40"}`}>
                            {inc.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs font-mono ${inc.status === "closed" ? "text-green-400 border-green-400/40" : "text-red-400 border-red-400/40"}`}>
                            {inc.status === "closed" ? "blocked" : "active"}
                          </Badge>
                        </TableCell>
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
      </section>
    </div>
  );
};

export default Firewall;
