Status: Approved — Human
Approved: 2026-06-01

# Kickoff Plan — 20260601-skinny-mvp

---

## 1. What I understood

A single-page, no-auth web app where one person can log strength training sets and view their history. The UI has two sections on one page: a set of exercise cards (5 hardcoded lifts) at the top for logging, and a history table below that updates immediately after each log action. The backend stores rows in an H2 database, stamps `created_at` server-side, and exposes an API the frontend calls to save and retrieve logs. There is no login, no user management, no configuration, and no navigation beyond the single page.

**PRD summary:** Log weight/sets/reps per exercise, see all past logs newest-first. Five exercises (Squat, Bench Press, Deadlift, Overhead Press, Bent-over Row) are hardcoded. Validation enforces all fields required and > 0. History table shows exact submitted values with no rounding.

**Project config:** Deployment target is local. Tech stack will be confirmed by EM with human at Stage 3 start.

**Folder structure check:**
- `projects/20260601-skinny-mvp/workflow/workflow.md` ✅
- `projects/20260601-skinny-mvp/generated-docs/prd.md` ✅
- `projects/20260601-skinny-mvp/generated-docs/design/` ✅

**Input quality check:** No issues found. PRD is complete with acceptance criteria. No unfilled placeholders or contradictions detected.

**Risks and unknowns:**
- No existing stack in `src/` — greenfield build. EM will select stack with human at Stage 3 start.
- PRD specifies H2 as the data store, which suits local/dev. If the deployment target ever changes to prod, a migration to PostgreSQL/MySQL would be needed. Not a current risk for this scope.
- The PRD data model includes `updated_at` and `deleted_at` columns but the acceptance criteria do not reference updates or soft deletes. These columns will be included in the schema per the PRD but no corresponding API or UI logic is required for MVP.

**Out of scope:**
- User authentication or multi-user support
- Configurable or user-defined exercises
- Edit or delete of logged entries
- Mobile native app (desktop/mobile browser only)
- Cloud deployment or infrastructure provisioning
- Any navigation beyond the single page

**Software stack:** `src/` is empty. No existing stack. EM will select and confirm the minimum subset at Stage 3 after mocks are available.

---

## 2. Open questions

1. ❓ The PRD includes `updated_at` and `deleted_at` columns but no editing or soft-delete behavior is described. Should these columns be persisted silently (infrastructure only, no API/UI) or omitted entirely for MVP?

---

## 3. Next step

Once approved, Designer produces mocks for `projects/20260601-skinny-mvp/generated-docs/design/` covering the single-page layout (exercise cards + history table, both states: empty and with data).
