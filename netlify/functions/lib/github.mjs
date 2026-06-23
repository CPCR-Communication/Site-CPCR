const CONTENT_PATH = "data/site-content.json";

function getRepo() {
  return process.env.GITHUB_REPO || "CPCR-Communication/Site-CPCR";
}

function getToken() {
  return process.env.GITHUB_TOKEN || "";
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "CPCR-Site-Admin",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function assertGitHubConfigured() {
  if (!getToken()) {
    const error = new Error(
      "GitHub non configuré. Ajoutez GITHUB_TOKEN dans les variables Netlify."
    );
    error.statusCode = 500;
    throw error;
  }
}

export async function readJsonFile(path) {
  if (!getToken()) return null;

  const repo = getRepo();
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    { headers: githubHeaders() }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = new Error("Impossible de lire le contenu sur GitHub.");
    error.statusCode = response.status;
    throw error;
  }

  const file = await response.json();
  const text = Buffer.from(file.content, "base64").toString("utf8");
  return {
    data: JSON.parse(text),
    sha: file.sha,
  };
}

export async function writeJsonFile(path, data, sha, message) {
  assertGitHubConfigured();
  const repo = getRepo();
  const content = Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64");
  const body = {
    message,
    content,
  };
  if (sha) body.sha = sha;

  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        ...githubHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    const error = new Error("Impossible d'enregistrer sur GitHub.");
    error.statusCode = response.status;
    error.details = details;
    throw error;
  }

  return response.json();
}

export async function writeBinaryFile(path, buffer, sha, message) {
  assertGitHubConfigured();
  const repo = getRepo();
  const body = {
    message,
    content: buffer.toString("base64"),
  };
  if (sha) body.sha = sha;

  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        ...githubHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = new Error("Impossible d'envoyer l'image sur GitHub.");
    error.statusCode = response.status;
    throw error;
  }

  return response.json();
}

export async function getSiteContent() {
  const fromGitHub = await readJsonFile(CONTENT_PATH);
  if (fromGitHub) return fromGitHub.data;

  const siteUrl =
    process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";
  const response = await fetch(`${siteUrl}/${CONTENT_PATH}`);
  if (!response.ok) {
    const error = new Error("Contenu introuvable.");
    error.statusCode = 404;
    throw error;
  }
  return response.json();
}

export async function saveSiteContent(data) {
  const existing = await readJsonFile(CONTENT_PATH);
  await writeJsonFile(
    CONTENT_PATH,
    data,
    existing?.sha,
    "Mise à jour du contenu du site (admin CPCR)"
  );
}

export { CONTENT_PATH };
