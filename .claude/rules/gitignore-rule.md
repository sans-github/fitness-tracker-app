# Rule: .gitignore Ownership

Every agent that produces files in `src/` is responsible for ensuring `.gitignore` covers the file types their tooling generates — in the same commit, before anything is pushed. No build artifact, dependency directory, or secrets file may appear in git history.

## How to write to .gitignore

- **If `.gitignore` does not exist:** create it, then append your section.
- **If `.gitignore` exists:** append only. Never overwrite or remove entries from another agent's section.
- **Before appending:** check whether your entries are already present. Do not duplicate.
- **Each section must have a comment header** identifying the agent/stack (e.g. `# Java / Maven`, `# Frontend / Node`).

## Section ownership by agent

### BE (Java / Maven)
```
# Java / Maven
target/
*.class
*.jar
*.war
.mvn/wrapper/maven-wrapper.jar
```

### BE (Node / Python)
```
# Node (BE)
node_modules/
dist/

# Python
*.pyc
__pycache__/
.venv/
```

### FE
```
# Frontend / Node
node_modules/
dist/
.next/
.vite/
playwright-report/
test-results/
```

### DevOps
```
# Terraform
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars
!*.tfvars.example
```

### Swift Engineer
```
# Xcode / Swift
.build/
DerivedData/
*.xcuserstate
*.xcworkspace/xcuserdata/
*.xccheckout
*.moved-aside
```

## Baseline entries (first agent to write code adds these)

The first agent to create `.gitignore` must include these entries regardless of stack:

```
# OS
.DS_Store

# Environment / secrets
.env
.env.local
.env.*.local

# IDE
.idea/
*.iml
```

## EM verification

When reviewing any agent's implementation work, EM must confirm:
- `.gitignore` exists
- It covers all file types produced by that agent's stack
- No build artifacts or secrets appear in the staged or committed files
