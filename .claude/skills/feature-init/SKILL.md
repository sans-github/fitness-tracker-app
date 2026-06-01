---
name: feature-init
description: Scaffold a new feature folder under projects/. Creates projects/master/ (once) and projects/YYYYMMDD-feature-name/ from the template. Use when starting work on a new feature.
---

# Feature Init

Scaffolds a new feature workspace and guides the user through requirements, config, and kickoff interactively. One command -- no manual file editing required.

**Sequence:** Requirements Kickoff → Project Config Review → Scaffold → Phase Config → Kick off

---

## Step 0: Requirements Kickoff

Open with: "Let me gather details about what you'd like to build today."

Use `AskUserQuestion` (single-select) to ask how the user wants to start:

- **Describe it now** -- you'll interview me
- **I have requirements text** -- I'll paste them
- **I have a full PRD** -- I'll paste it or give a file path

### Path A: Describe it now

Invoke the `senior-product-manager` agent with this instruction:

> "Run a short requirements interview with the user. Ask one question at a time. When you have enough context, produce: (1) a one-paragraph summary, (2) 3-5 key points, (3) a suggested 2-3 word kebab-case slug for the feature folder (e.g. `user-auth-flow`). Do not write a full PRD -- requirements summary only."

Wait for PM agent to complete. Extract the slug suggestion from its output.

### Path B: I have requirements text

Ask the user to paste their requirements. Then invoke `senior-product-manager` with:

> "The user has provided the following requirements: [paste]. Refine them into: (1) a one-paragraph summary, (2) 3-5 key points, (3) a suggested 2-3 word kebab-case slug. Requirements summary only -- no full PRD."

Extract the slug suggestion.

### Path C: I have a full PRD

Ask the user to paste the PRD content or provide a file path. If a file path is given, read the file. Derive a 2-3 word kebab-case slug from the PRD title or first heading. No PM agent invocation needed.

After collecting the PRD, ask:

> "Do you also have existing design artifacts (mocks) or a high-level design (HLD)?"

Options: **Yes, I have mocks** / **Yes, I have an HLD** / **Yes, both** / **No, just the PRD**

For each artifact the user says they have, ask for the file path or folder path. Then validate the path is accessible before proceeding:

- If the file or folder exists: confirm it and hold the resolved path in context.
- If it cannot be located, respond with: "I couldn't find a file at [path]. Please check the path and try again, or skip this artifact." Do not proceed past this step until all provided paths are confirmed accessible.

Hold in context: which artifacts were provided and their resolved paths. This drives stage skipping in Step 2.

### Confirm the slug

After any path, present the slug suggestion to the user using `AskUserQuestion`:

> "I'll name the feature folder `YYYYMMDD-[slug]` (today's date will be prepended). Does this look right?"

Options: "Yes, use this name" / "Edit it" (user types a different slug via Other).

Hold the confirmed slug and requirements summary in context -- they are written to `prd.md` after the scaffold in Step 2.

---

## Step 1: Project Config Review

Read `.claude/my-project-config.md`. Ask the two questions below in sequence.

**1a. GitHub issue labels**

Read the label taxonomy from `my-project-config.md`. Use `AskUserQuestion` (single-select) with the question text built from the actual label values:

> "GitHub issue labels for this project:
> Area: be · fe · db · infra · design · qa · spec · mocks · contract
> Type: bug · debt · ux · gap
> Priority: p0 · p1 · p2
>
> Do these look right?"

Substitute the actual label values read from `my-project-config.md` — do not hardcode the labels above.

Options: **Looks good** / **I need to change them** (if changes needed, tell user to edit `.claude/my-project-config.md` directly, then re-ask).

**1b. Brand guidelines (conditional)**

Only ask this if the requirements summary from Step 0 indicates a UI component (web frontend, mobile, or macOS app).

Use `AskUserQuestion` (single-select):

> "A default brand ships with the framework (Off-White + Deep Teal, Plus Jakarta Sans). Want to preview it, use it as-is, or replace it with your own?"

Options:
- **Preview it** — run `open .claude/skills/brand-guidelines/previews/default-brand.html` via Bash, then re-ask with only **Use the default** / **I'll replace it**
- **Use the default**
- **I'll replace it** — tell user to update `.claude/skills/brand-guidelines/SKILL.md` before kickoff

Note: tech stack selection happens later — EM reviews the full PRD and confirms the stack with you at the start of Stage 3.

---

## Step 2: Scaffold

Run `bash .claude/skills/feature-init/feature-init.sh YYYYMMDD-[confirmed-slug]` using Bash. IMPORTANT: always use this relative path exactly -- never expand it to an absolute path. Substitute today's date (YYYYMMDD) and the confirmed slug.

Show the user the folder tree from the script output. Extract the feature folder path from the output (format: `projects/YYYYMMDD-feature-name`) -- you will need it in every subsequent step.

**Write requirements to `prd.md`:**

- **Paths A or B:** Write the requirements frontmatter block to `[feature-folder]/generated-docs/prd.md`:

  ```
  ---
  requirements:
    summary: <one paragraph from PM output>
    key_points:
      - <bullet>
      - <bullet>
    additional_context: none
    gathered_by: orchestrator-inline
  ---
  ```

- **Path C (full PRD provided):** Write the full PRD content directly to `[feature-folder]/generated-docs/prd.md` (no frontmatter wrapper).

**Copy provided artifacts (Path C only):**

If the user provided artifacts in Step 0, copy them to their canonical locations now:

| Artifact | Destination |
|---|---|
| PRD (file) | `[feature-folder]/generated-docs/prd.md` (overwrite the stub already written above) |
| Mocks (file or folder) | `[feature-folder]/generated-docs/design/` |
| HLD (file) | `[feature-folder]/generated-docs/architecture/hld.md` |

If a provided artifact is a folder, copy all contents into the destination. If Claude cannot read the format (e.g. Figma URL, unsupported binary), tell the user and ask them to export to a supported format before continuing.

**Special case — HLD provided without mocks:** Save the HLD to its canonical path, then ask:

> "You provided an HLD but no mocks. Do you have mocks to go with it?"

If yes: collect the mocks path, validate it, and proceed with all three artifacts in context. If no: inform the user that Design will run to produce mocks, and that EM will then validate the provided HLD against those mocks before Stage 3 can proceed. Continue with PRD-only skip rules below.

**Mark skipped stages in `[feature-folder]/workflow/workflow.md`:**

Apply these rules based on which artifacts were provided:

| Artifacts provided | What gets marked `[-]` |
|---|---|
| PRD only | Stage 1 whole block |
| PRD + mocks | Stage 1 whole block; Stage 2 whole block |
| PRD + mocks + HLD | Stage 1; Stage 2; Stage 3 > Engineering Kickoff whole block; Stage 3 > System Architecture whole block; Stage 3 > High-Level Design > `EM: produce high-level design` step only (parent group stays `[ ]`; EM-DevOps loop and `👤 HUMAN: review` stay `[ ]`) |

If Engineering Kickoff is marked `[-]`, check whether `BACKLOG.md` exists at the repo root. If it does not, create it using the format in `backlog-reporting-rule.md`.

After all writes, confirm the changes with a brief summary to the user.

Then invoke `/my-git-commit` automatically without asking. Commit subject: `"Scaffold [feature-name] feature folder"` where `[feature-name]` is the `YYYYMMDD-feature-name` portion of the folder path.

---

## Step 3: Phase Config

Read `[feature-folder]/workflow/workflow.md` to identify which stages are currently active (`[ ]`) and which are already skipped (`[-]`) from Step 2 artifact rules. Collect all `👤` gate lines from active stages.

**Orientation (output before any question):**

```
Your feature runs through up to 8 stages. Stages 6, 7, and 8 always run
(master baseline update, documentation, and release).
[If any stages were skipped in Step 2: "Stages X and Y have been automatically
skipped based on the artifacts you provided."]

Below are the human approval gates in your workflow. All are active by default.
Check any you want to skip — leave all unchecked to keep every gate active.
```

**Deployment target**

Use `AskUserQuestion` (single-select):

> "What is your deployment target?"

Options: **Local** / **AWS** (user types a custom target via the free-text Other field).

**Gate config — three grouped calls**

Each call is multi-select. Options start unchecked. Checking an option means skipping that gate. If the user checks nothing, all gates in that group remain active. **Each option is a label only — no description field, no stage reference, no explanatory text.**

**Call 1 — Discovery and design** (skip this call entirely if both Stage 1 and Stage 2 are `[-]`)

Use `AskUserQuestion` (multi-select):

> "Which approval gates do you want to skip?"

Options (include only if the corresponding stage is active; no description lines):
- PRD approval (human review)
- Mocks approval (human review)

**Call 2 — Technical planning** (skip this call entirely if all Stage 3 gate steps are `[-]`)

Use `AskUserQuestion` (multi-select):

> "Which approval gates do you want to skip?"

Options (include only if the corresponding step is active; no description lines):
- System architecture approval (human review)
- High-level design approval (human review)
- Implementation plan approval (human review)

**Call 3 — Engineering and wrap-up**

Use `AskUserQuestion` (multi-select):

> "Which approval gates do you want to skip?"

Options (no description lines):
- Deployment plan approval (human review) — include only if the Infrastructure step in Stage 4 is active
- Master baseline confirmation (human review)
- README and CLAUDE.md approval (human review)
- Release readiness approval (human review)

**Apply the selections**

Update `[feature-folder]/workflow/workflow.md`:
- For each checked option: find the matching `👤` step line within its stage and change its `[ ]` to `[-]`
- Replace the `local` default in the `## Deployment target` block with the user's choice

Print a plain-language summary with consistent alignment:

1. Collect every label that will appear: stage names (e.g. `Stage 1: Discovery`) and checkpoint labels (e.g. `    👤 Review and approve the PRD`). The checkpoint prefix `    👤 ` counts toward the label width.
2. Find `max_label_width` = the length of the longest label.
3. For each line, pad the label to `max_label_width` with spaces, then append the status badge.
4. Print a blank line after each stage block (after its last checkpoint row, or after the stage line itself if it has no checkpoints).

Example with correct alignment (labels padded to a common column):

```
Phases configured:
- Stage 1: Discovery                            [ active ]
    👤 Review and approve the PRD               [ active ]

- Stage 2: Design                               [ active ]
    👤 Review and approve mocks                 [ active ]

- Stage 3: Technical Planning                   [ active ]
    👤 Review and approve system architecture   [ skipped ]
    👤 Review and approve high-level design     [ skipped ]
    👤 Review and approve implementation plan   [ skipped ]

- Stage 4: Engineering                          [ active ]
    👤 Review and approve deployment plan       [ skipped ]

Deployment target: local
```

Use `[ active ]` for `[ ]` items and `[ skipped ]` for `[-]` items. Only show checkpoint rows for active stages.

Then ask: "Does this look right before we continue?" with options "Yes, continue" and "No, reconfigure". If reconfigure, repeat from deployment target question until the user confirms.

---

## Step 4: Kick off

Ask the user: "Config and requirements are ready. Ready to kick off?" Offer "Yes, proceed" and "Not yet".

If yes: read `.claude/template/kickoff-prompt.md`, replace every occurrence of `[YYYYMMDD-feature-name]` with the actual feature folder path (e.g. `projects/20260420-my-feature`), then execute the resulting prompt as if the user had sent it. The kickoff prompt handles everything from here.
