import type { IncomingMessage, ServerResponse } from "http";
import { runDecay } from "../../server/db";

function getAuthHeader(req: IncomingMessage) {
  const raw = req.headers.authorization;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function decayHandler(
  req: IncomingMessage,
  res: ServerResponse
) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = getAuthHeader(req);

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Unauthorized" }));
    return;
  }

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }

  const result = await runDecay();
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, ...result }));
}
