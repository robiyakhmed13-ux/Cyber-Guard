# CyberGuard Phase V

This service adds the final intelligent layer for the course project:

- AI/ML classification with `scikit-learn`
- ontology-based semantic modeling with RDF/Turtle
- semantic querying and AI + ontology integration
- optional free local LLM recommendations through Ollama

## Files

- `app.py` - FastAPI service exposing prediction, ontology, and LLM endpoints
- `train_model.py` - dataset preprocessing, training, and artifact generation
- `data/training_dataset.csv` - cybersecurity dataset used for model training
- `ontology/cyberguard.ttl` - ontology classes, relationships, and sample triples
- `artifacts/` - generated model and metadata after training

## Setup

```bash
python -m pip install -r requirements.txt
python train_model.py
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Main Endpoints

- `GET /health`
- `GET /model/info`
- `POST /predict-risk`
- `GET /ontology/triples`
- `GET /ontology/query`
- `POST /enrich-incident`
- `POST /llm/recommendation`

## Free LLM

Recommended free local model:

```bash
ollama pull qwen2.5:7b-instruct
```

If Ollama is not running on `http://localhost:11434`, the service returns a fallback recommendation so the rest of Phase V still works.
