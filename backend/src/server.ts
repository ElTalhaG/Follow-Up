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

const app = express();
const port = getPort();
validateRuntimeEnv();

if (isProduction()) {
  app.set("trust proxy", 1);
}

app.use(cors(buildCorsOptions()));
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
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);
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
  console.log(`Followup backend listening on port ${port}`);
  console.log(getRuntimeSummary());
});
