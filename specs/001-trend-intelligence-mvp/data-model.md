# Data Model: TrendMind Trend Prediction Platform

**Created**: 2026-06-04  
**Last Updated**: 2026-06-08  
**Phase**: 1 (Design & Contracts)  
**Purpose**: Define database schema, entities, and relationships for trend prediction, lifecycle classification, and acceleration-based signals

## Entity Relationship Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1
       │
       │ *
┌──────┴──────────┐
│    Keyword      │◄─────────────┐
└──────┬──────────┘              │
       │ 1                       │ *
       │                    ┌────┴────────────────┐
       │ *                  │   SeedKeyword       │
┌──────┴────────────────┐   │   (global, no user) │
│  TrendDataPoint       │   └─────────────────────┘
│  (time-series)        │
└──────┬────────────────┘
       │ 1
       │
       ├────────────────┐
       │ 1              │ 1
       │                │
┌──────┴────────────┐   │
│ AccelerationMetrics│   │
│ (derived)          │   │
└────────────────────┘   │
       │ 1               │
       │                 │
       │ 1               │
┌──────┴─────────────┐   │
│ PredictionScore    │   │
│ (calculated)       │   │
└────────────────────┘   │
       │ 1               │
       │                 │
       │ 0..1            │
┌──────┴────────────┐    │
│   AIInsight       │    │
└───────────────────┘    │
                         │
                         │ 1
                  ┌──────┴──────────────────┐
                  │ StageTransitionEvent    │
                  │ (historical)            │
                  └─────────────────────────┘
```

## Entities

### User

Represents an authenticated user of the platform.

**Attributes**:
- `id` (UUID, PK): Unique user identifier
- `email` (string, unique, not null): User email for authentication
- `password_hash` (string, not null): Bcrypt-hashed password
- `created_at` (timestamp): Account creation timestamp
- `updated_at` (timestamp): Last account update
- `is_active` (boolean): Account status flag

**Relationships**:
- One-to-many with `Keyword`

**Validation Rules**:
- Email must be valid format
- Password minimum 8 characters (enforced before hashing)

**Indexes**:
- `idx_users_email` on `email` (unique)

---

### Keyword

Represents a product keyword being monitored with lifecycle stage classification.

**Attributes**:
- `id` (UUID, PK): Unique keyword identifier
- `user_id` (UUID, FK → User, nullable): Owner user (null for seed keywords)
- `original_term` (string, not null): Original keyword as entered by user
- `normalized_form` (string, not null): Normalized form (lowercase, no punctuation, singular)
- `current_lifecycle_stage` (enum: 'seed', 'emerging', 'growing', 'viral', 'saturated', 'declining'): Current product lifecycle stage
- `stage_entered_at` (timestamp): When current stage was entered
- `is_seed_keyword` (boolean, default false): Whether this is a system seed keyword
- `monitoring_status` (enum: 'active', 'paused', 'failed'): Current monitoring state
- `created_at` (timestamp): When keyword was added
- `updated_at` (timestamp): Last modification
- `last_collected_at` (timestamp, nullable): Last successful trend data collection

**Relationships**:
- Many-to-one with `User` (nullable for seed keywords)
- One-to-many with `TrendDataPoint`
- One-to-many with `AccelerationMetrics`
- One-to-many with `PredictionScore`
- One-to-many with `AIInsight`
- One-to-many with `StageTransitionEvent`

**Lifecycle Stages**:
- `seed`: Low volume, low momentum (early product, minimal signals)
- `emerging`: Low-medium volume, high acceleration (early growth stage)
- `growing`: Medium volume, sustained momentum (expanding adoption)
- `viral`: High volume, high engagement (mainstream adoption)
- `saturated`: High volume, declining momentum (market saturation)
- `declining`: Declining volume, negative momentum (fading trend)

**Validation Rules**:
- `original_term` length: 1-100 characters
- `normalized_form` must not contain punctuation or uppercase
- User-keyword combination must be unique per `normalized_form`
- `current_lifecycle_stage` must be valid enum value

**Indexes**:
- `idx_keywords_user_normalized` on `(user_id, normalized_form)` (unique, partial: where user_id is not null)
- `idx_keywords_normalized` on `normalized_form` (for global seed keywords)
- `idx_keywords_seed` on `is_seed_keyword` (for quick seed keyword queries)
- `idx_keywords_lifecycle_stage` on `current_lifecycle_stage` (for stage-filtered queries)

**Unique Constraint**:
```sql
-- Prevent duplicate keywords per user
CREATE UNIQUE INDEX idx_user_keywords_unique 
ON keywords(user_id, normalized_form) 
WHERE user_id IS NOT NULL;

-- Prevent duplicate seed keywords
CREATE UNIQUE INDEX idx_seed_keywords_unique 
ON keywords(normalized_form) 
WHERE is_seed_keyword = true;
```

---

### TrendDataPoint

Represents a single measurement of trend signals from a provider (Google Trends or YouTube). Time-series data optimized for acceleration calculations.

**Attributes**:
- `id` (UUID, PK): Unique data point identifier
- `keyword_id` (UUID, FK → Keyword, not null): Associated keyword
- `provider` (enum: 'google_trends', 'youtube'): Source of trend data
- `timestamp` (timestamp, not null): When this data was collected
- `search_volume` (integer, nullable): Google Trends interest score (0-100)
- `video_count` (integer, nullable): YouTube video count for keyword search
- `view_count` (bigint, nullable): Sum of views across top YouTube results
- `unique_creators` (integer, nullable): Count of unique channel IDs
- `engagement_rate` (numeric, nullable): (Likes + Comments) / Views (YouTube)
- `related_query_breakouts` (integer, nullable): Count of related queries with "breakout" status
- `raw_response` (JSONB): Complete API response for debugging
- `collection_status` (enum: 'success', 'partial', 'failed'): Data collection outcome
- `error_message` (text, nullable): Error details if collection failed
- `created_at` (timestamp): Record creation timestamp

**Relationships**:
- Many-to-one with `Keyword`

**JSONB Structures**:
```typescript
// raw_response example (YouTube)
{
  "videos": [
    {
      "video_id": "abc123",
      "title": "Product Review",
      "channel_id": "channel_xyz",
      "view_count": 125000,
      "like_count": 4500,
      "comment_count": 320
    }
  ],
  "total_results": 150
}
```

**Validation Rules**:
- `search_volume` between 0 and 100 (Google Trends scale)
- `timestamp` cannot be in the future
- At least one signal metric must be present (search_volume, video_count, view_count)
- `engagement_rate` between 0 and 1.0 (capped at 10% = 0.1)

**Indexes**:
- `idx_trend_data_keyword_time` on `(keyword_id, timestamp DESC)` (for time-series acceleration queries)
- `idx_trend_data_provider_time` on `(provider, timestamp DESC)` (for provider-specific queries)

**Time-Series Optimization** (TimescaleDB):
```sql
-- Convert to hypertable for time-series partitioning
SELECT create_hypertable('trend_data_points', 'timestamp');

-- Retention policy: auto-delete data older than 90 days
SELECT add_retention_policy('trend_data_points', INTERVAL '90 days');
```

---

### AccelerationMetrics

Derived metrics measuring growth velocity and momentum. Calculated from historical TrendDataPoint comparisons.

**Attributes**:
- `id` (UUID, PK): Unique metrics identifier
- `keyword_id` (UUID, FK → Keyword, not null): Associated keyword
- `calculation_timestamp` (timestamp, not null): When metrics were calculated
- `search_acceleration` (numeric): Percentage change in search volume over 14 days (-1.0 to +∞)
- `search_acceleration_7d` (numeric): 7-day search acceleration (rapid signals)
- `search_acceleration_30d` (numeric): 30-day search acceleration (trend trajectory)
- `video_velocity` (numeric): New videos per day over last 7 days
- `view_velocity` (numeric): View growth rate (percentage change in views/day)
- `creator_adoption_rate` (numeric): New unique creators per day over last 7 days
- `related_query_growth` (numeric): Percentage of related queries with breakout growth (0-1)
- `confidence_level` (enum: 'low', 'medium', 'high'): Data confidence based on history
- `historical_data_days` (integer): Number of days of historical data available

**Relationships**:
- Many-to-one with `Keyword`

**Calculation Windows**:
- Primary acceleration: 14-day window (balanced signal/noise)
- Short-term: 7-day window (early signals)
- Long-term: 30-day window (trajectory confirmation)

**Validation Rules**:
- `search_acceleration` can be negative (declining trends)
- `video_velocity` must be >= 0
- `creator_adoption_rate` must be >= 0
- `confidence_level` determined by:
  - LOW: <14 days historical data OR <50% signal coverage
  - MEDIUM: 14-30 days historical data AND 50-80% signal coverage
  - HIGH: 30+ days historical data AND >80% signal coverage

**Indexes**:
- `idx_acceleration_keyword_time` on `(keyword_id, calculation_timestamp DESC)`
- `idx_acceleration_confidence` on `confidence_level` (for filtering reliable predictions)

**Continuous Aggregate** (TimescaleDB):
```sql
-- Pre-computed daily acceleration metrics for performance
CREATE MATERIALIZED VIEW daily_acceleration_metrics
WITH (timescaledb.continuous) AS
SELECT
  keyword_id,
  time_bucket('1 day', timestamp) AS day,
  provider,
  AVG(search_volume) as avg_search_volume,
  MAX(video_count) - MIN(video_count) as videos_added,
  MAX(unique_creators) - MIN(unique_creators) as new_creators
FROM trend_data_points
GROUP BY keyword_id, day, provider;
```

---

### PredictionScore

Calculated score estimating probability of significant growth in next 7-30 days. Replaces the old OpportunityScore concept.

**Attributes**:
- `id` (UUID, PK): Unique score identifier
- `keyword_id` (UUID, FK → Keyword, not null): Associated keyword
- `score` (integer, not null): Prediction score 0-100
- `calculation_timestamp` (timestamp, not null): When score was calculated
- `search_acceleration_component` (numeric): Weighted contribution (30%)
- `video_velocity_component` (numeric): Weighted contribution (25%)
- `creator_adoption_component` (numeric): Weighted contribution (20%)
- `related_query_growth_component` (numeric): Weighted contribution (15%)
- `view_velocity_component` (numeric): Weighted contribution (10%)
- `confidence_level` (enum: 'low', 'medium', 'high'): Prediction confidence
- `previous_score` (integer, nullable): Previous score for comparison
- `score_change` (integer, nullable): Change from previous score

**Relationships**:
- Many-to-one with `Keyword`

**Prediction Formula**:
```
PredictionScore = (
  searchAccelerationPercentile × 0.30 +
  videoVelocityPercentile × 0.25 +
  creatorAdoptionPercentile × 0.20 +
  relatedQueryGrowthPercentile × 0.15 +
  viewVelocityPercentile × 0.10
) × 100

Where each component is normalized to 0-1 percentile rank
```

**Validation Rules**:
- `score` between 0 and 100
- Components sum to approximately 1.0 before scaling
- `confidence_level` inherited from AccelerationMetrics
- Score components should be >= 0

**Indexes**:
- `idx_prediction_keyword_time` on `(keyword_id, calculation_timestamp DESC)`
- `idx_prediction_score_desc` on `(score DESC, calculation_timestamp DESC)` (for top opportunities dashboard)
- `idx_prediction_confidence` on `(confidence_level, score DESC)` (for high-confidence predictions)

**Cache Strategy**:
- Cache prediction scores for 30 minutes (shorter than trend data to reflect rapid changes)
- Invalidate cache when new acceleration metrics calculated

---

### AIInsight

AI-generated explanation of lifecycle stage, growth signals, and timing recommendations.

**Attributes**:
- `id` (UUID, PK): Unique insight identifier
- `keyword_id` (UUID, FK → Keyword, not null): Associated keyword
- `insight_text` (text, not null): Generated insight explaining stage and timing (2-3 sentences)
- `lifecycle_stage_explained` (string): Which lifecycle stage is being explained
- `timing_recommendation` (enum: 'early', 'on_time', 'late', 'avoid'): User timing guidance
- `seasonality_flag` (boolean): Whether seasonal pattern detected
- `rapid_transition_flag` (boolean): Whether rapid stage transition detected
- `confidence_score` (integer): AI confidence 0-100
- `generation_timestamp` (timestamp, not null): When insight was generated
- `ai_provider` (string): Provider used (e.g., 'openai-gpt4')
- `token_count` (integer, nullable): Tokens used for cost tracking
- `prompt_version` (string): Version of prompt template used

**Relationships**:
- Many-to-one with `Keyword`

**Timing Recommendations**:
- `early`: Product in Seed/Emerging stage, excellent opportunity window
- `on_time`: Product in Growing stage, good opportunity but rising competition
- `late`: Product in Viral/Saturated stage, opportunity window closing
- `avoid`: Product in Declining stage or strong seasonality flag

**Validation Rules**:
- `insight_text` length: 50-500 characters
- `confidence_score` between 0 and 100
- `lifecycle_stage_explained` must match keyword's current stage

**Indexes**:
- `idx_ai_insights_keyword_time` on `(keyword_id, generation_timestamp DESC)`
- `idx_ai_insights_timing` on `timing_recommendation` (for filtering opportunities by timing)

**Cache Strategy**:
- Cache insights for 24 hours (longer than prediction scores)
- Regenerate only when:
  - Lifecycle stage changes
  - Prediction score changes >20 points
  - Rapid transition detected

**Prompt Template Context**:
```typescript
interface InsightContext {
  keyword: string;
  predictionScore: number;
  lifecycleStage: string;
  searchAcceleration: number;
  videoVelocity: number;
  creatorAdoptionRate: number;
  confidenceLevel: string;
  rapidTransition: boolean;
  seasonalPattern: boolean;
}
```

---

### StageTransitionEvent

Historical record of lifecycle stage changes for analytics and rapid transition detection.

**Attributes**:
- `id` (UUID, PK): Unique event identifier
- `keyword_id` (UUID, FK → Keyword, not null): Associated keyword
- `previous_stage` (enum: lifecycle stages): Stage before transition
- `new_stage` (enum: lifecycle stages): Stage after transition
- `transition_timestamp` (timestamp, not null): When transition occurred
- `trigger_signals` (string array): Signals that triggered transition (e.g., ["searchAcceleration", "videoVelocity"])
- `transition_velocity` (enum: 'normal', 'rapid', 'stagnant'): Transition speed classification
- `days_in_previous_stage` (integer): Duration in previous stage
- `acceleration_at_transition` (numeric): Search acceleration value at transition point

**Relationships**:
- Many-to-one with `Keyword`

**Transition Velocity Classification**:
- `normal`: 7-21 days in previous stage (typical progression)
- `rapid`: <7 days in previous stage (viral acceleration)
- `stagnant`: >30 days in previous stage (false signal or plateau)

**Validation Rules**:
- `previous_stage` must differ from `new_stage`
- `days_in_previous_stage` must be >= 0
- `trigger_signals` must be non-empty array

**Indexes**:
- `idx_stage_transition_keyword_time` on `(keyword_id, transition_timestamp DESC)` (for historical stage analysis)
- `idx_stage_transition_velocity` on `transition_velocity` (for rapid transition alerts)

**Analytics Use Cases**:
- Detect products with rapid viral acceleration patterns
- Identify typical stage transition timelines per product category
- Train future ML models on historical stage progression data

---

## Database Schema (PostgreSQL + TimescaleDB)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);

-- Keywords table
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_term VARCHAR(100) NOT NULL,
  normalized_form VARCHAR(100) NOT NULL,
  current_lifecycle_stage VARCHAR(20) NOT NULL DEFAULT 'seed',
  stage_entered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_seed_keyword BOOLEAN DEFAULT false,
  monitoring_status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_collected_at TIMESTAMP,
  
  CHECK (current_lifecycle_stage IN ('seed', 'emerging', 'growing', 'viral', 'saturated', 'declining')),
  CHECK (monitoring_status IN ('active', 'paused', 'failed'))
);

CREATE UNIQUE INDEX idx_user_keywords_unique ON keywords(user_id, normalized_form) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_seed_keywords_unique ON keywords(normalized_form) WHERE is_seed_keyword = true;
CREATE INDEX idx_keywords_seed ON keywords(is_seed_keyword);
CREATE INDEX idx_keywords_lifecycle_stage ON keywords(current_lifecycle_stage);

-- Trend data points table (TimescaleDB hypertable)
CREATE TABLE trend_data_points (
  id UUID DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  search_volume INTEGER,
  video_count INTEGER,
  view_count BIGINT,
  unique_creators INTEGER,
  engagement_rate NUMERIC(5,4),
  related_query_breakouts INTEGER,
  raw_response JSONB,
  collection_status VARCHAR(20) NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (provider IN ('google_trends', 'youtube')),
  CHECK (collection_status IN ('success', 'partial', 'failed')),
  CHECK (search_volume IS NULL OR (search_volume >= 0 AND search_volume <= 100)),
  CHECK (engagement_rate IS NULL OR (engagement_rate >= 0 AND engagement_rate <= 0.1))
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('trend_data_points', 'timestamp');

-- Retention policy: auto-delete data older than 90 days
SELECT add_retention_policy('trend_data_points', INTERVAL '90 days');

CREATE INDEX idx_trend_data_keyword_time ON trend_data_points(keyword_id, timestamp DESC);
CREATE INDEX idx_trend_data_provider_time ON trend_data_points(provider, timestamp DESC);

-- Acceleration metrics table
CREATE TABLE acceleration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  calculation_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  search_acceleration NUMERIC,
  search_acceleration_7d NUMERIC,
  search_acceleration_30d NUMERIC,
  video_velocity NUMERIC,
  view_velocity NUMERIC,
  creator_adoption_rate NUMERIC,
  related_query_growth NUMERIC,
  confidence_level VARCHAR(10) NOT NULL,
  historical_data_days INTEGER NOT NULL,
  
  CHECK (confidence_level IN ('low', 'medium', 'high')),
  CHECK (historical_data_days >= 0),
  CHECK (video_velocity IS NULL OR video_velocity >= 0),
  CHECK (creator_adoption_rate IS NULL OR creator_adoption_rate >= 0)
);

CREATE INDEX idx_acceleration_keyword_time ON acceleration_metrics(keyword_id, calculation_timestamp DESC);
CREATE INDEX idx_acceleration_confidence ON acceleration_metrics(confidence_level);

-- Prediction scores table
CREATE TABLE prediction_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  calculation_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  search_acceleration_component NUMERIC NOT NULL,
  video_velocity_component NUMERIC NOT NULL,
  creator_adoption_component NUMERIC NOT NULL,
  related_query_growth_component NUMERIC NOT NULL,
  view_velocity_component NUMERIC NOT NULL,
  confidence_level VARCHAR(10) NOT NULL,
  previous_score INTEGER,
  score_change INTEGER,
  
  CHECK (score >= 0 AND score <= 100),
  CHECK (confidence_level IN ('low', 'medium', 'high')),
  CHECK (search_acceleration_component >= 0 AND search_acceleration_component <= 1),
  CHECK (video_velocity_component >= 0 AND video_velocity_component <= 1),
  CHECK (creator_adoption_component >= 0 AND creator_adoption_component <= 1),
  CHECK (related_query_growth_component >= 0 AND related_query_growth_component <= 1),
  CHECK (view_velocity_component >= 0 AND view_velocity_component <= 1)
);

CREATE INDEX idx_prediction_keyword_time ON prediction_scores(keyword_id, calculation_timestamp DESC);
CREATE INDEX idx_prediction_score_desc ON prediction_scores(score DESC, calculation_timestamp DESC);
CREATE INDEX idx_prediction_confidence ON prediction_scores(confidence_level, score DESC);

-- AI insights table
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  lifecycle_stage_explained VARCHAR(20) NOT NULL,
  timing_recommendation VARCHAR(10) NOT NULL,
  seasonality_flag BOOLEAN DEFAULT false,
  rapid_transition_flag BOOLEAN DEFAULT false,
  confidence_score INTEGER,
  generation_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ai_provider VARCHAR(50) NOT NULL,
  token_count INTEGER,
  prompt_version VARCHAR(20),
  
  CHECK (timing_recommendation IN ('early', 'on_time', 'late', 'avoid')),
  CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
  CHECK (char_length(insight_text) >= 50 AND char_length(insight_text) <= 500)
);

CREATE INDEX idx_ai_insights_keyword_time ON ai_insights(keyword_id, generation_timestamp DESC);
CREATE INDEX idx_ai_insights_timing ON ai_insights(timing_recommendation);

-- Stage transition events table
CREATE TABLE stage_transition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  previous_stage VARCHAR(20) NOT NULL,
  new_stage VARCHAR(20) NOT NULL,
  transition_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trigger_signals TEXT[] NOT NULL,
  transition_velocity VARCHAR(10) NOT NULL,
  days_in_previous_stage INTEGER NOT NULL,
  acceleration_at_transition NUMERIC,
  
  CHECK (previous_stage IN ('seed', 'emerging', 'growing', 'viral', 'saturated', 'declining')),
  CHECK (new_stage IN ('seed', 'emerging', 'growing', 'viral', 'saturated', 'declining')),
  CHECK (previous_stage != new_stage),
  CHECK (transition_velocity IN ('normal', 'rapid', 'stagnant')),
  CHECK (days_in_previous_stage >= 0)
);

CREATE INDEX idx_stage_transition_keyword_time ON stage_transition_events(keyword_id, transition_timestamp DESC);
CREATE INDEX idx_stage_transition_velocity ON stage_transition_events(transition_velocity);

-- Continuous aggregate for daily acceleration (TimescaleDB)
CREATE MATERIALIZED VIEW daily_acceleration_metrics
WITH (timescaledb.continuous) AS
SELECT
  keyword_id,
  time_bucket('1 day', timestamp) AS day,
  provider,
  AVG(search_volume) as avg_search_volume,
  MAX(video_count) - MIN(video_count) as videos_added,
  MAX(unique_creators) - MIN(unique_creators) as new_creators,
  AVG(engagement_rate) as avg_engagement_rate
FROM trend_data_points
GROUP BY keyword_id, day, provider;

-- Refresh policy: update aggregates every hour
SELECT add_continuous_aggregate_policy('daily_acceleration_metrics',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');
```

## TypeORM Entities (TypeScript)

```typescript
// User entity
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Keyword, keyword => keyword.user)
  keywords: Keyword[];
}

// Keyword entity
export enum LifecycleStage {
  SEED = 'seed',
  EMERGING = 'emerging',
  GROWING = 'growing',
  VIRAL = 'viral',
  SATURATED = 'saturated',
  DECLINING = 'declining'
}

@Entity('keywords')
export class Keyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.keywords, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'original_term' })
  originalTerm: string;

  @Column({ name: 'normalized_form' })
  normalizedForm: string;

  @Column({ 
    name: 'current_lifecycle_stage',
    type: 'enum',
    enum: LifecycleStage,
    default: LifecycleStage.SEED
  })
  currentLifecycleStage: LifecycleStage;

  @Column({ name: 'stage_entered_at' })
  stageEnteredAt: Date;

  @Column({ name: 'is_seed_keyword', default: false })
  isSeedKeyword: boolean;

  @Column({ name: 'monitoring_status', default: 'active' })
  monitoringStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_collected_at', nullable: true })
  lastCollectedAt: Date;

  @OneToMany(() => TrendDataPoint, tdp => tdp.keyword)
  trendDataPoints: TrendDataPoint[];

  @OneToMany(() => AccelerationMetrics, am => am.keyword)
  accelerationMetrics: AccelerationMetrics[];

  @OneToMany(() => PredictionScore, ps => ps.keyword)
  predictionScores: PredictionScore[];

  @OneToMany(() => AIInsight, ai => ai.keyword)
  aiInsights: AIInsight[];

  @OneToMany(() => StageTransitionEvent, ste => ste.keyword)
  stageTransitionEvents: StageTransitionEvent[];
}
```

## Data Retention & Archival

**Retention Policies**:
- `trend_data_points`: 90 days (TimescaleDB auto-deletion)
- `acceleration_metrics`: 90 days (aligned with trend data)
- `prediction_scores`: 90 days (historical scoring analysis)
- `ai_insights`: 365 days (training data for future AI tuning)
- `stage_transition_events`: Indefinite (small footprint, valuable analytics)

**Archival Strategy** (Post-MVP):
- Export aggregated daily metrics to data warehouse for long-term analysis
- Retain stage transition patterns for ML model training
- Archive prediction score accuracy data for model validation

## Queries & Performance

**Common Query Patterns**:

1. **Top Emerging Opportunities Dashboard**:
```sql
SELECT k.id, k.original_term, k.current_lifecycle_stage,
       ps.score, ps.confidence_level,
       ai.insight_text, ai.timing_recommendation
FROM keywords k
JOIN prediction_scores ps ON k.id = ps.keyword_id
JOIN ai_insights ai ON k.id = ai.keyword_id
WHERE k.monitoring_status = 'active'
  AND k.current_lifecycle_stage IN ('seed', 'emerging')
  AND ps.calculation_timestamp = (
    SELECT MAX(calculation_timestamp) 
    FROM prediction_scores 
    WHERE keyword_id = k.id
  )
  AND ai.generation_timestamp = (
    SELECT MAX(generation_timestamp)
    FROM ai_insights
    WHERE keyword_id = k.id
  )
ORDER BY ps.score DESC, k.current_lifecycle_stage ASC
LIMIT 10;
```

2. **Acceleration Metrics for Keyword**:
```sql
SELECT am.*
FROM acceleration_metrics am
WHERE am.keyword_id = $1
  AND am.confidence_level IN ('medium', 'high')
ORDER BY am.calculation_timestamp DESC
LIMIT 30;
```

3. **Rapid Stage Transitions**:
```sql
SELECT ste.*, k.original_term
FROM stage_transition_events ste
JOIN keywords k ON ste.keyword_id = k.id
WHERE ste.transition_velocity = 'rapid'
  AND ste.transition_timestamp >= NOW() - INTERVAL '7 days'
ORDER BY ste.transition_timestamp DESC;
```

---

**Data model complete. Ready for Phase 1 contracts.**
