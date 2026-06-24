# TrendMind Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- Python 3.11+ (for trend-collector, if running outside Docker)
- Node.js 22+ (for backend/frontend, if running outside Docker)
- A YouTube Data API v3 key (Google Cloud Console)
- An OpenAI API key

---

## Environment Setup

### 1. Infrastructure `.env`

```bash
cp src/infrastructure/.env.example src/infrastructure/.env
```

Edit `src/infrastructure/.env`:
```
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
JWT_SECRET=<32+-char-random-string>
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=AIza...
```

### 2. Backend `.env`

```bash
cp src/infrastructure/.env.example src/backend/.env
```

Edit `src/backend/.env` — same values plus:
```
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=trendmind_user
DB_PASSWORD=<same as POSTGRES_PASSWORD>
DB_NAME=trendmind
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<same as REDIS_PASSWORD>
TREND_COLLECTOR_URL=http://localhost:8000
```

### 3. Trend Collector `.env`

```bash
echo "YOUTUBE_API_KEY=AIza..." > src/trend-collector/.env
```

---

## Running Locally (Manual)

```bash
# 1. Start database + Redis
cd src/infrastructure && docker compose up -d postgres redis

# 2. Run database migrations (first time only)
cd src/backend && npm run migration:run

# 3. Start backend
cd src/backend && npm run start:dev

# 4. Start trend collector
cd src/trend-collector
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export $(cat .env | xargs)
uvicorn src.api.app:app --host 0.0.0.0 --port 8000 --reload

# 5. Start frontend
cd src/frontend && npm run dev
```

URLs:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger UI: http://localhost:3001/api/docs
- Adminer (DB UI): http://localhost:8080

---

## Running with Docker Compose (Full Stack)

```bash
cd src/infrastructure

# Start all services
docker compose up -d

# Run migrations inside the container
docker exec trendmind-backend npm run migration:run

# View logs
docker compose logs -f backend
docker compose logs -f trend-collector
```

---

## Database Migrations

```bash
# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

---

## Database Backup

```bash
# Backup to ./backups/ (auto-cleans files older than 7 days)
./src/infrastructure/scripts/backup-db.sh

# Restore from a backup
docker exec -i trendmind-postgres pg_restore \
  -U trendmind_user -d trendmind \
  < ./backups/trendmind_<timestamp>.dump
```

---

## Production Notes

- Set `NODE_ENV=production` for structured JSON logs from the backend.
- The frontend Dockerfile uses Next.js standalone build — set `NEXT_PUBLIC_API_URL` to your backend URL.
- YouTube Data API v3 has a 10,000 unit/day quota. Each search costs 100 units (~100 keywords/day).
- Google Trends uses `pytrends` (unofficial scraper) — it may be rate-limited on fresh IPs. Add a proxy if needed.
- TimescaleDB continuous aggregates (`daily_acceleration_metrics` view) are created by migration 1.
