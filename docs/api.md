# TrendMind API Documentation

Base URL: `http://localhost:3001`

All endpoints (except auth) require `Authorization: Bearer <token>`.

Interactive docs (Swagger UI): `http://localhost:3001/api/docs`

---

## Authentication

### POST /auth/register
Create a new user account.

**Body:**
```json
{ "email": "user@example.com", "password": "Password123!" }
```

**Response 201:**
```json
{ "accessToken": "<jwt>", "user": { "id": "...", "email": "user@example.com" } }
```

### POST /auth/login
Authenticate and receive a JWT.

**Body:**
```json
{ "email": "user@example.com", "password": "Password123!" }
```

**Response 200:**
```json
{ "accessToken": "<jwt>" }
```

---

## Dashboard

### GET /dashboard/emerging-opportunities
Returns trending keywords with prediction scores.

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `stages` | string | all | Comma-separated lifecycle stages: `seed,emerging,growing,viral` |
| `minScore` | number | 0 | Minimum prediction score (0–100) |
| `confidenceLevel` | string | — | `low`, `medium`, or `high` |
| `limit` | number | 10 | Max results (capped at 50) |

**Response 200:**
```json
[
  {
    "keywordId": "uuid",
    "keyword": "wireless earbuds",
    "lifecycleStage": "emerging",
    "predictionScore": 72,
    "confidenceLevel": "medium",
    "searchAcceleration": 0.18,
    "videoVelocity": 4.5,
    "creatorAdoptionRate": 0.9,
    "timingRecommendation": "early",
    "rapidTransitionFlag": false,
    "scoreChange": 5,
    "insightText": "Strong early signals detected."
  }
]
```

### GET /analytics/stage-distribution
Returns keyword count per lifecycle stage.

### GET /analytics/rapid-transitions?days=7
Returns keywords that transitioned stages rapidly within the last N days.

### GET /api/rate-limit-status
Returns current API quota status for YouTube and Google Trends providers.

**Response 200:**
```json
{
  "youtube": { "remaining": 9500, "resetAt": "2026-06-25T00:00:00Z", "isLimited": false },
  "googleTrends": { "remaining": 18, "resetAt": "2026-06-24T10:00:00Z", "isLimited": false }
}
```

---

## Keywords

### POST /keywords
Add a keyword to monitor.

**Body:**
```json
{ "term": "smart home speaker" }
```

**Response 201:**
```json
{ "id": "uuid", "term": "smart home speaker", "normalizedForm": "smart home speaker", "lifecycleStage": "seed", "monitoringStatus": "active" }
```

**Errors:** `400` invalid term, `409` already monitoring this keyword.

### GET /keywords?page=1&limit=20
List monitored keywords (paginated).

**Response 200:**
```json
{
  "data": [ { "id": "...", "term": "...", "lifecycleStage": "...", "monitoringStatus": "active" } ],
  "total": 3,
  "page": 1,
  "limit": 20
}
```

### GET /keywords/:id
Get full keyword detail including prediction, acceleration metrics, AI insight, and stage history.

**Response 200:**
```json
{
  "id": "uuid",
  "term": "wireless earbuds",
  "lifecycleStage": "emerging",
  "predictionScore": 72,
  "confidenceLevel": "medium",
  "searchAcceleration": 0.18,
  "videoVelocity": 4.5,
  "creatorAdoptionRate": 0.9,
  "viewVelocity": 12000,
  "relatedQueryGrowth": 0.22,
  "insightText": "...",
  "timingRecommendation": "early",
  "rapidTransitionFlag": false,
  "seasonalityFlag": false,
  "stageTransitions": []
}
```

### GET /keywords/:id/acceleration-history?days=30
Returns time-series acceleration metrics for charting.

### GET /keywords/:id/stage-transitions
Returns historical lifecycle stage changes with velocity and trigger signals.

### DELETE /keywords/:id
Remove a keyword from monitoring. Response: `204 No Content`.

---

## Error Responses

All errors return:
```json
{
  "statusCode": 404,
  "error": "NotFoundException",
  "message": "The requested resource was not found.",
  "timestamp": "2026-06-24T09:00:00.000Z",
  "path": "/keywords/bad-id"
}
```

| Code | Meaning |
|---|---|
| 400 | Bad request / validation failure |
| 401 | Missing or invalid JWT |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Conflict (duplicate keyword) |
| 429 | Rate limit exceeded |
| 503 | Request timeout or upstream unavailable |
