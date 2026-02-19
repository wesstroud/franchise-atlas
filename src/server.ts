import express from "express";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { fddRouter } from "./routes/fdd.routes.js";

const app = express();

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start
      },
      "http_request"
    );
  });
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/fdd", fddRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "unhandled error");
  res.status(500).json({ error: "internal_error" });
});

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "server started");
});
