# Project Config

> **What to edit:** The Tech stack and GitHub issue labels sections below are yours to configure. You can also replace the default brand guidelines (see below). Everything else (file paths, DB conventions, code style, approvals) is internal framework configuration loaded automatically from `framework-config.md`.

---

## Tech stack

Update this to match your project. The kickoff prompt reads this section to evaluate stack fit.

These are available technology choices per layer, not a mandatory full stack. Each project uses the minimum subset that covers its requirements.

| Layer | Technology |
|-------|------------|
| BE | Java 21 + Spring Boot (REST API, Spring Data JPA + Hibernate 6, H2 for dev/test, PostgreSQL/MySQL for prod) |
| FE | React 18 + TypeScript (Redux Toolkit, TanStack Query, React Router v6, Vite) |
| macOS | Swift 5.10 + SwiftUI (Observation framework, SwiftData, URLSession) |
| Infra | Terraform on AWS |
| QA | Playwright (E2E + API) |

---

## GitHub issue labels

Flat labels -- no prefixes. Apply one area label and one type label per issue. Priority is added at triage.

**Area:** `be` `fe` `db` `infra` `design` `qa` `spec` `mocks` `contract`

**Type:** `bug` `debt` `ux` `gap`

**Priority:** `p0` `p1` `p2`

Examples: `be` + `bug` = backend defect. `spec` + `gap` = missing requirement. `mocks` + `gap` = missing design coverage.

---

## Brand guidelines

A default brand ships in `skills/brand-guidelines/SKILL.md` (Off-White + Deep Teal, Plus Jakarta Sans, full light/dark token set). Preview it at `skills/brand-guidelines/previews/default-brand.html`.

To use your own: replace `SKILL.md` with your color palette, typography, spacing, and component states. Designer, FE, PM, and QA agents all read it before producing any UI work.

Note: the macOS Designer uses `macos-hig` instead of `brand-guidelines` — the HIG defines the platform's design system.

---

@.claude/framework-config.md
