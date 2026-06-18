# Implementation Plan: TrendMind AI-Powered Trend Prediction Platform MVP

**Branch**: `001-trend-intelligence-mvp` | **Date**: 2026-06-04 | **Last Updated**: 2026-06-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-trend-intelligence-mvp/spec.md`

## Summary

TrendMind is a trend prediction platform that helps content creators and affiliate marketers discover emerging products before market saturation. Unlike trend reporting tools that identify what's viral today, TrendMind predicts what products are likely to trend next by classifying products into lifecycle stages (Seed, Emerging, Growing, Viral, Saturated, Declining) and calculating prediction scores based on acceleration signals.

**Core Question**: Not "What products are trending today?" but "What products are likely to trend next?"

**Technical Approach**: Microservices architecture with NestJS (TypeScript) for the main API and dashboard backend, Python microservice using pytrends for Google Trends and YouTube Data API for signal collection, PostgreSQL with TimescaleDB for time-series data storage, and rule-based lifecycle classification engine. Prediction scores calculated using weighted acceleration metrics (Search Acceleration 30%, Video Velocity 25%, Creator Adoption Rate 20%, Related Query Growth 15%, View Velocity 10%).

## Technical Context

**Language/Version**: 
- TypeScript 5.x (strict mode) for NestJS backend and frontend
- Python 3.11+ for trend collection microservice

**Primary Dependencies**: 
- NestJS 10.x (backend framework with clean architecture support)
- PostgreSQL 15+ with TimescaleDB extension (time-series data optimization)
- TypeORM (relational data storage with hypertable support)
- pytrends (Google Trends unofficial API)
- google-api-python-client (YouTube Data API v3)
- BullMQ (job queue for background trend collection and prediction calculation)
- Redis (caching and job queue backing)
- OpenAI SDK (AI lifecycle insight generation)
- Passport.js (authentication middleware)
- React 18+ or Next.js 14 (frontend dashboard)

**Storage**: 
- PostgreSQL with TimescaleDB for time-series trend data (automatic partitioning, retention policies, continuous aggregates)
- Redis for caching (prediction scores: 30min TTL, trend data: 1hr TTL, AI insights: 24hr TTL)

**Testing**: 
- Jest (unit and integration tests for NestJS)
- pytest (unit tests for Python microservice)
- Supertest (API endpoint testing)
- React Testing Library (frontend component tests)

**Target Platform**: Web application deployed on cloud infrastructure (AWS/Azure/GCP), containerized with Docker

**Project Type**: Web service with microservices architecture - main NestJS API + Python trend collection service + React dashboard

**Performance Goals**:
- Dashboard load: <2 seconds
- API response: <500ms for standard requests
- Prediction calculation: handle 5000+ keywords with staggered updates
- Support 100 concurrent users

**Constraints**:
- API response time <500ms (95th percentile)
- Dashboard load time <2 seconds
- Google Trends API rate limits (unofficial API, ~20 requests/hour per IP)
- YouTube API quota (10,000 units/day default)
- Background jobs must not block user requests
- Cache TTL: 1 hour for trend data, 30 minutes for prediction scores, 24 hours for AI insights
- Minimum 7 days historical data required for lifecycle classification
- Minimum 14 days for medium confidence predictions
- 30+ days for high confidence predictions

**Scale/Scope**: 
- MVP target: 500 users
- Up to 50 keywords per user (25,000 total keywords system-wide)
- ~20 seed keywords always monitored
- 90-day historical data retention for raw signals
- 365-day retention for aggregated metrics (seasonality detection)
- Indefinite retention for lifecycle stage transition events

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Code Quality
- [x] TypeScript strict mode enabled
- [x] Clean architecture principles will be followed (NestJS modules, services, controllers pattern)
- [x] Public APIs will be documented (OpenAPI/Swagger for REST endpoints)
- [x] No duplicated business logic in design (shared scoring service, reusable providers)
- [x] Linting and type checking configured (ESLint, Prettier, tsc)

### Principle II: Testing Standards (NON-NEGOTIABLE)
- [x] Unit tests planned for all business logic (scoring algorithm, keyword normalization, data parsers)
- [x] Integration tests planned for critical workflows (end-to-end trend collection, API endpoints)
- [x] Test coverage target: 80% minimum
- [x] Regression tests included for bug fixes
- [x] Tests required before merge (CI/CD pipeline enforced)

### Principle III: User Experience Consistency
- [x] Consistent UI components identified (React component library)
- [x] Terminology standardized (trends, signals, keywords, insights)
- [x] Loading and error states handled (loading skeletons, error boundaries, toast notifications)
- [x] Mobile-responsive design planned (responsive CSS, mobile breakpoints)
- [x] Dashboard remains intuitive for non-technical users (clear labels, tooltips, simple navigation)

### Principle IV: Performance
- [x] Dashboard load time target: < 2 seconds
- [x] API response time target: < 500ms for standard requests
- [x] Background jobs designed as asynchronous (BullMQ job queues)
- [x] Trend collection will not block user requests (separate microservice + async processing)
- [x] Caching strategy defined (Redis: 1hr trend data, 30min scores)

### Principle V: Scalability
- [x] Signal providers designed as pluggable (Provider interface, Google Trends + YouTube implementations)
- [x] New data sources can be added without modifying existing providers (strategy pattern)
- [x] AI providers designed as replaceable (AI provider interface, OpenAI implementation)
- [x] Notification channels designed as extensible (notification provider interface)

### Principle VI: Security
- [x] Authentication required for protected endpoints (Passport.js JWT strategy)
- [x] Credentials will be stored in environment variables (.env files, secrets management)
- [x] Rate limiting planned for public APIs (NestJS throttler guard)
- [x] Input validation planned for all endpoints (class-validator DTOs, sanitization)

## Project Structure

### Documentation (this feature)

```text
specs/001-trend-intelligence-mvp/
├── spec.md              # Feature specification
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0: Technology decisions and best practices
├── data-model.md        # Phase 1: Database schema and entity definitions
├── quickstart.md        # Phase 1: Validation scenarios and setup guide
├── contracts/           # Phase 1: API contracts and interface definitions
│   ├── rest-api.md      # REST API endpoints specification
│   └── providers.md     # Provider interface contracts
└── tasks.md             # Phase 2: Task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── backend/                          # NestJS main application
│   ├── src/
│   │   ├── auth/                    # Authentication module (Passport.js, JWT)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── guards/
│   │   ├── keywords/                # Keyword management module
│   │   │   ├── keywords.controller.ts
│   │   │   ├── keywords.service.ts
│   │   │   ├── dto/
│   │   │   └── entities/keyword.entity.ts
│   │   ├── trends/                  # Trend data collection orchestration
│   │   │   ├── trends.controller.ts
│   │   │   ├── trends.service.ts
│   │   │   └── entities/trend-data-point.entity.ts
│   │   ├── lifecycle/               # Lifecycle stage classification engine
│   │   │   ├── lifecycle.service.ts        # Rule-based classification
│   │   │   ├── stage-classifier.ts         # Classification logic
│   │   │   ├── stage-transition.service.ts # Detect & log transitions
│   │   │   ├── entities/
│   │   │   │   └── stage-transition-event.entity.ts
│   │   │   └── config/
│   │   │       └── thresholds.config.ts   # Configurable stage thresholds
│   │   ├── acceleration/            # Acceleration metrics calculation
│   │   │   ├── acceleration.service.ts     # Multi-window rate of change
│   │   │   ├── metrics-calculator.ts       # Velocity, adoption rate calc
│   │   │   ├── entities/
│   │   │   │   └── acceleration-metrics.entity.ts
│   │   │   └── aggregates/
│   │   │       └── daily-metrics.view.ts  # TimescaleDB continuous aggregate
│   │   ├── prediction/              # Prediction score calculation
│   │   │   ├── prediction.controller.ts
│   │   │   ├── prediction.service.ts
│   │   │   ├── scoring.service.ts          # Weighted percentile scoring
│   │   │   ├── percentile.service.ts       # Percentile rank normalization
│   │   │   ├── entities/
│   │   │   │   └── prediction-score.entity.ts
│   │   │   └── config/
│   │   │       └── weights.config.ts      # Configurable score weights
│   │   ├── insights/                # AI lifecycle insight generation
│   │   │   ├── insights.service.ts
│   │   │   ├── insight-generator.ts
│   │   │   ├── seasonality-detector.ts    # Year-over-year pattern detection
│   │   │   └── entities/ai-insight.entity.ts
│   │   ├── dashboard/               # Dashboard endpoints
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── emerging-opportunities.service.ts  # Filtered by stage
│   │   │   └── analytics.service.ts              # Stage distribution, rapid transitions
│   │   ├── providers/               # Pluggable provider abstractions
│   │   │   ├── signal-providers/
│   │   │   │   ├── signal-provider.interface.ts
│   │   │   │   ├── normalized-signals.interface.ts
│   │   │   │   ├── google-trends.provider.ts
│   │   │   │   ├── youtube.provider.ts
│   │   │   │   └── signal-aggregation.service.ts # Multi-provider merge
│   │   │   └── ai-providers/
│   │   │       ├── ai-provider.interface.ts
│   │   │       ├── lifecycle-insight-context.interface.ts
│   │   │       └── openai.provider.ts
│   │   ├── jobs/                    # Background job processors
│   │   │   ├── trend-collection.processor.ts
│   │   │   ├── acceleration-calculation.processor.ts
│   │   │   ├── prediction-scoring.processor.ts
│   │   │   ├── lifecycle-classification.processor.ts
│   │   │   └── insight-generation.processor.ts
│   │   ├── database/                # Database configuration and migrations
│   │   │   ├── migrations/
│   │   │   └── timescale/
│   │   │       └── hypertable.config.ts  # TimescaleDB setup
│   │   ├── common/                  # Shared utilities
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── interceptors/
│   │   │   ├── pipes/
│   │   │   └── enums/
│   │   │       ├── lifecycle-stage.enum.ts
│   │   │       ├── confidence-level.enum.ts
│   │   │       └── timing-recommendation.enum.ts
│   │   └── main.ts
│   ├── test/
│   │   ├── unit/
│   │   │   ├── lifecycle/
│   │   │   ├── acceleration/
│   │   │   └── prediction/
│   │   ├── integration/
│   │   └── e2e/
│   ├── package.json
│   └── tsconfig.json
│
├── trend-collector/                  # Python microservice for Google Trends
│   ├── src/
│   │   ├── collectors/
│   │   │   ├── google_trends.py    # pytrends wrapper
│   │   │   └── youtube_trends.py   # YouTube Data API wrapper
│   │   ├── normalizer/
│   │   │   └── keyword_normalizer.py  # Advanced normalization logic
│   │   ├── api/
│   │   │   └── app.py              # FastAPI endpoints for trend collection
│   │   └── models/
│   │       └── trend_data.py
│   ├── tests/
│   │   └── test_collectors.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                         # React/Next.js dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── OpportunityCard.tsx
│   │   │   │   ├── TrendChart.tsx
│   │   │   │   └── KeywordList.tsx
│   │   │   ├── keywords/
│   │   │   │   ├── AddKeywordForm.tsx
│   │   │   │   └── KeywordItem.tsx
│   │   │   ├── insights/
│   │   │   │   └── InsightDetail.tsx
│   │   │   └── common/
│   │   │       ├── LoadingState.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── Toast.tsx
│   │   ├── pages/
│   │   │   ├── index.tsx            # Dashboard page
│   │   │   ├── login.tsx
│   │   │   └── keyword/[id].tsx     # Keyword detail page
│   │   ├── services/
│   │   │   └── api.ts               # API client
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── utils/
│   ├── tests/
│   │   └── components/
│   ├── package.json
│   └── tsconfig.json
│
└── infrastructure/
    ├── docker-compose.yml
    ├── Dockerfile.backend
    ├── Dockerfile.collector
    ├── Dockerfile.frontend
    └── .env.example
```

**Structure Decision**: Microservices architecture chosen to isolate Google Trends data collection (rate-limited Python service) from main application logic (NestJS). Frontend separated for independent deployment and scaling. PostgreSQL as single source of truth with Redis for caching and job queues.

## Complexity Tracking

✅ **No constitutional violations** - all complexity is justified:
- Microservices architecture: Required to isolate rate-limited Python trend collection from user-facing NestJS API
- Provider pattern: Required by Constitution Principle V (pluggable signal providers, AI providers, notification channels)
- TimescaleDB: Required for efficient time-series query performance at scale (10.8M+ data points over 90 days)
- Lifecycle classification engine: Core feature requirement for trend prediction (distinguishing emerging vs. saturated markets)
- Acceleration metrics calculation: Core feature requirement for prediction scoring (velocity-focused signals)
- Multi-window rate of change: Required for noise filtering and trend confirmation (7/14/30-day windows)
- Percentile normalization: Required to make heterogeneous signals (search volume, video count, etc.) comparable for unified scoring
- Stage transition tracking: Core feature requirement for rapid transition detection and lifecycle progression analytics
- Three separate projects (backend, collector, frontend): Minimal viable architecture for MVP requirements
