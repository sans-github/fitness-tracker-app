---
status: approved
author: PM
date: 2026-04-17
---

# Fitness Tracker -- Skinny MVP

## Pitch

Open the app, log your sets, see your history.

## Audience

One person. No login. Desktop or mobile browser.

---

## The screen

One page. No navigation. Two sections: logging inputs at the top, history table below.

### Exercises (hardcoded, not configurable)

1. Squat
2. Bench Press
3. Deadlift
4. Overhead Press
5. Bent-over Row

### Logging section

Each exercise is a card with three inputs and a Log button:

| Field | Type | Constraint |
|-------|------|-----------|
| Weight (lbs) | decimal | > 0 |
| Sets | integer | >= 1 |
| Reps | integer | >= 1 |

All sets share the same weight. Clicking "Log" saves one row and refreshes the history table. Date is auto-stamped server-side.

### History table

Shows all logged rows, newest first.

| Date | Exercise | Weight (lbs) | Sets | Reps |
|------|----------|-------------|------|------|

Loads on page load. Updates immediately after each Log action.

---

## Data model (H2)

```
workout_log (
  id          UUID PK,
  exercise    VARCHAR(50) not null,
  weight_lbs  DECIMAL(6,2) not null,
  sets        INT not null,
  reps        INT not null,
  created_at  TIMESTAMP not null,  -- server-assigned
  updated_at  TIMESTAMP not null,
  deleted_at  TIMESTAMP nullable
)
```

---

## Acceptance criteria

### AC-1: Render exercises

On load, all 5 exercises appear in order with empty inputs and the history table shows all existing DB rows newest-first.

### AC-2: Log an exercise

Clicking "Log" saves a row to H2 (with server-assigned created_at timestamp) and the history table refreshes showing the new row at the top.

### AC-3: Validation

Weight, sets, and reps are all required and must be > 0. Submitting an invalid or empty field shows an inline error next to that field and does not save.

### AC-4: History correctness

The table displays all rows from the DB in descending created_at order. Values match what was submitted exactly (no rounding on display).
