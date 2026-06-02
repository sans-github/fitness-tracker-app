<div align="center">

[![Proof of Concept](https://img.shields.io/badge/Proof%20of%20Concept-claude--delivery--team-0d9488?style=for-the-badge)](https://github.com/sans-github/claude-delivery-team)

Built with **[claude-delivery-team](https://github.com/sans-github/claude-delivery-team)** — a library that drives Claude agents to collaboratively build software end-to-end.<br>
Not intended for general use. The fitness tracker app is purely the vehicle for demonstrating the library.

</div>

---

# Fitness Tracker

Single-page web app for logging strength training sets and viewing workout history. One person, five hardcoded exercises, no authentication.

## Features

- Log weight, sets, and reps for five exercises: Squat, Bench Press, Deadlift, Overhead Press, Bent-over Row
- Inline validation prevents zero or missing values
- History table updates instantly without a page reload, newest entries first
- H2 file-backed database with Flyway migrations

## Prerequisites

- Java 21
- Maven 3.9+
- Node.js 18+

## Running locally

```bash
./scripts/dev.sh
```

This starts the backend on `http://localhost:8080` and the frontend on `http://localhost:5173`.

Or start each manually:

```bash
# Backend
cd src/backend && mvn spring-boot:run

# Frontend (separate terminal)
cd src/frontend && npm install && npm run dev
```

## Running tests

```bash
# Backend unit + integration tests
cd src/backend && mvn verify

# Frontend component tests
cd src/frontend && npm run test

# Playwright API and E2E tests (requires both servers running)
cd src/frontend && npx playwright test
```

## Project structure

```
src/
  backend/    Java 21 + Spring Boot 3 REST API
  frontend/   React 18 + TypeScript + TanStack Query v5
  db/         Flyway migrations and ER diagram
scripts/
  dev.sh      Starts both servers
```

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | Java 21, Spring Boot 3.3, Spring Data JPA, H2 (file-backed), Flyway |
| Frontend | React 18, TypeScript, TanStack Query v5, Vite |
| Tests | JUnit 5, MockMvc (BE), Vitest + Testing Library (FE), Playwright (E2E + API) |
