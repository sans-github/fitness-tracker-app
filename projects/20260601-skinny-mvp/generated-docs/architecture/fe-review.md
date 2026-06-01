Status: Approved — EM
Approved: 2026-06-01

# FE Implementation Review

- `.gitignore` has all required FE entries: `node_modules/`, `dist/`, `.next/`, `.vite/`, `playwright-report/`, `test-results/`
- `node_modules/` and `dist/` are not tracked in git (confirmed via `git ls-files`)
- All 5 exercises render in correct PRD order: Squat, Bench Press, Deadlift, Overhead Press, Bent-over Row (`ExerciseGrid.tsx`)
- `ExerciseCard` validation matches AC-3: all three fields required, weight must be > 0, sets >= 1, reps >= 1 (`validate()` function in `ExerciseCard.tsx`)
- `WorkoutLogRequest` field names match API Contract exactly: `exercise`, `weightLbs`, `sets`, `reps` (`types.ts`)
- `X-Trace-Id` header sent on every POST using a 128-bit hex `generateTraceId()` (`useLogWorkout.ts`)
- Vite proxy `/api` → `http://localhost:8080` configured (`vite.config.ts`)
- Logger module exists at `src/lib/logger.ts` with structured `key=value` events, `sessionId`, `loglevel` transport, and per-level wrappers matching `fe-logging` conventions
- `traceId.ts` generates OTel-compatible 128-bit random trace IDs using `crypto.getRandomValues`
- Component tests cover: empty-submit shows all three errors, weight=0 error, sets<1 error, reps<1 error, successful submit clears form, pending loading state, mutation failure banner, aria-invalid/aria-describedby attributes
- Playwright E2E tests cover AC-1 (all 5 exercises visible on load), AC-2 (successful log adds row to history table), AC-3 (empty submit shows inline errors and does not save)
