import { useEffect, useMemo, useState } from "react";
import { Brain, DatabaseZap, Network, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  type IncidentRecord,
  type LlmRecommendationResult,
  type ModelInfoResult,
  type OntologyTriplesResult,
  type RiskPredictionResult,
  phase3Api,
} from "@/lib/phase3-api";

const defaultPayload = {
  threat_type: "phishing",
  severity: "medium",
  source_ip: "192.168.1.10",
  target_asset: "public-web",
  ioc_type: "email",
  ioc_source: "internal",
  status: "open",
  description: "Suspicious phishing email targeting finance user.",
  related_iocs: 2,
  open_ports: 1,
};

const colorByRisk = (value: string) => {
  if (value === "critical") return "text-red-400 border-red-400/40";
  if (value === "high") return "text-orange-400 border-orange-400/40";
  if (value === "medium") return "text-yellow-400 border-yellow-400/40";
  return "text-primary border-primary/40";
};

const IntelligenceHub = () => {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [payload, setPayload] = useState(defaultPayload);
  const [prediction, setPrediction] = useState<RiskPredictionResult | null>(null);
  const [triples, setTriples] = useState<OntologyTriplesResult | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResult | null>(null);
  const [llmResult, setLlmResult] = useState<LlmRecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningLlm, setRunningLlm] = useState(false);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => String(incident.id) === selectedId),
    [incidents, selectedId],
  );

  const syncPayload = (incident: IncidentRecord) => {
    setPayload((current) => ({
      ...current,
      threat_type: incident.threat_type,
      severity: incident.severity,
      source_ip: incident.source_ip,
      target_asset: incident.target_asset,
      status: incident.status,
      description: incident.description || current.description,
    }));
  };

  const load = async () => {
    setLoading(true);
    try {
      const [incidentsRes, triplesRes, modelInfoRes] = await Promise.all([
        phase3Api.listIncidents(),
        phase3Api.getOntologyTriples({ limit: 12 }),
        phase3Api.getModelInfo(),
      ]);

      setIncidents(incidentsRes.data.data ?? []);
      setTriples(triplesRes.data);
      setModelInfo(modelInfoRes.data);

      const firstIncident = incidentsRes.data.data?.[0];
      if (firstIncident) {
        setSelectedId(String(firstIncident.id));
        syncPayload(firstIncident);
      }
    } catch (error) {
      toast({
        title: "Phase V service unavailable",
        description: error instanceof Error ? error.message : "Start the Phase III and Phase V servers to use this page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runSelectedIncident = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const result = await phase3Api.enrichIncident(selectedId);
      setPrediction(result.data);
      setPayload((current) => ({
        ...current,
        threat_type: String(result.data.features.threat_type || current.threat_type),
        severity: String(result.data.features.severity || current.severity),
        ioc_type: String(result.data.features.ioc_type || current.ioc_type),
      }));
      const ontology = await phase3Api.queryOntology({
        threat_type: String(result.data.features.threat_type || payload.threat_type),
        asset: String(result.data.features.target_asset || payload.target_asset),
        risk_level: result.data.predicted_risk,
      });
      setTriples({
        count: result.data.semantic_context.triples.length + (result.data.dynamic_triples?.length || 0),
        triples: [...result.data.semantic_context.triples, ...(result.data.dynamic_triples || [])],
      });
      setPrediction((current) =>
        current
          ? { ...current, semantic_context: ontology.data }
          : current,
      );
      setLlmResult(null);
    } catch (error) {
      toast({
        title: "Prediction failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runManualPrediction = async () => {
    setLoading(true);
    try {
      const result = await phase3Api.predictRisk(payload);
      setPrediction(result.data);
      setTriples({
        count: result.data.semantic_context.triples.length,
        triples: result.data.semantic_context.triples,
      });
      setLlmResult(null);
    } catch (error) {
      toast({
        title: "Prediction failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runLlm = async () => {
    if (!prediction) return;
    setRunningLlm(true);
    try {
      const result = await phase3Api.getLlmRecommendation({
        incident_summary: `${payload.threat_type} targeting ${payload.target_asset} from ${payload.source_ip}`,
        predicted_risk: prediction.predicted_risk,
        semantic_recommendations: prediction.semantic_context.mitigations,
      });
      setLlmResult(result.data);
    } catch (error) {
      toast({
        title: "LLM request failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setRunningLlm(false);
    }
  };

  return (
    <div className="container py-10 pb-16 space-y-8 max-w-6xl">
      <div className="flex items-center gap-3">
        <Brain className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-mono cyber-text-glow">Phase V Intelligence Hub</h1>
          <p className="text-sm text-muted-foreground">
            ML risk classification, ontology-powered reasoning, and optional Ollama recommendations.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="ml-auto gap-2" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold font-mono text-primary">{modelInfo?.samples ?? "--"}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Training Samples</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold font-mono text-foreground">
              {modelInfo ? `${Math.round(modelInfo.accuracy * 100)}%` : "--"}
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Model Accuracy</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold font-mono text-orange-400">{triples?.count ?? "--"}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Visible Triples</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold font-mono text-green-400">{incidents.length}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Incidents Ready</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predict" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predict">Predict & Enrich</TabsTrigger>
          <TabsTrigger value="ontology">Ontology Layer</TabsTrigger>
          <TabsTrigger value="llm">LLM Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="predict" className="space-y-6">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-primary">
                  <DatabaseZap className="h-4 w-4" />
                  Incident-Driven Prediction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Existing Incident</Label>
                  <Select
                    value={selectedId}
                    onValueChange={(value) => {
                      setSelectedId(value);
                      const incident = incidents.find((item) => String(item.id) === value);
                      if (incident) syncPayload(incident);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose incident" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidents.map((incident) => (
                        <SelectItem key={incident.id} value={String(incident.id)}>
                          {incident.incident_id} | {incident.threat_type} | {incident.target_asset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={runSelectedIncident} disabled={!selectedId || loading} className="w-full">
                  {loading ? "Analyzing..." : "Analyze Selected Incident"}
                </Button>

                <div className="grid md:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2">
                    <Label>Threat Type</Label>
                    <Input value={payload.threat_type} onChange={(e) => setPayload({ ...payload, threat_type: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select value={payload.severity} onValueChange={(value) => setPayload({ ...payload, severity: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["low", "medium", "high", "critical"].map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source IP</Label>
                    <Input value={payload.source_ip} onChange={(e) => setPayload({ ...payload, source_ip: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Asset</Label>
                    <Input value={payload.target_asset} onChange={(e) => setPayload({ ...payload, target_asset: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>IOC Type</Label>
                    <Select value={payload.ioc_type} onValueChange={(value) => setPayload({ ...payload, ioc_type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["domain", "ip", "url", "hash_md5", "hash_sha256", "email", "filename", "registry_key"].map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>IOC Source</Label>
                    <Select value={payload.ioc_source} onValueChange={(value) => setPayload({ ...payload, ioc_source: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["internal", "osint", "partner_feed"].map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={payload.description}
                    onChange={(e) => setPayload({ ...payload, description: e.target.value })}
                  />
                </div>
                <Button variant="outline" onClick={runManualPrediction} disabled={loading} className="w-full">
                  Run Manual Prediction
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Network className="h-4 w-4 text-primary" />
                  AI Output
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!prediction ? (
                  <p className="text-sm text-muted-foreground">Run a prediction to see the ML and ontology outputs.</p>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={colorByRisk(prediction.predicted_risk)}>
                        {prediction.predicted_risk}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        Confidence: {(prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-mono text-muted-foreground">Probability Distribution</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(prediction.probabilities).map(([label, score]) => (
                          <div key={label} className="rounded border border-border/60 px-3 py-2">
                            <div className="text-xs font-mono">{label}</div>
                            <div className="text-sm text-primary font-mono">{(score * 100).toFixed(1)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-mono text-muted-foreground">Semantic Recommendations</p>
                      <div className="flex flex-wrap gap-2">
                        {prediction.semantic_context.mitigations.map((item) => (
                          <Badge key={item} variant="secondary">{item}</Badge>
                        ))}
                        {prediction.semantic_context.recommendations.map((item) => (
                          <Badge key={item} variant="outline">{item}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-mono text-muted-foreground">Mapped Techniques</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {prediction.semantic_context.techniques.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ontology" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Semantic Triples</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!triples || triples.triples.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No triples loaded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Predicate</TableHead>
                        <TableHead>Object</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {triples.triples.map((triple, index) => (
                        <TableRow key={`${triple.subject}-${triple.predicate}-${index}`}>
                          <TableCell className="font-mono text-xs">{triple.subject}</TableCell>
                          <TableCell className="font-mono text-xs text-primary">{triple.predicate}</TableCell>
                          <TableCell className="font-mono text-xs">{triple.object}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llm" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                Local Ollama Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This optional layer uses the ML prediction and ontology recommendations to generate a concise response plan.
              </p>
              <Button onClick={runLlm} disabled={!prediction || runningLlm}>
                {runningLlm ? "Requesting..." : "Generate Recommendation"}
              </Button>
              <div className="rounded border border-border/60 bg-muted/20 p-4 min-h-32">
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {llmResult?.response || "Run a prediction first, then request a local LLM recommendation."}
                </pre>
              </div>
              {llmResult?.note && (
                <p className="text-xs text-muted-foreground">{llmResult.note}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligenceHub;
