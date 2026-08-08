# ScoreFlow Pull Request Records

This folder is the permanent project record for ScoreFlow pull requests.

## Workflow

1. Treat the repository as the source of truth.
2. Create each change on an `agent/` branch from the current `main` branch.
3. Number work sequentially as `PR-001`, `PR-002`, and so on.
4. Add or update the matching Markdown record in this folder.
5. Open a GitHub pull request for local testing and review.
6. Richie tests the branch locally.
7. Merge only after approval.

## Naming

- Branch: `agent/pr-###-short-description`
- Record: `docs/PRs/PR-###.md`
- Pull request title: `PR-###: Short description`

## Required Record Sections

Each PR record should include:

- Status
- Branch
- Purpose
- Scope
- Files changed
- Implementation notes
- Testing checklist
- Known limitations
- Merge notes

The PR record should be updated when the implementation or testing results change.
