# CyberGuard Phase V Documentation Notes

Use this as the write-up base for the final PDF and presentation.

## 1. System Overview
- Phase I: React cybersecurity portal and dashboards
- Phase II: enterprise integration server with orchestration, messaging, caching, and fault handling
- Phase III: data management layer with SQLite, NeDB, REST APIs, async jobs, logging, and security
- Phase V: intelligence layer with ML risk prediction, semantic ontology, and optional local LLM recommendations

## 2. AI / ML Model Design
- Goal: predict incident risk level (`low`, `medium`, `high`, `critical`)
- Dataset file: `server/phase5/data/training_dataset.csv`
- Features:
  - `threat_type`
  - `severity`
  - `source_ip`
  - `target_asset`
  - `ioc_type`
  - `ioc_source`
  - `status`
  - `description_length`
  - `related_iocs`
  - `open_ports`
- Preprocessing:
  - categorical fields encoded using `DictVectorizer`
  - numeric fields preserved directly
  - train/test split with stratification
- Algorithm: `RandomForestClassifier`
- Result source: `server/phase5/artifacts/model_metadata.json`

## 3. Ontology Design
- Ontology file: `server/phase5/ontology/cyberguard.ttl`
- Core classes:
  - `Incident`
  - `ThreatIndicator`
  - `Asset`
  - `Mitigation`
  - `AttackTechnique`
  - `Recommendation`
  - `Prediction`
- Core predicates:
  - `indicates`
  - `targets`
  - `mitigatedBy`
  - `usesTechnique`
  - `suggestsResponse`
  - `hasRiskLevel`

## 4. Sample RDF Triples
- `(RansomwareIncidentTemplate, indicates, RansomwareIndicator)`
- `(RansomwareIndicator, usesTechnique, T1486)`
- `(RansomwareIndicator, mitigatedBy, IsolateEndpoint)`
- `(Prediction_INC_101, suggestsResponse, ResetCredentials)`

## 5. Integration Flow
1. User opens `Intelligence Hub` in the frontend.
2. React calls Phase III endpoint `/api/v3/ai/incidents/:id/enrich`.
3. Phase III forwards the request to the Phase V Python service.
4. Phase V predicts risk using the trained ML model.
5. Phase V queries ontology relationships and returns semantic recommendations.
6. React displays prediction, triples, and optional Ollama-generated advice.

## 6. Suggested Screenshots
- Intelligence Hub page overview
- Prediction result with confidence and recommendations
- Triple table from ontology tab
- Terminal showing Phase V service running
- Ollama recommendation output

## 7. Challenges And Improvements
- Small academic dataset can limit generalization
- Semantic layer currently uses curated ontology templates rather than a full external knowledge graph
- Future work:
  - larger datasets
  - persistence of generated triples
  - graph database integration
  - richer ATT&CK mappings
