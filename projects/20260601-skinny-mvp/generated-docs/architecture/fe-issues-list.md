## Issue 1: Vite + React + TypeScript project scaffold

**Labels:** fe debt
**Done when:** `src/frontend/` exists with `package.json`, `tsconfig.json` (strict mode enabled), `vite.config.ts` (proxy `/api` to `localhost:8080`, Vitest jsdom config), ESLint + Prettier config files, and `.gitignore` FE entries; `npm install` and `npm run dev` succeed without errors.

Scaffold the frontend project under `src/frontend/` using Vite with `@vitejs/plugin-react`. TypeScript strict mode must be enabled in `tsconfig.json`. The Vite dev server must proxy all `/api/*` requests to `localhost:8080`. ESLint with `@typescript-eslint` and `eslint-plugin-react-hooks` and Prettier must be configured.

---

## Issue 2: Logger module

**Labels:** fe debt
**Done when:** `src/frontend/src/lib/logger.ts` exists; exports a default `logger` with `info`, `warn`, `error`, `debug` methods; emits structured JSON with `timestamp`, `level`, `event`, `sessionId`, and `traceId` fields; `sessionId` is generated once at module load; unit test confirms JSON shape.

Implement the structured logger wrapper per `fe-logging` conventions. The module wraps `loglevel` and serializes every call to a JSON object with a `snake_case` event name and key-value context fields. `sessionId` is generated at app boot and stored in module scope (not localStorage). `console.*` calls are suppressed in non-dev environments via loglevel's level configuration.

---

## Issue 3: API types

**Labels:** fe contract
**Done when:** `src/frontend/src/features/workout/api/types.ts` exists; exports `WorkoutLogRequest` and `WorkoutLogResponse` interfaces with field names and types matching the API Contract exactly; TypeScript compilation passes with no errors.

Define the two TypeScript interfaces that correspond to the API Contract request and response schemas. `WorkoutLogResponse` includes `id` (string), `exercise` (string), `weightLbs` (number), `sets` (number), `reps` (number), and `createdAt` (string). `WorkoutLogRequest` includes `exercise`, `weightLbs`, `sets`, and `reps`. `updatedAt` and `deletedAt` are absent per the contract.

---

## Issue 4: TanStack Query provider setup

**Labels:** fe debt
**Done when:** `src/frontend/src/main.tsx` mounts `ReactDOM.createRoot` with a `QueryClientProvider` wrapping `App`; `src/frontend/src/App.tsx` wraps `WorkoutPage` in `ErrorBoundary` and renders inside the provider; `npm run dev` starts without console errors.

Wire `QueryClient` and `QueryClientProvider` from `@tanstack/react-query` into the application entry point. `App.tsx` is the provider boundary. The `ErrorBoundary` class component wraps `WorkoutPage` and logs `react_error_boundary` events via the logger module on `componentDidCatch`.

---

## Issue 5: `useWorkoutLogs` query hook

**Labels:** fe debt
**Done when:** `src/frontend/src/features/workout/api/useWorkoutLogs.ts` exists; calls `GET /api/v1/workout-logs` with `X-Trace-Id` header; `staleTime` is 0; logs `api_call_start`, `api_call_complete`, and `api_call_failed` events; unit test (MSW) confirms successful fetch returns typed array and non-200 sets `isError`.

Implement the TanStack Query hook that fetches all workout log entries. A new `traceId` is generated per fetch invocation using `generateTraceId()` and sent as `X-Trace-Id`. The query key is `['workoutLogs', 'list']`. `staleTime: 0` ensures the history table always revalidates on window focus.

---

## Issue 6: `useLogWorkout` mutation hook

**Labels:** fe debt
**Done when:** `src/frontend/src/features/workout/api/useLogWorkout.ts` exists; calls `POST /api/v1/workout-logs` with `Content-Type: application/json` and `X-Trace-Id` header; `onSuccess` calls `invalidateQueries` on `['workoutLogs']`; logs the three API events; unit test confirms query invalidation fires on 201 and `isError` on non-201.

Implement the TanStack Query mutation hook for creating a new workout log. A fresh `traceId` is generated per invocation. On success, `invalidateQueries` targets the full `workoutLogKeys.all` key so the history table refetches. Mutation errors are surfaced to the calling component via the returned `isError`/`error` values.

---

## Issue 7: `ExerciseCard` component

**Labels:** fe ux
**Done when:** `src/frontend/src/features/workout/components/ExerciseCard.tsx` exists; renders exercise name, weight/sets/reps inputs with correct labels, and a Log button; client-side validation fires on click only, shows per-field inline errors with `role="alert"`, `aria-invalid`, and `aria-describedby`; loading state disables the button while mutation is pending; success clears the form; mutation error shows a banner below the Log button.

Implement the exercise card form component. Local state tracks the three input strings and per-field validation errors. The `validate()` function checks weight > 0, sets >= 1, reps >= 1 before firing the mutation. Input IDs use the exercise name slugified to match mock HTML IDs. Logs `workout_log_submitted` on valid submit and `workout_log_validation_failed` on failed validation.

---

## Issue 8: `ExerciseGrid` component

**Labels:** fe ux
**Done when:** `src/frontend/src/features/workout/components/ExerciseGrid.tsx` exists; renders exactly five `ExerciseCard` components in PRD order (Squat, Bench Press, Deadlift, Overhead Press, Bent-over Row) from the internal `EXERCISES` constant; no props required.

Implement the grid container that renders the five hardcoded exercise cards. The exercise list is defined as a `const` tuple inside the module. No props interface is needed. Layout styling must place the cards in a readable grid as shown in the mocks.

---

## Issue 9: `HistoryTable` component

**Labels:** fe ux
**Done when:** `src/frontend/src/features/workout/components/HistoryTable.tsx` exists; renders column headers (Date, Exercise, Weight (lbs), Sets, Reps); renders one row per log entry in the order received (newest-first from API); shows a distinct empty-state message when `logs` is empty; shows a loading indicator when `isLoading` is true; shows an error banner when `isError` is true.

Implement the pure display component that renders the workout log history. `WorkoutPage` owns the query and passes `logs`, `isLoading`, and `isError` as props. The component does not call any hooks. Rows are rendered in the order provided (the API already returns newest-first).

---

## Issue 10: `WorkoutPage` component

**Labels:** fe ux
**Done when:** `src/frontend/src/features/workout/WorkoutPage.tsx` exists; calls `useWorkoutLogs` and passes results to `HistoryTable`; renders `ExerciseGrid` above `HistoryTable`; logs `page_view` on mount via a `useEffect`; the assembled page renders correctly at `localhost:5173` with the backend running.

Implement the top-level page component that composes the two main UI sections. `WorkoutPage` owns the `useWorkoutLogs` query and passes `data`, `isLoading`, and `isError` down to `HistoryTable`. `ExerciseGrid` is rendered above the table. A `useEffect` with an empty dependency array fires `logger.info('page_view', ...)` on mount.

---

## Issue 11: Component tests (Vitest + React Testing Library)

**Labels:** fe debt
**Done when:** `npm run test` passes with zero failures; `ExerciseCard` scenarios covered: renders all inputs and button, empty submit shows all three errors, valid submit fires POST and clears form, loading state disables button, mutation error shows banner, ARIA attributes set on error; `HistoryTable` scenarios covered: renders headers, renders rows with correct values, empty state, loading state, error banner, newest row first; MSW handlers mock `GET` and `POST /api/v1/workout-logs`.

Write Vitest + React Testing Library tests for `ExerciseCard` and `HistoryTable`. MSW is configured in `src/test/setup.ts` to intercept API calls. Tests must not make real network requests. All scenarios documented in FE Detailed Design section 9 must have a corresponding test case.

---

## Issue 12: Playwright E2E tests

**Labels:** fe qa
**Done when:** `npx playwright test` passes all three specs against a locally running BE + FE; AC-1 confirms five exercise names and history table headers visible on load; AC-2 confirms filling Squat inputs and clicking Log adds a row with correct values at the top of the history table; AC-3 confirms empty submit shows all three inline error messages and does not change the row count.

Implement the three Playwright E2E specs in `src/frontend/tests/workout.spec.ts` targeting `http://localhost:5173`. Tests run against a real BE (H2 in-memory) and the Vite dev server. `playwright.config.ts` must configure `webServer` to start the dev server automatically. Each spec maps directly to one acceptance criterion from the PRD.

---

Status: Approved — EM
