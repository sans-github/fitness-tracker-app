<!-- Internal framework configuration. Loaded automatically via my-project-config.md. Do not edit unless changing framework conventions. -->

---

## File locations

Design docs and plans live under `generated-docs/`. Production artifacts (code, migrations, seeds) live under `src/`. Agent-to-agent handoffs always pass the `.md` file only.

| Artifact | Path | Owner | Source |
|---|---|---|---|
| PRD | `generated-docs/prd.md` | PM writes | `senior-product-manager.md` |
| Mocks | `generated-docs/design/` | Designer writes, PM approves | `senior-ux-ui-designer.md`, `senior-macos-designer.md` |
| Workflow | `workflow/workflow.md` | Phase config, deployment target, and live delivery tracker in one file; config set by `/feature-init`, `## Progress` seeded at kickoff | `feature-init` skill |
| Kickoff Plan | `workflow/kickoff-plan.md` | Orchestrator writes, human approves | `kickoff-prompt.md` |
| Implementation Plan | `workflow/implementation-plan.md` | EM writes, human approves; steps then seeded into `## Progress` in `workflow.md` | `senior-engineering-manager.md` |
| System Architecture | `generated-docs/architecture/sys-arch.md` | Arch writes, EM approves | `senior-software-architect.md` |
| Deployment Plan | `generated-docs/architecture/deployment-plan.md` | DevOps writes, Human approves | `senior-devops-engineer.md` |
| Infrastructure Verification | `generated-docs/ops/infra-verification.md` | DevOps writes after smoke tests pass, Human approves | `senior-devops-engineer.md` |
| Eng Plans (HLD) | `generated-docs/architecture/hld.md` | EM writes, EM approves | `senior-engineering-manager.md` |
| BE Detailed Design | `generated-docs/architecture/be-detailed-design.md` | BE writes, EM approves | `senior-backend-engineer.md` |
| FE Detailed Design | `generated-docs/architecture/fe-detailed-design.md` | FE writes, EM approves | `senior-frontend-engineer.md` |
| Swift Detailed Design | `generated-docs/architecture/swift-detailed-design.md` | Swift Engineer writes, EM approves | `senior-swift-engineer.md` |
| API Contract | `generated-docs/contracts/api-contract.md` | BE + FE write, EM approves | `senior-backend-engineer.md`, `senior-frontend-engineer.md` |
| Test Plan | `generated-docs/qa/test-plan.md` | QA writes, EM approves | `senior-qa-automation-engineer.md` |
| ER Diagram | `src/db/er-diagram.md` | BE writes, EM verifies | `db-schema-change-rule.md` |
| DB Schema Files | `src/db/schema/` | BE | `db-schema.md` |
| DB Migrations | `src/db/migrations/` | BE | `db-schema.md` |
| DB Seeds (all envs) | `src/db/seeds/common/` | BE | `db-schema.md` |
| DB Seeds (dev only) | `src/db/seeds/dev/` | BE | `db-schema.md` |
| Infrastructure | `src/infra/` | DevOps | `senior-devops-engineer.md` |
| Tech Debt / Bug Backlog | `BACKLOG.md` | EM triages | `backlog-reporting-rule.md` |

---

## Contract approvals

Agent-to-agent technical contracts that block downstream work until approved. Approval requires a `Status: Approved — [role]` header at the top of the file. Human milestone gates (PRD, Mocks, Sys Arch, Implementation Plan) are defined per-project in `## Progress` in `workflow/workflow.md`.

| Artifact | Approver | Blocks |
|---|---|---|
| PRD | PM | Designer / macOS Designer (mocks, flows) |
| DB schema | EM + BE | BE data layer, migrations, queries |
| API contract | EM + BE + FE | BE endpoint implementation, FE integration |

---

## DB conventions

| Convention | Value |
|---|---|
| Migration filename format | `YYYYMMDD_HHMMSS_<description>.sql` |
| Schema files | Numbered (`01_users.sql`), run once, never modified after first run |
| Column naming | snake_case (e.g. `created_at`, `user_id`, `order_total`) |
| ID type | UUID |
| Audit columns | `id`, `created_at`, `updated_at`, `deleted_at` on every table |
| Index naming | `idx_{table}_{column}`, unique: `uq_{table}_{column}` |
| FK naming | `{referenced_table}_id` by default; role-based (e.g. `customer_id`) when two FKs reference the same table |

---

## ER diagram format

Mermaid `erDiagram` syntax. Must be updated in the same commit as any schema change.

---

## Code style

| Convention | Value |
|---|---|
| Linter | Checkstyle with `google_checks.xml` |
| Coverage | 100% line coverage enforced via JaCoCo |
| Maven phase | `verify` -- `mvn verify` fails on Checkstyle violations or coverage below 100% |
| CI gate | GitHub Actions runs `mvn verify` on every PR, blocks merge on failure |

---

## Backlog

All agents append to the Triage table in `BACKLOG.md`. ID and priority are assigned by EM at triage -- never self-assigned.
