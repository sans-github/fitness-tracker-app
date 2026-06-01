## Issue 1: Maven project scaffolding

**Labels:** be debt
**Done when:** `src/backend/pom.xml` exists with Spring Boot 3, Spring Data JPA, H2, Flyway, SpringDoc OpenAPI (`springdoc-openapi-starter-webmvc-ui`), Bean Validation, `logstash-logback-encoder`, JaCoCo (100% line coverage gate), and Checkstyle (`google_checks.xml`) configured; `src/backend/src/main/resources/application.properties` exists with all settings from BE Detailed Design section 11; `mvn verify` passes with no compilation errors.

Set up the Maven project skeleton at `src/backend/` with all required dependencies and plugins. Configure JaCoCo to fail `mvn verify` below 100% line coverage. Configure Checkstyle bound to the `verify` phase using `google_checks.xml`. The `application.properties` must include server, H2 datasource, JPA, Flyway, Tomcat access log, CORS, logging levels, and SpringDoc settings exactly as specified in BE Detailed Design section 11.

---

## Issue 2: Flyway migration and .gitignore baseline

**Labels:** db debt
**Done when:** `src/db/schema/01_workout_log.sql` exists and creates the `workout_log` table matching the entity (id UUID PK, exercise VARCHAR(50) NOT NULL, weight_lbs DECIMAL(6,2) NOT NULL, sets INT NOT NULL, reps INT NOT NULL, created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL, deleted_at TIMESTAMP NULL); `.gitignore` exists at repo root with baseline OS/IDE/secrets entries plus Java/Maven section covering `target/`, `*.class`, `*.jar`, `*.war`; `mvn spring-boot:run` starts without Flyway or Hibernate errors.

Author the Flyway schema file at `src/db/schema/01_workout_log.sql`. The file is a schema baseline — it must never be modified after first run. Include standard audit columns (`created_at`, `updated_at`, `deleted_at`) and a primary key on `id`. Create `.gitignore` if absent, or append to it if present, with the Java/Maven section and baseline OS/IDE/secrets entries as defined in `gitignore-rule.md`.

---

## Issue 3: ER diagram

**Labels:** db debt
**Done when:** `src/db/er-diagram.md` exists and contains a Mermaid `erDiagram` block for `WORKOUT_LOG` with all columns, types, nullability, and the UUID primary key; file is committed in the same commit as the schema migration file per `db-schema-change-rule.md`.

Produce the ER diagram at `src/db/er-diagram.md` as a Mermaid `erDiagram` diagram. Include every column from `01_workout_log.sql` with type, nullability, and PK annotation. This file is the authoritative live schema snapshot and must stay in sync with every future migration.

---

## Issue 4: `WorkoutLog` JPA entity

**Labels:** be debt
**Done when:** `src/backend/src/main/java/com/fitnessapp/workoutlog/WorkoutLog.java` exists with all fields (`id` UUID, `exercise` String, `weightLbs` BigDecimal, `sets` Integer, `reps` Integer, `createdAt` LocalDateTime, `updatedAt` LocalDateTime, `deletedAt` LocalDateTime nullable), correct JPA annotations (`@Entity`, `@Table`, `@Id`, `@GeneratedValue(GenerationType.UUID)`, `@Column` with `nullable`, `length`, `updatable` constraints), and `mvn verify` passes Checkstyle.

Implement the `WorkoutLog` JPA entity exactly as specified in BE Detailed Design section 3. Use `@GeneratedValue(strategy = GenerationType.UUID)` for JPA 3.1 native UUID generation. `weightLbs` must be `BigDecimal` with `precision = 6, scale = 2`. No `@PrePersist` — timestamps are assigned in the service layer.

---

## Issue 5: `WorkoutLogRequest` and `WorkoutLogResponse` DTOs

**Labels:** be debt
**Done when:** `WorkoutLogRequest.java` exists with all four fields and Bean Validation annotations (`@NotBlank`, `@Size(max=50)`, `@NotNull`, `@DecimalMin("0.01")`, `@Digits(integer=4, fraction=2)`, `@Min(1)`) with constraint messages matching the API contract; `WorkoutLogResponse.java` exists with six fields (id, exercise, weightLbs, sets, reps, createdAt) and no `updatedAt` or `deletedAt`; `mvn verify` passes.

Implement the two DTOs in `src/backend/src/main/java/com/fitnessapp/workoutlog/`. `WorkoutLogRequest` must carry all Bean Validation annotations as specified in BE Detailed Design section 4, with constraint messages that match the API contract error examples exactly. `WorkoutLogResponse` exposes only the six fields the client receives — internal fields must not be included.

---

## Issue 6: `WorkoutLogRepository` interface

**Labels:** be debt
**Done when:** `WorkoutLogRepository.java` exists extending `JpaRepository<WorkoutLog, UUID>` with a `findAllActiveNewestFirst()` method annotated `@Query` using JPQL that filters `deletedAt IS NULL` and orders by `createdAt DESC`; `@DataJpaTest` can resolve the bean without errors.

Implement `WorkoutLogRepository` in `src/backend/src/main/java/com/fitnessapp/workoutlog/`. The custom query must use JPQL (not native SQL) so it runs against H2 in tests. The method name is `findAllActiveNewestFirst` as referenced in the service design.

---

## Issue 7: `WorkoutLogService`

**Labels:** be debt
**Done when:** `WorkoutLogService.java` exists annotated `@Service` with constructor injection; `findAll()` calls `repository.findAllActiveNewestFirst()` and maps results via `toResponse()`; `create()` sets `createdAt` and `updatedAt` to `LocalDateTime.now()` before calling `repository.save()` and returns a mapped DTO; `toResponse()` is a private mapping method; `mvn verify` passes Checkstyle.

Implement `WorkoutLogService` in `src/backend/src/main/java/com/fitnessapp/workoutlog/` following the method contracts in BE Detailed Design section 7. Timestamps must be assigned in the service method (not via `@PrePersist`) to keep timestamp logic testable with Mockito. Add SLF4J `log.info` calls per the logging plan in section 12.

---

## Issue 8: `WorkoutLogController`

**Labels:** be debt
**Done when:** `WorkoutLogController.java` exists with `@RestController`, `@RequestMapping("/api/v1/workout-logs")`, constructor injection of `WorkoutLogService`; `getAll()` returns `ResponseEntity<List<WorkoutLogResponse>>` with status 200; `create()` accepts `@Valid @RequestBody WorkoutLogRequest` and returns `ResponseEntity<WorkoutLogResponse>` with status 201; a `CorsConfig` `@Configuration` bean implementing `WebMvcConfigurer#addCorsMappings` wires the CORS settings from `application.properties`; `mvn verify` passes.

Implement `WorkoutLogController` as a thin delegation layer — no business logic. Add the `CorsConfig` class in `com.fitnessapp` to pick up `spring.web.cors.*` properties via `WebMvcConfigurer`. Add SLF4J `log.info` and `log.warn` calls per the logging plan in BE Detailed Design section 12.

---

## Issue 9: `GlobalExceptionHandler`

**Labels:** be debt
**Done when:** `GlobalExceptionHandler.java` exists in `com.fitnessapp` annotated `@RestControllerAdvice`; `handleValidation` catches `MethodArgumentNotValidException` and returns 400 with the RFC 7807 body shape (`type`, `title`, `status`, `instance`, `errors` map keyed by field name); `handleGeneric` catches `Exception` and returns 500 with the RFC 7807 body shape and no internal detail exposed; `log.warn` on 400, `log.error` with exception on 500 per logging plan; `mvn verify` passes.

Implement the exception handler in `src/backend/src/main/java/com/fitnessapp/GlobalExceptionHandler.java`. The `errors` map must collect all field violations in a single pass so the FE receives all errors at once. The 500 handler must not include the exception message or stack trace in the response body. Response `Content-Type` must be `application/problem+json` per the API contract.

---

## Issue 10: Structured JSON logging config

**Labels:** be debt
**Done when:** `src/backend/src/main/resources/logback-spring.xml` exists with two appenders: `APP_FILE` (JSON via `logstash-logback-encoder`, writing to `logs/app.log`) and a console appender for local dev; `application.properties` has all Tomcat access log settings from BE Detailed Design section 11 including the `traceId=%{X-Trace-Id}i` pattern field; `mvn spring-boot:run` produces JSON lines in `logs/app.log` and access log lines in `logs/access.log`.

Configure Logback structured JSON output using `logstash-logback-encoder`. The app log and access log must be separate files as specified in the logging plan. No `TraceIdFilter` or OTEL agent wiring is required for this local-only MVP — that gap is noted in BACKLOG. Ensure `logs/` is added to `.gitignore`.

---

## Issue 11: Unit tests — `WorkoutLogServiceTest` and `WorkoutLogControllerTest`

**Labels:** be debt
**Done when:** `WorkoutLogServiceTest.java` covers all five scenarios from BE Detailed Design section 13 using JUnit 5 + Mockito with no Spring context; `WorkoutLogControllerTest.java` covers all nine scenarios using `@WebMvcTest` with `MockMvc`; parameterized tests used for the four invalid-field 400 cases; all test methods follow `methodName_should_expectedBehavior_when_scenario` naming with `@DisplayName`; `mvn verify` passes JaCoCo 100% line coverage gate and Checkstyle.

Implement unit tests for the service and controller slice tests per BE Detailed Design section 13. The controller test must assert the RFC 7807 response shape on 400 and 500 cases using `MockMvcResultMatchers.jsonPath`. Repository is mocked in `WorkoutLogControllerTest` via `@MockBean`.

---

## Issue 12: Integration tests — `WorkoutLogRepositoryTest` and `WorkoutLogIntegrationTest`

**Labels:** be debt
**Done when:** `WorkoutLogRepositoryTest.java` covers all four scenarios from BE Detailed Design section 13 using `@DataJpaTest` against H2 with Flyway applied; `WorkoutLogIntegrationTest.java` covers at minimum a full POST then GET round-trip using `@SpringBootTest` with `TestRestTemplate` or `MockMvc`; all test methods follow naming convention with `@DisplayName`; `mvn verify` passes JaCoCo and Checkstyle.

Implement data layer integration tests using `@DataJpaTest`, which spins up H2 and applies Flyway migrations from the test classpath. The repository test must verify soft-delete filtering (rows with non-null `deletedAt` are excluded) and newest-first ordering. The full integration test verifies the HTTP stack end to end against the embedded server.

---

## Issue 13: OpenAPI spec export

**Labels:** be debt
**Done when:** `projects/20260601-skinny-mvp/generated-docs/contracts/openapi.json` exists, was generated by running `curl http://localhost:8080/v3/api-docs -o generated-docs/contracts/openapi.json` against a live local instance, and is committed with message `export openapi spec for skinny-mvp #13`.

Start the application locally (`mvn spring-boot:run`), then export the OpenAPI spec using `curl http://localhost:8080/v3/api-docs -o generated-docs/contracts/openapi.json`. Commit the file in a standalone commit. This artifact enables QA to drive contract-level API assertions per the collaboration contracts.

---

Status: Approved — EM
