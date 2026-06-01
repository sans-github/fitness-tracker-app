# High-Level Design: Fitness Tracker Skinny MVP

## Architecture Summary

Single-page fitness logging app. No auth. No multi-user concerns. One table, two endpoints, one React page.

**Key technical decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Deployment target | Local only | Scope per PRD -- no infra provisioning needed |
| DB | H2 in-file mode | MVP only; no external DB to manage locally |
| Migration tool | Flyway | Consistent with java-springboot conventions; owns schema creation so Hibernate validates only |
| State management | TanStack Query only | No shared client state; server state (history list) is all that exists -- Redux would be over-engineering |
| API versioning | `/api/v1/` prefix | Conventional; trivial to add now, costly to retrofit later |
| CORS | Configured for `localhost:5173` | Vite dev server default port |
| Error format | RFC 7807 Problem Details | Consistent, parseable by FE without bespoke handling |

**Component overview:**

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| Frontend | React 18 + TypeScript + Vite | Single page: logging cards + history table |
| Backend | Java 21 + Spring Boot | REST API, validation, persistence |
| Database | H2 (file-backed) | `workout_log` table |
| Build | Maven (BE), npm (FE) | Local only; no CI required for MVP |

---

## System Components

```
Browser
  └── React SPA (localhost:5173)
        ├── GET /api/v1/workout-logs  ──► Spring Boot (localhost:8080)
        └── POST /api/v1/workout-logs ──►      └── H2 file DB
```

No reverse proxy. No CDN. No load balancer. FE dev server proxies `/api` to Spring Boot during development.

---

## Data Flow

**Page load:**
1. React mounts, TanStack Query fires `GET /api/v1/workout-logs`
2. Spring Boot queries H2 `ORDER BY created_at DESC`
3. Response populates history table

**Log action:**
1. User fills inputs, clicks Log
2. FE validates client-side (required, > 0); shows inline errors on failure without hitting BE
3. On valid inputs: TanStack Query mutation fires `POST /api/v1/workout-logs`
4. BE validates again server-side, stamps `created_at` / `updated_at`, persists to H2
5. On 201: TanStack Query invalidates the list query, history table refreshes

---

## Backend Design

**Package structure** (feature-organized per java-springboot conventions):

```
com.example.fitnesstracker
├── workoutlog/
│   ├── WorkoutLogController.java   -- REST endpoints
│   ├── WorkoutLogService.java      -- business logic, timestamp assignment
│   ├── WorkoutLogRepository.java   -- JpaRepository<WorkoutLog, UUID>
│   ├── WorkoutLog.java             -- JPA entity
│   ├── WorkoutLogRequest.java      -- inbound DTO (validated)
│   └── WorkoutLogResponse.java     -- outbound DTO
└── FitnessTrackerApplication.java
```

**Key classes:**

- `WorkoutLogController` -- `@RestController`, maps two endpoints, delegates to service
- `WorkoutLogService` -- stamps `created_at` / `updated_at` via `LocalDateTime.now()`, calls repository
- `WorkoutLog` (entity) -- fields: `id` (UUID), `exercise`, `weight_lbs`, `sets`, `reps`, `created_at`, `updated_at`, `deleted_at`
- `WorkoutLogRequest` -- Bean Validation annotations: `@NotBlank` (exercise), `@DecimalMin("0.01")` (weight), `@Min(1)` (sets, reps)
- `GlobalExceptionHandler` -- `@ControllerAdvice` handling `MethodArgumentNotValidException` (400) and generic fallback (500)

**application.properties (dev):**

```properties
spring.datasource.url=jdbc:h2:file:./data/fitnessdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.locations=filesystem:../db/schema,filesystem:../db/seeds/common,filesystem:../db/migrations
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=0
server.port=8080
```

---

## Frontend Design

**Component tree:**

```
App
└── WorkoutPage
    ├── ExerciseGrid
    │   └── ExerciseCard (x5)  -- weight/sets/reps inputs + Log button + inline errors
    └── HistoryTable           -- date, exercise, weight, sets, reps columns
```

**State management:**

- No Redux. TanStack Query owns all server state.
- `useWorkoutLogs()` -- query hook for `GET /api/v1/workout-logs`
- `useLogWorkout()` -- mutation hook for `POST /api/v1/workout-logs`; on success: `queryClient.invalidateQueries`
- Form state (per card) -- local `useState`; cleared on successful log

**Component placement:**

| Component | Location |
|-----------|----------|
| `ExerciseCard` | `src/features/workout/components/` |
| `ExerciseGrid` | `src/features/workout/components/` |
| `HistoryTable` | `src/features/workout/components/` |
| `WorkoutPage` | `src/features/workout/` |
| `useWorkoutLogs`, `useLogWorkout` | `src/features/workout/api/` |

**Vite proxy config (`vite.config.ts`):**

```ts
server: { proxy: { '/api': 'http://localhost:8080' } }
```

---

## API Surface Summary

Two endpoints. No auth header required.

| Method | Path | Purpose | Success |
|--------|------|---------|---------|
| `GET` | `/api/v1/workout-logs` | Fetch all logs, newest first | 200 array |
| `POST` | `/api/v1/workout-logs` | Create a log entry | 201 created object |

Full contract (request/response shapes) is defined in the API Contract artifact produced jointly by BE and FE.

---

## DB Schema Summary

Single table. Flyway-managed. Hibernate validates only (`ddl-auto=validate`).

```
workout_log
  id          UUID        PK
  exercise    VARCHAR(50) NOT NULL
  weight_lbs  DECIMAL(6,2) NOT NULL
  sets        INT         NOT NULL
  reps        INT         NOT NULL
  created_at  TIMESTAMP   NOT NULL
  updated_at  TIMESTAMP   NOT NULL
  deleted_at  TIMESTAMP   NULL
```

History queries filter `WHERE deleted_at IS NULL ORDER BY created_at DESC`.

Migration file: `src/db/schema/01_workout_log.sql`
ER diagram: `src/db/er-diagram.md`

---

## Error Handling Approach

- **Client-side first:** FE validates before sending. Invalid fields show inline errors; no request is fired.
- **Server-side always:** BE re-validates with Bean Validation. `MethodArgumentNotValidException` returns 400 with field-level errors in RFC 7807 shape.
- **FE error display:** TanStack Query `isError` state shows a banner above the history table for network/server failures. Inline field errors are local state only.
- **500 fallback:** `GlobalExceptionHandler` returns `{ "title": "Internal Server Error", "status": 500 }` without leaking stack traces.

---

## Logging Approach

Per be-logging conventions. Structured JSON via `logstash-logback-encoder`. SLF4J abstraction throughout.

- Controller: logs request received and request completed (method, URI, status, duration)
- Service: logs `workout_log_created` with `exerciseName`, `weightLbs`, `sets`, `reps`
- Repository layer: DEBUG only
- No PII (no user data exists in this app)
- Access log: Tomcat access log enabled, writes to `logs/access.log`
- Application log: writes to `logs/app.log`

OTEL agent: not wired for local-only MVP. Can be added at promotion to non-local deployment.

---

## Testing Approach

| Layer | Tool | Scope |
|-------|------|-------|
| BE unit | JUnit 5 + Mockito | `WorkoutLogService` logic, timestamp assignment, validation |
| BE integration | `@WebMvcTest` | Controller request/response, validation errors, 400/500 paths |
| BE repository | `@DataJpaTest` | Query correctness against H2 |
| FE unit | Vitest + React Testing Library | `ExerciseCard` inline validation, render states |
| E2E | Playwright | Log a set end-to-end, history table update, validation error display |

No separate staging environment. Playwright E2E runs against locally started BE + FE.

---

## Out of Scope

- Authentication or multi-user support
- Configurable exercise list
- Edit or delete logged entries
- Pagination of history table
- Mobile-native app
- Deployment to any cloud environment
- CI/CD pipelines
- OTEL agent wiring (local MVP only)
