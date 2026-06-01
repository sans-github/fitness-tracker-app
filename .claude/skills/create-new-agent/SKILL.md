---
name: create-new-agent
description: >
  Step-by-step process for adding a new agent to this repo correctly: plan-first design,
  9-section file format, inline skill scaffolding, collaboration-contracts registration,
  and fail-proof structural verification. Invoke via /create-new-agent.
---

## When invoked

Trigger: `/create-new-agent [intent]`

If `intent` is omitted, ask: "What kind of engineer or specialist should this agent be? Briefly describe their role and the tech stack (if any)."

Do not touch any file until the plan is approved.

## Phase 1: Plan

Invoke the **Plan agent** with the user's intent plus this context:

> Design a plan for adding a new agent to this Claude Code delivery-team repo. The plan must cover: (1) agent file format and section order per CLAUDE.md, (2) which existing skills to reference and which new skills to scaffold inline, (3) which files across the repo need updating (agents, rules, skills/collaboration-contracts, template, my-project-config, framework-config, README), (4) the structural verification grep strategy per the CLAUDE.md checklist. The user's intent: [INTENT]

Present the plan to the user. Iterate with `re-invoke Plan agent with this feedback: [USER_FEEDBACK]` until the user approves.

Do not proceed past this phase until the user explicitly approves the plan.

## Phase 2: Agent file

### Required file location

`.claude/agents/<role-slug>.md` where `<role-slug>` matches the `name` field in frontmatter (e.g. `senior-swift-engineer`).

### 9-section format (mandatory order)

```markdown
---
name: <role-slug>
description: <one sentence: when to pick this agent over others>
skills:
  - <skill-1>
  - collaboration-contracts
---

You are a senior <role title>.

## Qualities

<intro line: mindset or philosophy that defines this role>

- <quality bullet: domain-specific strength>
- <quality bullet: collaboration trait>
- <quality bullet: craft standard>

## Collaboration

<who this role works with and how -- behavioral only, no artifact names>

- **With EM:** <...>
- **With <Role>:** <...>

## Ownership

<what this role owns end-to-end, as a short prose paragraph or tight bullet list>

## Decision-making

<how this role makes and escalates decisions>

## Communication

<how this role communicates blockers, reviews, and handoffs>

## Hard constraints

> All artifact dependencies and approval gates are governed by the collaboration-contracts skill. Consult it before producing or consuming any artifact.

- <operational rule: security, code quality, craft standard>
- <operational rule>

## Commit conventions

- Prefix: `<prefix>(scope): message` -- e.g. `feat(auth): add JWT refresh`
- <any role-specific commit rule>
```

**Rules:**
- Every agent includes `collaboration-contracts` in skills.
- `## Hard constraints` opens with the blockquote delegating to collaboration-contracts. Never re-list artifact dependencies here.
- Qualities, Collaboration, Ownership, Decision-making, Communication sections are behavioral. No artifact names, no file paths.
- No em dashes anywhere (parentheses or restructure instead).

## Phase 3: New skills (if any)

If the plan calls for new skills, scaffold each at `.claude/skills/<skill-slug>/SKILL.md`:

```markdown
---
name: <skill-slug>
description: <one sentence: what knowledge this skill provides and when to load it>
---

## <Topic heading>

<content>
```

Skill names must be unique across the repo. Verify with `grep -irn "name: <slug>" .claude/skills/`.

## Phase 4: Collaboration contracts

Open `.claude/skills/collaboration-contracts/SKILL.md`. Add one section per new role pairing. Follow the existing pair format exactly (e.g. `### EM<>Swift Engineer`). Cover:

- What the upstream role produces and the downstream role consumes
- Approval gate and who approves
- Any loop exit condition

Also update the **QA inputs**, **Arch gatekeeping**, and **Clarification access** sections if the new role participates in them. Use the existing Swift Engineer additions as a reference.

## Phase 5: Update all dependent files

Work through this list in order. For each file, check whether the new role or skill belongs and add it if so.

| File | What to check |
|------|---------------|
| `.claude/agents/senior-engineering-manager.md` | Add "With \<Role\>" bullet under Collaboration |
| `.claude/agents/senior-product-manager.md` | Add "With \<Role\>" bullet if PM collaborates with this role |
| `.claude/agents/senior-qa-automation-engineer.md` | Add "With \<Role\>" QA loop bullet if QA tests this role's output |
| `.claude/agents/senior-software-architect.md` | Add "With \<Role\>" if Arch reviews this role's designs; update Ownership if needed |
| `.claude/rules/contract-first-rule.md` | Add rows for any new artifact dependencies this role introduces |
| `.claude/rules/artifact-review-rule.md` | Add any new human-gate artifact to the artifact list and key overview table |
| `.claude/rules/delegation-rule.md` | Add the new role name to the example role list |
| `.claude/rules/backlog-reporting-rule.md` | Add the role's Area label (e.g. `Swift`) if not already present |
| `.claude/my-project-config.md` | Add tech stack row if introducing a new layer |
| `.claude/framework-config.md` | Add any new artifact to File locations table; update Mocks row if relevant |
| `.claude/template/feature/workflow/workflow.md` | Add Detailed Design block, Issues List block, and Development block for the new role in Stage 4; add QA coverage in Stage 5; update Stage 6 if Designer-equivalent |
| `README.md` | Add to agent table and skills mindmap; add any install-time note specific to this role's skills under Customizing |

Do not skip a file because it "probably doesn't need updating." Check each one.

## Phase 6: Structural verification

Follow the CLAUDE.md structural change verification checklist exactly. Specifically:

**Step 1 -- Enumerate all terms:**
- Technical identifier: `<role-slug>` (e.g. `senior-macos-designer`)
- File name: `<role-slug>.md`
- Human-readable: `<Role Title>` (e.g. `macOS Designer`)
- Role abbreviation if any (e.g. `Swift Engineer`, `macOS Designer`)
- For each new skill: `<skill-slug>`, `<skill-slug>.md`, human-readable label

**Step 2 -- Pick 2-3 baselines of the same type:**
- New agent: use `senior-frontend-engineer`, `senior-backend-engineer`, `senior-ux-ui-designer`
- New skill: use `prd-craft`, `fe-testing`, `react-typescript`
- New rule: use `contract-first-rule`, `progress-tracking-rule`, `delegation-rule`

**Step 3 -- Grep from repo root, no filters:**

Run from the directory containing `CLAUDE.md` and the `.claude/` folder:

```bash
grep -irn "<term>" .
```

Run this for every term from Step 1 AND every baseline term from Step 2. Never pipe through `grep -v`. Never scope to a subdirectory. Every hit gets evaluated.

**Step 4 -- Compare locations.** Paste the grep output for each baseline alongside the new term's output. If ANY baseline appears in a location, that location is a candidate for the new term too. Document every location the new term is missing. If a gap is deliberate (the new term genuinely does not belong there), state the reason explicitly -- do not silently skip it.

**Step 5 -- Fix all gaps.** Edit each file individually. Do not batch.

**Step 6 -- Re-run and show evidence.** After fixing all gaps, re-run `grep -irn "<new-term>" .` (all forms from Step 1). Paste the complete output. The user confirms.

**Never substitute a prose confidence claim for grep output.** "I'm confident this is complete" without pasted evidence is not verification.

## Definition of done

- [ ] Agent file exists at `.claude/agents/<role-slug>.md` with all 9 sections
- [ ] All new skill files exist at `.claude/skills/<skill-slug>/SKILL.md`
- [ ] `collaboration-contracts/SKILL.md` updated with new role pairings
- [ ] All 12 dependent files checked and updated where needed
- [ ] Baseline greps run and compared against new-term locations
- [ ] All gaps fixed and documented (with reason if deliberately skipped)
- [ ] Re-run grep after fixes; full output pasted
- [ ] User has confirmed the grep output
