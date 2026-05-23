import type { IncomingMessage, ServerResponse } from "http";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { appRouter } from "../../server/routers.js";

const handler = createHTTPHandler({
  router: appRouter,
  createContext: () => ({}),
  basePath: "/api/trpc/",
});

export default function trpcHandler(req: IncomingMessage, res: ServerResponse) {
  return handler(req, res);
}
