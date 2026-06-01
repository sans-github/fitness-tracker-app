#!/usr/bin/env bash
# Starts BE (port 8080) and FE (port 5173) for local development.
# Run from the repo root.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[dev] Starting backend (Spring Boot, port 8080)..."
cd "$ROOT/src/backend"
mvn spring-boot:run -q &
BE_PID=$!

echo "[dev] Starting frontend (Vite, port 5173)..."
cd "$ROOT/src/frontend"
npm run dev &
FE_PID=$!

echo "[dev] BE pid=$BE_PID  FE pid=$FE_PID"
echo "[dev] Press Ctrl+C to stop both servers."

trap "kill $BE_PID $FE_PID 2>/dev/null; echo '[dev] Stopped.'" INT TERM
wait $BE_PID $FE_PID
