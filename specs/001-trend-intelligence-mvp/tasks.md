# Tasks: TrendMind AI-Powered Trend Prediction Platform MVP

**Feature Branch**: `001-trend-intelligence-mvp`  
**Input**: Design documents from `/specs/001-trend-intelligence-mvp/`  
**Prerequisites**: plan.md, spec.md (user stories P1-P3), research.md, data-model.md, contracts/  
**Tests**: Required per Constitution Principle II (NON-NEGOTIABLE) - 80% coverage minimum

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize monorepo structure with src/backend/, src/trend-collector/, src/frontend/, infrastructure/ directories
- [X] T002 Configure backend: Initialize NestJS project with TypeScript strict mode in src/backend/ (Principle I)
- [X] T003 [P] Configure trend-collector: Initialize Python 3.11+ FastAPI project in src/trend-collector/
- [X] T004 [P] Configure frontend: Initialize Next.js 14 with TypeScript in src/frontend/
- [X] T005 [P] Setup backend linting: Configure ESLint and Prettier in src/backend/.eslintrc.js (Principle I)
- [X] T006 [P] Setup backend testing: Configure Jest with 80% coverage target in src/backend/jest.config.js (Principle II)
- [X] T007 [P] Setup Python testing: Configure pytest in src/trend-collector/pytest.ini (Principle II)
- [X] T008 [P] Setup frontend testing: Configure Jest + React Testing Library in src/frontend/jest.config.js (Principle II)
- [X] T009 [P] Configure CI/CD pipeline: Create GitHub Actions workflow for linting, type checking, and tests in .github/workflows/ci.yml (Principles I & II)
- [X] T010 [P] Setup Docker infrastructure: Create docker-compose.yml in infrastructure/ with PostgreSQL 15+ (TimescaleDB), Redis 7+
- [X] T011 [P] Configure environment templates: Create .env.example files in backend/, trend-collector/, frontend/ with all required vars (Principle VI)
- [X] T012 Setup TimescaleDB extension: Create initialization script in infrastructure/postgres/init.sql enabling TimescaleDB

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Migrations

- [X] T013 Setup TypeORM configuration in src/backend/src/database/data-source.ts with TimescaleDB support
- [X] T014 Create User entity in src/backend/src/auth/entities/user.entity.ts with email, password_hash, created_at, updated_at, is_active
- [X] T015 [P] Create Keyword entity in src/backend/src/keywords/entities/keyword.entity.ts with user_id, original_term, normalized_form, current_lifecycle_stage, stage_entered_at, is_seed_keyword, monitoring_status
- [X] T016 [P] Create TrendDataPoint entity in src/backend/src/trends/entities/trend-data-point.entity.ts with keyword_id, provider, timestamp, search_volume, video_count, view_count, unique_creators, engagement_rate, related_query_breakouts, raw_response
- [X] T017 [P] Create AccelerationMetrics entity in src/backend/src/acceleration/entities/acceleration-metrics.entity.ts with keyword_id, search_acceleration, search_acceleration_7d, search_acceleration_30d, video_velocity, view_velocity, creator_adoption_rate, confidence_level
- [X] T018 [P] Create PredictionScore entity in src/backend/src/prediction/entities/prediction-score.entity.ts with keyword_id, score, confidence_level, components (search_acceleration_weight, video_velocity_weight, etc.)
- [X] T019 [P] Create AIInsight entity in src/backend/src/insights/entities/ai-insight.entity.ts with keyword_id, text, timing_recommendation, seasonality_flag, rapid_transition_flag, ai_provider
- [X] T020 [P] Create StageTransitionEvent entity in src/backend/src/lifecycle/entities/stage-transition-event.entity.ts with keyword_id, previous_stage, new_stage, transition_velocity, trigger_signals
- [X] T021 Create database migration for all entities in src/backend/src/database/migrations/20260604000000-InitialSchema.ts
- [X] T022 Create TimescaleDB hypertable configuration for TrendDataPoint in src/backend/src/database/timescale/hypertable.config.ts with 90-day retention policy
- [X] T023 [P] Create TimescaleDB continuous aggregate for daily acceleration metrics in src/backend/src/database/migrations/20260604000001-DailyAccelerationAggregate.ts

### Shared Enums & Constants

- [X] T024 [P] Create LifecycleStage enum in src/backend/src/common/enums/lifecycle-stage.enum.ts (SEED, EMERGING, GROWING, VIRAL, SATURATED, DECLINING)
- [X] T025 [P] Create ConfidenceLevel enum in src/backend/src/common/enums/confidence-level.enum.ts (LOW, MEDIUM, HIGH)
- [X] T026 [P] Create TimingRecommendation enum in src/backend/src/common/enums/timing-recommendation.enum.ts (EARLY, ON_TIME, LATE, AVOID)
- [X] T027 [P] Create DataSource enum in src/backend/src/common/enums/data-source.enum.ts (GOOGLE_TRENDS, YOUTUBE, future: TIKTOK, REDDIT)
- [X] T028 [P] Create lifecycle classification threshold config in src/backend/src/lifecycle/config/thresholds.config.ts (seed, emerging, growing, viral, saturated, declining thresholds)
- [X] T029 [P] Create prediction score weights config in src/backend/src/prediction/config/weights.config.ts (searchAcceleration: 0.30, videoVelocity: 0.25, creatorAdoptionRate: 0.20, relatedQueryGrowth: 0.15, viewVelocity: 0.10)

### Authentication & Security

- [X] T030 Create auth module in src/backend/src/auth/auth.module.ts
- [X] T031 Implement JWT strategy in src/backend/src/auth/jwt.strategy.ts with Passport.js (Principle VI)
- [X] T032 [P] Implement auth service in src/backend/src/auth/auth.service.ts with register(), login(), validateUser() methods
- [X] T033 [P] Implement auth controller in src/backend/src/auth/auth.controller.ts with POST /auth/register, POST /auth/login endpoints
- [X] T034 [P] Create JWT auth guard in src/backend/src/auth/guards/jwt-auth.guard.ts (Principle VI)
- [X] T035 [P] Configure rate limiting middleware in src/backend/src/common/middleware/rate-limit.middleware.ts (Principle VI)
- [X] T036 [P] Create input validation pipes in src/backend/src/common/pipes/validation.pipe.ts using class-validator (Principle VI)

### Provider Architecture (Pluggable Pattern)

- [X] T037 Create ISignalProvider interface in src/backend/src/providers/signal-providers/signal-provider.interface.ts with collectSignals(), normalizeSignals(), getRateLimitStatus() methods (Principle V)
- [X] T038 [P] Create NormalizedSignals interface in src/backend/src/providers/signal-providers/normalized-signals.interface.ts with searchVolume, videoCount, viewCount, uniqueCreators, engagementRate, relatedQueries, breakoutQueries, confidence
- [X] T039 [P] Create IAIProvider interface in src/backend/src/providers/ai-providers/ai-provider.interface.ts with generateLifecycleInsight() method (Principle V)
- [X] T040 [P] Create LifecycleInsightContext interface in src/backend/src/providers/ai-providers/lifecycle-insight-context.interface.ts with keyword, lifecycleStage, accelerationMetrics, rapidTransition, seasonalPattern
- [X] T041 Implement GoogleTrendsProvider in src/backend/src/providers/signal-providers/google-trends.provider.ts (calls Python microservice, normalizes to NormalizedSignals)
- [X] T042 [P] Implement YouTubeProvider in src/backend/src/providers/signal-providers/youtube.provider.ts (calls Python microservice, normalizes to NormalizedSignals)
- [X] T043 [P] Implement OpenAIProvider in src/backend/src/providers/ai-providers/openai.provider.ts with GPT-4 integration for lifecycle insights
- [X] T044 [P] Create SignalAggregationService in src/backend/src/providers/signal-providers/signal-aggregation.service.ts for merging multi-provider signals

### Python Trend Collector Microservice

- [X] T045 Create FastAPI application in src/trend-collector/src/api/app.py with /health, /collect/google-trends, /collect/youtube endpoints
- [X] T046 [P] Implement GoogleTrendsCollector in src/trend-collector/src/collectors/google_trends.py using pytrends library
- [X] T047 [P] Implement YouTubeCollector in src/trend-collector/src/collectors/youtube_trends.py using google-api-python-client
- [X] T048 [P] Implement keyword normalizer in src/trend-collector/src/normalizer/keyword_normalizer.py (lowercase, trim, remove punctuation, singular form)
- [X] T049 [P] Create TrendData Pydantic model in src/trend-collector/src/models/trend_data.py for response validation

### Job Queue Infrastructure

- [X] T050 Setup BullMQ configuration in src/backend/src/common/config/bullmq.config.ts with Redis connection
- [X] T051 Create trend-collection job queue in src/backend/src/jobs/queues/trend-collection.queue.ts
- [X] T052 [P] Create acceleration-calculation job queue in src/backend/src/jobs/queues/acceleration-calculation.queue.ts
- [X] T053 [P] Create prediction-scoring job queue in src/backend/src/jobs/queues/prediction-scoring.queue.ts
- [X] T054 [P] Create lifecycle-classification job queue in src/backend/src/jobs/queues/lifecycle-classification.queue.ts
- [X] T055 [P] Create insight-generation job queue in src/backend/src/jobs/queues/insight-generation.queue.ts

### Caching Infrastructure

- [X] T056 Setup Redis cache module in src/backend/src/common/cache/cache.module.ts (Principle IV)
- [X] T057 Create cache service in src/backend/src/common/cache/cache.service.ts with get(), set(), invalidate() methods and configurable TTLs (trend data: 1hr, prediction scores: 30min, AI insights: 24hr)

### Frontend Base Components

- [X] T058 Create API client service in src/frontend/src/services/api.ts with axios, JWT interceptor, error handling (Principle III)
- [X] T059 [P] Create LoadingState component in src/frontend/src/components/common/LoadingState.tsx (Principle III)
- [X] T060 [P] Create ErrorBoundary component in src/frontend/src/components/common/ErrorBoundary.tsx (Principle III)
- [X] T061 [P] Create Toast notification component in src/frontend/src/components/common/Toast.tsx (Principle III)
- [X] T062 [P] Setup global styles with Tailwind CSS in src/frontend/src/app/globals.css (mobile-responsive, Principle III)
- [X] T063 [P] Create authentication layout in src/frontend/src/app/layout.tsx with header, navigation (Principle III)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Discover Emerging Product Opportunities (Priority: P1) 🎯 MVP

**Goal**: Dashboard showing top 5-10 emerging opportunities with prediction scores, lifecycle stages, and AI insights

**Independent Test**: Open dashboard and verify emerging opportunities appear with prediction scores (0-100), lifecycle stages (seed/emerging preferred), acceleration metrics, and AI insights explaining growth signals. Works without keyword monitoring.

### Tests for User Story 1 (Write FIRST, ensure they FAIL before implementation)

- [X] T064 [P] [US1] Unit tests for lifecycle classification logic in src/backend/src/lifecycle/stage-classifier.spec.ts (test classification rules: seed, emerging, growing, viral, saturated, declining)
- [X] T065 [P] [US1] Unit tests for prediction score calculation in src/backend/src/prediction/scoring.service.spec.ts (test weighted formula, percentile normalization, 0-100 range)
- [X] T066 [P] [US1] Unit tests for acceleration metrics calculation in src/backend/src/acceleration/metrics-calculator.spec.ts (test multi-window rate of change: 7d, 14d, 30d)
- [X] T067 [P] [US1] Integration test for dashboard endpoint in src/backend/src/dashboard/dashboard.controller.spec.ts (test GET /dashboard/emerging-opportunities with filters, sorting, response structure)
- [ ] T068 [P] [US1] E2E test for dashboard page in src/frontend/tests/e2e/dashboard.test.tsx (test page load, opportunity cards rendered, loading states, error handling)

### Backend Implementation - Lifecycle Classification

- [X] T069 [US1] Implement stage classifier logic in src/backend/src/lifecycle/stage-classifier.ts with classifyLifecycleStage(metrics) using thresholds from config
- [X] T070 [P] [US1] Implement lifecycle service in src/backend/src/lifecycle/lifecycle.service.ts with classifyKeyword(), detectStageTransition() methods
- [X] T071 [P] [US1] Implement stage transition service in src/backend/src/lifecycle/stage-transition.service.ts with logTransition(), detectRapidTransition() methods

### Backend Implementation - Acceleration Metrics

- [X] T072 [US1] Implement metrics calculator in src/backend/src/acceleration/metrics-calculator.ts with calculateSearchAcceleration(), calculateVideoVelocity(), calculateCreatorAdoptionRate(), calculateViewVelocity()
- [X] T073 [P] [US1] Implement acceleration service in src/backend/src/acceleration/acceleration.service.ts with calculateMetrics(keyword), getAccelerationHistory()

### Backend Implementation - Prediction Scoring

- [X] T074 [US1] Implement percentile service in src/backend/src/prediction/percentile.service.ts with calculatePercentileRank() for normalization across all keywords
- [X] T075 [P] [US1] Implement scoring service in src/backend/src/prediction/scoring.service.ts with calculatePredictionScore(metrics, weights), applyWeights(), normalizeToScale()
- [X] T076 [P] [US1] Implement prediction service in src/backend/src/prediction/prediction.service.ts with scorePrediction(keyword), getPredictionHistory()

### Backend Implementation - AI Insights

- [X] T077 [US1] Implement seasonality detector in src/backend/src/insights/seasonality-detector.ts with detectSeasonalPattern() using year-over-year comparison
- [X] T078 [P] [US1] Implement insight generator in src/backend/src/insights/insight-generator.ts with generateLifecycleInsight(keyword, context) calling AI provider
- [X] T079 [P] [US1] Implement insights service in src/backend/src/insights/insights.service.ts with generateInsight(), refreshInsight(), cacheInsight()

### Backend Implementation - Dashboard Endpoints

- [X] T080 [US1] Implement emerging opportunities service in src/backend/src/dashboard/emerging-opportunities.service.ts with getEmergingOpportunities(filters) - filter by stages, minScore, confidenceLevel, sort by predictionScore
- [X] T081 [P] [US1] Implement analytics service in src/backend/src/dashboard/analytics.service.ts with getStageDistribution(), getRapidTransitions()
- [X] T082 [P] [US1] Implement dashboard controller in src/backend/src/dashboard/dashboard.controller.ts with GET /dashboard/emerging-opportunities, GET /analytics/stage-distribution, GET /analytics/rapid-transitions

### Background Jobs - Calculation Pipeline

- [X] T083 [US1] Implement trend collection processor in src/backend/src/jobs/trend-collection.processor.ts - orchestrate signal collection from Google Trends + YouTube, store TrendDataPoint
- [X] T084 [P] [US1] Implement acceleration calculation processor in src/backend/src/jobs/acceleration-calculation.processor.ts - calculate metrics from historical TrendDataPoint records
- [X] T085 [P] [US1] Implement prediction scoring processor in src/backend/src/jobs/prediction-scoring.processor.ts - calculate prediction score from AccelerationMetrics
- [X] T086 [P] [US1] Implement lifecycle classification processor in src/backend/src/jobs/lifecycle-classification.processor.ts - classify stage, detect transitions
- [X] T087 [P] [US1] Implement insight generation processor in src/backend/src/jobs/insight-generation.processor.ts - generate AI insights with timing recommendations

### Frontend Implementation - Dashboard

- [X] T088 [US1] Create OpportunityCard component in src/frontend/src/components/dashboard/OpportunityCard.tsx displaying keyword, predictionScore, lifecycleStage badge, accelerationMetrics preview, insight snippet (Principle III)
- [X] T089 [P] [US1] Create TrendChart component in src/frontend/src/components/dashboard/TrendChart.tsx for visualizing 30-day acceleration history with SVG (Principle III)
- [X] T090 [P] [US1] Create dashboard page in src/frontend/src/app/page.tsx with emerging opportunities list, filters (stages, minScore, confidenceLevel), loading/error states (Principles III & IV)
- [X] T091 [P] [US1] Implement dashboard hooks in src/frontend/src/hooks/useDashboard.ts with useEmergingOpportunities(), useStageDistribution()
- [X] T092 [P] [US1] Style OpportunityCard with lifecycle stage color coding in src/frontend/src/components/dashboard/OpportunityCard.module.css (seed: gray, emerging: green, growing: blue, viral: purple, saturated: orange, declining: red) (Principle III)

### Seed Keywords Setup

- [X] T093 [US1] Create seed keywords migration in src/backend/src/database/migrations/20260604000002-SeedKeywords.ts with 20 curated product categories (e.g., wireless earbuds, standing desk, portable blender)
- [X] T094 [P] [US1] Configure staggered trend collection schedule in src/backend/src/jobs/schedulers/seed-keywords.scheduler.ts - distribute 20 seed keywords evenly over 1-hour interval to prevent API rate limit spikes

---

## Phase 4: User Story 2 - Monitor Custom Product Keywords (Priority: P2)

**Goal**: Users can add/remove keywords, see them in dashboard with prediction scores and lifecycle stages

**Independent Test**: Add a new keyword, verify it appears in dashboard with initial "seed" stage and "low" confidence, then simulate 14 days of data to see stage progression to "emerging" with "medium" confidence. Works independently once P1 infrastructure exists.

### Tests for User Story 2 (Write FIRST, ensure they FAIL before implementation)

- [X] T095 [P] [US2] Unit tests for keyword normalization in src/backend/src/keywords/keywords.service.spec.ts (test lowercase, trim, remove punctuation, XSS, duplicate detection)
- [X] T096 [P] [US2] Unit tests for keyword validation in src/backend/src/keywords/keywords.service.spec.ts (test length limits, special characters, XSS attempts, SQL injection)
- [X] T097 [P] [US2] Integration test for keyword CRUD in src/backend/src/keywords/keywords.controller.spec.ts (test POST /keywords, GET /keywords, DELETE /keywords/:id with auth, duplicates, user isolation)
- [ ] T098 [P] [US2] E2E test for add keyword flow in src/frontend/tests/e2e/add-keyword.test.tsx (test form submission, validation, success toast, keyword appears in list)

### Backend Implementation - Keyword Management

- [X] T099 [US2] Implement keywords service in src/backend/src/keywords/keywords.service.ts with addKeyword(), removeKeyword(), listKeywords(), normalizeKeyword(), validateKeyword() methods
- [X] T100 [P] [US2] Implement keywords controller in src/backend/src/keywords/keywords.controller.ts with POST /keywords, GET /keywords, DELETE /keywords/:id, GET /keywords/:id
- [X] T101 [P] [US2] Create AddKeywordDto in src/backend/src/keywords/dto/add-keyword.dto.ts with validation decorators (class-validator: IsNotEmpty, Length(1,100), IsString) (Principle VI)
- [X] T102 [P] [US2] Create KeywordResponseDto in src/backend/src/keywords/dto/keyword-response.dto.ts with serialization for API responses
- [X] T103 [P] [US2] Implement duplicate detection in keywords service using normalized_form uniqueness constraint and return 409 Conflict error

### Frontend Implementation - Keyword Management

- [X] T104 [US2] Create AddKeywordForm component in src/frontend/src/components/keywords/AddKeywordForm.tsx with input field, validation, submit handler (Principle III)
- [X] T105 [P] [US2] Create KeywordList component in src/frontend/src/components/keywords/KeywordList.tsx displaying user's monitored keywords with remove button (Principle III)
- [X] T106 [P] [US2] Create KeywordItem component in src/frontend/src/components/keywords/KeywordItem.tsx with keyword details, lifecycle stage badge, prediction score, remove button (Principle III)
- [X] T107 [P] [US2] Implement keyword hooks in src/frontend/src/hooks/useKeywords.ts with useAddKeyword(), useRemoveKeyword(), useKeywordList()
- [X] T108 [P] [US2] Add keyword management section to dashboard page in src/frontend/src/app/page.tsx with AddKeywordForm and KeywordList components

### Monitoring Status & Error Handling

- [X] T109 [US2] Implement monitoring status updates in keywords service - set to 'active' on add, 'failed' on collection error, 'paused' on user request
- [X] T110 [P] [US2] Create monitoring status badge component in src/frontend/src/components/keywords/StatusBadge.tsx with color coding (active: green, paused: yellow, failed: red) (Principle III)
- [X] T111 [P] [US2] Implement error recovery logic in trend collection processor - retry failed keywords with exponential backoff, mark as 'failed' after 3 attempts

---

## Phase 5: User Story 3 - Understand Product Lifecycle and Timing (Priority: P3)

**Goal**: Detailed keyword view with lifecycle insights, growth signals, stage transition history, and timing recommendations

**Independent Test**: Click any keyword to see detailed view with AI insights explaining lifecycle stage, acceleration metrics chart, stage transition history, and timing recommendation (early/on_time/late/avoid). Enhances existing data but isn't required for basic opportunity identification.

### Tests for User Story 3 (Write FIRST, ensure they FAIL before implementation)

- [ ] T112 [P] [US3] Unit tests for stage transition detection in src/backend/test/unit/lifecycle/stage-transition.service.test.ts (test normal vs rapid transitions, velocity classification)
- [ ] T113 [P] [US3] Unit tests for timing recommendation logic in src/backend/test/unit/insights/insight-generator.test.ts (test early/on_time/late/avoid mapping to lifecycle stages)
- [ ] T114 [P] [US3] Integration test for keyword detail endpoint in src/backend/test/integration/keywords-detail.test.ts (test GET /keywords/:id with full prediction, acceleration, insight, stage history)
- [ ] T115 [P] [US3] E2E test for keyword detail page in src/frontend/tests/e2e/keyword-detail.test.tsx (test navigation, data display, chart rendering, back button)

### Backend Implementation - Detailed Keyword Endpoints

- [ ] T116 [US3] Implement getKeywordDetail() in keywords service returning keyword + prediction + acceleration + insight + stage transition history
- [ ] T117 [P] [US3] Implement GET /keywords/:id endpoint in keywords controller with detailed response including all related entities
- [ ] T118 [P] [US3] Implement GET /keywords/:id/acceleration-history?days=30 endpoint returning 30-day time-series acceleration metrics for charting
- [ ] T119 [P] [US3] Implement GET /keywords/:id/stage-transitions endpoint returning historical stage changes with transition velocity and trigger signals

### Frontend Implementation - Keyword Detail Page

- [ ] T120 [US3] Create keyword detail page in src/frontend/src/app/keyword/[id]/page.tsx with keyword info, prediction score, lifecycle stage, acceleration metrics, AI insight, stage history (Principle III)
- [ ] T121 [P] [US3] Create InsightDetail component in src/frontend/src/components/insights/InsightDetail.tsx displaying full AI insight text, timing recommendation badge, seasonality flag, rapid transition alert (Principle III)
- [ ] T122 [P] [US3] Create AccelerationChart component in src/frontend/src/components/insights/AccelerationChart.tsx with Recharts line chart for 30-day acceleration history (searchAcceleration, videoVelocity, creatorAdoptionRate) (Principle III)
- [ ] T123 [P] [US3] Create StageTimeline component in src/frontend/src/components/insights/StageTimeline.tsx visualizing lifecycle progression (seed → emerging → growing → viral) with timestamps and velocity indicators (Principle III)
- [ ] T124 [P] [US3] Implement keyword detail hooks in src/frontend/src/hooks/useKeywordDetail.ts with useKeyword(), useAccelerationHistory(), useStageTransitions()
- [ ] T125 [P] [US3] Add navigation from OpportunityCard to keyword detail page using Next.js Link component

### AI Insight Enhancements

- [ ] T126 [US3] Enhance AI prompt template in OpenAIProvider to include lifecycle stage explanation, growth signal analysis (search acceleration %, video velocity, creator adoption), timing recommendation rationale, seasonality warnings, rapid transition alerts
- [ ] T127 [P] [US3] Implement confidence scoring in insight generation - LOW: <14 days data, MEDIUM: 14-30 days, HIGH: 30+ days with all signals present
- [ ] T128 [P] [US3] Implement insight caching with 24hr TTL in insights service to reduce OpenAI API costs (Principle IV)

### Stage Transition Detection

- [ ] T129 [US3] Implement detectRapidTransition() in stage-transition service - flag if stage jump occurs in <7 days (normal: 7-14 days, rapid: <7 days, stagnant: >30 days)
- [ ] T130 [P] [US3] Implement getTriggerSignals() in stage-transition service - identify which acceleration metrics triggered the stage change
- [ ] T131 [P] [US3] Add rapid transition alerts to AI insights - "⚠️ Rapid stage transition detected (emerging → viral in 4 days). Opportunity window may be closing faster than normal."

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, final testing, deployment preparation

### Performance Optimization

- [ ] T132 Implement caching for GET /dashboard/emerging-opportunities with 30min TTL (Principle IV)
- [ ] T133 [P] Add database indexes for common queries: idx_keywords_lifecycle_stage, idx_keywords_user_normalized, idx_trend_data_keyword_time (Principle IV)
- [ ] T134 [P] Optimize TimescaleDB continuous aggregates for daily acceleration metrics to reduce query time (Principle IV)
- [ ] T135 [P] Implement pagination for GET /keywords endpoint (limit: 20, default page: 1) (Principle IV)
- [ ] T136 [P] Add request timeout handling (5s default) with graceful degradation (Principle III)

### Error Handling & User Experience

- [ ] T137 Implement global error handler in src/backend/src/common/filters/http-exception.filter.ts with user-friendly messages (Principle III)
- [ ] T138 [P] Add API rate limit exhaustion handling - return 429 with resetAt timestamp, frontend displays "Data collection paused due to API limits. Refreshes at {resetAt}" (Principle III)
- [ ] T139 [P] Implement insufficient data handling - display "Insufficient historical data for high-confidence prediction. Check back in 7-14 days" for keywords with <7 days data (Principle III)
- [ ] T140 [P] Add empty state for users with no keywords - display curated seed opportunities with "Add your first keyword to get personalized predictions" (Principle III)

### Documentation

- [ ] T141 Generate OpenAPI/Swagger documentation in src/backend/src/main.ts with SwaggerModule (Principle I)
- [ ] T142 [P] Create API documentation in docs/api.md with endpoint descriptions, request/response examples, error codes
- [ ] T143 [P] Create deployment guide in docs/deployment.md with Docker setup, environment variables, database migrations, TimescaleDB initialization
- [ ] T144 [P] Update README.md with project overview, architecture diagram, quick start guide, testing instructions

### Final Integration Tests

- [ ] T145 E2E test for complete user flow in src/backend/test/e2e/complete-flow.test.ts: register → login → view dashboard → add keyword → view keyword detail → verify prediction score updates over simulated time
- [ ] T146 [P] E2E test for seed keywords in src/backend/test/e2e/seed-keywords.test.ts: verify 20 seed keywords exist, have prediction scores, appear in dashboard for new users
- [ ] T147 [P] Load testing for dashboard endpoint with Artillery or k6 - verify <2s load time with 100 concurrent users (Principle IV)
- [ ] T148 [P] Regression tests for lifecycle classification accuracy in src/backend/test/regression/classification-accuracy.test.ts - spot-check 100 keywords against manual expert classification (90% accuracy target)

### Deployment Preparation

- [ ] T149 Create production Dockerfile for backend in infrastructure/Dockerfile.backend with multi-stage build
- [ ] T150 [P] Create production Dockerfile for trend-collector in infrastructure/Dockerfile.collector
- [ ] T151 [P] Create production Dockerfile for frontend in infrastructure/Dockerfile.frontend with Next.js standalone build
- [ ] T152 [P] Update docker-compose.yml with production environment variables, health checks, resource limits
- [ ] T153 [P] Create database backup script in infrastructure/scripts/backup-db.sh for PostgreSQL + TimescaleDB
- [ ] T154 [P] Configure monitoring and logging with Winston in src/backend/src/common/logger/logger.service.ts (structured JSON logs for production)

---

## Task Dependencies (User Story Completion Order)

**Critical Path**:
1. **Phase 1 (Setup)** → **Phase 2 (Foundational)** MUST complete first
2. **Phase 3 (US1)**, **Phase 4 (US2)**, **Phase 5 (US3)** can run partially in parallel once Phase 2 complete:
   - US1 backend implementation → US2 backend implementation (keywords service dependency)
   - US1 frontend implementation can run parallel to US2 backend
   - US3 builds on US1 + US2 (requires keyword detail endpoint from US2, lifecycle insights from US1)
3. **Phase 6 (Polish)** requires all user stories complete

**Parallel Execution Opportunities**:

### After Phase 2 Complete:
- **Track A**: US1 backend (lifecycle, acceleration, prediction, insights, dashboard endpoints)
- **Track B**: US2 backend (keywords CRUD, monitoring)
- **Track C**: US1 frontend (dashboard page, OpportunityCard, filters)
- **Track D**: Python microservice tests (can run entirely parallel)

### After US1 Backend Complete:
- **Track A**: US1 frontend completion (dashboard page)
- **Track B**: US2 frontend (AddKeywordForm, KeywordList)
- **Track C**: US3 backend (keyword detail endpoints, stage transitions)

### After US1 + US2 Complete:
- **Track A**: US3 frontend (keyword detail page, charts, timeline)
- **Track B**: Phase 6 polish tasks (performance optimization, error handling)

---

## Implementation Strategy

**MVP Scope**: 
- Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (User Story 1) = Minimum Viable Product
- Users can view emerging opportunities with prediction scores, lifecycle stages, and AI insights
- Seed keywords provide immediate value without user configuration

**Incremental Delivery**:
1. **Week 1-2**: Phase 1 + Phase 2 (foundation)
2. **Week 3-4**: Phase 3 (US1 - dashboard with emerging opportunities) → MVP RELEASE
3. **Week 5**: Phase 4 (US2 - custom keyword monitoring)
4. **Week 6**: Phase 5 (US3 - detailed lifecycle insights)
5. **Week 7**: Phase 6 (polish, optimization, deployment)

**Quality Gates** (per Constitution Principle II):
- [ ] All unit tests passing (80% coverage minimum)
- [ ] All integration tests passing
- [ ] E2E tests passing for completed user stories
- [ ] Linting and type checking passing
- [ ] Performance benchmarks met (<2s dashboard, <500ms API)
- [ ] Security validation complete (auth required, rate limiting active, input validation enforced)
- [ ] Lifecycle classification accuracy validated (90% match manual expert classification)

---

**Total Tasks**: 154  
**User Story Breakdown**: Setup (12) + Foundational (51) + US1 (31) + US2 (17) + US3 (20) + Polish (23)  
**Parallel Opportunities**: 89 tasks marked [P] can run in parallel  
**Estimated Timeline**: 7 weeks with 2-3 developers

**Next Steps**: Execute `/speckit.implement` to begin task execution with TDD workflow and requirement tracing
