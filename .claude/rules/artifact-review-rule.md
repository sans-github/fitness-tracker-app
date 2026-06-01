# Rule: Artifact Review at Human Gates

When an agent produces or updates any of the artifacts below, it must present it for human review at the 👤 gate. Output the full markdown content in the response, then use `AskUserQuestion` (single-select) with exactly two options: **Approve** and **Request changes**. Do not proceed until the human approves.

## Artifacts requiring human review

- PRD
- Kickoff Plan
- Implementation Plan
- System Architecture
- High-Level Design
- BE Detailed Design
- FE Detailed Design
- Swift Detailed Design
- API Contract
- Deployment Plan
- Infrastructure Verification
- Test Plan

## Required document structure

Every artifact must follow this section order:

1. **Status header** (if applicable) -- `Status: Approved — [role]` and `Approved: YYYY-MM-DD`, as a blockquote at the very top of the MD
2. **Key overview section** -- the single most decision-relevant summary, as the first `##` heading
3. **Full content** -- remaining sections in logical order

### Key overview per artifact

| Artifact | First `##` heading | Content |
|---|---|---|
| PRD | `## Goals` | Goals, non-goals, and success metrics |
| System Architecture | `## System Overview` | Component summary table or diagram |
| High-Level Design | `## Architecture Summary` | Architecture summary and key technical decisions |
| BE Detailed Design | `## API Surface` | API endpoints at a glance: method, path, purpose |
| FE Detailed Design | `## Component Overview` | Component tree at a glance |
| Swift Detailed Design | `## View Overview` | SwiftUI view tree at a glance |
| API Contract | `## Contract Summary` | Endpoint count, auth model, key constraints |
| Deployment Plan | `## What Will Be Provisioned` | Component list, service, config, and estimated cost table |
| Infrastructure Verification | `## Verification Summary` | What was checked and pass/fail result per check |
| Test Plan | `## Scope` | What is in scope, what is out, and risk summary |
| Kickoff Plan | `## Summary` | Feature summary, delivery phases, and key risks |

## Markdown writing rules

**Always insert a blank line before a pipe table.** GFM requires it; without it the table collapses into a paragraph.

```markdown
Existing stack confirmed from `src/`:

| Layer | Technology |
|-------|------------|
```

Not:

```markdown
Existing stack confirmed from `src/`:
| Layer | Technology |
|-------|------------|
```
