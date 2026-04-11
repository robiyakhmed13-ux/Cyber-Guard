# CyberGuard - Phase III: Data Management & Integration Layer

## Overview

Phase III extends the CyberGuard cybersecurity platform (Phase I web app + Phase II service-oriented system) with a modern data management and integration layer. This phase implements efficient, secure, and scalable data handling using dual-database architecture, RESTful APIs, async processing, caching, security hardening, data transformation, and comprehensive logging.

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    CyberGuard Frontend (React)                    │
│             Vite + TypeScript + Tailwind + shadcn/ui              │
└────────────────────────────┬──────────────────────────────────────┘
                             │ REST API (JSON)
┌────────────────────────────▼──────────────────────────────────────┐
│              Phase III - Data Management Server                   │
│                   Express.js (Port 3002)                          │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐ │
│  │   Controllers    │  │    Middleware    │  │     Routes       │ │
│  │  (Auth, CRUD,   │  │  (JWT, Helmet,  │  │  (/api/v3/...)   │ │
│  │   Transform)    │  │   Validation)   │  │                  │ │
│  └────────┬────────┘  └─────────────────┘  └──────────────────┘ │
│           │                                                       │
│  ┌────────▼────────────────────────────────────────────────────┐ │
│  │                      Service Layer                          │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │ │
│  │  │  Cache   │  │    Async     │  │  Data Transformer     │ │ │
│  │  │ Service  │  │  Processor   │  │  (JSON/XML/STIX)      │ │ │
│  │  └──────────┘  └──────────────┘  └───────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│           │                                                       │
│  ┌────────▼────────────────────────────────────────────────────┐ │
│  │                    Data Access Layer                         │ │
│  │  ┌───────────────────┐     ┌────────────────────────────┐  │ │
│  │  │  SQLite (sql.js)  │     │   NeDB (Document Store)    │  │ │
│  │  │  ─ Users          │     │   ─ Threat Intelligence    │  │ │
│  │  │  ─ Incidents      │     │   ─ System Events          │  │ │
│  │  │  ─ Signatures     │     │   ─ Scan Results           │  │ │
│  │  │  ─ Audit Log      │     │   ─ Job Queue              │  │ │
│  │  └───────────────────┘     └────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │          Winston Logger + Performance Metrics               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Runtime | Node.js v18+ | Non-blocking I/O, large ecosystem |
| Framework | Express.js | Lightweight, flexible REST framework |
| Relational DB | SQLite (sql.js) | Zero-config, ACID-compliant, portable |
| NoSQL DB | NeDB | MongoDB-like API, embedded, file-based |
| Authentication | JWT (jsonwebtoken) | Stateless, scalable auth |
| Security | Helmet + bcryptjs | HTTP headers + password hashing |
| Validation | express-validator | Declarative input validation |
| Logging | Winston | Structured, multi-transport logging |
| Data Transform | xml2js | JSON↔XML bidirectional conversion |

## Prerequisites

- Node.js v18+
- npm v9+

## Installation & Deployment

```bash
# 1. Frontend (from project root)
npm install
npm run dev
# Runs on http://localhost:5173

# 2. Phase II Server
cd server
npm install
npm start
# Runs on http://localhost:3001

# 3. Phase III Server
cd server/phase3
npm install
npm start
# Runs on http://localhost:3002
# API Base: http://localhost:3002/api/v3
```

## Default Credentials

| User | Password | Role |
|------|----------|------|
| admin | Admin123! | admin |
| analyst1 | Analyst123! | analyst |
| viewer1 | Analyst123! | viewer |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v3/auth/register | Register new user |
| POST | /api/v3/auth/login | Login and get JWT token |

### Incidents (SQLite CRUD)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v3/incidents | List all incidents (filterable) |
| GET | /api/v3/incidents/:id | Get single incident |
| POST | /api/v3/incidents | Create incident (auth required) |
| PUT | /api/v3/incidents/:id | Update incident (auth required) |
| DELETE | /api/v3/incidents/:id | Delete incident (admin only) |
| GET | /api/v3/incidents/statistics | Aggregated statistics |
| GET | /api/v3/incidents/:id/xml | Get incident as XML |
| GET | /api/v3/incidents/:id/external | Get in external format |
| GET | /api/v3/incidents/:id/stix | Get in STIX 2.1 format |

### Threat Intelligence (NeDB CRUD)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v3/threat-intel | List all IOCs |
| GET | /api/v3/threat-intel/:id | Get single IOC |
| POST | /api/v3/threat-intel | Create IOC (auth required) |
| PUT | /api/v3/threat-intel/:id | Update IOC (auth required) |
| DELETE | /api/v3/threat-intel/:id | Delete IOC (auth required) |
| GET | /api/v3/threat-intel/search?q=... | Search IOCs |
| GET | /api/v3/threat-intel/:id/xml | Get IOC as XML |

### Async Processing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v3/async/produce | Enqueue background job |
| POST | /api/v3/async/consume | Process pending jobs |
| GET | /api/v3/async/stats | Queue statistics |
| POST | /api/v3/async/simulate-offline | Demo offline persistence |

### Cache & System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v3/cache/stats | Cache hit/miss statistics |
| GET | /api/v3/cache/performance | Before/after benchmark |
| DELETE | /api/v3/cache/clear | Clear all cache (admin) |
| GET | /api/v3/health | System health check |
| GET | /api/v3/metrics | Performance metrics |
| GET | /api/v3/audit-log | Audit trail (admin) |
| GET | /api/v3/system-events | System event log |
| POST | /api/v3/transform/xml-to-json | Convert XML to JSON |

## Quick Test

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3002/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | jq -r '.data.token')

# Create an incident
curl -X POST http://localhost:3002/api/v3/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"threat_type":"ransomware","severity":"critical","source_ip":"192.168.1.100","target_asset":"web-server-01"}'

# Get all incidents
curl http://localhost:3002/api/v3/incidents

# Get incident as XML
curl http://localhost:3002/api/v3/incidents/1/xml

# Cache performance benchmark
curl http://localhost:3002/api/v3/cache/performance

# System health
curl http://localhost:3002/api/v3/health
```

## Project Structure (Phase III)

```
server/phase3/
├── index.js                  # Main server entry point
├── package.json
├── config/
│   ├── database.js           # SQLite + NeDB configuration
│   └── seed.js               # Sample data seeder
├── models/
│   ├── sqliteModels.js       # Relational models (User, Incident, Signature, Audit)
│   └── nedbModels.js         # Document models (ThreatIntel, Events, Scans, Jobs)
├── controllers/
│   └── index.js              # Auth, Incident, ThreatIntel, System controllers
├── routes/
│   └── api.js                # RESTful route definitions
├── services/
│   ├── cacheService.js       # In-memory cache with TTL + tags
│   ├── asyncProcessor.js     # Event-driven background job processor
│   └── dataTransformer.js    # JSON/XML/STIX transformation
├── middleware/
│   └── security.js           # JWT, validation, rate limiting, sanitization
├── utils/
│   └── logger.js             # Winston logger + metrics
├── data/                     # Database files (auto-created)
└── logs/                     # Log files (auto-created)
```
