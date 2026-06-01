# Kickoff Prompt

**Feature folder:** `projects/20260601-skinny-mvp`

---

## Required reading

Read these before doing anything:

1. `CLAUDE.md` (if present) -- existing software stack, conventions, project structure.
2. `.claude/agents-guide.md` -- agent team orientation, collaboration model, rules. The project config overrides where they differ.
3. `.claude/my-project-config.md` -- file locations, naming conventions, tooling choices.
4. `[feature-folder]/workflow/workflow.md` -- active stages, skipped phases, deployment target; the `## Progress` section is the live delivery tracker.
5. `[feature-folder]/generated-docs/prd.md` -- the feature PRD.

Never hardcode artifact paths. Resolve all artifact paths by looking up the artifact name in the File locations table in `my-project-config.md`.

---

## Produce the kickoff plan

Write `[feature-folder]/workflow/kickoff-plan.md` with the sections below.

Emoji conventions -- use inline on the heading, row, or bullet where the action is needed:
- 👀 Human must review and explicitly confirm before work proceeds
- ❓ Human input is missing and required -- agents cannot proceed without it
- 👤 Human gate -- human must approve before downstream work is unblocked

### 1. What I understood

Start with a one-paragraph big picture: what will be built and how the pieces fit together. Then summarize the PRD and project config in your own words. Call out anything ambiguous or missing that I should clarify before work begins.

**Folder structure check:** Verify the feature folder contains:
- `[feature-folder]/workflow/workflow.md`
- `[feature-folder]/generated-docs/prd.md`
- `[feature-folder]/generated-docs/design/`

If any are missing, stop and tell the human exactly what is missing.

**Input quality check:** Flag any of:
- Unfilled placeholders (`[YYYYMMDD-feature-name]`, `TODO`, `TBD`, template defaults)
- Sections untouched or still containing template defaults
- Content in `workflow.md` or `prd.md` that contradicts the project description
- Sparse or vague entries (e.g. "active agents: all" with no rationale, one-line PRD)
- A stage marked as active whose upstream dependency is skipped -- flag the broken dependency and block until resolved. Dependencies: Design requires Discovery; System Design requires Discovery and Design; Technical Planning requires System Design; Engineering requires Technical Planning; QA requires Engineering; Release requires QA
- `prd.md` contains only a requirements frontmatter block (no full PRD body) -- this is the expected state after `/feature-init`. Do not flag it and do not invoke PM. Stage 1 will produce the full PRD. If `prd.md` is completely empty (no content at all), flag it as a blocker -- user must re-run `/feature-init` to capture requirements first.

Do not proceed if critical inputs are missing or stale. Surface them and wait for the human.

**Risks and unknowns:** Anything that could slow the project down: unclear requirements, missing design decisions, external dependencies, integration risks with existing code, or anything needing resolution before work starts. If `my-project-config.md` has changed since the last feature (or this feature requires a change), assess the impact: what changed, which parts of the codebase are affected, risk level with reasoning, extent of refactor, and whether it could introduce regressions. Do not proceed past project config risks without explicit human sign-off.

**Out of scope:** Explicitly state what is NOT being built, based on the project config and PRD.

**Software stack:** Inspect `src/` to determine whether an existing stack is in place. If a stack exists, note it here. If no stack exists, note that EM will select and confirm the stack with the human at the start of Stage 3, after the full PRD is available. Flag anything in the requirements that looks unlikely to be addressable with the available layers in `my-project-config.md` — surface it as a risk for the human to resolve before Stage 3.

### 2. Open questions

Numbered list of questions that need my answers before agents can proceed. Do not make assumptions.

When the human answers a question, update that line in `kickoff-plan.md`: add ✅ after ❓ and append a short resolution note inline. Unanswered questions stay as ❓ only. Example:

```
1. ❓✅ Will auth be included in Phase 1? -- No, auth ships in Phase 2.
2. ❓ Which cloud region should the infra target?
```

Do not remove the original question text. Mark all questions resolved before proceeding to approval.

### 3. Next step

One sentence only. State exactly what happens after I approve: who does what, and what artifact they produce. Must match the first unchecked step in `## Progress` in `workflow.md`.

Example: "Once approved, Designer produces mocks for `[feature-folder]/generated-docs/design/` before any engineering work begins."

---

## After approval

Do not begin any work until I have reviewed and approved the kickoff plan.

### When I approve the kickoff plan:

1. Write `Status: Approved — Human` and `Approved: YYYY-MM-DD` at the top of `kickoff-plan.md`. Then invoke `/my-git-commit` automatically without asking. Commit subject: "Add kickoff plan for [feature-name]" where `[feature-name]` is the `YYYYMMDD-feature-name` portion of the feature folder path.

2. Seed the `## Progress` section of `[feature-folder]/workflow/workflow.md` from `## Project phases` in the same file:
   - First line after the heading: `[ ]  not started   |   [-]  skipped   |   [x]  done`
   - Work through each phase in order.
   - Phase or step `[-]`: mark SKIPPED, append any inline reason if present.
   - Phase or step `[ ]`: include as an active numbered checkbox.
   - Stage 6 (Master Baseline Update) is always `[ ]` -- never mark it SKIPPED regardless of `## Project phases`. If it appears as `[-]`, correct it to `[ ]` silently.
   - Stage 7 (README and CLAUDE.md) is always `[ ]` -- same rule applies.
   - Stage 8 (Release) is always `[ ]` -- same rule applies.
   - Do not resolve contradictions here -- they must be caught during the input quality check before this step is reached.

   Then invoke `/my-git-commit` automatically without asking. Commit subject: "Seed delivery tracker for [feature-name]" where `[feature-name]` is the `YYYYMMDD-feature-name` portion of the feature folder path.

3. Transfer orchestration to PM for Stages 1 and 2: invoke PM with a brief that includes:
   - The feature folder path.
   - The requirements summary from `prd.md` frontmatter.
   - These instructions: execute Stages 1 and 2 from `## Progress` in `workflow.md` top-to-bottom, following the execution rules below; check off each step as it completes; once every step in Stage 2 is checked off, explicitly signal EM: "Stage 2 complete. Resuming from Stage 3." and stop.

   EM does not proceed past this point until PM signals Stage 2 complete.

4. Resume at Stage 3: when PM signals Stage 2 complete, read the full PRD at `[feature-folder]/generated-docs/prd.md`. Select the minimum tech stack subset from the Tech stack table in `my-project-config.md` that covers the requirements -- do not default to the full list. Prefer the smallest stack that addresses the scope. Flag any mismatch (e.g. Redux Toolkit for a single-page app with no shared state) with a concrete alternative and rationale.

   Present the selected layers to the human using `AskUserQuestion` (multi-select):

   > "Based on the PRD, here is the tech stack EM recommends for this feature. Deselect any layer you don't need, or confirm as-is."

   Options: one per selected layer (e.g. "BE — Java 21 + Spring Boot", "FE — React 18 + TypeScript", "QA — Playwright"). If the human deselects a layer or requests a change, revise and re-ask until confirmed. If an unlisted technology is requested, flag that Arch approval is required before proceeding.

   Once the stack is confirmed, read `## Progress` in `workflow.md` and continue execution from the first unchecked step in Stage 3.

### Execution rules

These rules apply to whichever agent is currently orchestrating (PM for Stages 1-2, EM for Stage 3+).

- Never self-execute a step assigned to a named role. Invoke the Agent tool with that role.
- Never skip ahead. A step is not started until all prior steps are checked off.
- After checking off any step, scan its parent phase group (bold label line, e.g. `- [ ] **Backend Development**`). If every child step under that group is `[x]`, mark the parent `[x]` in the same edit. Do not defer or batch rollup. Stage headings (`### Stage N: ...`) have no checkbox and are never rolled up.
- After completing any step marked 💾, create a git commit immediately before proceeding to the next step. Do not ask -- commit automatically. Commit subject: imperative mood, describe the artifact (`Add PRD for sample-feature`), no stage numbers or approval metadata.
- When the orchestrator reaches the end of the list, stop and wait -- EM will add the next batch of steps.
- When a 👤 human gate is reached, output the full artifact MD content in the response, then use `AskUserQuestion` with options **Approve** and **Request changes** per `artifact-review-rule.md`. Check the box only after human confirms.
- After human confirms a gate, do not prompt for a commit. Any uncommitted changes (e.g. tracker checkboxes) will be picked up by the next 💾 auto-commit.
