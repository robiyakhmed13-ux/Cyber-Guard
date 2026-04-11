# CyberGuard

CyberGuard is a React-based cybersecurity platform that now includes both:
- Phase II enterprise integration services on `http://localhost:3001`
- Phase III data management and integration APIs on `http://localhost:3002/api/v3`

## Project Structure

- `src/` frontend application
- `server/` Phase II service-oriented backend
- `server/phase3/` Phase III data management backend

## Run The Frontend

```bash
npm install
npm run dev
```

Frontend routes include:
- `/integration` for the Phase II dashboard
- `/data-management` for the Phase III dashboard

## Run Phase II Backend

```bash
cd server
npm install
npm start
```

## Run Phase III Backend

```bash
cd server/phase3
npm install
npm start
```

Phase III provides:
- Modular controller -> service -> model data access
- SQLite + NeDB persistence
- RESTful CRUD APIs
- JWT authentication and validation
- Persistent asynchronous job processing
- In-memory caching with TTL and invalidation
- JSON/XML/STIX transformation endpoints
- Logging, metrics, and audit trail support

## Default Phase III Credentials

- `admin / Admin123!`
- `analyst1 / Analyst123!`
- `viewer1 / Analyst123!`

## Useful Phase III Endpoints

- `GET /api/v3/health`
- `POST /api/v3/auth/login`
- `GET /api/v3/incidents`
- `POST /api/v3/incidents`
- `GET /api/v3/threat-intel`
- `POST /api/v3/async/produce`
- `GET /api/v3/cache/performance`
- `POST /api/v3/transform/xml-to-json`
