import {
  createToken,
  getBearerToken,
  requireAuth,
  verifyPassword,
  verifyToken,
} from "./lib/auth.mjs";
import {
  saveSiteContent,
  writeBinaryFile,
} from "./lib/github.mjs";
import { handleError, jsonResponse } from "./lib/response.mjs";

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  return JSON.parse(raw);
}

export const handler = async (event) => {
  const action = event.queryStringParameters?.action || "";

  try {
    switch (action) {
      case "check": {
        const token = getBearerToken(event);
        return jsonResponse(200, { ok: true, authenticated: verifyToken(token) });
      }

      case "login": {
        const { password } = parseBody(event);
        if (!verifyPassword(password)) {
          return jsonResponse(401, { ok: false, error: "Mot de passe incorrect." });
        }
        return jsonResponse(200, { ok: true, token: createToken() });
      }

      case "logout":
        return jsonResponse(200, { ok: true });

      case "get": {
        requireAuth(event);
        const { getSiteContent } = await import("./lib/github.mjs");
        const data = await getSiteContent();
        return jsonResponse(200, { ok: true, data });
      }

      case "save": {
        requireAuth(event);
        const { data } = parseBody(event);
        if (!data) {
          return jsonResponse(400, { ok: false, error: "Données manquantes." });
        }
        await saveSiteContent(data);
        return jsonResponse(200, {
          ok: true,
          message:
            "Modifications enregistrées. Les textes sont mis à jour tout de suite ; les nouvelles images peuvent prendre 1 à 2 minutes.",
        });
      }

      case "upload": {
        requireAuth(event);
        const { filename, mime, data: base64Data } = parseBody(event);
        if (!base64Data || !mime) {
          return jsonResponse(400, { ok: false, error: "Aucune image reçue." });
        }
        const ext = MIME_TO_EXT[mime];
        if (!ext) {
          return jsonResponse(400, {
            ok: false,
            error: "Format non autorisé. Utilisez JPG, PNG, WebP ou GIF.",
          });
        }

        const buffer = Buffer.from(base64Data, "base64");
        if (buffer.length > 5 * 1024 * 1024) {
          return jsonResponse(400, {
            ok: false,
            error: "Image trop volumineuse (max 5 Mo).",
          });
        }

        const basename = String(filename || "image")
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]+/g, "-")
          .replace(/^-+|-+$/g, "") || "image";
        const path = `images/uploads/${basename}-${Date.now()}.${ext}`;

        await writeBinaryFile(
          path,
          buffer,
          null,
          `Ajout image admin CPCR : ${basename}`
        );

        return jsonResponse(200, { ok: true, path });
      }

      case "change-password":
        return jsonResponse(400, {
          ok: false,
          error:
            "Sur Netlify, le mot de passe se modifie dans le tableau de bord Netlify : Site configuration → Environment variables → ADMIN_PASSWORD.",
        });

      default:
        return jsonResponse(400, { ok: false, error: "Action inconnue." });
    }
  } catch (error) {
    return handleError(error);
  }
};
