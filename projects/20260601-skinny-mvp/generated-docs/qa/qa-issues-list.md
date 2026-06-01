# QA Issues List: Fitness Tracker Skinny MVP

## Issue 1: API: GET /api/v1/workout-logs — 200 happy path

**Labels:** qa be
**Done when:** `API-01`, `API-02`, `API-03`, `API-04`, `API-05` all pass in `tests/api/workout-logs.api.spec.ts`

Covers the full GET happy path: an empty database returns `[]` with status 200 and `Content-Type: application/json`; a seeded database returns an array with the correct length; each item in the response contains exactly `id` (UUID string), `exercise`, `weightLbs` (number), `sets` (integer), `reps` (integer), and `createdAt` (ISO 8601 UTC string) with no extra fields such as `updatedAt` or `deletedAt`. Two rows seeded 100ms apart must appear with the newer row first, confirming descending `createdAt` order is server-guaranteed. A row seeded with `weightLbs: 135.75` must be returned as `135.75` with no rounding.

---

## Issue 2: API: POST /api/v1/workout-logs — 201 happy path

**Labels:** qa be
**Done when:** `API-06`, `API-07`, `API-08` all pass in `tests/api/workout-logs.api.spec.ts`

A valid request body (`exercise`, `weightLbs`, `sets`, `reps` all present and valid) returns 201 with `Content-Type: application/json`. The response body contains every submitted field plus a UUID `id` and a non-null ISO 8601 UTC `createdAt` assigned by the server, not the client. A weight of `135.75` is accepted and returned as `135.75` in both the POST response and a subsequent GET, confirming the value is stored without rounding.

---

## Issue 3: API: POST 400 — missing required fields

**Labels:** qa be
**Done when:** `API-12`, `API-13`, `API-14`, `API-15`, `API-16` all pass in `tests/api/workout-logs.api.spec.ts`

Each required field (`exercise`, `weightLbs`, `sets`, `reps`) is omitted one at a time; each omission must produce a 400 with `Content-Type: application/problem+json` and a body containing `type: "https://fitnessapp.local/errors/validation"`, `title: "Validation Failed"`, `status: 400`, and an `errors` object with a key matching the missing field. An empty body `{}` must produce violations for all four fields simultaneously. A subsequent GET after each invalid POST must confirm no row was persisted.

---

## Issue 4: API: POST 400 — invalid zero and negative values

**Labels:** qa be
**Done when:** `API-09`, `API-10`, `API-11`, `API-17`, `API-18` all pass in `tests/api/workout-logs.api.spec.ts`

`weightLbs: 0`, `sets: 0`, and `reps: 0` each produce a 400 RFC 7807 response with a field-level error under the corresponding key in `errors`. A negative `weightLbs: -10` is also rejected with 400 and `errors.weightLbs` present. After each invalid POST, a GET request must return no row corresponding to that submission, confirming the validation boundary prevents persistence.

---

## Issue 5: API: POST — minimum valid boundary values accepted

**Labels:** qa be
**Done when:** `EDGE-02`, `EDGE-03`, `EDGE-04` all pass in `tests/api/workout-logs.api.spec.ts`

The minimum valid values (`weightLbs: 0.01`, `sets: 1`, `reps: 1`) are each accepted with a 201 response. These tests sit immediately above the zero-rejection boundary and confirm the lower bound is inclusive at 0.01 for weight and 1 for counts. Each accepted POST response body must contain the submitted value unchanged.

---

## Issue 6: E2E AC-1: All 5 exercises render on page load in correct order

**Labels:** qa fe
**Done when:** `E2E-01`, `E2E-02` both pass in `tests/e2e/render.spec.ts`

Navigating to `/` with no prior data must show all five exercise cards in the exact order: Squat, Bench Press, Deadlift, Overhead Press, Bent-over Row. Each card must contain exactly three input fields (Weight, Sets, Reps) and a Log button. Order is verified by DOM position, not just presence, so a shuffled render fails the test.

---

## Issue 7: E2E AC-1: History table visible on load with correct empty state

**Labels:** qa fe
**Done when:** `E2E-03` passes in `tests/e2e/render.spec.ts`

The history table element is present in the DOM on initial load even when no workout rows exist. The empty state (header row or empty-state message) is visible and does not require any user interaction to appear. When rows exist from prior seeds, the table body is populated rather than showing the empty state.

---

## Issue 8: E2E AC-2: Log a workout entry — save, display, and form reset

**Labels:** qa fe
**Done when:** `E2E-04`, `E2E-05`, `E2E-06`, `E2E-07` all pass in `tests/e2e/log-exercise.spec.ts`

Filling the Squat card with `135.75 lbs`, `3 sets`, `5 reps` and clicking Log must produce a new row at the top of the history table showing "Squat", "135.75", "3", "5" with no page reload. When a prior row already exists, the new row must appear above it. After a successful submit the input fields must return to empty. The history table update must occur in-place (no full navigation), verified by asserting no page reload event fires.

---

## Issue 9: E2E AC-3: Validation — empty fields block submission

**Labels:** qa fe
**Done when:** `E2E-08`, `E2E-09`, `E2E-10`, `E2E-14` all pass in `tests/e2e/validation.spec.ts`

Clicking Log on a card with each individual field empty must show an inline error adjacent to that specific input with no new row in the history table. Clicking Log on an untouched card (all three fields empty) must show inline errors on all three fields simultaneously. After each invalid submission a GET to the API must confirm no row was created, proving the validation fires before the network call.

---

## Issue 10: E2E AC-3: Validation — zero values block submission

**Labels:** qa fe
**Done when:** `E2E-11`, `E2E-12`, `E2E-13` all pass in `tests/e2e/validation.spec.ts`

Entering `0` for Weight, Sets, or Reps individually and clicking Log must each show an inline error adjacent to the offending field. No new history row must appear after any of these submissions. These cases verify client-side validation matches the server-side constraint so users receive immediate feedback without a round trip.

---

## Issue 11: E2E AC-4: History order and value correctness

**Labels:** qa fe
**Done when:** `E2E-15`, `E2E-16`, `E2E-17`, `E2E-18`, `EDGE-06` all pass in `tests/e2e/history.spec.ts`

Three rows seeded via the API in known order must appear in descending `createdAt` order after a page reload, confirming the FE does not re-sort client-side in a way that differs from server order. A row logged with `135.75` must display as "135.75" in the table cell, not "135.8" or "136". Integer values `sets: 3` and `reps: 5` must appear as "3" and "5" with no decimal point. An exercise name such as "Overhead Press" must appear exactly as submitted. Three entries submitted in rapid succession must all appear in the table with the newest at the top.

---

Status: Approved — EM
