---
name: no-pause-after-commit
description: Do not stop after a git commit — continue automatically to the next step without waiting for user input
metadata:
  type: feedback
---

After creating a git commit, continue immediately to the next step in the workflow. Do not pause, summarize, or wait for the user to nudge.

**Why:** User had to repeatedly prompt to resume after commits. The commit is a side effect, not a stopping point.

**How to apply:** Treat every commit as a non-blocking action. Execute it and immediately proceed to the next task without any pause or summary output.
