export const PHASE3_API_BASE = "http://localhost:3002/api/v3";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    message?: string;
    code?: number;
    details?: unknown;
  };
}

interface Phase3RequestOptions extends RequestInit {
  token?: string | null;
}

export async function phase3Request<T>(
  path: string,
  options: Phase3RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(options.headers || {});
  const isJsonBody = options.body && !headers.has("Content-Type");

  if (isJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${PHASE3_API_BASE}${path}`, {
    ...options,
    headers,
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Request failed with status ${response.status}`);
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  return payload;
}

export interface IncidentRecord {
  id: number;
  incident_id: string;
  threat_type: string;
  severity: string;
  source_ip: string;
  target_asset: string;
  status: string;
  description?: string | null;
  created_at?: string;
}

export interface RiskPredictionResult {
  predicted_risk: string;
  confidence: number;
  probabilities: Record<string, number>;
  features: Record<string, unknown>;
  semantic_context: {
    indicator: string;
    asset: string;
    techniques: string[];
    mitigations: string[];
    recommendations: string[];
    related_templates: string[];
    triples: Array<{ subject: string; predicate: string; object: string }>;
  };
  dynamic_triples?: Array<{ subject: string; predicate: string; object: string }>;
  incident_id?: string | number;
}

export interface OntologyTriplesResult {
  count: number;
  triples: Array<{ subject: string; predicate: string; object: string }>;
}

export interface ModelInfoResult {
  samples: number;
  train_samples: number;
  test_samples: number;
  classes: string[];
  accuracy: number;
  feature_fields: string[];
  classification_report: Record<string, unknown>;
}

export interface LlmRecommendationResult {
  provider: string;
  model: string;
  response: string;
  note?: string;
}

export const phase3Api = {
  listIncidents() {
    return phase3Request<{ data: IncidentRecord[]; total: number }>("/incidents?limit=50");
  },
  getModelInfo() {
    return phase3Request<ModelInfoResult>("/ai/model-info");
  },
  getAiHealth() {
    return phase3Request<{ status: string; model_loaded: boolean; triples: number }>("/ai/health");
  },
  enrichIncident(id: number | string) {
    return phase3Request<RiskPredictionResult>(`/ai/incidents/${id}/enrich`);
  },
  predictRisk(body: Record<string, unknown>) {
    return phase3Request<RiskPredictionResult>("/ai/predict-risk", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  queryOntology(params: { threat_type?: string; asset?: string; risk_level?: string }) {
    const search = new URLSearchParams();
    if (params.threat_type) search.set("threat_type", params.threat_type);
    if (params.asset) search.set("asset", params.asset);
    if (params.risk_level) search.set("risk_level", params.risk_level);
    return phase3Request<RiskPredictionResult["semantic_context"]>(`/ai/ontology/query?${search.toString()}`);
  },
  getOntologyTriples(params: { subject?: string; predicate?: string; object?: string; limit?: number }) {
    const search = new URLSearchParams();
    if (params.subject) search.set("subject", params.subject);
    if (params.predicate) search.set("predicate", params.predicate);
    if (params.object) search.set("object", params.object);
    if (params.limit) search.set("limit", String(params.limit));
    return phase3Request<OntologyTriplesResult>(`/ai/ontology/triples?${search.toString()}`);
  },
  getLlmRecommendation(body: {
    incident_summary: string;
    predicted_risk: string;
    semantic_recommendations: string[];
    model?: string;
  }) {
    return phase3Request<LlmRecommendationResult>("/ai/llm/recommendation", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
