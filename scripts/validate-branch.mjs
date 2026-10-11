#!/usr/bin/env node
/**
 * Validates the current git branch name against the project Gitflow.
 *
 * Allowed:
 *   main
 *   dev | develop
 *   feature/TM-<num>-<slug>
 *   config/TM-<num>-<slug>
 *   bugfix/TM-<num>-<slug>
 *   hotfix/TM-<num>-<slug>
 */

import { execSync } from 'node:child_process';

const ALLOWED =
  /^(main|dev|develop|(?:feature|config|bugfix|hotfix)\/TM-\d+-[a-z0-9]+(?:-[a-z0-9]+)*)$/;

function currentBranch() {
  if (process.env.GITHUB_HEAD_REF) return process.env.GITHUB_HEAD_REF;
  if (process.env.BRANCH_NAME) return process.env.BRANCH_NAME;
  return execSync('git rev-parse --abbrev-ref HEAD', {
    encoding: 'utf8',
  }).trim();
}

const branch = currentBranch();

if (branch === 'HEAD') {
  console.log('Detached HEAD — skip branch name check.');
  process.exit(0);
}

if (!ALLOWED.test(branch)) {
  console.error(`
❌ Invalid branch name: "${branch}"

Allowed patterns:
  main
  dev | develop
  feature/TM-12-add-login
  config/TM-32-api-config
  bugfix/TM-34-fix-clock-out
  hotfix/TM-56-prod-crash

Rules:
  - TM ticket number is required (except main/dev/develop)
  - slug: lowercase, digits, hyphens only
  - no spaces, no underscores, no accents
`);
  process.exit(1);
}

console.log(`✅ Branch name OK: ${branch}`);
