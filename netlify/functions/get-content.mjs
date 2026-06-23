import { getSiteContent } from "./lib/github.mjs";
import { handleError, jsonResponse } from "./lib/response.mjs";

export const handler = async () => {
  try {
    const data = await getSiteContent();
    return jsonResponse(200, data);
  } catch (error) {
    return handleError(error);
  }
};
