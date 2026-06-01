Status: Approved — EM
Approved: 2026-06-01

# Test Plan: Fitness Tracker Skinny MVP

## Scope

### In scope

- AC-1: All 5 hardcoded exercises render on page load in correct order; history table visible
- AC-2: Log entry form submits successfully; new row appears at top of history table with correct values
- AC-3: Inline validation errors appear for empty fields and invalid values (weight = 0, sets = 0, reps = 0); no DB row created on invalid submit
- AC-4: History table rows ordered by descending `created_at`; displayed values match submitted values exactly with no rounding

### Out of scope

- Authentication and multi-user scenarios
- Exercise configurability (add, edit, remove exercises)
- Mobile native (iOS/Android apps)
- Non-local deployment environments

### Risk summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Decimal rounding on `weightLbs` display (AC-4) | High | Explicit test with 2-decimal input (e.g. 135.75) asserting exact display value |
| Sort order relying on client-side sort rather than server-guaranteed order (AC-4) | High | API-level test verifies GET returns array in descending `createdAt` order; two POST calls with known timing enforced |
| Inline error does not block save (AC-3) | High | Assert no DB row exists via GET after invalid submit |
| `createdAt` assigned client-side instead of server-side (AC-2) | Medium | POST response contains `createdAt`; verify it is present and ISO 8601 UTC format |

---

## Environment

Both servers must be running locally before any test suite executes.

- **BE:** Spring Boot on `http://localhost:8080` — started per `generated-docs/ops/local-run-guide.md`
- **FE:** Vite dev server on `http://localhost:5173` — started per `generated-docs/ops/local-run-guide.md`
- **Database:** H2 in-process; fresh data directory deleted before each test run to guarantee a clean state

---

## Test data strategy

- Delete the H2 data directory before each full test run (ensures no state leaks between runs)
- Seed test data via POST calls in test `beforeEach` / `beforeAll` hooks — never via direct DB manipulation
- Each test that requires pre-existing history rows creates them through `POST /api/v1/workout-logs` in setup
- No shared mutable state between test files; each file owns its setup and teardown

---

## Test types and tooling

| Type | Tool | Target |
|------|------|--------|
| API-level | Playwright (API mode) | `http://localhost:8080` |
| E2E browser | Playwright (headed/headless) | `http://localhost:5173` |

No unit tests are in scope for this phase. Behavior is tested at the API and E2E layers only.

---

## API-level test cases

Base URL: `http://localhost:8080`

### GET /api/v1/workout-logs

| ID | Description | Input | Expected |
|----|-------------|-------|----------|
| API-01 | Empty DB returns empty array | No prior data | 200, body `[]`, Content-Type `application/json` |
| API-02 | Returns all rows when data exists | 2 rows seeded via POST | 200, array length 2 |
| API-03 | Response shape matches contract | 1 row seeded | Each item has `id` (UUID string), `exercise` (string), `weightLbs` (number), `sets` (integer), `reps` (integer), `createdAt` (ISO 8601 UTC string); no `updatedAt`, no `deletedAt` |
| API-04 | Rows ordered newest first | 2 rows seeded 100ms apart | `createdAt` of first item is greater than second item |
| API-05 | Decimal weight preserved exactly | POST with `weightLbs: 135.75` | GET response shows `weightLbs: 135.75`, not rounded |

### POST /api/v1/workout-logs

| ID | Description | Input | Expected |
|----|-------------|-------|----------|
| API-06 | Valid body creates entry | `{exercise: "Squat", weightLbs: 100.0, sets: 3, reps: 5}` | 201, response body contains all submitted fields plus `id` (UUID) and `createdAt` (ISO 8601 UTC); Content-Type `application/json` |
| API-07 | `createdAt` is server-assigned | Valid body | `createdAt` present in response; not null; matches ISO 8601 UTC pattern |
| API-08 | 2-decimal weight accepted | `weightLbs: 135.75` | 201, `weightLbs: 135.75` in response |
| API-09 | Weight = 0 rejected | `weightLbs: 0` with valid other fields | 400, Content-Type `application/problem+json`, body has `type: "https://fitnessapp.local/errors/validation"`, `title: "Validation Failed"`, `status: 400`, `errors.weightLbs` present |
| API-10 | Sets = 0 rejected | `sets: 0` with valid other fields | 400, RFC 7807, `errors.sets` present |
| API-11 | Reps = 0 rejected | `reps: 0` with valid other fields | 400, RFC 7807, `errors.reps` present |
| API-12 | Missing exercise field | Body without `exercise` | 400, RFC 7807, `errors.exercise` present |
| API-13 | Missing weightLbs field | Body without `weightLbs` | 400, RFC 7807, `errors.weightLbs` present |
| API-14 | Missing sets field | Body without `sets` | 400, RFC 7807, `errors.sets` present |
| API-15 | Missing reps field | Body without `reps` | 400, RFC 7807, `errors.reps` present |
| API-16 | All fields missing | Empty body `{}` | 400, RFC 7807, `errors` contains violations for all required fields |
| API-17 | Negative weight rejected | `weightLbs: -10` | 400, RFC 7807, `errors.weightLbs` present |
| API-18 | Invalid 400 body does not persist | POST invalid body, then GET | GET returns no row corresponding to the invalid request |

---

## E2E browser test cases

Base URL: `http://localhost:5173`

### AC-1: Exercise rendering

| ID | Description | Steps | Expected |
|----|-------------|-------|----------|
| E2E-01 | All 5 exercises appear in correct order on load | Navigate to `/` | Page shows Squat, Bench Press, Deadlift, Overhead Press, Bent-over Row in that order |
| E2E-02 | Each exercise has Weight, Sets, Reps inputs and a Log button | Navigate to `/` | Each of the 5 exercise cards has 3 input fields and a Log button |
| E2E-03 | History table is visible on load | Navigate to `/` with no prior data | History table element is visible; shows empty state or header row |

### AC-2: Log an exercise

| ID | Description | Steps | Expected |
|----|-------------|-------|----------|
| E2E-04 | Valid log entry saves and appears in history | Fill Squat card (135.75 lbs, 3 sets, 5 reps), click Log | New row appears at top of history table; shows "Squat", "135.75", "3", "5" |
| E2E-05 | New row appears at top after logging | Seed 1 existing row, fill and submit Bench Press | Bench Press row is the first row in the table |
| E2E-06 | Form inputs clear after successful log | Submit valid entry | Input fields return to empty after submit |
| E2E-07 | History refreshes without page reload | Submit valid entry | Table updates without full page navigation |

### AC-3: Validation

| ID | Description | Steps | Expected |
|----|-------------|-------|----------|
| E2E-08 | Empty weight shows inline error | Click Log with empty weight field | Inline error appears adjacent to Weight input; no new history row |
| E2E-09 | Empty sets shows inline error | Click Log with empty sets field | Inline error appears adjacent to Sets input; no new history row |
| E2E-10 | Empty reps shows inline error | Click Log with empty reps field | Inline error appears adjacent to Reps input; no new history row |
| E2E-11 | Weight = 0 shows inline error | Enter 0 in Weight, click Log | Inline error adjacent to Weight input; no new history row |
| E2E-12 | Sets = 0 shows inline error | Enter 0 in Sets, click Log | Inline error adjacent to Sets input; no new history row |
| E2E-13 | Reps = 0 shows inline error | Enter 0 in Reps, click Log | Inline error adjacent to Reps input; no new history row |
| E2E-14 | All fields empty shows all errors | Click Log on untouched card | Inline errors visible for Weight, Sets, and Reps; no new history row |

### AC-4: History correctness

| ID | Description | Steps | Expected |
|----|-------------|-------|----------|
| E2E-15 | Rows ordered newest first on load | Seed 3 rows with known order via API, reload page | Rows appear in descending `createdAt` order matching seed order |
| E2E-16 | Decimal weight displayed exactly | Log entry with `weightLbs: 135.75` | Table cell shows "135.75" not "135.8" or "136" |
| E2E-17 | Integer values not rounded | Log entry with sets = 3, reps = 5 | Table cells show "3" and "5" exactly |
| E2E-18 | Exercise name matches submitted value | Log "Overhead Press" | Table row shows "Overhead Press" |

---

## Edge and boundary cases

| ID | Description | Test type | Input | Expected |
|----|-------------|-----------|-------|----------|
| EDGE-01 | Weight with 2 decimal places | API + E2E | `135.75` | Stored and displayed as `135.75` |
| EDGE-02 | Minimum valid weight | API | `weightLbs: 0.01` | 201 accepted |
| EDGE-03 | Minimum valid sets | API | `sets: 1` | 201 accepted |
| EDGE-04 | Minimum valid reps | API | `reps: 1` | 201 accepted |
| EDGE-05 | GET on empty DB | API | No data | 200 with `[]` |
| EDGE-06 | Multiple rapid logs | E2E | Submit 3 entries in succession | All 3 appear in history; newest at top |

---

## Pass/fail criteria

- All automated tests exit 0
- No skipped tests without a documented reason in the test file (use `test.skip` with a comment)
- No test may use `test.fixme` or retry logic as a substitute for a real fix
- Flaky tests are quarantined immediately and filed as bugs before the suite can be marked passing

---

## Playwright configuration

```ts
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'api', testMatch: 'tests/api/**/*.spec.ts' },
    { name: 'e2e', testMatch: 'tests/e2e/**/*.spec.ts', use: { baseURL: 'http://localhost:5173' } },
  ],
});
```

API tests use `request` fixture with `baseURL` overridden to `http://localhost:8080` in the spec file.

---

## Test file structure

```
tests/
  api/
    workout-logs.api.spec.ts   # API-01 through API-18, EDGE-01 through EDGE-05
  e2e/
    render.spec.ts             # E2E-01 through E2E-03 (AC-1)
    log-exercise.spec.ts       # E2E-04 through E2E-07 (AC-2)
    validation.spec.ts         # E2E-08 through E2E-14 (AC-3)
    history.spec.ts            # E2E-15 through E2E-18, EDGE-06 (AC-4)
```

---

## Results

Run date: 2026-06-01

All 40 tests pass: 21 API-level (api project) + 19 E2E (e2e project). Zero skipped, zero failures.

| Suite | Tests | Result |
|-------|-------|--------|
| API (workout-logs.api.spec.ts) | 21 | All pass |
| E2E render.spec.ts | 3 | All pass |
| E2E log-exercise.spec.ts | 4 | All pass |
| E2E validation.spec.ts | 7 | All pass |
| E2E history.spec.ts | 5 | All pass |

All ACs covered. No tests skipped without documented reason.

Status: Approved — EM
Approved: 2026-06-01
