import { mkdir, writeFile } from "node:fs/promises";
import { renderStats } from "pixel-profile";

const username = "FlorianTseng";
const headers = {
  "Accept": "application/vnd.github+json",
  "User-Agent": "FlorianTseng-profile"
};

async function getJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

async function searchTotal(query) {
  try {
    const data = await getJson(`https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=1`);
    return Number(data.total_count || 0);
  } catch {
    return 0;
  }
}

async function commitTotal() {
  try {
    const data = await getJson(`https://api.github.com/search/commits?q=${encodeURIComponent(`author:${username}`)}&per_page=1`);
    return Number(data.total_count || 0);
  } catch {
    return 0;
  }
}

const [user, repos, totalCommits, totalPRs, totalIssues] = await Promise.all([
  getJson(`https://api.github.com/users/${username}`),
  getJson(`https://api.github.com/users/${username}/repos?type=owner&per_page=100&sort=updated`),
  commitTotal(),
  searchTotal(`author:${username} type:pr`),
  searchTotal(`author:${username} type:issue`)
]);

const totalStars = repos.reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0);

const stats = {
  name: user.name || username,
  username,
  totalStars,
  totalCommits,
  totalIssues,
  totalPRs,
  avatarUrl: user.avatar_url || "",
  contributedTo: repos.length,
  rank: null
};

await mkdir("dist", { recursive: true });

const light = await renderStats(stats, {
  theme: "fuji",
  dithering: true,
  hiddenStatsKeys: ["rank"],
  includeAllCommits: true
});

const dark = await renderStats(stats, {
  theme: "crt",
  hiddenStatsKeys: ["rank"],
  includeAllCommits: true
});

await Promise.all([
  writeFile("dist/github-stats.png", light),
  writeFile("dist/github-stats-crt.png", dark)
]);

console.log({ totalStars, totalCommits, totalPRs, totalIssues, repos: repos.length });
