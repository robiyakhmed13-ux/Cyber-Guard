import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePhase3Auth } from "@/context/Phase3AuthContext";
import { phase3Request } from "@/lib/phase3-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Database, Lock, RefreshCw, Scale, XCircle } from "lucide-react";

interface Incident {
  id: number;
  threat_type: string;
  severity: string;
  status: string;
  target_asset: string;
  created_at: string;
}

interface AuditRecord {
  id: number;
  action: string;
  resource: string;
  resource_id?: string;
  created_at: string;
}

const frameworks = [
  {
    name: "GDPR",
    desc: "EU Data Protection",
    requirements: ["Data breach incidents must be tracked", "Audit trail required", "Access control enforced"],
  },
  {
    name: "HIPAA",
    desc: "Healthcare",
    requirements: ["Access logs maintained", "Incident response documented", "Security events monitored"],
  },
  {
    name: "PCI DSS",
    desc: "Payment Cards",
    requirements: ["Vulnerability management active", "Firewall rules documented", "Access logs retained"],
  },
  {
    name: "SOC 2",
    desc: "Service Orgs",
    requirements: ["Threat detection operational", "Incident management process", "System monitoring in place"],
  },
  {
    name: "ISO 27001",
    desc: "Info Security",
    requirements: ["Risk register maintained", "Security events logged", "ISMS controls documented"],
  },
  {
    name: "NIST CSF",
    desc: "Cybersecurity Framework",
    requirements: ["Identify: asset inventory tracked", "Protect: access control in place", "Detect: continuous monitoring active"],
  },
];

const Compliance = () => {
  const { user, token, isAuthenticated, isHydrated } = usePhase3Auth();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [auditLog, setAuditLog] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const canSeeAudit = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const [incRes] = await Promise.all([
        phase3Request<{ data: Incident[] }>("/incidents?limit=100"),
      ]);
      setIncidents(incRes.data.data ?? []);

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
    if (isHydrated) load();
  }, [isHydrated, canSeeAudit, token]);

  // Compliance calculations
  const total = incidents.length;
  const closed = incidents.filter((i) => i.status === "closed").length;
  const openCritical = incidents.filter((i) => i.status !== "closed" && i.severity === "critical").length;
  const openHigh = incidents.filter((i) => i.status !== "closed" && i.severity === "high").length;
  const remediationRate = total === 0 ? 100 : Math.round((closed / total) * 100);

  // Overall compliance score: penalise open critical/high incidents
  const complianceScore = Math.max(0, remediationRate - openCritical * 10 - openHigh * 3);
  const scoreColor = complianceScore >= 80 ? "text-green-400" : complianceScore >= 50 ? "text-yellow-400" : "text-red-400";
  const scoreLabel = complianceScore >= 80 ? "Compliant" : complianceScore >= 50 ? "Needs Attention" : "Non-Compliant";

  // Risk register: open high/critical incidents
  const risks = incidents.filter((i) => i.status !== "closed" && (i.severity === "critical" || i.severity === "high"));

  // Framework compliance check
  const hasIncidents = incidents.length > 0;
  const hasAudit = auditLog.length > 0 || !canSeeAudit; // treat as pass if viewer can't see
  const hasNoOpenCritical = openCritical === 0;

  const frameworkPasses = (f: (typeof frameworks)[0]) => {
    // Simple heuristic: pass if we have tracking data and no open critical
    if (f.name === "GDPR" || f.name === "HIPAA") return hasIncidents && hasAudit;
    if (f.name === "PCI DSS") return hasNoOpenCritical;
    return hasIncidents;
  };

  return (
    <div className="container py-10 pb-16 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Scale className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-mono cyber-text-glow">Compliance</h1>
          <p className="text-sm text-muted-foreground">
            Live compliance score, risk register, and audit trail derived from your security data.
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
              Log in to see the full risk register. Audit trail requires <strong>admin</strong> role.
            </p>
            <Button asChild size="sm"><Link to="/login?returnTo=/compliance">Login</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Score + stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 text-center">
            <div className={`text-3xl font-bold font-mono ${scoreColor}`}>{complianceScore}%</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">{scoreLabel}</div>
          </CardContent>
        </Card>
        {[
          { label: "Total Incidents", value: total, color: "text-foreground" },
          { label: "Remediated", value: closed, color: "text-green-400" },
          { label: "Open Risks", value: openCritical + openHigh, color: openCritical + openHigh > 0 ? "text-red-400" : "text-green-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="pt-4 pb-3 text-center">
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="frameworks">
        <TabsList>
          <TabsTrigger value="frameworks">Framework Status</TabsTrigger>
          <TabsTrigger value="risks">Risk Register ({risks.length})</TabsTrigger>
          {canSeeAudit && (
            <TabsTrigger value="audit">Audit Trail ({auditLog.length})</TabsTrigger>
          )}
        </TabsList>

        {/* Framework compliance */}
        <TabsContent value="frameworks" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {frameworks.map((f) => {
              const passing = frameworkPasses(f);
              return (
                <Card key={f.name} className={`border ${passing ? "border-green-400/20" : "border-orange-400/20"}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-mono">{f.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                      </div>
                      {passing
                        ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                        : <XCircle className="h-5 w-5 text-orange-400 shrink-0" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {f.requirements.map((req) => (
                        <li key={req} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-4">
            Score is calculated from incident remediation rate and open critical/high issues. Resolve all critical incidents to improve compliance status.
          </p>
        </TabsContent>

        {/* Risk Register */}
        <TabsContent value="risks" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-0">
              {risks.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-3" />
                  <p className="text-sm font-mono text-green-400">No open critical or high risks.</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">All high-priority incidents have been remediated.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono text-xs">Risk</TableHead>
                        <TableHead className="font-mono text-xs">Severity</TableHead>
                        <TableHead className="font-mono text-xs">Asset</TableHead>
                        <TableHead className="font-mono text-xs">Status</TableHead>
                        <TableHead className="font-mono text-xs">Logged</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {risks.map((inc) => (
                        <TableRow key={inc.id}>
                          <TableCell className="font-mono text-xs font-medium">{inc.threat_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-mono ${inc.severity === "critical" ? "text-red-400 border-red-400/40" : "text-orange-400 border-orange-400/40"}`}>
                              {inc.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{inc.target_asset}</TableCell>
                          <TableCell className="font-mono text-xs capitalize">{inc.status}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {new Date(inc.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground font-mono mt-2">
            Resolve these incidents from <Link to="/incident-response" className="text-primary underline">Incident Response</Link> to improve the compliance score.
          </p>
        </TabsContent>

        {/* Audit Trail (admin only) */}
        {canSeeAudit && (
          <TabsContent value="audit" className="mt-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-primary flex items-center gap-2">
                  <Database className="h-4 w-4" /> Full Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {auditLog.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground font-mono">
                    No audit records yet. Perform operations to generate audit entries.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-mono text-xs">#</TableHead>
                          <TableHead className="font-mono text-xs">Action</TableHead>
                          <TableHead className="font-mono text-xs">Resource</TableHead>
                          <TableHead className="font-mono text-xs">ID</TableHead>
                          <TableHead className="font-mono text-xs">Timestamp</TableHead>
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
    </div>
  );
};

export default Compliance;
