@.claude/my-project-config.md

## Project state

Delivered feature: `projects/20260601-skinny-mvp/` — single-page fitness tracker, fully implemented and tested.

## Running the app

```bash
./scripts/dev.sh          # starts BE (port 8080) + FE (port 5173)
cd src/backend && mvn spring-boot:run
cd src/frontend && npm run dev
```

## Running tests

```bash
cd src/backend && mvn verify                   # unit + integration tests
cd src/frontend && npm run test                # Vitest component tests
cd src/frontend && npx playwright test         # API + E2E (servers must be running)
```

## Key conventions

- BE uses H2 file-backed DB at `src/backend/data/fitnessdb`; schema managed by Flyway; `ddl-auto=validate`
- `WorkoutLogResponse.createdAt` is a `String` formatted as ISO 8601 UTC offset (e.g. `2026-06-01T12:00:00+00:00`)
- FE input IDs follow `slugify(exerciseName)`: `Bench Press` → `#bench-press-weight`, `#bench-press-sets`, `#bench-press-reps`
- Playwright tests run sequentially (`workers: 1`); api project runs before e2e (`dependencies: ['api']`)
- CORS allows `http://localhost:5173`; `X-Trace-Id` header is set on every response

## H2 console

Available at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/fitnessdb`)
