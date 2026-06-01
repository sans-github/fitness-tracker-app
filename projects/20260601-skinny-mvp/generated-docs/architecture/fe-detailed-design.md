Status: Approved — EM
Approved: 2026-06-01

# FE Detailed Design: Fitness Tracker Skinny MVP

## Component Overview

Single-page React app. No routing. TanStack Query owns all server state. No Redux.

```
App
└── WorkoutPage
    ├── ExerciseGrid
    │   ├── ExerciseCard (Squat)
    │   ├── ExerciseCard (Bench Press)
    │   ├── ExerciseCard (Deadlift)
    │   ├── ExerciseCard (Overhead Press)
    │   └── ExerciseCard (Bent-over Row)
    └── HistoryTable
```

---

## 1. Vite Project Structure

```
src/frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── playwright.config.ts
├── src/
│   ├── main.tsx                         -- ReactDOM.createRoot entry
│   ├── App.tsx                          -- QueryClientProvider wrapper + WorkoutPage
│   ├── features/
│   │   └── workout/
│   │       ├── WorkoutPage.tsx
│   │       ├── api/
│   │       │   ├── useWorkoutLogs.ts    -- GET query hook
│   │       │   ├── useLogWorkout.ts     -- POST mutation hook
│   │       │   └── types.ts             -- WorkoutLogRequest, WorkoutLogResponse
│   │       └── components/
│   │           ├── ExerciseGrid.tsx
│   │           ├── ExerciseCard.tsx
│   │           └── HistoryTable.tsx
│   ├── lib/
│   │   ├── logger.ts                    -- structured logger wrapper
│   │   └── traceId.ts                   -- generateTraceId()
│   └── test/
│       └── setup.ts                     -- @testing-library/jest-dom + MSW server
└── tests/
    └── workout.spec.ts                  -- Playwright E2E
```

---

## 2. Component Tree and Props Interfaces

### `WorkoutPage`

No props. Owns page-level layout (header, `ExerciseGrid`, `HistoryTable`). Logs `page_view` on mount.

```ts
// No props interface -- top-level page component
```

### `ExerciseGrid`

```ts
interface ExerciseGridProps {
  // No props -- hardcoded exercise list is internal constant
}
```

Renders the five `ExerciseCard` components from a static constant:

```ts
const EXERCISES = [
  'Squat',
  'Bench Press',
  'Deadlift',
  'Overhead Press',
  'Bent-over Row',
] as const;
```

### `ExerciseCard`

```ts
interface ExerciseCardProps {
  exerciseName: string;
}
```

Owns local form state (weight, sets, reps) and per-field validation errors. Calls `useLogWorkout` mutation internally.

### `HistoryTable`

```ts
interface HistoryTableProps {
  logs: WorkoutLogResponse[];
  isLoading: boolean;
  isError: boolean;
}
```

Pure display component. Renders a table or loading/error states. Does not own any query state itself -- `WorkoutPage` passes data down.

---

## 3. API Types

Aligned with BE Detailed Design field names exactly.

```ts
// src/features/workout/api/types.ts

export interface WorkoutLogResponse {
  id: string;              // UUID as string
  exercise: string;
  weightLbs: number;       // matches BE field name (camelCase from Jackson)
  sets: number;
  reps: number;
  createdAt: string;       // ISO-8601 datetime string
}

export interface WorkoutLogRequest {
  exercise: string;
  weightLbs: number;
  sets: number;
  reps: number;
}
```

Note: `updatedAt` and `deletedAt` are not exposed by the BE response DTO and are absent here.

---

## 4. TanStack Query Hooks

### `useWorkoutLogs` (GET)

```ts
// src/features/workout/api/useWorkoutLogs.ts

import { useQuery } from '@tanstack/react-query';
import { WorkoutLogResponse } from './types';
import logger from '../../lib/logger';
import { generateTraceId } from '../../lib/traceId';

export const workoutLogKeys = {
  all: ['workoutLogs'] as const,
  list: () => [...workoutLogKeys.all, 'list'] as const,
};

async function fetchWorkoutLogs(): Promise<WorkoutLogResponse[]> {
  const traceId = generateTraceId();
  const endpoint = '/api/v1/workout-logs';
  logger.info('api_call_start', { endpoint, method: 'GET', traceId });
  const start = Date.now();
  const res = await fetch(endpoint, {
    headers: { 'X-Trace-Id': traceId },
  });
  const durationMs = Date.now() - start;
  if (!res.ok) {
    logger.error('api_call_failed', new Error(res.statusText), { endpoint, method: 'GET', status: res.status, durationMs, traceId });
    throw new Error(`GET ${endpoint} failed: ${res.status}`);
  }
  logger.info('api_call_complete', { endpoint, method: 'GET', status: res.status, durationMs, traceId });
  return res.json();
}

export function useWorkoutLogs() {
  return useQuery<WorkoutLogResponse[], Error>({
    queryKey: workoutLogKeys.list(),
    queryFn: fetchWorkoutLogs,
    staleTime: 0,          // history must always be fresh; revalidate on every focus
    retry: 1,
  });
}
```

`staleTime: 0` is intentional. The history table must reflect the latest DB state after every log action. Background refetch on window focus is acceptable.

### `useLogWorkout` (POST mutation)

```ts
// src/features/workout/api/useLogWorkout.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkoutLogRequest, WorkoutLogResponse } from './types';
import { workoutLogKeys } from './useWorkoutLogs';
import logger from '../../lib/logger';
import { generateTraceId } from '../../lib/traceId';

async function logWorkout(request: WorkoutLogRequest): Promise<WorkoutLogResponse> {
  const traceId = generateTraceId();
  const endpoint = '/api/v1/workout-logs';
  logger.info('api_call_start', { endpoint, method: 'POST', traceId });
  const start = Date.now();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Trace-Id': traceId,
    },
    body: JSON.stringify(request),
  });
  const durationMs = Date.now() - start;
  if (!res.ok) {
    logger.error('api_call_failed', new Error(res.statusText), { endpoint, method: 'POST', status: res.status, durationMs, traceId });
    throw new Error(`POST ${endpoint} failed: ${res.status}`);
  }
  logger.info('api_call_complete', { endpoint, method: 'POST', status: res.status, durationMs, traceId });
  return res.json();
}

export function useLogWorkout() {
  const queryClient = useQueryClient();
  return useMutation<WorkoutLogResponse, Error, WorkoutLogRequest>({
    mutationFn: logWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutLogKeys.all });
    },
  });
}
```

On success, `invalidateQueries` triggers a background refetch of the workout logs list, which updates `HistoryTable` without a manual state update.

---

## 5. Client-Side Validation

Validated before the mutation fires. Invalid inputs show inline errors; no request is sent.

### Fields and rules

| Field | Rule | Error message |
|-------|------|---------------|
| Weight (lbs) | Required; must be a number > 0 | "Weight is required and must be greater than 0" |
| Sets | Required; must be an integer >= 1 | "Sets is required and must be at least 1" |
| Reps | Required; must be an integer >= 1 | "Reps is required and must be at least 1" |

### Validation function

```ts
// Inside ExerciseCard.tsx

interface FormErrors {
  weight?: string;
  sets?: string;
  reps?: string;
}

function validate(weight: string, sets: string, reps: string): FormErrors {
  const errors: FormErrors = {};
  const w = parseFloat(weight);
  if (!weight.trim() || isNaN(w) || w <= 0) {
    errors.weight = 'Weight is required and must be greater than 0';
  }
  const s = parseInt(sets, 10);
  if (!sets.trim() || isNaN(s) || s < 1) {
    errors.sets = 'Sets is required and must be at least 1';
  }
  const r = parseInt(reps, 10);
  if (!reps.trim() || isNaN(r) || r < 1) {
    errors.reps = 'Reps is required and must be at least 1';
  }
  return errors;
}
```

Validation fires on Log button click only (not on blur). Errors are cleared on the next click attempt or on successful submission.

On valid input, the numeric strings are converted to numbers (`parseFloat` for weight, `parseInt` for sets/reps) before constructing `WorkoutLogRequest`.

---

## 6. Error Display Approach

### Inline field errors (ExerciseCard)

Each field in `ExerciseCard` renders an error message below its input when a validation error is present. ARIA attributes ensure screen-reader accessibility.

```tsx
<div className="field">
  <label className="field-label" htmlFor={`${id}-weight`}>Weight (lbs)</label>
  <input
    id={`${id}-weight`}
    className={`field-input${errors.weight ? ' is-error' : ''}`}
    type="number"
    min="0.01"
    step="0.01"
    value={weight}
    onChange={e => setWeight(e.target.value)}
    aria-describedby={errors.weight ? `${id}-weight-err` : undefined}
    aria-invalid={errors.weight ? 'true' : undefined}
  />
  {errors.weight && (
    <span id={`${id}-weight-err`} className="field-error" role="alert">
      {errors.weight}
    </span>
  )}
</div>
```

The `id` prefix is the exercise name slugified (e.g. `squat`, `bench-press`) to match the mock HTML IDs.

### API/network error (HistoryTable)

When `useWorkoutLogs` returns `isError: true`, `HistoryTable` renders an error banner above the table body. Mutation errors (POST failures) are surfaced the same way via an error banner inside `ExerciseCard` below the Log button.

---

## 7. `vite.config.ts` Proxy

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

All `/api/*` requests from the dev server are forwarded to Spring Boot on port 8080. No CORS issue in dev because the browser sees a same-origin request.

---

## 8. Logging Plan

Per `fe-logging` conventions. Logger wraps `loglevel` with structured JSON serialization. `sessionId` is generated at app boot in memory.

### Events

| Event name | Level | Where | Context fields |
|-----------|-------|-------|----------------|
| `page_view` | INFO | `WorkoutPage` mount effect | `page`, `sessionId` |
| `workout_log_submitted` | INFO | `ExerciseCard` Log button click (after validation passes) | `exerciseName`, `sessionId` |
| `workout_log_validation_failed` | WARN | `ExerciseCard` validate() result non-empty | `exerciseName`, `errorFields`, `sessionId` |
| `api_call_start` | INFO | fetch wrapper in `useWorkoutLogs`, `useLogWorkout` | `endpoint`, `method`, `traceId` |
| `api_call_complete` | INFO | fetch wrapper on 2xx | `endpoint`, `method`, `status`, `durationMs`, `traceId` |
| `api_call_failed` | ERROR | fetch wrapper on non-ok response | `endpoint`, `method`, `status`, `durationMs`, `traceId` |
| `react_error_boundary` | ERROR | `ErrorBoundary.componentDidCatch` | `componentStack`, `page` |

### Error boundary

`App.tsx` wraps `WorkoutPage` in a class-based `ErrorBoundary`:

```tsx
class ErrorBoundary extends React.Component<...> {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('react_error_boundary', error, {
      componentStack: info.componentStack,
      page: window.location.pathname,
    });
  }
  render() {
    if (this.state.hasError) return <div role="alert">Something went wrong. Please refresh the page.</div>;
    return this.props.children;
  }
}
```

### Hard constraints observed

- No PII logged (no user identifiers exist in this app)
- No request or response bodies logged
- `console.log` not used outside local dev (logger module handles level-based suppression)

---

## 9. Component Test Scope

Tool: Vitest + React Testing Library + MSW.

### `ExerciseCard`

| Scenario | Assertion |
|----------|-----------|
| Renders exercise name, three labeled inputs, and Log button | Elements present by role/label |
| Log button click with empty inputs shows all three error messages | Error text visible, no fetch fired |
| Log button click with weight = 0 shows weight error only | Only weight error visible |
| Log button click with sets < 1 shows sets error only | Only sets error visible |
| Log button click with reps < 1 shows reps error only | Only reps error visible |
| Valid inputs fire POST mutation and clear form on success | MSW handler called; inputs cleared |
| Log button shows loading state while mutation is pending | Button disabled or text changes |
| Mutation error shows error banner below Log button | Error message visible |
| Weight input has aria-invalid and aria-describedby when error present | ARIA attributes set |

### `HistoryTable`

| Scenario | Assertion |
|----------|-----------|
| Renders column headers: Date, Exercise, Weight (lbs), Sets, Reps | Headers by role |
| Renders a row for each log entry with correct values | Row count and cell text |
| Renders empty state when logs array is empty | Empty message visible |
| Renders loading state when isLoading is true | Loading indicator visible |
| Renders error banner when isError is true | Error message visible |
| Newest entry appears first | First row matches newest fixture |

### `useWorkoutLogs` hook

| Scenario | Assertion |
|----------|-----------|
| Returns data on successful GET 200 | `isSuccess`, correct array |
| Returns error state on GET non-200 | `isError` true |

### `useLogWorkout` hook

| Scenario | Assertion |
|----------|-----------|
| Calls POST and invalidates list query on 201 | Query key invalidated |
| Returns error state on POST non-201 | `isError` true |

---

## 10. Playwright E2E Test Scope

Tests run against a locally started BE + FE (`localhost:5173` with Vite dev server proxying to `localhost:8080`).

### AC-1: Render exercises

```ts
test('all five exercises appear on page load with empty inputs', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Bent-over Row']) {
    await expect(page.getByText(name)).toBeVisible();
  }
  // History table headers present
  await expect(page.getByRole('columnheader', { name: /date/i })).toBeVisible();
});
```

### AC-2: Log an exercise and verify history update

```ts
test('logging a set adds the row to the history table', async ({ page }) => {
  await page.goto('/');
  // Fill Squat card
  await page.getByLabel('Weight (lbs)', { exact: false }).first().fill('100');
  await page.getByLabel('Sets').first().fill('3');
  await page.getByLabel('Reps').first().fill('5');
  await page.getByRole('button', { name: /log/i }).first().click();
  // History table updates with new row at top
  await expect(page.getByRole('cell', { name: 'Squat' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: '100' }).first()).toBeVisible();
});
```

### AC-3: Validation (inline errors, no save)

```ts
test('submitting empty inputs shows inline errors and does not save', async ({ page }) => {
  await page.goto('/');
  const initialRowCount = await page.getByRole('row').count();
  await page.getByRole('button', { name: /log/i }).first().click();
  await expect(page.getByText(/weight is required/i).first()).toBeVisible();
  await expect(page.getByText(/sets is required/i).first()).toBeVisible();
  await expect(page.getByText(/reps is required/i).first()).toBeVisible();
  // Row count unchanged
  await expect(page.getByRole('row')).toHaveCount(initialRowCount);
});
```

---

## 11. `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Out of Scope

- Redux / global client state (no shared state exists beyond query cache)
- React Router (single page, no navigation)
- Auth or session persistence
- Pagination of history table
- Edit or delete log entries
- OTEL agent wiring
- CI/CD pipeline
