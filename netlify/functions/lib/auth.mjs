import crypto from "crypto";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret() {
  return process.env.ADMIN_PASSWORD || "";
}

export function createToken() {
  const payload = {
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !getSecret()) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [data, sig] = parts;
  const expected = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function getBearerToken(event) {
  const header = event.headers.authorization || event.headers.Authorization || "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice(7).trim();
}

export function requireAuth(event) {
  const token = getBearerToken(event);
  if (!verifyToken(token)) {
    const error = new Error("Non autorisé.");
    error.statusCode = 401;
    throw error;
  }
}

export function verifyPassword(password) {
  const secret = getSecret();
  if (!secret || typeof password !== "string") return false;
  if (password.length !== secret.length) return false;
  return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(secret));
}
