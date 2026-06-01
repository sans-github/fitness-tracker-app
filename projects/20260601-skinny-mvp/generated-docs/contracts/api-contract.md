Status: Approved — EM
Approved: 2026-06-01

# API Contract: Fitness Tracker Skinny MVP

## Contract Summary

| Item | Value |
|------|-------|
| Endpoints | 2 |
| Auth | None |
| Base URL | `http://localhost:8080` |
| Content type | `application/json` |
| Error format | RFC 7807 `application/problem+json` |
| Date format | ISO 8601 UTC (`2026-06-01T10:00:00Z`) |
| Decimal format | `weight_lbs` as JSON number, max 2 decimal places |

CORS: allowed origin `http://localhost:5173`, allowed methods `GET, POST`, allowed headers `Content-Type`.

---

## Endpoints

### GET /api/v1/workout-logs

Returns all non-deleted workout log entries, newest first.

**Request**

No body. No query parameters.

**Response — 200 OK**

Content-Type: `application/json`

Array of `WorkoutLogResponse`. Empty array when no entries exist.

#### WorkoutLogResponse schema

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | Server-generated UUID |
| `exercise` | string | Name of the exercise |
| `weightLbs` | number | Decimal, max 2 decimal places |
| `sets` | number (integer) | |
| `reps` | number (integer) | |
| `createdAt` | string (ISO 8601 UTC) | e.g. `2026-06-01T10:00:00Z` |

`updatedAt` and `deletedAt` are internal and are not returned.

**Example response — 200**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "exercise": "Squat",
    "weightLbs": 100.00,
    "sets": 3,
    "reps": 5,
    "createdAt": "2026-06-01T10:05:00Z"
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "exercise": "Bench Press",
    "weightLbs": 80.50,
    "sets": 4,
    "reps": 8,
    "createdAt": "2026-06-01T09:50:00Z"
  }
]
```

**Example response — 200 (empty)**

```json
[]
```

---

### POST /api/v1/workout-logs

Creates a new workout log entry.

**Request**

Content-Type: `application/json`

#### WorkoutLogRequest schema

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `exercise` | string | Yes | Not blank; max 50 characters |
| `weightLbs` | number | Yes | Greater than 0; max 4 integer digits, max 2 decimal places |
| `sets` | number (integer) | Yes | At least 1 |
| `reps` | number (integer) | Yes | At least 1 |

**Example request**

```json
{
  "exercise": "Squat",
  "weightLbs": 100.00,
  "sets": 3,
  "reps": 5
}
```

**Response — 201 Created**

Content-Type: `application/json`

Returns the created `WorkoutLogResponse` (same schema as GET array items).

**Example success response — 201**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "exercise": "Squat",
  "weightLbs": 100.00,
  "sets": 3,
  "reps": 5,
  "createdAt": "2026-06-01T10:05:00Z"
}
```

**Response — 400 Bad Request**

Content-Type: `application/problem+json`

RFC 7807 shape. The `errors` object is keyed by field name. All field violations are returned in a single response.

| Field | Type | Value |
|-------|------|-------|
| `type` | string | `https://fitnessapp.local/errors/validation` |
| `title` | string | `Validation Failed` |
| `status` | number | `400` |
| `instance` | string | Request URI, e.g. `/api/v1/workout-logs` |
| `errors` | object | Map of field name to violation message |

**Example 400 response**

```json
{
  "type": "https://fitnessapp.local/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "instance": "/api/v1/workout-logs",
  "errors": {
    "exercise": "exercise is required",
    "weightLbs": "weightLbs must be greater than 0",
    "sets": "sets must be at least 1"
  }
}
```

**Response — 500 Internal Server Error**

Content-Type: `application/problem+json`

No internal detail is exposed.

```json
{
  "type": "https://fitnessapp.local/errors/internal",
  "title": "Internal Server Error",
  "status": 500,
  "instance": "/api/v1/workout-logs"
}
```

---

## CORS

| Header | Value |
|--------|-------|
| `Access-Control-Allow-Origin` | `http://localhost:5173` |
| `Access-Control-Allow-Methods` | `GET, POST` |
| `Access-Control-Allow-Headers` | `Content-Type` |

Note: during local development the Vite dev server proxies `/api/*` to `http://localhost:8080`, so the browser sees a same-origin request and CORS does not apply. The CORS config is present for any client that calls the BE directly (e.g. Playwright API tests, curl).

---

## Field name alignment

Both sides agree on camelCase field names. Jackson serializes Java `camelCase` fields to JSON as-is. The FE TypeScript interfaces match exactly.

| JSON field | Java field | TypeScript field |
|------------|------------|-----------------|
| `id` | `id` (UUID) | `id` (string) |
| `exercise` | `exercise` | `exercise` |
| `weightLbs` | `weightLbs` | `weightLbs` |
| `sets` | `sets` | `sets` |
| `reps` | `reps` | `reps` |
| `createdAt` | `createdAt` | `createdAt` |
