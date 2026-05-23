import type { IncomingMessage, ServerResponse } from "http";
import { getDbHealth } from "../server/db";
import { storageConfigured } from "../server/storage";

export default async function healthHandler(
  _req: IncomingMessage,
  res: ServerResponse
) {
  const db = await getDbHealth();
  const body = {
    ok: db.ok,
    db,
    storage: { configured: storageConfigured() },
  };
  res.statusCode = db.ok ? 200 : 503;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
