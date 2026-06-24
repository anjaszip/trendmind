# TrendMind

AI-powered trend intelligence platform that helps content creators identify emerging product trends on TikTok/YouTube before they go mainstream.

## What It Does

- **Discovers emerging opportunities** — monitors 20 seed keywords across the full product lifecycle (seed → emerging → growing → viral → saturated → declining)
- **Predicts trend trajectory** — scores each keyword 0–100 based on search acceleration, video velocity, and creator adoption rate
- **Generates AI insights** — OpenAI-powered analysis explains what the signals mean and whether now is the right time to create content
- **Tracks stage transitions** — detects rapid lifecycle changes and alerts creators when an opportunity window is closing

## Architecture

```
Next.js 14 (port 3000)
    ↕ REST API
NestJS 11 (port 3001)
    ↕ BullMQ jobs
Trend Collector — Python FastAPI (port 8000)
    ↕ APIs
YouTube Data API v3 + Google Trends (pytrends)
    ↓
PostgreSQL 15 + TimescaleDB + Redis 7
```

## Quick Start

**Prerequisites:** Docker, Node.js 22+, Python 3.11+, YouTube Data API v3 key, OpenAI API key.

```bash
# 1. Configure environment
cp src/infrastructure/.env.example src/infrastructure/.env
# Edit .env with your API keys

# 2. Start database + Redis
cd src/infrastructure && docker compose up -d postgres redis

# 3. Run migrations
cd src/backend && npm run migration:run

# 4. Start backend
npm run start:dev

# 5. Start trend collector (new terminal)
cd src/trend-collector
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export $(cat .env | xargs)
uvicorn src.api.app:app --host 0.0.0.0 --port 8000 --reload

# 6. Start frontend (new terminal)
cd src/frontend && npm run dev
```

Open http://localhost:3000, register an account, and the dashboard will show emerging opportunities from seed keywords.

## Testing

```bash
# Backend unit + integration tests (79 tests)
cd src/backend && npm test

# TypeScript check
cd src/backend && npx tsc --noEmit
cd src/frontend && npx tsc --noEmit

# E2E tests (requires running stack)
cd src/backend && npx jest test/e2e
```

## Key URLs

| URL | Description |
|---|---|
| http://localhost:3000 | Dashboard |
| http://localhost:3001/api/docs | Swagger API docs |
| http://localhost:8000/docs | Trend collector API docs |
| http://localhost:8080 | Adminer (database UI) |

## Documentation

- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)

## Project Structure

```
src/
├── backend/          NestJS API (TypeScript)
├── frontend/         Next.js 14 app (TypeScript)
├── trend-collector/  Python FastAPI microservice
└── infrastructure/   Docker Compose, Dockerfiles, scripts
specs/                Product requirements and task breakdown
docs/                 API and deployment documentation
```
