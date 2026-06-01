Status: Approved — EM
Approved: 2026-06-01

# BE Detailed Design: Fitness Tracker Skinny MVP

## API Surface

Two endpoints. No authentication required.

| Method | Path | Request Body | Response | Status Codes |
|--------|------|-------------|----------|--------------|
| `GET` | `/api/v1/workout-logs` | none | `WorkoutLogResponse[]` | 200 |
| `POST` | `/api/v1/workout-logs` | `WorkoutLogRequest` | `WorkoutLogResponse` | 201, 400, 500 |

---

## 1. Maven Project Structure

```
src/backend/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/fitnessapp/
    │   │       ├── FitnessTrackerApplication.java
    │   │       └── workoutlog/
    │   │           ├── WorkoutLog.java
    │   │           ├── WorkoutLogController.java
    │   │           ├── WorkoutLogRepository.java
    │   │           ├── WorkoutLogRequest.java
    │   │           ├── WorkoutLogResponse.java
    │   │           └── WorkoutLogService.java
    │   └── resources/
    │       ├── application.properties
    │       └── logback-spring.xml
    └── test/
        └── java/
            └── com/fitnessapp/
                └── workoutlog/
                    ├── WorkoutLogControllerTest.java
                    ├── WorkoutLogRepositoryTest.java
                    └── WorkoutLogServiceTest.java
```

---

## 2. Package Layout

```
com.fitnessapp
├── FitnessTrackerApplication          -- @SpringBootApplication entry point
└── workoutlog
    ├── WorkoutLog                     -- JPA entity
    ├── WorkoutLogRequest              -- inbound DTO with Bean Validation
    ├── WorkoutLogResponse             -- outbound DTO
    ├── WorkoutLogRepository           -- Spring Data JPA interface
    ├── WorkoutLogService              -- business logic + timestamp assignment
    └── WorkoutLogController           -- REST endpoints
```

One additional class lives outside the feature package:

```
com.fitnessapp
└── GlobalExceptionHandler             -- @ControllerAdvice, RFC 7807 error responses
```

---

## 3. `WorkoutLog` Entity

```java
package com.fitnessapp.workoutlog;

@Entity
@Table(name = "workout_log")
public class WorkoutLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "exercise", nullable = false, length = 50)
    private String exercise;

    @Column(name = "weight_lbs", nullable = false, precision = 6, scale = 2)
    private BigDecimal weightLbs;

    @Column(name = "sets", nullable = false)
    private Integer sets;

    @Column(name = "reps", nullable = false)
    private Integer reps;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
```

Field notes:
- `id`: `UUID`, `@GeneratedValue(GenerationType.UUID)` -- JPA 3.1 native UUID generation, no manual `UUID.randomUUID()` needed
- `weightLbs`: `BigDecimal` -- preserves decimal precision; never `float`/`double`
- `createdAt`, `updatedAt`: set in `WorkoutLogService`, not via `@PrePersist` -- keeps timestamp assignment testable without Spring context
- `deletedAt`: nullable; soft-delete marker, currently unused by any write path but present per schema and audit column convention

---

## 4. `WorkoutLogRequest` DTO

```java
package com.fitnessapp.workoutlog;

public class WorkoutLogRequest {

    @NotBlank(message = "exercise is required")
    @Size(max = 50, message = "exercise must be 50 characters or fewer")
    private String exercise;

    @NotNull(message = "weightLbs is required")
    @DecimalMin(value = "0.01", message = "weightLbs must be greater than 0")
    @Digits(integer = 4, fraction = 2, message = "weightLbs must have at most 4 integer digits and 2 decimal places")
    private BigDecimal weightLbs;

    @NotNull(message = "sets is required")
    @Min(value = 1, message = "sets must be at least 1")
    private Integer sets;

    @NotNull(message = "reps is required")
    @Min(value = 1, message = "reps must be at least 1")
    private Integer reps;
}
```

Validation notes:
- `@NotBlank` covers null + empty + whitespace-only for `exercise`
- `@DecimalMin("0.01")` rejects zero and negative values for weight
- `@Digits` bounds the decimal shape to match `DECIMAL(6,2)` in the schema -- prevents DB truncation errors from reaching the persistence layer
- `@NotNull` required on `Integer` and `BigDecimal` fields because `@Min`/`@DecimalMin` do not fire on null

---

## 5. `WorkoutLogResponse` DTO

```java
package com.fitnessapp.workoutlog;

public class WorkoutLogResponse {

    private UUID id;
    private String exercise;
    private BigDecimal weightLbs;
    private Integer sets;
    private Integer reps;
    private LocalDateTime createdAt;
}
```

Field notes:
- `updatedAt` and `deletedAt` are internal fields and are not exposed to the client
- `createdAt` is the value the history table displays as "Date"
- The controller maps from entity to this DTO; the entity is never returned directly

---

## 6. `WorkoutLogRepository` Interface

```java
package com.fitnessapp.workoutlog;

public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, UUID> {

    @Query("SELECT w FROM WorkoutLog w WHERE w.deletedAt IS NULL ORDER BY w.createdAt DESC")
    List<WorkoutLog> findAllActiveNewestFirst();
}
```

Notes:
- Extends `JpaRepository<WorkoutLog, UUID>` for standard CRUD
- `findAllActiveNewestFirst` uses JPQL to filter soft-deleted rows and sort newest first -- satisfies AC-4 and the HLD query requirement
- The `@Query` is JPQL (not native SQL) so it is DB-agnostic and works against H2

---

## 7. `WorkoutLogService`

```java
package com.fitnessapp.workoutlog;

@Service
public class WorkoutLogService {

    private final WorkoutLogRepository repository;

    public WorkoutLogService(WorkoutLogRepository repository) {
        this.repository = repository;
    }

    // Returns all non-deleted entries, newest first
    public List<WorkoutLogResponse> findAll();

    // Stamps createdAt/updatedAt, persists, returns response DTO
    public WorkoutLogResponse create(WorkoutLogRequest request);

    // Private: maps WorkoutLog entity to WorkoutLogResponse
    private WorkoutLogResponse toResponse(WorkoutLog entity);
}
```

Method contracts:

| Method | Parameters | Return | Notes |
|--------|-----------|--------|-------|
| `findAll()` | none | `List<WorkoutLogResponse>` | Calls `repository.findAllActiveNewestFirst()`, maps each to response DTO |
| `create(WorkoutLogRequest)` | `WorkoutLogRequest` | `WorkoutLogResponse` | Sets `createdAt = LocalDateTime.now()`, `updatedAt = LocalDateTime.now()`, saves, maps to response |
| `toResponse(WorkoutLog)` | `WorkoutLog` | `WorkoutLogResponse` | Private mapping method; extracted for reuse between `findAll` and `create` |

Timestamp assignment is done in the service (not `@PrePersist`) so tests can verify timestamps without needing a JPA lifecycle.

---

## 8. `WorkoutLogController`

```java
package com.fitnessapp.workoutlog;

@RestController
@RequestMapping("/api/v1/workout-logs")
public class WorkoutLogController {

    private final WorkoutLogService service;

    public WorkoutLogController(WorkoutLogService service) {
        this.service = service;
    }
}
```

Endpoints:

| Method | Path | Handler | Request | Response | Success Status |
|--------|------|---------|---------|----------|----------------|
| `GET` | `/api/v1/workout-logs` | `getAll()` | none | `List<WorkoutLogResponse>` | 200 |
| `POST` | `/api/v1/workout-logs` | `create(@Valid @RequestBody WorkoutLogRequest)` | `WorkoutLogRequest` | `WorkoutLogResponse` | 201 |

Handler signatures:

```java
@GetMapping
public ResponseEntity<List<WorkoutLogResponse>> getAll();

@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public ResponseEntity<WorkoutLogResponse> create(@Valid @RequestBody WorkoutLogRequest request);
```

Notes:
- `@Valid` on the `@RequestBody` parameter triggers Bean Validation; violations throw `MethodArgumentNotValidException` which `GlobalExceptionHandler` catches
- Controller is thin: no business logic, only delegates to service and wraps response
- No `@CrossOrigin` here; CORS is configured globally in a `WebMvcConfigurer` bean (see `application.properties` section)

---

## 9. `GlobalExceptionHandler`

```java
package com.fitnessapp;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handles Bean Validation failures from @Valid -- returns 400
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request);

    // Catch-all fallback -- returns 500, no internal details exposed
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(
            Exception ex, HttpServletRequest request);
}
```

### 400 Validation Error Shape (RFC 7807)

```json
{
  "type": "https://fitnessapp.local/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "instance": "/api/v1/workout-logs",
  "errors": {
    "weightLbs": "weightLbs must be greater than 0",
    "sets": "sets is required"
  }
}
```

The `errors` map is keyed by field name and valued by the constraint message. Multiple field errors are all returned in one response so the FE can show all inline errors without a round-trip.

### 500 Fallback Shape

```json
{
  "type": "https://fitnessapp.local/errors/internal",
  "title": "Internal Server Error",
  "status": 500,
  "instance": "/api/v1/workout-logs"
}
```

No stack trace, no exception message, no internal detail is included in the 500 response body.

---

## 10. Flyway Configuration

Migration file path (schema file, run once):

```
src/db/schema/01_workout_log.sql
```

Naming convention:
- Schema files: `{nn}_{description}.sql` (e.g. `01_workout_log.sql`) -- numeric prefix, run once, never modified after first run
- Future migrations: `YYYYMMDD_HHMMSS_<description>.sql` placed in `src/db/migrations/`

Flyway locates scripts via `spring.flyway.locations` (see section 11). It uses the text before the first `_` as the version key to track applied scripts.

---

## 11. `application.properties`

```properties
# Server
server.port=8080

# H2 datasource (file-backed for persistence across restarts)
spring.datasource.url=jdbc:h2:file:./data/fitnessdb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# H2 console (dev convenience -- disable before any non-local deployment)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# JPA -- Hibernate validates only; Flyway owns DDL
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# Flyway
spring.flyway.locations=filesystem:../db/schema,filesystem:../db/seeds/common,filesystem:../db/migrations
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=0
spring.flyway.sql-migration-prefix=
spring.flyway.sql-migration-separator=_

# Tomcat access log
server.tomcat.accesslog.enabled=true
server.tomcat.accesslog.directory=logs
server.tomcat.accesslog.prefix=access
server.tomcat.accesslog.suffix=.log
server.tomcat.accesslog.rotate=true
server.tomcat.accesslog.pattern=time=%t remote_ip=%h request_method=%m url_path="%U" query_string="%q" response_code=%s time_millis=%{msec}T bytes_sent=%b Referrer="%{Referer}i" UserAgent="%{User-Agent}i" traceId=%{X-Trace-Id}i

# CORS (allows Vite dev server to call BE)
spring.web.cors.allowed-origins=http://localhost:5173
spring.web.cors.allowed-methods=GET,POST
spring.web.cors.allowed-headers=Content-Type

# Logging
logging.level.root=INFO
logging.level.com.fitnessapp=INFO
logging.level.org.springframework.web=WARN
logging.level.org.hibernate.SQL=WARN

# SpringDoc / Swagger UI
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

Note on CORS: `spring.web.cors.*` properties require a `WebMvcConfigurer` bean to pick them up in Spring Boot 3. A `CorsConfig` class annotated `@Configuration` implementing `WebMvcConfigurer#addCorsMappings` reads these values via `@ConfigurationProperties`.

---

## 12. Logging Plan

Logback structured JSON output via `logstash-logback-encoder`. SLF4J abstraction throughout. Two separate outputs: `logs/app.log` (application) and `logs/access.log` (Tomcat HTTP layer).

OTEL agent is not wired for this local-only MVP per HLD decision. MDC fields (`traceId`) are not populated automatically; no manual `TraceIdFilter` is added either since there is no distributed tracing requirement at this scope. This is a known gap documented in BACKLOG for promotion to non-local deployment.

### Per-class logging

| Class | Level | Events logged |
|-------|-------|---------------|
| `WorkoutLogController` | `INFO` | `request_received method={} uri={}`, `request_completed status={} durationMs={}` |
| `WorkoutLogController` | `WARN` | 4xx responses (validation failures) |
| `WorkoutLogService` | `INFO` | `workout_log_created exerciseName={} weightLbs={} sets={} reps={}` |
| `WorkoutLogRepository` | `DEBUG` | No explicit logging; Hibernate SQL logging stays at `WARN` in prod |
| `GlobalExceptionHandler` | `WARN` | 400 validation errors: `validation_failed fields={}` |
| `GlobalExceptionHandler` | `ERROR` | 500 fallback: `unhandled_exception uri={}` with exception object as last arg |

### MDC fields

| Field | Set by | Value |
|-------|--------|-------|
| (none for MVP) | n/a | OTEL agent not attached; MDC not populated |

### Message format examples

```
// Controller
log.info("request_received method={} uri={} remoteIp={}", request.getMethod(), request.getRequestURI(), request.getRemoteAddr());
log.info("request_completed status={} durationMs={}", status, duration);

// Service
log.info("workout_log_created exerciseName={} weightLbs={} sets={} reps={}", exercise, weightLbs, sets, reps);

// GlobalExceptionHandler -- validation
log.warn("validation_failed fields={}", fieldErrors.keySet());

// GlobalExceptionHandler -- 500
log.error("unhandled_exception uri={}", request.getRequestURI(), ex);
```

### `logback-spring.xml` configuration

Two appenders: `APP_FILE` (JSON, writes to `logs/app.log`) and console for local dev. Tomcat access log is enabled via `application.properties` (see section 11).

---

## 13. Unit and Integration Test Scope

Coverage target: 100% line coverage enforced by JaCoCo (`mvn verify` fails below threshold).

### `WorkoutLogServiceTest` (unit test)

Tool: JUnit 5 + Mockito. No Spring context.

| Scenario | Method under test |
|----------|------------------|
| `findAll` returns mapped DTOs from repository | `findAll()` |
| `findAll` returns empty list when repository returns empty | `findAll()` |
| `create` stamps `createdAt` and `updatedAt` as non-null | `create()` |
| `create` passes correct fields to repository save | `create()` |
| `create` returns DTO with fields matching request | `create()` |

Repository is mocked via `@Mock` / `@InjectMocks`. No DB involved.

### `WorkoutLogControllerTest` (integration test -- slice)

Tool: `@WebMvcTest(WorkoutLogController.class)` + `MockMvc`. Service is mocked.

| Scenario | Endpoint |
|----------|---------|
| GET returns 200 with JSON array | `GET /api/v1/workout-logs` |
| GET returns empty array when no logs exist | `GET /api/v1/workout-logs` |
| POST with valid body returns 201 with created object | `POST /api/v1/workout-logs` |
| POST with missing `exercise` returns 400 RFC 7807 body | `POST /api/v1/workout-logs` |
| POST with `weightLbs = 0` returns 400 with field error | `POST /api/v1/workout-logs` |
| POST with `sets = 0` returns 400 with field error | `POST /api/v1/workout-logs` |
| POST with `reps = 0` returns 400 with field error | `POST /api/v1/workout-logs` |
| POST with all fields missing returns 400 with all field errors | `POST /api/v1/workout-logs` |
| Service throws unchecked exception returns 500 shape | `POST /api/v1/workout-logs` |

### `WorkoutLogRepositoryTest` (integration test -- slice)

Tool: `@DataJpaTest` against H2. Flyway applied automatically via test classpath.

| Scenario | Method under test |
|----------|------------------|
| `findAllActiveNewestFirst` returns records ordered newest first | `findAllActiveNewestFirst()` |
| `findAllActiveNewestFirst` excludes rows where `deletedAt` is not null | `findAllActiveNewestFirst()` |
| `findAllActiveNewestFirst` returns empty list when no active rows | `findAllActiveNewestFirst()` |
| `save` persists all fields correctly | `JpaRepository.save()` |

### Test naming convention

Methods follow `methodName_should_expectedBehavior_when_scenario`. `@DisplayName` added to all test methods for readable Maven output. `@ParameterizedTest` used wherever the same behavior is being verified across multiple invalid inputs (e.g. the four invalid-field 400 cases in the controller test).
