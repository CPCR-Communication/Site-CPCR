export function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(payload),
  };
}

export function handleError(error) {
  const statusCode = error.statusCode || 500;
  return jsonResponse(statusCode, {
    ok: false,
    error: error.message || "Erreur serveur",
  });
}
