# REST API Contract: TrendMind Trend Prediction Platform

**Version**: 2.0.0 (Updated for Trend Prediction)  
**Last Updated**: 2026-06-08  
**Base URL**: `/api/v1`  
**Authentication**: Bearer JWT token  
**Content-Type**: `application/json`

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2026-06-04T10:00:00Z"
  },
  "accessToken": "jwt.token.here"
}
```

**Errors**:
- `400 Bad Request`: Invalid email format or weak password
- `409 Conflict`: Email already registered

---

### POST /auth/login

Authenticate and receive access token.

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "accessToken": "jwt.token.here"
}
```

**Errors**:
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account inactive

---

## Dashboard Endpoints

### GET /dashboard/emerging-opportunities

Get top emerging product opportunities (prediction-focused).

**Authentication**: Required

**Query Parameters**:
- `limit` (optional, default: 10): Number of opportunities to return (max: 50)
- `includeUserKeywords` (optional, default: true): Include user's watchlist keywords
- `stages` (optional): Comma-separated lifecycle stages to include (e.g., "seed,emerging")
- `minScore` (optional, default: 0): Minimum prediction score threshold (0-100)
- `confidenceLevel` (optional): Filter by confidence ('low', 'medium', 'high')

**Response** (200 OK):
```json
{
  "opportunities": [
    {
      "keyword": {
        "id": "uuid",
        "originalTerm": "Portable Blender",
        "normalizedForm": "portable blender",
        "isSeedKeyword": false
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
    "lastRefreshed": "2026-06-04T09:30:00Z",
    "filters": {
      "stages": ["seed", "emerging"],
      "minScore": 0,
      "confidenceLevel": "all"
    }
  }
}
```

**Performance**: <500ms (cached for 30 minutes)

**Errors**:
- `401 Unauthorized`: Missing or invalid token
- `400 Bad Request`: Invalid query parameters

---

## Keyword Management Endpoints

### GET /keywords

Get user's monitored keywords with lifecycle information.

**Authentication**: Required

**Query Parameters**:
- `status` (optional): Filter by monitoring_status ('active', 'paused', 'failed')
- `stage` (optional): Filter by lifecycle stage
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `sortBy` (optional, default: 'predictionScore'): Sort field ('predictionScore', 'lifecycleStage', 'createdAt')
- `sortOrder` (optional, default: 'desc'): Sort order ('asc', 'desc')

**Response** (200 OK):
```json
{
  "keywords": [
    {
      "id": "uuid",
      "originalTerm": "Standing Desk",
      "normalizedForm": "standing desk",
      "lifecycleStage": "growing",
      "stageEnteredAt": "2026-05-20T00:00:00Z",
      "daysInStage": 15,
      "monitoringStatus": "active",
      "createdAt": "2026-05-15T10:00:00Z",
      "lastCollectedAt": "2026-06-04T09:00:00Z",
      "currentPredictionScore": 73,
      "confidenceLevel": "high",
      "timingRecommendation": "on_time"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 15,
    "totalPages": 1
  }
}
```

**Performance**: <500ms

---

### POST /keywords

Add a new keyword to user's watchlist.

**Authentication**: Required

**Request Body**:
```json
{
  "keyword": "ergonomic mouse"
}
```

**Validation**:
- Length: 1-100 characters
- Sanitization: Remove XSS attempts, SQL injection
- Normalization: Applied server-side

**Response** (201 Created):
```json
{
  "keyword": {
    "id": "uuid",
    "originalTerm": "ergonomic mouse",
    "normalizedForm": "ergonomic mouse",
    "lifecycleStage": "seed",
    "monitoringStatus": "active",
    "createdAt": "2026-06-04T10:00:00Z"
  },
  "message": "Keyword added successfully. Prediction analysis will begin shortly (may take 7-14 days to accumulate sufficient historical data for high-confidence predictions)."
}
```

**Errors**:
- `400 Bad Request`: Invalid keyword format
- `409 Conflict`: Keyword already in user's watchlist (duplicate normalized form)
- `429 Too Many Requests`: User exceeded keyword limit (50 per user)

**Side Effects**:
- Triggers async trend collection job
- Initial lifecycle stage set to "seed" with "low" confidence
- Returns immediately (does not wait for collection)

---

### DELETE /keywords/:id

Remove a keyword from user's watchlist.

**Authentication**: Required

**Path Parameters**:
- `id`: Keyword UUID

**Response** (200 OK):
```json
{
  "message": "Keyword removed successfully"
}
```

**Errors**:
- `404 Not Found`: Keyword not found or not owned by user
- `401 Unauthorized`: Missing or invalid token

---

## Keyword Detail Endpoints

### GET /keywords/:id

Get detailed information about a specific keyword including lifecycle history.

**Authentication**: Required

**Path Parameters**:
- `id`: Keyword UUID

**Response** (200 OK):
```json
{
  "keyword": {
    "id": "uuid",
    "originalTerm": "Portable Blender",
    "normalizedForm": "portable blender",
    "lifecycleStage": "emerging",
    "stageEnteredAt": "2026-05-28T00:00:00Z",
    "daysInStage": 10,
    "monitoringStatus": "active",
    "isSeedKeyword": false,
    "createdAt": "2026-05-18T10:00:00Z",
    "lastCollectedAt": "2026-06-04T09:30:00Z"
  },
  "prediction": {
    "score": 88,
    "confidenceLevel": "high",
    "calculatedAt": "2026-06-04T09:30:00Z",
    "components": {
      "searchAcceleration": 0.28,
      "videoVelocity": 0.31,
      "creatorAdoption": 0.22,
      "relatedQueryGrowth": 0.12,
      "viewVelocity": 0.07
    },
    "scoreChange": 5,
    "previousScore": 83
  },
  "accelerationMetrics": {
    "searchAcceleration": 180.5,
    "searchAcceleration7d": 220.3,
    "searchAcceleration30d": 145.8,
    "videoVelocity": 12.3,
    "viewVelocity": 125.8,
    "creatorAdoptionRate": 8.7,
    "relatedQueryGrowth": 45.2,
    "historicalDataDays": 28
  },
  "insight": {
    "text": "Portable Blender is currently in the Emerging stage. Search interest has accelerated over the last 14 days while creator adoption remains relatively low. This indicates a potentially attractive early-stage opportunity before mainstream saturation.",
    "timingRecommendation": "early",
    "seasonalityFlag": false,
    "rapidTransitionFlag": false,
    "generatedAt": "2026-06-04T09:30:00Z",
    "confidence": 85
  },
  "stageHistory": [
    {
      "previousStage": "seed",
      "newStage": "emerging",
      "transitionedAt": "2026-05-28T00:00:00Z",
      "daysInPreviousStage": 10,
      "transitionVelocity": "normal",
      "triggerSignals": ["searchAcceleration", "videoVelocity"]
    }
  ]
}
```

**Performance**: <500ms

**Errors**:
- `404 Not Found`: Keyword not found or not owned by user
- `401 Unauthorized`: Missing or invalid token

---

### GET /keywords/:id/acceleration-history

Get historical acceleration metrics for trend analysis.

**Authentication**: Required

**Path Parameters**:
- `id`: Keyword UUID

**Query Parameters**:
- `days` (optional, default: 30): Number of days of history to return
- `interval` (optional, default: 'daily'): Data granularity ('hourly', 'daily', 'weekly')

**Response** (200 OK):
```json
{
  "keyword": {
    "id": "uuid",
    "originalTerm": "Portable Blender"
  },
  "metrics": [
    {
      "timestamp": "2026-06-04T00:00:00Z",
      "searchAcceleration": 180.5,
      "videoVelocity": 12.3,
      "creatorAdoptionRate": 8.7,
      "relatedQueryGrowth": 45.2,
      "viewVelocity": 125.8,
      "confidenceLevel": "high"
    },
    {
      "timestamp": "2026-06-03T00:00:00Z",
      "searchAcceleration": 175.2,
      "videoVelocity": 11.8,
      "creatorAdoptionRate": 8.1,
      "relatedQueryGrowth": 42.5,
      "viewVelocity": 118.3,
      "confidenceLevel": "high"
    }
  ],
  "summary": {
    "totalDataPoints": 30,
    "earliestDate": "2026-05-05T00:00:00Z",
    "latestDate": "2026-06-04T00:00:00Z",
    "averageAcceleration": 165.8,
    "trend": "accelerating"
  }
}
```

**Performance**: <500ms

---

### GET /keywords/:id/stage-transitions

Get lifecycle stage transition history.

**Authentication**: Required

**Path Parameters**:
- `id`: Keyword UUID

**Response** (200 OK):
```json
{
  "keyword": {
    "id": "uuid",
    "originalTerm": "Portable Blender",
    "currentStage": "emerging"
  },
  "transitions": [
    {
      "id": "uuid",
      "previousStage": "seed",
      "newStage": "emerging",
      "transitionedAt": "2026-05-28T00:00:00Z",
      "daysInPreviousStage": 10,
      "transitionVelocity": "normal",
      "triggerSignals": ["searchAcceleration", "videoVelocity"],
      "accelerationAtTransition": 185.3
    }
  ],
  "analysis": {
    "totalTransitions": 1,
    "averageDaysPerStage": 10,
    "rapidTransitions": 0,
    "projection": "Expected to enter Growing stage in ~14 days if current momentum continues"
  }
}
```

**Performance**: <500ms

---

## Analytics Endpoints

### GET /analytics/stage-distribution

Get distribution of keywords across lifecycle stages.

**Authentication**: Required

**Response** (200 OK):
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

**Performance**: <500ms (cached for 1 hour)

---

### GET /analytics/rapid-transitions

Get keywords with rapid stage transitions (potential viral trends).

**Authentication**: Required

**Query Parameters**:
- `days` (optional, default: 7): Look back period in days

**Response** (200 OK):
```json
{
  "rapidTransitions": [
    {
      "keyword": {
        "id": "uuid",
        "originalTerm": "Viral Product X",
        "normalizedForm": "viral product x"
      },
      "transition": {
        "previousStage": "emerging",
        "newStage": "viral",
        "transitionedAt": "2026-06-03T00:00:00Z",
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

**Performance**: <500ms

---

## Health & Status Endpoints

### GET /health

System health check.

**Authentication**: None (public endpoint)

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-06-04T10:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "trendCollector": "healthy",
    "aiProvider": "healthy"
  },
  "version": "2.0.0"
}
```

**Performance**: <100ms

---

### GET /status/collection

Get trend collection status and queue information.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "queue": {
    "waiting": 25,
    "active": 5,
    "completed": 12450,
    "failed": 32
  },
  "rateLimits": {
    "googleTrends": {
      "remaining": 15,
      "resetAt": "2026-06-04T11:00:00Z",
      "isExhausted": false
    },
    "youtube": {
      "remaining": 5000,
      "resetAt": "2026-06-05T00:00:00Z",
      "isExhausted": false
    }
  },
  "lastCollectionRun": "2026-06-04T09:30:00Z",
  "nextScheduledRun": "2026-06-04T10:30:00Z"
}
```

**Performance**: <500ms

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2026-06-04T10:00:00Z"
  }
}
```

**Common Error Codes**:
- `INVALID_REQUEST`: Malformed request body or parameters
- `UNAUTHORIZED`: Missing or invalid authentication token
- `FORBIDDEN`: Valid token but insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists (duplicate)
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server-side error
- `SERVICE_UNAVAILABLE`: External service (trend collector, AI provider) unavailable

---

## Rate Limiting

**Per User Limits**:
- `/dashboard/*`: 60 requests/minute
- `/keywords/*`: 30 requests/minute (POST/DELETE)
- `/keywords/*`: 60 requests/minute (GET)
- `/analytics/*`: 30 requests/minute

**Global Limits**:
- Trend collection: Limited by external API quotas (Google Trends: ~20/hour, YouTube: 10,000 units/day)

**Rate Limit Headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1654331400
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters**:
- `page`: Page number (1-indexed)
- `limit`: Items per page (max: 100)

**Response Metadata**:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## Sorting

Sortable endpoints support:

**Query Parameters**:
- `sortBy`: Field name
- `sortOrder`: 'asc' or 'desc'

**Default Sorting**:
- `/dashboard/emerging-opportunities`: `predictionScore DESC, lifecycleStage ASC`
- `/keywords`: `predictionScore DESC`

---

**REST API contract complete. Ready for quickstart validation scenarios.**
