// config/github.js — commits a file straight to the live repo via the GitHub
// Contents API, so an admin-panel upload can update a file Vercel serves
// statically (the Node backend has no writable/persistent disk of its own on
// Vercel, and the static frontend is a separate deployment it can't touch).
// Pushing to `main` re-triggers Vercel's connected auto-deploy.
const OWNER = 'bastelpvtltd-png';
const REPO = 'bastel-web-new';
const BRANCH = 'main';

async function githubRequest(path, options = {}) {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `GitHub API ${res.status}`);
  return body;
}

// Creates or updates a single file in the repo with the given buffer's contents.
async function commitFile(repoPath, buffer, message) {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured.');

  let sha;
  try {
    const existing = await githubRequest(`/contents/${repoPath}?ref=${BRANCH}`);
    sha = existing.sha;
  } catch {
    // file doesn't exist yet — fine, this is a create rather than an update
  }

  return githubRequest(`/contents/${repoPath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: buffer.toString('base64'),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
}

module.exports = { commitFile };
