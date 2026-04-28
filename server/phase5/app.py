import json
import pickle
import re
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any
from urllib.parse import quote

from fastapi import FastAPI
from pydantic import BaseModel, Field
from rdflib import Graph, Namespace
from rdflib.namespace import RDF, RDFS

from train_model import METADATA_PATH, MODEL_PATH, ensure_model


BASE_DIR = Path(__file__).resolve().parent
ONTOLOGY_PATH = BASE_DIR / "ontology" / "cyberguard.ttl"
EX = Namespace("http://cyberguard.local/ontology#")

app = FastAPI(title="CyberGuard Phase V Intelligence Service", version="5.0.0")
graph = Graph()
model = None
metadata: dict[str, Any] = {}


class PredictRequest(BaseModel):
    threat_type: str
    severity: str
    source_ip: str
    target_asset: str
    ioc_type: str
    ioc_source: str = "internal"
    status: str = "open"
    description: str = ""
    related_iocs: int = 1
    open_ports: int = 0


class TripleQuery(BaseModel):
    subject: str | None = None
    predicate: str | None = None
    object: str | None = None
    limit: int = 25


class EnrichIncidentRequest(BaseModel):
    incident_id: str | int = Field(..., description="App incident identifier")
    threat_type: str
    severity: str
    source_ip: str
    target_asset: str
    ioc_type: str
    ioc_source: str = "internal"
    status: str = "open"
    description: str = ""
    related_iocs: int = 1
    open_ports: int = 0


class LlmRequest(BaseModel):
    incident_summary: str
    predicted_risk: str
    semantic_recommendations: list[str] = []
    model: str = "qwen2.5:7b-instruct"


def load_runtime():
    global model, metadata
    ensure_model()

    with MODEL_PATH.open("rb") as handle:
        model = pickle.load(handle)

    with METADATA_PATH.open("r", encoding="utf-8") as handle:
        metadata = json.load(handle)

    graph.parse(ONTOLOGY_PATH, format="ttl")


@app.on_event("startup")
def startup_event():
    load_runtime()


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", value.strip())
    return cleaned.strip("_") or "unknown"


def label_for_term(uri) -> str:
    label = graph.value(uri, RDFS.label)
    if label:
        return str(label)
    text = str(uri)
    return text.rsplit("#", 1)[-1]


def model_features(payload: PredictRequest | EnrichIncidentRequest) -> dict[str, Any]:
    description_length = len((payload.description or "").strip())
    return {
        "threat_type": payload.threat_type,
        "severity": payload.severity,
        "source_ip": payload.source_ip,
        "target_asset": payload.target_asset,
        "ioc_type": payload.ioc_type,
        "ioc_source": payload.ioc_source,
        "status": payload.status,
        "description_length": description_length,
        "related_iocs": payload.related_iocs,
        "open_ports": payload.open_ports,
    }


def map_indicator_name(threat_type: str) -> str:
    mapping = {
        "ransomware": "RansomwareIndicator",
        "phishing": "PhishingIndicator",
        "spear_phishing": "PhishingIndicator",
        "sql_injection": "SqlInjectionIndicator",
        "xss": "SqlInjectionIndicator",
        "ddos": "DdosIndicator",
        "malware": "RansomwareIndicator",
        "brute_force": "BruteForceIndicator",
        "credential_stuffing": "BruteForceIndicator",
        "data_exfiltration": "ExfiltrationIndicator",
        "botnet": "DdosIndicator",
    }
    return mapping.get(threat_type, "PhishingIndicator")


def map_asset_name(target_asset: str) -> str:
    text = target_asset.lower()
    if "finance" in text:
        return "FinanceDatabase"
    if "web" in text or "portal" in text or "api" in text:
        return "PublicWeb"
    if "identity" in text:
        return "IdentityServer"
    if "vpn" in text:
        return "AdminVPN"
    if "storage" in text or "bucket" in text:
        return "ObjectStorage"
    return "EndpointLaptop"


def graph_links(threat_type: str, target_asset: str, predicted_risk: str) -> dict[str, Any]:
    indicator = EX[map_indicator_name(threat_type)]
    asset = EX[map_asset_name(target_asset)]
    risk = EX[predicted_risk.capitalize()]

    techniques = [label_for_term(obj) for obj in graph.objects(indicator, EX.usesTechnique)]
    mitigations = [label_for_term(obj) for obj in graph.objects(indicator, EX.mitigatedBy)]
    recommendations = [
        label_for_term(subject)
        for subject in graph.subjects(EX.recommendedFor, risk)
    ]
    templates = [
        label_for_term(subject)
        for subject in graph.subjects(EX.targets, asset)
    ]

    triples = []
    for predicate, obj in graph.predicate_objects(indicator):
        triples.append(
            {
                "subject": label_for_term(indicator),
                "predicate": label_for_term(predicate),
                "object": label_for_term(obj),
            }
        )

    return {
        "indicator": label_for_term(indicator),
        "asset": label_for_term(asset),
        "techniques": techniques,
        "mitigations": mitigations,
        "recommendations": recommendations,
        "related_templates": templates,
        "triples": triples[:10],
    }


def predict_payload(payload: PredictRequest | EnrichIncidentRequest) -> dict[str, Any]:
    features = model_features(payload)
    probabilities = model.predict_proba([features])[0]
    classes = list(model.named_steps["classifier"].classes_)
    predicted_risk = model.predict([features])[0]

    semantic = graph_links(payload.threat_type, payload.target_asset, predicted_risk)
    probability_map = {
        label: round(float(score), 4) for label, score in zip(classes, probabilities)
    }

    return {
        "predicted_risk": predicted_risk,
        "confidence": round(max(probability_map.values()), 4),
        "probabilities": probability_map,
        "features": features,
        "semantic_context": semantic,
    }


def dynamic_triples(incident_id: str | int, result: dict[str, Any]) -> list[dict[str, str]]:
    incident_node = f"Incident_{slugify(str(incident_id))}"
    prediction_node = f"Prediction_{slugify(str(incident_id))}"
    triples = [
        {
            "subject": incident_node,
            "predicate": "hasRiskLevel",
            "object": result["predicted_risk"],
        },
    ]
    for mitigation in result["semantic_context"]["mitigations"]:
        triples.append(
            {
                "subject": prediction_node,
                "predicate": "suggestsResponse",
                "object": mitigation,
            }
        )
    return triples


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "phase5-intelligence",
        "ontology_path": str(ONTOLOGY_PATH),
        "model_loaded": model is not None,
        "triples": len(graph),
    }


@app.get("/model/info")
def model_info():
    return metadata


@app.post("/predict-risk")
def predict_risk(payload: PredictRequest):
    return predict_payload(payload)


@app.get("/ontology/triples")
def ontology_triples(subject: str | None = None, predicate: str | None = None, object: str | None = None, limit: int = 25):
    query = TripleQuery(subject=subject, predicate=predicate, object=object, limit=limit)
    triples = []
    for subj, pred, obj in graph:
        triple = {
            "subject": label_for_term(subj),
            "predicate": label_for_term(pred),
            "object": label_for_term(obj),
        }
        if query.subject and query.subject.lower() not in triple["subject"].lower():
            continue
        if query.predicate and query.predicate.lower() not in triple["predicate"].lower():
            continue
        if query.object and query.object.lower() not in triple["object"].lower():
            continue
        triples.append(triple)
        if len(triples) >= query.limit:
            break

    return {"count": len(triples), "triples": triples}


@app.get("/ontology/query")
def ontology_query(threat_type: str | None = None, asset: str | None = None, risk_level: str | None = None):
    resolved_risk = risk_level or "high"
    resolved_threat = threat_type or "phishing"
    resolved_asset = asset or "public-web"
    return graph_links(resolved_threat, resolved_asset, resolved_risk)


@app.post("/enrich-incident")
def enrich_incident(payload: EnrichIncidentRequest):
    result = predict_payload(payload)
    result["incident_id"] = payload.incident_id
    result["dynamic_triples"] = dynamic_triples(payload.incident_id, result)
    return result


@app.post("/llm/recommendation")
def llm_recommendation(payload: LlmRequest):
    prompt = (
        "You are a cybersecurity analyst. Produce a concise response plan.\n"
        f"Incident: {payload.incident_summary}\n"
        f"Predicted risk: {payload.predicted_risk}\n"
        f"Semantic recommendations: {', '.join(payload.semantic_recommendations) or 'none'}\n"
        "Return 3 bullet points and one short final recommendation sentence."
    )
    body = json.dumps(
        {
            "model": payload.model,
            "prompt": prompt,
            "stream": False,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
        return {"provider": "ollama", "model": payload.model, "response": data.get("response", "").strip()}
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        fallback = (
            f"- Prioritize containment for the {payload.predicted_risk} incident.\n"
            f"- Review linked semantic controls: {', '.join(payload.semantic_recommendations) or 'manual review required'}.\n"
            "- Validate IOC spread and record follow-up actions in the incident log.\n"
            "Recommendation: start with the mitigation that protects the most exposed asset."
        )
        return {
            "provider": "fallback",
            "model": payload.model,
            "response": fallback,
            "note": "Ollama is not reachable on http://localhost:11434. Start Ollama to enable local LLM output.",
        }


@app.get("/")
def root():
    return {
        "name": "CyberGuard Phase V Intelligence Service",
        "version": "5.0.0",
        "endpoints": {
            "health": "/health",
            "predict_risk": "/predict-risk",
            "ontology_triples": f"/ontology/triples?subject={quote('Indicator')}",
            "ontology_query": "/ontology/query?threat_type=phishing&asset=public-web&risk_level=high",
            "enrich_incident": "/enrich-incident",
            "llm_recommendation": "/llm/recommendation",
        },
    }
