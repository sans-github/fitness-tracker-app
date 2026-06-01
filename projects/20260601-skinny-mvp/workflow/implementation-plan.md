# Implementation Plan: Fitness Tracker Skinny MVP

## Overview

This plan covers Stage 4 (Engineering) and Stage 5 (QA) for the Skinny MVP. Scope is narrow: one table, two endpoints, one React page, local deployment only. Steps are sequenced to respect contract-first dependencies.

---

## Stage 4: Engineering

### 4.1 BE Detailed Design

**Agent:** BE

**Produces:** `generated-docs/architecture/be-detailed-design.md`

Steps:
1. **BE** authors BE Detailed Design covering: Maven project structure, full package layout, entity and DTO field definitions, Bean Validation annotations, `GlobalExceptionHandler` behavior (400 validation errors, 500 fallback), Flyway config, `application.properties` settings, logging plan per `be-logging` conventions, and unit/integration test scope.
   - Done when: file exists at `generated-docs/architecture/be-detailed-design.md` with `Status: Draft` header.
2. **EM** reviews BE Detailed Design and approves or requests changes. Loop continues until EM is satisfied.
   - Done when: `Status: Approved — EM` is set at the top of `generated-docs/architecture/be-detailed-design.md`. 💾

---

### 4.2 FE Detailed Design

**Agent:** FE

**Produces:** `generated-docs/architecture/fe-detailed-design.md`

Steps:
3. **FE** authors FE Detailed Design covering: Vite project structure, component tree (`WorkoutPage`, `ExerciseGrid`, `ExerciseCard`, `HistoryTable`), props interfaces, TanStack Query hook signatures (`useWorkoutLogs`, `useLogWorkout`), client-side validation logic, error display approach, Vite proxy config, logging plan per `fe-logging` conventions, and component/E2E test scope.
   - Done when: file exists at `generated-docs/architecture/fe-detailed-design.md` with `Status: Draft` header.
4. **EM** reviews FE Detailed Design and approves or requests changes. Loop continues until EM is satisfied.
   - Done when: `Status: Approved — EM` is set at the top of `generated-docs/architecture/fe-detailed-design.md`. 💾

---

### 4.3 API Contract

**Agents:** BE + FE jointly

**Produces:** `generated-docs/contracts/api-contract.md`

Steps:
5. **BE and FE** jointly author the API Contract covering: `GET /api/v1/workout-logs` and `POST /api/v1/workout-logs` — full request/response shapes, field types, validation rules, HTTP status codes, error response format (RFC 7807), and CORS behaviour. BE and FE align until both are satisfied.
   - Done when: file exists at `generated-docs/contracts/api-contract.md` with `Status: Draft` header and both BE and FE have confirmed alignment.
6. **EM** reviews API Contract and approves or requests changes. Loop continues until EM is satisfied.
   - Done when: `Status: Approved — EM` is set at the top of `generated-docs/contracts/api-contract.md`. 💾

---

### 4.4 BE Issues List

**Agent:** EM

**Produces:** `generated-docs/architecture/be-issues-list.md`

Steps:
7. **EM** produces the BE Issues List. One issue per discrete unit of work. Issues cover: Maven project scaffolding and `pom.xml`, `application.properties`, Flyway schema file (`src/db/schema/01_workout_log.sql`), ER diagram (`src/db/er-diagram.md`), `WorkoutLog` entity, `WorkoutLogRequest` / `WorkoutLogResponse` DTOs, `WorkoutLogRepository`, `WorkoutLogService`, `WorkoutLogController`, `GlobalExceptionHandler`, structured JSON logging config, unit tests (service, controller slice), integration tests (repository, full-stack), `.gitignore` for Java/Maven artifacts.
   - Done when: file exists at `generated-docs/architecture/be-issues-list.md` and `Status: Approved — EM` is set. 💾

---

### 4.5 Backend Development

**Agent:** BE

Steps:
8. **BE** creates GitHub issues from the approved BE Issues List.
   - Done when: all issues from `be-issues-list.md` exist in GitHub with correct labels.
9. **BE** implements DB schema: `src/db/schema/01_workout_log.sql` (Flyway-managed), `src/db/er-diagram.md` (Mermaid), `.gitignore` baseline entries.
   - Done when: schema file and ER diagram exist at their canonical paths; `mvn flyway:info` confirms script is detected. 💾
10. **BE** implements Maven project: `pom.xml` with Spring Boot, Spring Data JPA, H2, Flyway, SpringDoc, Bean Validation, Logback JSON encoder, JaCoCo, Checkstyle; `application.properties` with Flyway locations and `ddl-auto=validate`.
    - Done when: `mvn verify` exits 0 (no source files yet, but project compiles). 💾
11. **BE** implements entity, DTOs, repository, service, and controller: `WorkoutLog.java`, `WorkoutLogRequest.java`, `WorkoutLogResponse.java`, `WorkoutLogRepository.java`, `WorkoutLogService.java`, `WorkoutLogController.java`.
    - Done when: all files exist at their package paths and `mvn compile` exits 0.
12. **BE** implements `GlobalExceptionHandler.java` (400 validation errors formatted as RFC 7807, 500 fallback).
    - Done when: file exists and `mvn compile` exits 0.
13. **BE** implements structured JSON logging per `be-logging` conventions: Logback JSON appender config, per-layer log statements, access log enabled in `application.properties`.
    - Done when: `be-logging` checklist reviewed and all applicable items confirmed.
14. **BE** implements unit tests (service layer with Mockito, `@WebMvcTest` controller slice) and integration tests (`@SpringBootTest` with H2).
    - Done when: `mvn verify` exits 0 with 100% line coverage enforced by JaCoCo and no Checkstyle violations. 💾
15. **BE** exports OpenAPI spec: `curl http://localhost:8080/v3/api-docs -o generated-docs/contracts/openapi.json` after starting the app locally.
    - Done when: `generated-docs/contracts/openapi.json` exists and is valid JSON. 💾
16. **EM** reviews BE implementation: checks `.gitignore`, ER diagram present, schema file matches PRD data model, API Contract alignment, logging coverage, test coverage, no build artifacts committed.
    - Done when: EM confirms review complete and no blocking issues remain. Any issues raised are resolved by BE and re-reviewed before proceeding.

---

### 4.6 FE Issues List

**Agent:** EM

**Produces:** `generated-docs/architecture/fe-issues-list.md`

Steps:
17. **EM** produces the FE Issues List. Issues cover: Vite + React + TypeScript project scaffolding, `vite.config.ts` (proxy), TanStack Query provider setup, `useWorkoutLogs` query hook, `useLogWorkout` mutation hook, `WorkoutPage`, `ExerciseGrid`, `ExerciseCard` (form state, client-side validation, inline errors), `HistoryTable`, structured logging module per `fe-logging` conventions, component tests, Playwright E2E tests, `.gitignore` for FE artifacts.
    - Done when: file exists at `generated-docs/architecture/fe-issues-list.md` and `Status: Approved — EM` is set. 💾

---

### 4.7 Frontend Development

**Agent:** FE

Steps:
18. **FE** creates GitHub issues from the approved FE Issues List.
    - Done when: all issues from `fe-issues-list.md` exist in GitHub with correct labels.
19. **FE** scaffolds Vite + React + TypeScript project: `package.json`, `tsconfig.json` (strict mode), `vite.config.ts` (proxy to `localhost:8080`), ESLint + Prettier config, `.gitignore` for FE artifacts.
    - Done when: `npm run build` exits 0 with empty app. 💾
20. **FE** implements TanStack Query provider, logger module (`src/lib/logger.ts`), `generateTraceId` utility, and typed API hooks (`useWorkoutLogs`, `useLogWorkout`) with `X-Trace-Id` header on every request.
    - Done when: TypeScript compiles without errors (`npm run build` exits 0).
21. **FE** implements UI components: `ExerciseCard` (inputs, Log button, client-side validation, inline errors), `ExerciseGrid` (renders 5 cards in PRD order), `HistoryTable` (date, exercise, weight, sets, reps columns, newest-first), `WorkoutPage` (composes grid + table).
    - Done when: all component files exist at paths specified in FE Detailed Design and `npm run build` exits 0.
22. **FE** implements structured logging per `fe-logging` conventions: page view, API call start/complete/failed, user Log action, error boundary.
    - Done when: `fe-logging` checklist reviewed and all applicable items confirmed.
23. **FE** implements component tests and Playwright E2E tests covering AC-1 (render exercises) and AC-2 (log an exercise, history refreshes).
    - Done when: all tests pass (`npm test` and `npx playwright test` both exit 0). 💾
24. **EM** reviews FE implementation: checks `.gitignore`, component placement matches HLD, API Contract alignment (request shape, error handling), logging coverage, test coverage, no `node_modules` or build output committed.
    - Done when: EM confirms review complete and no blocking issues remain. Any issues raised are resolved by FE and re-reviewed before proceeding.

---

### 4.8 Local Run Guide

**Agent:** BE (owns the local setup doc since BE starts the server)

Steps:
25. **BE** produces `generated-docs/ops/local-run-guide.md` covering: prerequisites (Java 21, Node 18+, Maven), how to start the backend (`mvn spring-boot:run` from `src/backend/`), how to start the frontend (`npm install && npm run dev` from `src/frontend/`), expected URLs (`localhost:8080` for API, `localhost:5173` for UI), H2 data file location (`data/fitnessdb.mv.db`), and how to reset the DB (delete the data file).
    - Done when: file exists at `generated-docs/ops/local-run-guide.md`. 💾

---

## Stage 5: QA

### 5.1 Test Planning

**Agent:** QA

**Produces:** `generated-docs/qa/test-plan.md`

Steps:
26. **QA** authors Test Plan covering: scope (AC-1, AC-2; in-scope and out-of-scope explicitly stated), risk summary, test types (API-level and E2E), tool choices (Playwright), environment requirements (both servers running locally), test data strategy, and pass/fail criteria.
    - Done when: file exists at `generated-docs/qa/test-plan.md` with `Status: Draft` header.
27. **EM** reviews Test Plan and approves or requests changes.
    - Done when: `Status: Approved — EM` is set at the top of `generated-docs/qa/test-plan.md`. 💾

---

### 5.2 QA Issues List

**Agent:** EM

**Produces:** `generated-docs/qa/qa-issues-list.md`

Steps:
28. **EM** produces the QA Issues List. Issues cover: AC-1 E2E test (page load, 5 exercises render in order, history table visible), AC-2 E2E test (fill inputs, click Log, history table shows new row at top), API-level test (`GET /api/v1/workout-logs` 200, `POST /api/v1/workout-logs` 201, validation error 400), negative cases (missing fields, invalid weight, invalid sets/reps).
    - Done when: file exists at `generated-docs/qa/qa-issues-list.md` and `Status: Approved — EM` is set. 💾

---

### 5.3 Test Execution

**Agent:** QA

Steps:
29. **QA** creates GitHub issues from the approved QA Issues List.
    - Done when: all issues from `qa-issues-list.md` exist in GitHub with correct labels.
30. **QA** implements Playwright automation suite: API-level tests (using `generated-docs/contracts/openapi.json` for contract assertions where applicable) and E2E tests covering all items in the QA Issues List. Test files live at `src/frontend/tests/` (or a dedicated `src/qa/` path as agreed in the Test Plan).
    - Done when: all automated tests pass against locally running BE and FE (`npx playwright test` exits 0).
31. **QA** raises any blockers as GitHub issues assigned to BE or FE; BE/FE resolves; QA re-runs until clean.
    - Done when: no open QA-blocking issues remain.
32. **EM** reviews QA automation results: confirms all ACs are covered, no skipped tests without documented reason, test output is clean.
    - Done when: `Status: Approved — EM` appended to `generated-docs/qa/test-plan.md` results section, EM confirms sign-off. 💾
