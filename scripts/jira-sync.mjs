#!/usr/bin/env node
/**
 * Moves the Jira ticket named in the branch (TM-<num>) along the board:
 *   branch created  -> En cours
 *   PR opened       -> En cours de revue
 *   PR merged       -> Terminé
 *
 * Tickets only move forward: a ticket already further along is left alone.
 * Jira errors are reported as warnings and never fail the run, so a Jira
 * outage cannot block a pull request.
 *
 * Env: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, BRANCH, TARGET_STATUS,
 *      PR_URL (optional, added as a comment on the ticket).
 */

import { pathToFileURL } from 'node:url';

const KEY_RE = /\bTM-\d+\b/;

// Board order; "En Attente" sits with "En cours".
const RANK = {
  'À faire': 0,
  'En cours': 1,
  'En Attente': 1,
  'En cours de revue': 2,
  Terminé: 3,
};

export async function sync(env, fetchImpl = fetch, log = console) {
  const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, BRANCH, TARGET_STATUS, PR_URL } = env;

  if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
    log.log('::notice::Jira secrets not available (fork or Dependabot PR) — skip.');
    return 'skipped';
  }

  const key = (BRANCH ?? '').match(KEY_RE)?.[0];
  if (!key) {
    log.log(`No TM ticket in branch "${BRANCH}" — skip.`);
    return 'skipped';
  }

  if (!(TARGET_STATUS in RANK)) {
    log.log(`::warning::Unknown target status "${TARGET_STATUS}".`);
    return 'error';
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const api = async (path, init = {}) => {
    const res = await fetchImpl(`${JIRA_BASE_URL}/rest/api/3/issue/${key}${path}`, {
      ...init,
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path || '/'} -> HTTP ${res.status}`);
    return res.status === 204 ? null : res.json();
  };

  try {
    const issue = await api('?fields=status');
    const current = issue.fields.status.name;

    if ((RANK[current] ?? 0) >= RANK[TARGET_STATUS]) {
      log.log(`${key} is already "${current}" — nothing to do.`);
      return 'unchanged';
    }

    const { transitions } = await api('/transitions');
    const transition = transitions.find((t) => t.to.name === TARGET_STATUS);
    if (!transition) {
      log.log(`::warning::${key}: no transition from "${current}" to "${TARGET_STATUS}".`);
      return 'error';
    }

    await api('/transitions', {
      method: 'POST',
      body: JSON.stringify({ transition: { id: transition.id } }),
    });

    if (PR_URL) {
      const text = `${TARGET_STATUS === 'Terminé' ? 'PR mergée' : 'PR ouverte'} : ${PR_URL}`;
      await api('/comment', {
        method: 'POST',
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
          },
        }),
      });
    }

    log.log(`✅ ${key}: "${current}" -> "${TARGET_STATUS}"`);
    return 'moved';
  } catch (err) {
    log.log(`::warning::${key}: Jira sync failed (${err.message}).`);
    return 'error';
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await sync(process.env);
}
