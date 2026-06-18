# Research: TrendMind Trend Prediction Platform

**Date**: 2026-06-08 | **Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

This document captures research findings, technology decisions, and best practices for implementing TrendMind's trend prediction capabilities, lifecycle classification, and acceleration-based signal analysis.

---

## 1. Lifecycle Classification Engine

### Decision: Rule-Based Classification for MVP

**Chosen Approach**: Rule-based multi-signal threshold classification engine

**Rationale**:
- Machine learning requires large labeled training dataset (thousands of classified product trends) which doesn't exist for MVP
- Rule-based approach provides transparent, debuggable classification logic
- Allows rapid iteration on threshold tuning based on user feedback
- Establishes baseline for future ML model comparison

**Classification Rules**:

\`\`\`typescript
// Pseudo-code for lifecycle stage classification
function classifyLifecycleStage(metrics: AccelerationMetrics): LifecycleStage {
  const { searchVolume, searchAcceleration, videoVelocity, creatorAdoptionRate } = metrics;
  
  // Seed: Low absolute volume, low momentum
  if (searchVolume < 1000 && searchAcceleration < 0.05) {
    return LifecycleStage.SEED;
  }
  
  // Emerging: Low-medium volume, high acceleration
  if (searchVolume < 5000 && searchAcceleration > 0.20 && creatorAdoptionRate > 0.15) {
    return LifecycleStage.EMERGING;
  }
  
  // Growing: Medium volume, sustained momentum
  if (searchVolume >= 5000 && searchVolume < 20000 && searchAcceleration > 0.10) {
    return LifecycleStage.GROWING;
  }
  
  // Viral: High volume, high absolute engagement
  if (searchVolume >= 20000 && videoVelocity > 50) {
    return LifecycleStage.VIRAL;
  }
  
  // Saturated: High volume, declining momentum
  if (searchVolume >= 20000 && searchAcceleration < -0.05) {
    return LifecycleStage.SATURATED;
  }
  
  // Declining: Declining volume, negative momentum
  if (searchAcceleration < -0.15) {
    return LifecycleStage.DECLINING;
  }
  
  return LifecycleStage.SEED; // Default
}
\`\`\`

**Threshold Configuration**:
- Store thresholds in database configuration table (allows A/B testing different thresholds)
- Admin interface for threshold adjustment (post-MVP)
- Log all classification decisions for later ML training dataset

**Alternatives Considered**:
- **K-means clustering**: Rejected - unsupervised learning won't align with user-meaningful stages
- **Random Forest classifier**: Rejected - requires labeled training data unavailable for MVP
- **Manual classification**: Rejected - doesn't scale, introduces inconsistency

---

## 2. Prediction Score Algorithm

### Decision: Weighted Acceleration-Focused Scoring

**Chosen Approach**: Linear weighted combination of acceleration metrics with configurable weights

**Formula**:
\`\`\`
PredictionScore = (
  SearchAcceleration × 0.30 +
  VideoVelocity × 0.25 +
  CreatorAdoptionRate × 0.20 +
  RelatedQueryGrowth × 0.15 +
  ViewVelocity × 0.10
) × 100

Normalized to 0-100 scale
\`\`\`

**Rationale**:
- Search Acceleration (30%): Primary indicator of growing public interest
- Video Velocity (25%): Proxy for creator supply entering market
- Creator Adoption Rate (20%): Signals ecosystem building around product
- Related Query Growth (15%): Indicates expanding search interest variations
- View Velocity (10%): Confirms content engagement (lagging indicator)

**Normalization Strategy**:
1. Collect percentile distributions of each metric across all monitored keywords
2. Convert raw metric to percentile rank (0-1 scale)
3. Apply weights and scale to 0-100

**Implementation**:
\`\`\`typescript
interface PredictionScoreWeights {
  searchAcceleration: number;    // 0.30
  videoVelocity: number;          // 0.25
  creatorAdoptionRate: number;    // 0.20
  relatedQueryGrowth: number;     // 0.15
  viewVelocity: number;           // 0.10
}

function calculatePredictionScore(
  metrics: AccelerationMetrics,
  weights: PredictionScoreWeights
): number {
  const normalized = {
    searchAcceleration: percentileRank(metrics.searchAcceleration, 'searchAcceleration'),
    videoVelocity: percentileRank(metrics.videoVelocity, 'videoVelocity'),
    creatorAdoptionRate: percentileRank(metrics.creatorAdoptionRate, 'creatorAdoptionRate'),
    relatedQueryGrowth: percentileRank(metrics.relatedQueryGrowth, 'relatedQueryGrowth'),
    viewVelocity: percentileRank(metrics.viewVelocity, 'viewVelocity')
  };
  
  const score = (
    normalized.searchAcceleration * weights.searchAcceleration +
    normalized.videoVelocity * weights.videoVelocity +
    normalized.creatorAdoptionRate * weights.creatorAdoptionRate +
    normalized.relatedQueryGrowth * weights.relatedQueryGrowth +
    normalized.viewVelocity * weights.viewVelocity
  ) * 100;
  
  return Math.round(Math.max(0, Math.min(100, score)));
}
\`\`\`

**Weight Tuning Process**:
1. Start with theoretical weights based on research
2. Validate against historical trending products (manually labeled dataset)
3. Adjust weights to maximize correlation between high scores and actual trend emergence
4. Store weights in configuration for easy experimentation

**Alternatives Considered**:
- **Gradient boosting**: Rejected for MVP - requires labeled training data
- **Simple average**: Rejected - all signals not equally predictive
- **Multiplicative scoring**: Rejected - missing data in one signal zeros entire score

---

## 3. Acceleration Calculation Approaches

### Decision: Multi-Window Rate of Change Analysis

**Chosen Approach**: Calculate percentage change across multiple time windows (7-day, 14-day, 30-day)

**Rationale**:
- Single time window misses trends at different velocities
- Short window (7-day) catches rapid emerging trends
- Medium window (14-day) filters noise, confirms sustained growth
- Long window (30-day) identifies longer-term trajectory

**Calculation Logic**:
\`\`\`typescript
function calculateSearchAcceleration(
  currentValue: number,
  previousValues: { timestamp: Date; value: number }[]
): AccelerationMetrics {
  const sevenDayAgo = getPreviousValue(previousValues, 7);
  const fourteenDayAgo = getPreviousValue(previousValues, 14);
  const thirtyDayAgo = getPreviousValue(previousValues, 30);
  
  return {
    acceleration7d: ((currentValue - sevenDayAgo) / sevenDayAgo) || 0,
    acceleration14d: ((currentValue - fourteenDayAgo) / fourteenDayAgo) || 0,
    acceleration30d: ((currentValue - thirtyDayAgo) / thirtyDayAgo) || 0,
    // Use 14-day as primary acceleration metric (balanced signal/noise)
    primaryAcceleration: ((currentValue - fourteenDayAgo) / fourteenDayAgo) || 0
  };
}
\`\`\`

**Edge Cases**:
- Division by zero: Return 0 if previous value is 0
- Missing data points: Interpolate if 1-2 days missing, otherwise flag as "Insufficient Data"
- Negative values: Google Trends returns 0-100 relative scale, never negative

**Video Velocity Calculation**:
\`\`\`typescript
function calculateVideoVelocity(
  videoCountHistory: { timestamp: Date; count: number }[]
): number {
  const currentCount = videoCountHistory[0].count;
  const sevenDaysAgoCount = getPreviousValue(videoCountHistory, 7).count;
  
  // Videos added per day over last 7 days
  return (currentCount - sevenDaysAgoCount) / 7;
}
\`\`\`

**Creator Adoption Rate**:
\`\`\`typescript
function calculateCreatorAdoptionRate(
  creatorCountHistory: { timestamp: Date; uniqueCreators: number }[]
): number {
  const currentCreators = creatorCountHistory[0].uniqueCreators;
  const sevenDaysAgoCreators = getPreviousValue(creatorCountHistory, 7).uniqueCreators;
  
  // New unique creators per day over last 7 days
  return (currentCreators - sevenDaysAgoCreators) / 7;
}
\`\`\`

**Alternatives Considered**:
- **Linear regression slope**: Rejected - computationally expensive for real-time dashboard
- **Exponential moving average**: Rejected - obscures recent acceleration spikes
- **Day-over-day only**: Rejected - too noisy, susceptible to weekend/weekday patterns

---

## 4. Signal Normalization Layer

### Decision: Provider-Agnostic Signal Interface with Normalization Adapters

**Chosen Approach**: Common signal interface with provider-specific adapters that normalize metrics to comparable scales

**Interface Design**:
\`\`\`typescript
interface SignalProvider {
  readonly name: string;
  collectSignals(keyword: string): Promise<RawSignalData>;
  normalizeSignals(raw: RawSignalData): NormalizedSignals;
}

interface NormalizedSignals {
  timestamp: Date;
  searchVolume: number;        // Normalized 0-100 scale
  searchAcceleration: number;  // Percentage change -1.0 to +∞
  videoCount: number;          // Absolute count
  videoVelocity: number;       // Videos/day
  viewCount: number;           // Absolute count
  viewVelocity: number;        // Views/day growth rate
  engagementRate: number;      // Normalized 0-1 scale
  creatorCount: number;        // Unique creators count
  creatorAdoptionRate: number; // New creators/day
  relatedQueries: string[];
  relatedQueryGrowth: number;  // Percentage with "breakout" status
  confidence: number;          // 0-1 data quality score
}
\`\`\`

**Google Trends Normalization**:
- Search Volume: Already 0-100 relative scale (no normalization needed)
- Related Queries: Parse "breakout" label → 1.0, percentage → normalized value

**YouTube Data API Normalization**:
- Video Count: Absolute count from search results
- View Count: Sum of view counts from search results
- Creator Count: Unique channel IDs from search results
- Engagement Rate: (Likes + Comments) / Views, capped at 0.1 (10%)

**Normalization Challenges**:
- **Different time ranges**: Google Trends uses relative values over configurable period; YouTube uses absolute counts. Solution: Store both absolute and relative metrics, use appropriate metric for each calculation.
- **API quota differences**: YouTube has strict daily quotas (10,000 units); Google Trends rate-limited per hour. Solution: Prioritize YouTube for high-value keywords, fall back to Google Trends for bulk monitoring.
- **Data freshness**: Google Trends updates hourly; YouTube updates real-time. Solution: Accept eventual consistency, timestamp all data points.

**Alternatives Considered**:
- **Single provider dependency**: Rejected - creates vendor lock-in, single point of failure
- **Hard-coded provider logic**: Rejected - violates scalability requirement for pluggable providers
- **No normalization**: Rejected - incomparable metrics prevent unified prediction score

---

## 5. Stage Transition Detection

### Decision: Event-Based Transition Tracking with Velocity Classification

**Chosen Approach**: Detect stage changes and classify transition velocity (normal vs. rapid)

**Implementation**:
\`\`\`typescript
interface StageTransitionEvent {
  keywordId: string;
  previousStage: LifecycleStage;
  newStage: LifecycleStage;
  transitionTimestamp: Date;
  triggerSignals: string[];      // e.g., ["searchAcceleration", "videoVelocity"]
  transitionVelocity: 'normal' | 'rapid';
  daysInPreviousStage: number;
}

function detectStageTransition(
  keyword: Keyword,
  previousClassification: LifecycleStage,
  currentClassification: LifecycleStage,
  daysInStage: number
): StageTransitionEvent | null {
  if (previousClassification === currentClassification) {
    return null; // No transition
  }
  
  // Rapid transition: stage change in <7 days
  const isRapid = daysInStage < 7;
  
  // Identify which signals triggered transition
  const triggers = identifyTriggerSignals(keyword);
  
  return {
    keywordId: keyword.id,
    previousStage: previousClassification,
    newStage: currentClassification,
    transitionTimestamp: new Date(),
    triggerSignals: triggers,
    transitionVelocity: isRapid ? 'rapid' : 'normal',
    daysInPreviousStage: daysInStage
  };
}
\`\`\`

**Rapid Transition Thresholds**:
- Normal: 7-21 days in each stage (typical product lifecycle progression)
- Rapid: <7 days (indicates viral acceleration or external catalyst)
- Stagnant: >30 days in Emerging/Growing (may indicate false signal)

**AI Insight Integration**:
- Rapid transitions trigger special insight messaging: "⚠️ Rapid stage transition detected - opportunity window may be closing faster than normal"
- Normal transitions: Standard lifecycle explanation
- Backward transitions (e.g., Growing → Emerging): Flag as potential data anomaly or seasonal decline

**Alternatives Considered**:
- **Ignore transition velocity**: Rejected - rapid transitions are critical user insights
- **Continuous stage score**: Rejected - discrete stages easier for users to understand
- **Manual stage overrides**: Rejected for MVP - introduces inconsistency

---

## 6. Seasonality Detection

### Decision: Year-Over-Year Pattern Comparison with Flagging

**Chosen Approach**: Compare current trend trajectory with same period in previous year (if available)

**Implementation Strategy**:
\`\`\`typescript
function detectSeasonality(
  keyword: Keyword,
  currentMetrics: AccelerationMetrics,
  historicalData: TrendDataPoint[]
): SeasonalityAnalysis {
  const currentMonth = new Date().getMonth();
  const currentDayOfYear = getDayOfYear(new Date());
  
  // Find data from same period last year (±7 day window)
  const lastYearData = historicalData.filter(dp => {
    const dayOfYear = getDayOfYear(dp.timestamp);
    return Math.abs(dayOfYear - currentDayOfYear) <= 7;
  });
  
  if (lastYearData.length === 0) {
    return { isSeasonal: false, confidence: 'insufficient_data' };
  }
  
  // Calculate if current growth matches historical seasonal pattern
  const avgLastYearGrowth = calculateAverageGrowth(lastYearData);
  const currentGrowth = currentMetrics.primaryAcceleration;
  
  // If growth patterns match (±20%), flag as potentially seasonal
  const growthSimilarity = Math.abs(currentGrowth - avgLastYearGrowth) / avgLastYearGrowth;
  const isSeasonal = growthSimilarity < 0.20;
  
  return {
    isSeasonal,
    confidence: lastYearData.length > 30 ? 'high' : 'medium',
    lastYearPattern: avgLastYearGrowth,
    currentPattern: currentGrowth,
    seasonalityNote: isSeasonal 
      ? \`Historical seasonal pattern detected - similar growth observed in \${formatMonthYear(lastYearData[0].timestamp)}\`
      : null
  };
}
\`\`\`

**MVP Limitations**:
- Requires 12+ months of historical data (unavailable at launch)
- Initial keywords will have no year-over-year comparison
- Solution: Start collecting data immediately, enable seasonality detection after 12 months for seed keywords

**Known Seasonal Products** (pre-configured):
- Summer: "portable blender", "inflatable pool", "camping gear"
- Winter: "space heater", "heated blanket", "snow shovel"
- Holiday: "gift baskets", "advent calendar", "ugly sweater"

**AI Insight Integration**:
- When seasonality detected: "⚠️ Seasonal pattern detected - this product may experience similar growth annually. Verify year-round demand before investing."
- When no pattern: "No historical seasonal behavior detected - growth appears trend-driven rather than seasonal."

**Alternatives Considered**:
- **Fourier transform seasonality detection**: Rejected - overkill for MVP, requires extensive data
- **Manual seasonal tagging**: Rejected - doesn't scale, incomplete coverage
- **Ignore seasonality**: Rejected - misleads users about sustainable trends

---

## 7. Historical Data Storage Strategy

### Decision: PostgreSQL with TimescaleDB Extension for Time-Series Optimization

**Chosen Approach**: Use TimescaleDB (PostgreSQL extension) for efficient time-series data storage and querying

**Rationale**:
- TrendMind stores massive time-series data (5000 keywords × 24 data points/day × 90 days = 10.8M rows)
- TimescaleDB provides automatic partitioning (hypertables) for time-series data
- Maintains PostgreSQL compatibility (ACID, relations, TypeORM support)
- Native time-series functions for window queries, downsampling, retention policies

**Schema Design**:
\`\`\`sql
-- Hypertable for trend data points (auto-partitioned by time)
CREATE TABLE trend_data_points (
  id UUID PRIMARY KEY,
  keyword_id UUID NOT NULL REFERENCES keywords(id),
  provider VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  search_volume NUMERIC,
  video_count INTEGER,
  view_count BIGINT,
  unique_creators INTEGER,
  engagement_rate NUMERIC,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to TimescaleDB hypertable (partitioned by timestamp)
SELECT create_hypertable('trend_data_points', 'timestamp');

-- Retention policy: automatically drop data older than 90 days
SELECT add_retention_policy('trend_data_points', INTERVAL '90 days');

-- Continuous aggregate for pre-computed daily acceleration metrics
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

-- Refresh policy: update aggregates every hour
SELECT add_continuous_aggregate_policy('daily_acceleration_metrics',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');
\`\`\`

**Query Performance**:
- Time-range queries (last 7/14/30 days): Optimized by hypertable partitioning
- Acceleration calculations: Use continuous aggregates instead of raw data
- Historical pattern matching: Leverage time_bucket for grouping

**Data Retention**:
- Raw data points: 90 days (constitutional requirement)
- Aggregated metrics: 365 days (for year-over-year seasonality)
- Lifecycle stage history: Indefinite (small footprint, valuable analytics)

**Alternatives Considered**:
- **InfluxDB**: Rejected - introduces new database technology, team lacks expertise
- **Plain PostgreSQL**: Rejected - poor time-series query performance at scale
- **MongoDB**: Rejected - lacks time-series optimizations, TypeORM integration issues

---

## 8. Confidence Scoring

### Decision: Multi-Factor Confidence Calculation Based on Data Completeness

**Chosen Approach**: Calculate confidence score (Low/Medium/High) based on historical data completeness, signal availability, and provider diversity

**Confidence Levels**:
\`\`\`typescript
enum ConfidenceLevel {
  LOW = 'Low',      // <14 days historical data OR <50% signal coverage
  MEDIUM = 'Medium', // 14-30 days historical data AND 50-80% signal coverage
  HIGH = 'High'     // 30+ days historical data AND >80% signal coverage
}

function calculateConfidence(
  keyword: Keyword,
  signals: NormalizedSignals,
  historicalDataDays: number
): ConfidenceLevel {
  // Factor 1: Historical data availability
  const hasMinimalHistory = historicalDataDays >= 7;
  const hasGoodHistory = historicalDataDays >= 14;
  const hasExcellentHistory = historicalDataDays >= 30;
  
  // Factor 2: Signal coverage (% of expected signals present)
  const availableSignals = countAvailableSignals(signals);
  const totalExpectedSignals = 7; // searchVolume, videoCount, viewCount, creators, etc.
  const signalCoverage = availableSignals / totalExpectedSignals;
  
  // Factor 3: Provider diversity (both Google Trends and YouTube data available)
  const hasMultipleProviders = signals.searchVolume !== null && signals.videoCount !== null;
  
  // Decision logic
  if (!hasMinimalHistory || signalCoverage < 0.5) {
    return ConfidenceLevel.LOW;
  }
  
  if (hasExcellentHistory && signalCoverage > 0.8 && hasMultipleProviders) {
    return ConfidenceLevel.HIGH;
  }
  
  return ConfidenceLevel.MEDIUM;
}
\`\`\`

**UI Presentation**:
- Low Confidence: Display warning badge "⚠️ Low Confidence - Limited Data"
- Medium Confidence: No special indicator (default expected state)
- High Confidence: Display checkmark badge "✓ High Confidence"

**Impact on Predictions**:
- Low confidence predictions should be deprioritized in dashboard ranking
- AI insights should acknowledge confidence level: "Based on limited 10-day history, early signals suggest..."

**Alternatives Considered**:
- **Binary confidence (yes/no)**: Rejected - lacks nuance for user decision-making
- **Numerical score (0-100)**: Rejected - harder for users to interpret than Low/Medium/High
- **No confidence indicator**: Rejected - misleads users about prediction reliability

---

## Technology Stack Summary

### Backend Framework: NestJS
- **Decision**: NestJS 10.x with TypeScript strict mode
- **Rationale**: Built-in clean architecture (modules, services, controllers), excellent TypeORM integration, strong typing support, robust dependency injection
- **Best Practices**: 
  - Use DTOs with class-validator for all API inputs
  - Separate business logic (services) from API layer (controllers)
  - Use Guards for authentication, Interceptors for logging/caching

### Job Queue: BullMQ
- **Decision**: BullMQ with Redis backing
- **Rationale**: Robust job scheduling, rate limiting, retry logic, priority queues
- **Best Practices**:
  - Separate queues for trend collection (high frequency) vs. AI insights (low frequency, high cost)
  - Implement exponential backoff for API rate limit failures
  - Use job priorities to favor user-added keywords over seed keywords

### Time-Series Database: TimescaleDB
- **Decision**: TimescaleDB (PostgreSQL extension)
- **Rationale**: Time-series optimization while maintaining PostgreSQL compatibility
- **Best Practices**:
  - Use hypertables for all time-series data
  - Implement continuous aggregates for frequently queried metrics
  - Set retention policies to auto-delete old data

### Python Microservice: FastAPI
- **Decision**: FastAPI for trend collector microservice
- **Rationale**: Fast async Python framework, easy integration with pytrends and google-api-python-client
- **Best Practices**:
  - Use Pydantic models for request/response validation
  - Implement circuit breaker for Google Trends rate limit handling
  - Deploy as separate Docker container for isolation

### AI Provider: OpenAI GPT-4
- **Decision**: OpenAI GPT-4 via official SDK with provider abstraction
- **Rationale**: Best-in-class natural language generation for lifecycle insights
- **Best Practices**:
  - Implement provider interface to allow future switching
  - Cache AI insights to minimize API costs
  - Use structured prompts with lifecycle-specific few-shot examples for consistent output

---

## Open Questions & Future Research

1. **Prediction Accuracy Validation**: How to measure prediction score correlation with actual trend outcomes? (Post-MVP: automated tracking of 30-day forward growth)

2. **Multi-Region Support**: How to handle regional trend variations? (Post-MVP: add region parameter to signal collection)

3. **Competitive Intelligence**: Should we track competitor mentions or adjacent products? (Post-MVP: related product graph)

4. **Alert Triggers**: What thresholds should trigger user notifications for stage transitions? (Post-MVP: configurable alert rules)

5. **ML Model Migration**: When to migrate from rule-based to ML classification? (Post-MVP: after 6 months of labeled data collection)

6. **Extended Forecasting**: Should we support 60-90 day forecasting beyond lifecycle classification? (Deferred to post-MVP)

---

## References & Resources

- [Google Trends API (pytrends unofficial)](https://github.com/GeneralMills/pytrends)
- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [TimescaleDB Best Practices](https://docs.timescale.com/timescaledb/latest/how-to-guides/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [NestJS Clean Architecture Guide](https://docs.nestjs.com/techniques/database)
- [Percentile Rank Normalization](https://en.wikipedia.org/wiki/Percentile_rank)
- [Product Lifecycle Theory](https://en.wikipedia.org/wiki/Product_life-cycle_management)

---

**All NEEDS CLARIFICATION items resolved. Ready for Phase 1: Design & Contracts.**
