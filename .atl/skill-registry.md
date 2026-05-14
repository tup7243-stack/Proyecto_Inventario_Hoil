# Skill Registry — proyecto_hoil

Generated: 2026-05-13 | Persistence: engram | SDD: init phase

## Project Skills

None — project not yet scaffolded.

## Project Convention Files

None detected. No `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `GEMINI.md`, or `copilot-instructions.md` at project root.

## User-Level Skills

Scanned from `~/.config/opencode/skills/`. Skipped: `sdd-*`, `_shared`, `skill-registry`.

---

### branch-pr
**Trigger**: creating, opening, or preparing PRs for review.
**Path**: `~/.config/opencode/skills/branch-pr/SKILL.md`

**Compact Rules**:
- Every PR MUST link an approved issue with `status:approved` label — no exceptions.
- Branch naming: `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`.
- Conventional commits: `type(scope): description`. Types: feat, fix, docs, refactor, chore, style, perf, test, build, ci, revert.
- PR body MUST contain: `Closes #N`, exactly one `type:*` label, summary, changes table, test plan, contributor checklist.
- Shellcheck must pass on modified scripts.
- No `Co-Authored-By` trailers in commits.

---

### chained-pr
**Trigger**: PRs over 400 lines, stacked PRs, review slices.
**Path**: `~/.config/opencode/skills/chained-pr/SKILL.md`

**Compact Rules**:
- Split PRs over 400 changed lines unless maintainer explicitly accepts `size:exception`.
- Keep each PR reviewable in ≤60 minutes.
- One deliverable work unit per PR; tests/docs stay with their unit.
- Every child PR must include a dependency diagram marking the current PR with `📍`.
- Stacked PRs to main for independent slices; Feature Branch Chain with tracker PR for integrated features.
- Do not mix chain strategies after the user chooses one.
- Polluted diffs are base bugs: retarget or rebase.

---

### cognitive-doc-design
**Trigger**: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs.
**Path**: `~/.config/opencode/skills/cognitive-doc-design/SKILL.md`

**Compact Rules**:
- Lead with the answer — decision/outcome first, context after.
- Progressive disclosure: happy path → details → edge cases → references.
- Chunking: group related info into small sections.
- Signposting: use headings, labels, callouts, summaries.
- Recognition over recall: prefer tables, checklists, examples, templates over prose.
- Review empathy: make docs scannable for reviewers.
- Default structure: Quick path → Details → Checklist → Next step.

---

### comment-writer
**Trigger**: PR feedback, issue replies, reviews, Slack messages, or GitHub comments.
**Path**: `~/.config/opencode/skills/comment-writer/SKILL.md`

**Compact Rules**:
- Be useful fast: start with the actionable point, not a recap.
- Be warm and direct — sound like a teammate, not a corporate bot.
- Keep it short: 1–3 short paragraphs or tight bullets.
- Explain why when asking for a change (technical reason).
- Avoid pile-ons: comment on highest-value issue, not every preference.
- Match thread language. In Spanish, use Rioplatense Spanish/voseo.
- No em dashes. Comment formula: observation → why → next action.

---

### go-testing
**Trigger**: Go tests, go test coverage, Bubbletea teatest, golden files.
**Path**: `~/.config/opencode/skills/go-testing/SKILL.md`
**Note**: Go-specific. Not applicable to this TypeScript/Next.js project.

**Compact Rules**:
- Prefer table-driven tests with `t.Run(tt.name, ...)`.
- Test behavior and state transitions, not implementation trivia.
- Use `t.TempDir()` for filesystem tests.
- Keep integration tests skippable with `testing.Short()`.
- Golden files must be deterministic; update only through `-update` path.
- Use small mocks/interfaces around system boundaries.

---

### issue-creation
**Trigger**: creating GitHub issues, bug reports, or feature requests.
**Path**: `~/.config/opencode/skills/issue-creation/SKILL.md`

**Compact Rules**:
- Blank issues are disabled — MUST use template (bug report or feature request).
- Auto-labeled `status:needs-review` on creation.
- Maintainer MUST add `status:approved` before any PR can be opened.
- Questions go to Discussions, not issues.
- Search existing issues for duplicates first.
- Templates: Bug Report (fields: steps, expected, actual, OS, agent, shell) or Feature Request (problem, solution, affected area).

---

### judgment-day
**Trigger**: judgment day, dual review, adversarial review, juzgar.
**Path**: `~/.config/opencode/skills/judgment-day/SKILL.md`

**Compact Rules**:
- Launch TWO blind judges in parallel with identical target and criteria.
- Never review code yourself — judges do it.
- Wait for both judges before synthesis; never accept partial verdict.
- Classify warnings as real only if normal intended use can trigger them.
- Ask before fixing Round 1 confirmed issues.
- After any fix, immediately re-launch both judges in parallel.
- Terminal states: `APPROVED` or `ESCALATED`.
- Max 2 fix iterations; escalate if issues remain.

---

### skill-creator
**Trigger**: new skills, agent instructions, documenting AI usage patterns.
**Path**: `~/.config/opencode/skills/skill-creator/SKILL.md`

**Compact Rules**:
- Skill is an LLM runtime instruction contract, not human documentation.
- `description`: one physical line, quoted, YAML-safe, trigger-first, ≤250 chars.
- Frontmatter MUST include: name, description, license, metadata.author, metadata.version.
- Body structure: Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References.
- Target 180–450 body tokens; supporting material in `assets/` or `references/`.
- Do not add a `Keywords` section.
- References must point to local files.

---

### work-unit-commits
**Trigger**: implementation, commit splitting, chained PRs, keeping tests and docs with code.
**Path**: `~/.config/opencode/skills/work-unit-commits/SKILL.md`

**Compact Rules**:
- Commit by work unit (deliverable behavior), NOT by file type.
- Keep tests and docs with the code they verify — same commit.
- Tell a story: reviewer should understand why each commit exists from its diff and message.
- Each commit should be a candidate chained PR if the change grows.
- SDD workload guard: if tasks forecast >400-line change, group commits into chained PR slices before implementation.
- Rollback must be reasonable without reverting unrelated work.
- Conventional commit format.

---

## SDD Phase Skills

Available for SDD workflow but not registered as project skills (SDD infrastructure):

| Skill | Role |
|-------|------|
| sdd-explore | Explore ideas before committing to change |
| sdd-propose | Create change proposal |
| sdd-spec | Write delta specs with requirements/scenarios |
| sdd-design | Create technical design and architecture |
| sdd-tasks | Break change into implementation tasks |
| sdd-apply | Implement tasks from specs and design |
| sdd-verify | Execute tests, prove implementation matches specs |
| sdd-archive | Archive completed change, sync delta specs |
| sdd-onboard | Walk through full SDD cycle |
