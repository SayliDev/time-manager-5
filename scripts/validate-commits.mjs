import { execSync } from 'node:child_process';

const TYPES = 'feat|fix|chore|docs|style|refactor|test|ci|build|perf';
const COMMIT_RE = new RegExp(`^(${TYPES}): [a-z0-9].*$`);
const ACCENT_RE =
  /[àáâãäåāăąæçćčđďèéêëēĕėęěìíîïĩīĭįıłńñňņòóôõöøōŏőœřśšşťțùúûüũūŭůűųýÿžźżÀÁÂÃÄÅĀĂĄÆÇĆČĐĎÈÉÊËĒĔĖĘĚÌÍÎÏĨĪĬĮİŁŃÑŇŅÒÓÔÕÖØŌŎŐŒŘŚŠŞŤȚÙÚÛÜŨŪŬŮŰŲÝŸŽŹŻ]/;
const EMOJI_RE =
  /\p{Extended_Pictographic}|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const MERGE_RE = /^Merge /;
// Commits authored by Dependabot use GitHub's own message format.
const BOT_EMAIL_RE = /^\d+\+dependabot\[bot\]@users\.noreply\.github\.com$/;

const base = process.env.BASE_SHA;
const head = process.env.HEAD_SHA || 'HEAD';

if (!base) {
  console.error('BASE_SHA is required');
  process.exit(1);
}

const log = execSync(`git log --format=%ae%x09%s ${base}..${head}`, {
  encoding: 'utf8',
}).trim();

if (!log) {
  console.log('No commits to validate.');
  process.exit(0);
}

const subjects = log
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const tab = line.indexOf('\t');
    return [line.slice(0, tab), line.slice(tab + 1)];
  })
  .filter(([email]) => !BOT_EMAIL_RE.test(email))
  .map(([, subject]) => subject)
  .filter((s) => !MERGE_RE.test(s));

const invalid = subjects.filter((s) => {
  if (!COMMIT_RE.test(s)) return true;
  if (s.includes('(') && s.indexOf('(') < s.indexOf(':')) return true;
  if (EMOJI_RE.test(s)) return true;
  if (ACCENT_RE.test(s)) return true;
  if (s.length > 122) return true;
  return false;
});

if (invalid.length) {
  console.error('❌ Invalid commit message(s):');
  for (const s of invalid) console.error(`  - ${s}`);
  console.error(`
Expected format:
  <type>: <description>

Rules:
  - types: feat, fix, chore, docs, style, refactor, test, ci, build, perf
  - no scope (feat(api): ... is forbidden)
  - no emoji
  - no accents (é è à ç ...)
  - description in lower-case
  - max 122 characters

Examples:
  feat: add employee clock-in endpoint
  fix: prevent double clock-out
  docs: update gitflow conventions
`);
  process.exit(1);
}

console.log(`✅ ${subjects.length} commit message(s) OK`);
