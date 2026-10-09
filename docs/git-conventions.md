# Git conventions (enforcement)

## Commit message

Format:

```text
<type>: <description>
```

Allowed types: `feat` `fix` `chore` `docs` `style` `refactor` `test` `ci` `build` `perf`

Examples:

```text
feat: add employee clock-in endpoint
fix: prevent double clock-out
docs: update gitflow conventions
```

## Branch name

```text
feature/TM-<id>-short-slug
config/TM-<id>-short-slug
bugfix/TM-<id>-short-slug
hotfix/TM-<id>-short-slug
```

Also allowed: `main`, `dev`, `develop`

Examples:

```text
feature/TM-31-books-api
config/TM-32-api-config
bugfix/TM-20-fix-login
hotfix/TM-99-prod-crash
```

## How it is enforced

| Layer              | What             | When         |
| ------------------ | ---------------- | ------------ |
| Husky `commit-msg` | commitlint       | local commit |
| Husky `pre-push`   | branch name      | local push   |
| GitHub Action      | branch + commits | every PR     |

Setup (once per clone):

```bash
npm install
```

## Note (Epitech org repo)

We usually cannot enable GitHub branch protection on the school organization repo.
Local hooks + CI checks are the enforceable layers available to the team.
Do not push directly to `main` / `develop`; always open a PR.
