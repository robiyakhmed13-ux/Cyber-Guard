# CyberGuard

A full-stack cybersecurity monitoring and threat detection platform. Built with React on the frontend and two Express.js backends — one for enterprise service integration (Phase II) and one for data management (Phase III).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router |
| Phase III Backend | Node.js, Express.js, SQLite (sql.js), NeDB, JWT, bcrypt, Winston |
| Phase II Backend | Node.js, Express.js, custom orchestration/messaging engine |
| State Management | React Context API, TanStack Query |
| Charts | Recharts |

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

---

## Installation & Running

The project has three separate processes. Open three terminal windows.

### 1. Frontend
```bash
npm install
npm run dev
```
Runs at `http://localhost:5173`

### 2. Phase III Backend — Data Management API
```bash
cd server/phase3
npm install
npm start
```
Runs at `http://localhost:3002`

### 3. Phase II Backend — Enterprise Integration
```bash
cd server
npm install
npm start
```
Runs at `http://localhost:3001`

### 4. Phase V Backend — AI/ML + Ontology Service
```bash
cd server/phase5
python -m pip install -r requirements.txt
python train_model.py
uvicorn app:app --host 0.0.0.0 --port 8000
```
Runs at `http://localhost:8000`

> The app works without Phase II. Phase III must be running for live data features, and Phase V must be running for the new intelligence endpoints.

---

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin123!` |
| Analyst | `analyst1` | `Analyst123!` |
| Viewer | `viewer1` | `Analyst123!` |

---

## Project Structure

```
cyber-hug-guardian-main/
│
├── src/                              # React frontend
│   ├── App.tsx                       # Routes
│   ├── context/
│   │   └── Phase3AuthContext.tsx     # JWT auth state
│   ├── lib/
│   │   └── phase3-api.ts             # API client
│   ├── components/
│   │   ├── Layout.tsx                # Nav + footer
│   │   └── ProtectedRoute.tsx        # Auth guard
│   └── pages/
│       ├── Login.tsx
│       ├── Index.tsx
│       ├── Dashboard.tsx
│       ├── DataManagementDashboard.tsx
│       ├── IncidentResponse.tsx
│       ├── ThreatDetection.tsx
│       ├── ThreatIntelligence.tsx
│       ├── SIEM.tsx
│       ├── NetworkMonitoring.tsx
│       ├── VulnerabilityAssessment.tsx
│       ├── Firewall.tsx
│       ├── EndpointSecurity.tsx
│       ├── CloudSecurity.tsx
│       ├── Compliance.tsx
│       └── IntegrationDashboard.tsx
│
├── server/                           # Phase II backend (port 3001)
│   ├── index.js
│   ├── orchestration/
│   ├── messaging/
│   ├── correlation/
│   ├── caching/
│   └── faulthandling/
│
└── server/phase3/                    # Phase III backend (port 3002)
    ├── index.js
    ├── routes/
    │   └── api.js
    ├── middleware/
    │   └── security.js               # JWT validation, rate limiting, sanitization
    ├── controllers/
    │   └── index.js
    ├── services/
    │   ├── authService.js
    │   ├── incidentService.js
    │   ├── threatIntelService.js
    │   ├── asyncProcessor.js         # Producer/consumer job queue
    │   ├── cacheService.js           # In-memory TTL cache
    │   └── dataTransformer.js        # JSON/XML/STIX conversion
    ├── models/
    │   ├── sqliteModels.js           # Relational CRUD (incidents, users, audit)
    │   └── nedbModels.js             # Document CRUD (threat intel, events, jobs)
    ├── config/
    │   ├── database.js
    │   └── seed.js                   # Seeds default users on first run
    ├── utils/
    │   └── logger.js                 # Winston logger
    └── data/                         # Persistent DB files (auto-created)
        ├── cyberguard.db             # SQLite
        ├── threat_intel.db           # NeDB
        ├── system_events.db          # NeDB
        └── job_queue.db              # NeDB
```

---

## Features

### Authentication & Authorization
- JWT-based authentication (24h token expiry)
- Passwords hashed with bcrypt
- Three roles: `admin`, `analyst`, `viewer`
- Role-based UI — forms and action buttons hidden/shown per role
- Protected routes — unauthenticated users redirected to login

### Incident Management
- Full CRUD for security incidents
- Fields: threat type, severity, source IP, target asset, description
- Status workflow: `open` → `investigating` → `closed`
- Stored in SQLite

### Threat Intelligence
- Manage Indicators of Compromise (IOCs)
- Types: domain, IP, URL, MD5/SHA256 hash, email, filename, registry key
- Stored in NeDB (document store)

### Phase V Intelligence Layer
- Trained `scikit-learn` risk classifier using a cybersecurity incident dataset
- Semantic knowledge model implemented in RDF/Turtle with `rdflib`
- Context-aware recommendations produced by combining prediction output with ontology relationships
- Optional local LLM recommendation layer through Ollama
- New Intelligence Hub UI for predictions, triples, and semantic recommendations

### Async Job Processing
- Producer/consumer queue backed by NeDB
- Job types: `threat_analysis`, `scan_processing`, `report_generation`, `notification`, `data_cleanup`
- Dead-letter queue for failed jobs
- Processor runs on a 5-second interval

### Caching
- In-memory Map-based cache with TTL (default 60s)
- Tag-based cache invalidation
- Hit/miss/eviction statistics
- Performance benchmark endpoint

### Security Middleware
- Helmet HTTP headers
- Rate limiting: 200 req/15min (API), 20 req/15min (auth)
- Input validation via `express-validator`
- XSS/SQL injection sanitization

### Data Transformation
- XML → JSON conversion
- STIX format export for threat intel
- JSON restructuring

### Logging & Monitoring
- Winston structured logging (file + console)
- Request tracking (method, path, status, duration)
- Live metrics endpoint (uptime, request counts, response times, DB query counts)
- Audit trail for all write operations

---

## API Reference — Phase III (port 3002)

### Auth
```
POST   /api/v3/auth/login          Body: { username, password }
POST   /api/v3/auth/register       Body: { username, password, role }
```

### Incidents
```
GET    /api/v3/incidents            Query: limit, offset, status, severity
POST   /api/v3/incidents            Body: { threat_type, severity, source_ip, target_asset, description }
PUT    /api/v3/incidents/:id        Body: { status }
DELETE /api/v3/incidents/:id        Admin only
```

### Threat Intelligence
```
GET    /api/v3/threat-intel         Query: limit, offset, ioc_type, severity
POST   /api/v3/threat-intel         Body: { ioc_type, ioc_value, severity, source, description }
DELETE /api/v3/threat-intel/:id
```

### Async Processing
```
POST   /api/v3/async/produce        Body: { type, priority, payload }
POST   /api/v3/async/consume        Body: { batchSize }
GET    /api/v3/async/stats
```

### Cache
```
GET    /api/v3/cache/stats
GET    /api/v3/cache/performance
DELETE /api/v3/cache/clear          Admin only
```

### System
```
GET    /api/v3/health
GET    /api/v3/metrics
GET    /api/v3/system-events        Query: limit
GET    /api/v3/audit-log            Admin only, Query: limit
```

### Phase V Intelligence
```
GET    /api/v3/ai/health
GET    /api/v3/ai/model-info
POST   /api/v3/ai/predict-risk          Body: { threat_type, severity, source_ip, target_asset, ioc_type, ... }
GET    /api/v3/ai/incidents/:id/enrich
GET    /api/v3/ai/ontology/triples      Query: subject, predicate, object, limit
GET    /api/v3/ai/ontology/query        Query: threat_type, asset, risk_level
POST   /api/v3/ai/llm/recommendation    Body: { incident_summary, predicted_risk, semantic_recommendations, model? }
```

### Transform
```
POST   /api/v3/transform/xml-to-json    Body: { xml }
```

---

## Pages & Routes

| Route | Description | Auth required |
|-------|-------------|:---:|
| `/` | Home — redirects to workspace if logged in | No |
| `/login` | Login page | No |
| `/dashboard` | Visual stats dashboard | No |
| `/data-management` | Phase III workspace (main operational area) | **Yes** |
| `/integration` | Phase II integration demo | No |
| `/intelligence-hub` | Phase V AI + ontology dashboard | No |
| `/incident-response` | Incident CRUD | No* |
| `/threat-detection` | Live threat feed | No* |
| `/threat-intelligence` | IOC management | No* |
| `/siem` | System events + audit log | No* |
| `/network-monitoring` | Health & metrics dashboard | No* |
| `/vulnerability-assessment` | Vulnerability tracker | No* |
| `/firewall` | Firewall rules + blocked traffic | No* |
| `/endpoint-security` | EDR alerts + endpoint inventory | No* |
| `/cloud-security` | Cloud misconfiguration tracker | No* |
| `/compliance` | Compliance score + risk register | No* |

*Pages are publicly readable. Write actions (create/update/delete) require login.

---

## Environment

No `.env` file is required. Default configuration:

| Setting | Value |
|---------|-------|
| Frontend port | `5173` |
| Phase III API port | `3002` |
| Phase II API port | `3001` |
| Phase V API port | `8000` |
| JWT secret | `cyberguard-phase3-secret-key` (development only) |
| JWT expiry | `24h` |
| Cache TTL | `60s` |
| Rate limit | `200 req / 15 min` |
| DB location | `server/phase3/data/` |
| Phase V ontology | `server/phase5/ontology/cyberguard.ttl` |

---

## Scripts

### Frontend
```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint
```

### Phase III Backend
```bash
npm start          # Start server (auto-seeds DB on first run)
```

### Phase II Backend
```bash
npm start          # Start server
```

### Phase V Backend
```bash
python train_model.py                                       # Train and save model artifacts
uvicorn app:app --host 0.0.0.0 --port 8000                 # Start intelligence API
```

---

## Phase V Explanation

### AI / ML Integration
- Dataset: `server/phase5/data/training_dataset.csv`
- Model: Random forest classifier trained on cybersecurity incident features
- Preprocessing: `DictVectorizer` encodes categorical fields and keeps numeric features such as `related_iocs`, `open_ports`, and `description_length`
- Training script: `server/phase5/train_model.py`
- Saved artifacts: `server/phase5/artifacts/`

### Ontology Layer
- Ontology file: `server/phase5/ontology/cyberguard.ttl`
- Core classes: `Incident`, `ThreatIndicator`, `Asset`, `Mitigation`, `AttackTechnique`, `Recommendation`, `Prediction`
- Example triples:
  - `(RansomwareIncidentTemplate, indicates, RansomwareIndicator)`
  - `(RansomwareIndicator, mitigatedBy, IsolateEndpoint)`
  - `(SqlInjectionIndicator, usesTechnique, T1190)`
  - `(Prediction_INC_123, suggestsResponse, ResetCredentials)`

### AI + Ontology Integration
- Phase III Node backend proxies requests to the Python sidecar through `server/phase3/services/phase5Service.js`
- Prediction endpoints return both ML output and ontology-derived mitigations/recommendations
- Async `threat_analysis` jobs now use the Phase V enrichment path when the service is available
- The Intelligence Hub page displays predictions, semantic triples, and optional Ollama-generated response guidance

### Free LLM Recommendation
- Best free local option: Ollama with `qwen2.5:7b-instruct`
- Install Ollama, then pull the model:
```bash
ollama pull qwen2.5:7b-instruct
```
- If Ollama is not running, the app falls back to a deterministic recommendation instead of failing
