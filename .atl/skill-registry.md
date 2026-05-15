# Skill Registry — Proyecto_Hoil

Generated: 2026-05-14 | Persistence: engram | SDD: init phase

## Project Skills

None detected in project skill locations (`skills/`, `.codex/skills/`, `.agents/skills/`, `.atl/skills/`, etc.).

## Project Convention Files

None detected. No `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `GEMINI.md`, or `copilot-instructions.md` at project root.

## User-Level Skills

Scanned from `~/.codex/skills/`. Skipped SDD infrastructure skills (`sdd-*`), `_shared`, and `skill-registry`.

---

### branch-pr
**Trigger**: creating, opening, or preparing PRs for review.  
**Path**: `/home/angel/.codex/skills/branch-pr/SKILL.md`

**Compact Rules**:
- Every PR must link an approved issue with `status:approved` label.
- Branch names follow `type/slug` with conventional type prefix.
- PR body includes closure link, exactly one `type:*` label, summary, changes, test plan, and checklist.
- Modified shell scripts must pass ShellCheck.
- Do not add `Co-Authored-By` trailers.

---

### chained-pr
**Trigger**: PRs over 400 lines, stacked PRs, review slices.  
**Path**: `/home/angel/.codex/skills/chained-pr/SKILL.md`

**Compact Rules**:
- Split PRs over 400 changed lines unless the maintainer explicitly accepts an exception.
- Keep each PR reviewable within about 60 minutes.
- One deliverable work unit per PR; keep tests/docs with the unit.
- Child PRs include a dependency diagram marking the current PR.
- Do not mix chain strategies after selection.

---

### cognitive-doc-design
**Trigger**: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs.  
**Path**: `/home/angel/.codex/skills/cognitive-doc-design/SKILL.md`

**Compact Rules**:
- Lead with the answer, then context.
- Use progressive disclosure: happy path, details, edge cases, references.
- Prefer tables, checklists, examples, and templates over dense prose.
- Make docs scannable for reviewers.
- Default structure: Quick path → Details → Checklist → Next step.

---

### comment-writer
**Trigger**: PR feedback, issue replies, reviews, Slack messages, or GitHub comments.  
**Path**: `/home/angel/.codex/skills/comment-writer/SKILL.md`

**Compact Rules**:
- Start with the actionable point.
- Be warm, direct, and concise.
- Explain why when requesting a change.
- Avoid pile-ons; comment on highest-value issues.
- Match thread language; avoid em dashes.

---

### go-testing
**Trigger**: Go tests, go test coverage, Bubbletea teatest, golden files.  
**Path**: `/home/angel/.codex/skills/go-testing/SKILL.md`  
**Note**: Go-specific; not currently applicable to this TypeScript/Next.js project.

**Compact Rules**:
- Prefer table-driven tests with subtests.
- Test behavior and state transitions.
- Use temp dirs for filesystem tests.
- Keep integration tests skippable.
- Golden files must be deterministic.

---

### issue-creation
**Trigger**: creating GitHub issues, bug reports, or feature requests.  
**Path**: `/home/angel/.codex/skills/issue-creation/SKILL.md`

**Compact Rules**:
- Use issue templates; blank issues are disabled.
- New issues start with `status:needs-review`.
- Maintainer approval (`status:approved`) is required before PR work.
- Search for duplicates first.
- Questions go to Discussions, not issues.

---

### judgment-day
**Trigger**: judgment day, dual review, adversarial review, juzgar.  
**Path**: `/home/angel/.codex/skills/judgment-day/SKILL.md`

**Compact Rules**:
- Launch two blind judges in parallel with identical criteria.
- Wait for both before synthesis.
- Treat warnings as real only if normal intended use can trigger them.
- Ask before fixing confirmed Round 1 issues.
- Re-run both judges after fixes; terminal states are `APPROVED` or `ESCALATED`.

---

### skill-creator
**Trigger**: new skills, agent instructions, documenting AI usage patterns.  
**Path**: `/home/angel/.codex/skills/skill-creator/SKILL.md`

**Compact Rules**:
- Skills are LLM runtime instruction contracts, not human docs.
- `description` must be trigger-first, YAML-safe, one physical line, ≤250 chars.
- Include required frontmatter and standard sections.
- Keep body concise; move examples/background to local references/assets.
- References must resolve locally.

---

### work-unit-commits
**Trigger**: implementation, commit splitting, chained PRs, or keeping tests and docs with code.  
**Path**: `/home/angel/.codex/skills/work-unit-commits/SKILL.md`

**Compact Rules**:
- Commit by deliverable work unit, not by file type.
- Keep tests and docs with the code they verify.
- Each commit should tell a reviewable story.
- If forecast change exceeds 400 lines, group into chained PR slices before implementation.
- Use conventional commit format.

---

## SDD Phase Skills

Available for SDD workflow but not registered as project skills:

| Skill | Role |
| --- | --- |
| sdd-explore | Explore ideas before committing to a change |
| sdd-propose | Create change proposal |
| sdd-spec | Write delta specs with requirements/scenarios |
| sdd-design | Create technical design and architecture |
| sdd-tasks | Break change into implementation tasks |
| sdd-apply | Implement tasks from specs and design |
| sdd-verify | Execute tests and prove implementation matches specs |
| sdd-archive | Archive completed change and sync delta specs |
| sdd-onboard | Walk through the full SDD cycle |
