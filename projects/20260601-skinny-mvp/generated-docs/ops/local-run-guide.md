# Local Run Guide

## Prerequisites

| Tool | Required version |
|------|-----------------|
| Java | 21 |
| Maven | 3.x |
| Node.js | 18+ |

## Start the backend

```bash
cd src/backend
mvn spring-boot:run
```

The backend starts on port **8080** (set in `application.properties`).

## Start the frontend

```bash
cd src/frontend
npm install
npm run dev
```

The frontend starts on port **5173** (Vite default; no custom port is configured in `vite.config.ts`).

## Expected URLs

| Service | URL |
|---------|-----|
| REST API | http://localhost:8080 |
| Frontend UI | http://localhost:5173 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |

The Vite dev server proxies all `/api` requests to `http://localhost:8080`, so frontend API calls work without CORS configuration.

## H2 console

The H2 web console is enabled.

| Field | Value |
|-------|-------|
| URL | http://localhost:8080/h2-console |
| JDBC URL | `jdbc:h2:file:./data/fitnessdb` |
| Username | `sa` |
| Password | (empty) |

## Reset the database

The H2 file database is stored at `src/backend/data/` (derived from `spring.datasource.url=jdbc:h2:file:./data/fitnessdb`, relative to the Maven working directory `src/backend/`).

To reset to a clean state, stop the backend then delete the data directory:

```bash
rm -rf src/backend/data/
```

Restart the backend. Flyway will re-apply all migrations on the next startup.

## Run backend tests

```bash
cd src/backend
mvn verify
```

This runs unit tests, integration tests, and Checkstyle. All three must pass before merging.

## Run frontend unit tests

```bash
cd src/frontend
npm test
```

This runs Vitest in single-pass mode (`vitest run`).

## Run Playwright E2E tests

Both servers must be running before starting Playwright (backend on 8080, frontend on 5173).

```bash
cd src/frontend
npx playwright test
```

Test results are written to `playwright-report/` (ignored by `.gitignore`).
