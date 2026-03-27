import cors from "cors";
import express from "express";
import { buildRouter } from "./api/router.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());
app.use("/api", buildRouter());

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "followup-backend",
  });
});

app.listen(port, () => {
  console.log(`Followup backend listening on port ${port}`);
});
