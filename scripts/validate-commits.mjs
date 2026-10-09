#!/usr/bin/env node
/**
 * Validates commit subjects in a PR range (used by CI).
 * Format: <type>: <description>
 */

import { execSync } from 'node:child_process';

const COMMIT_RE =
  /^(feat|fix|chore|docs|style|refactor|test|ci|build|perf)(\([a-z0-9._-]+\))?: .+/;

const base = process.env.BASE_SHA;
const head = process.env.HEAD_SHA || 'HEAD';

if (!base) {
  console.error('BASE_SHA is required');
  process.exit(1);
}

const log = execSync(`git log --format=%s ${base}..${head}`, {
  encoding: 'utf8',
}).trim();

if (!log) {
  console.log('No commits to validate.');
  process.exit(0);
}

const subjects = log.split('\n').filter(Boolean);
const invalid = subjects.filter((s) => !COMMIT_RE.test(s));

if (invalid.length) {
  console.error('❌ Invalid commit message(s):');
  for (const s of invalid) console.error(`  - ${s}`);
  console.error(`
Expected format:
  <type>: <description>

Types: feat, fix, chore, docs, style, refactor, test, ci, build, perf

Examples:
  feat: add employee clock-in endpoint
  fix: prevent double clock-out
  docs: update gitflow conventions
`);
  process.exit(1);
}

console.log(`✅ ${subjects.length} commit message(s) OK`);
