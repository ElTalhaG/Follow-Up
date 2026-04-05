import cors from "cors";
import express from "express";
import { buildRouter, getErrorStatusCode } from "./api/router.js";
import {
  buildCorsOptions,
  getPort,
  getRuntimeSummary,
  isProduction,
  validateRuntimeEnv,
} from "./config/env.js";
import { logError, logInfo, requestLogger } from "./middleware/logging.js";
import { rateLimit } from "./middleware/rate-limit.js";

const app = express();
const port = getPort();
validateRuntimeEnv();

if (isProduction()) {
  app.set("trust proxy", 1);
}

app.use(cors(buildCorsOptions()));
app.use(requestLogger);
app.use(rateLimit);
app.use(express.json());
app.use("/api", buildRouter());

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "followup-backend",
    ...getRuntimeSummary(),
  });
});

app.use(
  (
    error: unknown,
    request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    logError("request_failed", {
      method: request.method,
      path: request.originalUrl,
      statusCode: getErrorStatusCode(error),
      ip: request.ip,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    response.status(getErrorStatusCode(error)).json({
      ok: false,
      error:
        error instanceof Error && getErrorStatusCode(error) !== 500
          ? error.message
          : "Internal server error",
    });
  },
);

app.listen(port, () => {
  logInfo("backend_started", {
    port,
    ...getRuntimeSummary(),
  });
});
