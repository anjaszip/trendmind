# Quickstart: TrendMind Trend Prediction Platform Validation Guide

**Purpose**: Runnable scenarios to validate TrendMind's trend prediction capabilities work end-to-end  
**Created**: 2026-06-04  
**Last Updated**: 2026-06-08  
**Target Audience**: Developers, QA, Product Managers

## Prerequisites

### System Requirements
- Node.js 18+ and npm/yarn
- Python 3.11+
- PostgreSQL 15+ with TimescaleDB extension
- Redis 7+
- Docker and Docker Compose (recommended)

### Environment Setup

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/trendmind.git
cd trendmind
```

2. **Configure Environment Variables**

Create `.env` files in each service directory:

**backend/.env**:
```bash
# Database (with TimescaleDB)
DATABASE_URL=postgresql://trendmind:password@localhost:5432/trendmind

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h

# External Services
TREND_COLLECTOR_URL=http://localhost:8000
YOUTUBE_API_KEY=your_youtube_api_key
OPENAI_API_KEY=your_openai_api_key

# Application
NODE_ENV=development
PORT=3001

# Prediction Configuration
PREDICTION_SCORE_WEIGHTS_SEARCH_ACCELERATION=0.30
PREDICTION_SCORE_WEIGHTS_VIDEO_VELOCITY=0.25
PREDICTION_SCORE_WEIGHTS_CREATOR_ADOPTION=0.20
PREDICTION_SCORE_WEIGHTS_RELATED_QUERY_GROWTH=0.15
PREDICTION_SCORE_WEIGHTS_VIEW_VELOCITY=0.10
```

**trend-collector/.env**:
```bash
DATABASE_URL=postgresql://trendmind:password@localhost:5432/trendmind
REDIS_URL=redis://localhost:6379
YOUTUBE_API_KEY=your_youtube_api_key
PORT=8000
```

**frontend/.env**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

3. **Start Dependencies with Docker Compose**

```bash
cd infrastructure
docker-compose up -d postgres redis
```

4. **Initialize Database with TimescaleDB**

```bash
cd backend

# Install TimescaleDB extension
psql -U trendmind -d trendmind -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"

# Run migrations
npm install
npm run migration:run

# Seed 20 test keywords with 30 days of mock historical data
npm run seed:keywords
npm run seed:historical-data  # Generates mock time-series data for lifecycle classification
```

5. **Start Services**

Terminal 1 - Backend:
```bash
cd backend
npm install
npm run start:dev
```

Terminal 2 - Trend Collector:
```bash
cd trend-collector
pip install -r requirements.txt
python src/api/app.py
```

Terminal 3 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## Validation Scenario 1: User Registration & Authentication

**Goal**: Verify users can register, login, and access protected endpoints

**Steps**:

1. **Register a new user**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response** (201):
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "createdAt": "2026-06-04T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

2. **Login and save token**
```bash
export TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }' | jq -r '.accessToken')
```

3. **Verify protected endpoint access**
```bash
curl -X GET http://localhost:3001/api/v1/dashboard/emerging-opportunities \
  -H "Authorization: Bearer $TOKEN"
```

**✅ Success Criteria**:
- Registration creates new user
- Login returns valid JWT token
- Protected endpoints accept requests with valid token

---

## Validation Scenario 2: View Emerging Opportunities Dashboard (P1)

**Goal**: Verify dashboard shows top emerging product opportunities with lifecycle stages and prediction scores

**Steps**:

1. **Navigate to Dashboard**
```bash
# Frontend
open http://localhost:3000

# OR API directly
curl -X GET "http://localhost:3001/api/v1/dashboard/emerging-opportunities?limit=10&stages=seed,emerging" \
  -H "Authorization: Bearer $TOKEN"
```

2. **Verify Response Structure**

**Expected Response** (200):
```json
{
  "opportunities": [
    {
      "keyword": {
        "id": "uuid",
        "originalTerm": "Portable Blender",
        "normalizedForm": "portable blender",
        "isSeedKeyword": true
      },
      "predictionScore": 88,
      "lifecycleStage": "emerging",
      "stageEnteredAt": "2026-05-28T00:00:00Z",
      "daysInStage": 10,
      "confidenceLevel": "high",
      "accelerationMetrics": {
        "searchAcceleration": 180.5,
        "videoVelocity": 12.3,
        "creatorAdoptionRate": 8.7,
        "relatedQueryGrowth": 45.2,
        "viewVelocity": 125.8
      },
      "insight": {
        "text": "Portable Blender is currently in the Emerging stage. Search interest has accelerated over the last 14 days while creator adoption remains relatively low. This indicates a potentially attractive early-stage opportunity before mainstream saturation.",
        "timingRecommendation": "early",
        "seasonalityFlag": false,
        "rapidTransitionFlag": false
      },
      "lastUpdated": "2026-06-04T09:30:00Z"
    }
  ],
  "metadata": {
    "totalCount": 10,
    "lastRefreshed": "2026-06-04T09:30:00Z"
  }
}
```

3. **Verify Lifecycle Classifications**
```bash
# Check stage distribution
curl -X GET http://localhost:3001/api/v1/analytics/stage-distribution \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response** (200):
```json
{
  "distribution": {
    "seed": { "count": 5, "percentage": 10 },
    "emerging": { "count": 15, "percentage": 30 },
    "growing": { "count": 18, "percentage": 36 },
    "viral": { "count": 8, "percentage": 16 },
    "saturated": { "count": 3, "percentage": 6 },
    "declining": { "count": 1, "percentage": 2 }
  },
  "totalKeywords": 50,
  "recommendations": {
    "earlyOpportunities": 15,
    "onTimeOpportunities": 18,
    "lateOpportunities": 11,
    "avoidOpportunities": 6
  }
}
```

4. **Measure Performance**
```bash
time curl -X GET http://localhost:3001/api/v1/dashboard/emerging-opportunities \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nResponse Time: %{time_total}s\n"
```

**✅ Success Criteria**:
- Dashboard loads within **2 seconds**
- At least 5 opportunities displayed
- Each opportunity has:
  - Prediction score (0-100)
  - Lifecycle stage (seed, emerging, growing, viral, saturated, declining)
  - Acceleration metrics (all 5 metrics present)
  - AI insight with timing recommendation
  - Confidence level (low, medium, high)
- Opportunities sorted by prediction score (desc) then lifecycle stage (emerging > seed > growing)
- Response time < 500ms

---

## Validation Scenario 3: Add Keyword & Monitor Lifecycle Progression (P2)

**Goal**: Verify users can add keywords and monitor lifecycle stage evolution

**Steps**:

1. **Add a new keyword**
```bash
curl -X POST http://localhost:3001/api/v1/keywords \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "smart water bottle"
  }'
```

**Expected Response** (201):
```json
{
  "keyword": {
    "id": "uuid",
    "originalTerm": "smart water bottle",
    "normalizedForm": "smart water bottle",
    "lifecycleStage": "seed",
    "monitoringStatus": "active",
    "createdAt": "2026-06-04T10:00:00Z"
  },
  "message": "Keyword added successfully. Prediction analysis will begin shortly (may take 7-14 days to accumulate sufficient historical data for high-confidence predictions)."
}
```

2. **Check initial lifecycle classification**
```bash
KEYWORD_ID="uuid-from-previous-response"

curl -X GET "http://localhost:3001/api/v1/keywords/$KEYWORD_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response** (200):
```json
{
  "keyword": {
    "id": "uuid",
    "originalTerm": "smart water bottle",
    "normalizedForm": "smart water bottle",
    "lifecycleStage": "seed",
    "daysInStage": 0,
    "monitoringStatus": "active"
  },
  "prediction": {
    "score": 35,
    "confidenceLevel": "low",
    "components": { /* all components present but low values */ }
  },
  "accelerationMetrics": {
    "historicalDataDays": 1  // Insufficient for high confidence
  },
  "insight": {
    "text": "Based on limited 1-day history, early signals suggest seed stage...",
    "timingRecommendation": "early",
    "seasonalityFlag": false
  }
}
```

3. **Simulate 14 days of data collection** (for testing)
```bash
# Dev/test endpoint to fast-forward time series data
curl -X POST "http://localhost:3001/api/v1/dev/keywords/$KEYWORD_ID/simulate-days" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "days": 14, "growthRate": 0.15 }'  # 15% daily growth
```

4. **Verify lifecycle progression**
```bash
curl -X GET "http://localhost:3001/api/v1/keywords/$KEYWORD_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response** (200):
```json
{
  "keyword": {
    "lifecycleStage": "emerging",  // Progressed from seed
    "daysInStage": 7
  },
  "prediction": {
    "score": 75,
    "confidenceLevel": "medium",  // Upgraded from low
    "scoreChange": 40
  },
  "accelerationMetrics": {
    "searchAcceleration": 165.3,
    "videoVelocity": 8.5,
    "historicalDataDays": 14
  }
}
```

5. **Check stage transition history**
```bash
curl -X GET "http://localhost:3001/api/v1/keywords/$KEYWORD_ID/stage-transitions" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response** (200):
```json
{
  "keyword": {
    "currentStage": "emerging"
  },
  "transitions": [
    {
      "previousStage": "seed",
      "newStage": "emerging",
      "transitionedAt": "2026-06-11T00:00:00Z",
      "daysInPreviousStage": 7,
      "transitionVelocity": "normal",
      "triggerSignals": ["searchAcceleration", "videoVelocity"]
    }
  ],
  "analysis": {
    "totalTransitions": 1,
    "rapidTransitions": 0
  }
}
```

**✅ Success Criteria**:
- New keywords start in "seed" stage with "low" confidence
- After 7-14 days of data, confidence upgrades to "medium"
- Lifecycle stage transitions are detected and logged
- Stage transition history is queryable
- Prediction score increases as historical data accumulates

---

## Validation Scenario 4: Understand Product Lifecycle & Timing (P3)

**Goal**: Verify detailed lifecycle insights help users make timing decisions

**Steps**:

1. **Get detailed keyword information**
```bash
curl -X GET "http://localhost:3001/api/v1/keywords/$KEYWORD_ID" \
  -H "Authorization: Bearer $TOKEN"
```

2. **Verify AI Insight Quality**

**Expected Insight Components**:
- **Lifecycle Explanation**: "Currently in the Emerging stage..."
- **Growth Signals**: "Search acceleration +180%, Creator adoption +220%..."
- **Timing Recommendation**: "early" / "on_time" / "late" / "avoid"
- **Seasonality Warning**: If detected, include warning
- **Rapid Transition Alert**: If detected, include alert

3. **Get acceleration history chart data**
```bash
curl -X GET "http://localhost:3001/api/v1/keywords/$KEYWORD_ID/acceleration-history?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response** (200):
```json
{
  "keyword": {
    "id": "uuid",
    "originalTerm": "smart water bottle"
  },
  "metrics": [
    {
      "timestamp": "2026-06-04T00:00:00Z",
      "searchAcceleration": 165.3,
      "videoVelocity": 8.5,
      "creatorAdoptionRate": 4.2,
      "relatedQueryGrowth": 32.1,
      "viewVelocity": 87.5,
      "confidenceLevel": "medium"
    }
    // ... 29 more days
  ],
  "summary": {
    "totalDataPoints": 30,
    "averageAcceleration": 155.8,
    "trend": "accelerating"
  }
}
```

4. **Compare Early vs. Late Opportunities**
```bash
# Get emerging opportunities (early timing)
curl -X GET "http://localhost:3001/api/v1/dashboard/emerging-opportunities?stages=seed,emerging" \
  -H "Authorization: Bearer $TOKEN"

# Get viral/saturated opportunities (late timing)
curl -X GET "http://localhost:3001/api/v1/dashboard/emerging-opportunities?stages=viral,saturated" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Behavior**:
- "seed" and "emerging" stage products have `timingRecommendation: "early"`
- "growing" stage products have `timingRecommendation: "on_time"`
- "viral" and "saturated" stage products have `timingRecommendation: "late"`
- "declining" stage products have `timingRecommendation: "avoid"`

**✅ Success Criteria**:
- AI insights explain lifecycle stage with specific growth signals
- Timing recommendations align with lifecycle stages
- Acceleration history shows 30-day trend progression
- Users can distinguish between early-stage opportunities and saturated markets

---

## Validation Scenario 5: Rapid Transition Detection

**Goal**: Verify system detects and alerts on rapid viral acceleration

**Steps**:

1. **Simulate rapid growth**
```bash
# Simulate keyword jumping from emerging → viral in 4 days
curl -X POST "http://localhost:3001/api/v1/dev/keywords/$KEYWORD_ID/simulate-days" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "days": 4, "growthRate": 1.5 }'  # 150% daily growth (viral)
```

2. **Check for rapid transition flag**
```bash
curl -X GET "http://localhost:3001/api/v1/keywords/$KEYWORD_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response** (200):
```json
{
  "keyword": {
    "lifecycleStage": "viral"
  },
  "insight": {
    "rapidTransitionFlag": true,
    "text": "⚠️ Rapid stage transition detected (emerging → viral in 4 days). Opportunity window may be closing faster than normal..."
  },
  "stageHistory": [
    {
      "previousStage": "emerging",
      "newStage": "viral",
      "daysInPreviousStage": 4,
      "transitionVelocity": "rapid"
    }
  ]
}
```

3. **Check analytics for rapid transitions**
```bash
curl -X GET "http://localhost:3001/api/v1/analytics/rapid-transitions?days=7" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response** (200):
```json
{
  "rapidTransitions": [
    {
      "keyword": {
        "id": "uuid",
        "originalTerm": "smart water bottle"
      },
      "transition": {
        "previousStage": "emerging",
        "newStage": "viral",
        "daysInPreviousStage": 4,
        "transitionVelocity": "rapid"
      },
      "currentPredictionScore": 95
    }
  ],
  "totalRapidTransitions": 1,
  "alertMessage": "1 keyword(s) experienced rapid viral acceleration in the last 7 days"
}
```

**✅ Success Criteria**:
- Rapid transitions (<7 days) are flagged in AI insights
- Stage transition events log transition velocity
- Analytics endpoint surfaces rapid transitions
- Users receive visual alerts about rapid opportunity window closing

---

## Performance Validation

### Dashboard Load Time

**Test**:
```bash
# Measure 10 consecutive dashboard loads
for i in {1..10}; do
  curl -X GET http://localhost:3001/api/v1/dashboard/emerging-opportunities \
    -H "Authorization: Bearer $TOKEN" \
    -w "Attempt $i: %{time_total}s\n" \
    -o /dev/null -s
done
```

**✅ Success Criteria**:
- First load (cold cache): < 2 seconds
- Subsequent loads (warm cache): < 500ms
- Average across 10 loads: < 1 second

---

### Prediction Score Calculation Performance

**Test**:
```bash
# Trigger batch prediction score recalculation for all keywords
time curl -X POST http://localhost:3001/api/v1/dev/recalculate-all-predictions \
  -H "Authorization: Bearer $TOKEN"
```

**✅ Success Criteria**:
- 100 keywords processed in < 5 seconds
- Asynchronous processing (returns immediately with job ID)
- No blocking of user requests during recalculation

---

### Acceleration Metrics Computation

**Test**:
```bash
# Test acceleration calculation for keyword with 30 days of data
time curl -X GET "http://localhost:3001/api/v1/keywords/$KEYWORD_ID/acceleration-history?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

**✅ Success Criteria**:
- Query time < 500ms even with 30 days of data
- TimescaleDB continuous aggregates used for performance
- No N+1 query issues

---

## Edge Cases & Error Handling

### Insufficient Historical Data

**Test**:
```bash
# Add keyword with < 7 days of data
curl -X POST http://localhost:3001/api/v1/keywords \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "keyword": "brand new product" }'

# Immediately check prediction
curl -X GET "http://localhost:3001/api/v1/keywords/$NEW_KEYWORD_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Behavior**:
- Prediction score calculated but flagged as `confidenceLevel: "low"`
- AI insight includes: "Based on limited X-day history..."
- No crash or error

---

### Duplicate Keyword Handling

**Test**:
```bash
# Try to add duplicate (different casing/punctuation)
curl -X POST http://localhost:3001/api/v1/keywords \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "keyword": "Smart Water Bottle!" }'
```

**Expected Response** (409 Conflict):
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Keyword 'smart water bottle' already in your watchlist (normalized form)"
  }
}
```

---

### API Rate Limit Exhaustion

**Test**:
```bash
# Simulate YouTube API quota exhaustion
curl -X POST http://localhost:3001/api/v1/dev/exhaust-youtube-quota \
  -H "Authorization: Bearer $TOKEN"

# Check collection status
curl -X GET http://localhost:3001/api/v1/status/collection \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```json
{
  "rateLimits": {
    "youtube": {
      "remaining": 0,
      "isExhausted": true,
      "resetAt": "2026-06-05T00:00:00Z"
    }
  }
}
```

**Expected Behavior**:
- System falls back to Google Trends only
- Prediction confidence downgraded to "medium" (missing YouTube signals)
- No crashes or data corruption

---

## Deployment Validation Checklist

Before considering MVP ready for production:

- [ ] All 5 validation scenarios pass
- [ ] Performance benchmarks met (<2s dashboard, <500ms API)
- [ ] Edge cases handled gracefully
- [ ] Lifecycle classification accuracy spot-checked on 100 keywords (90% match manual expert classification)
- [ ] TimescaleDB retention policies active (auto-delete 90+ day data)
- [ ] Seed keywords refreshing on 1-hour staggered schedule
- [ ] AI insights generating within 2 minutes for 90% of keywords
- [ ] Rapid transition alerts working correctly
- [ ] Seasonality detection functional (with 12+ months of data)

---

**Quickstart validation complete. System ready for task breakdown (Phase 2).**
