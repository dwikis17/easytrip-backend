import cors from "cors";
import express from "express";
import helmet from "helmet";
import { AppError } from "./lib/errors";
import { errorHandler } from "./middleware/errorHandler";
import { authLimiter, globalLimiter, webhookLimiter } from "./middleware/rateLimit";
import authRouter from "./modules/auth/router";
import usersRouter from "./modules/users/router";
import webhooksRouter from "./modules/webhooks/router";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

app.get("/health", (_req, res) => {
  res.json({ data: { ok: true }, error: null, meta: null });
});

app.get("/api/health", (_req, res) => {
  res.json({
    data: { status: "ok", timestamp: new Date().toISOString() },
    error: null,
    meta: null,
  });
});

app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/webhooks", webhookLimiter, webhooksRouter);

app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404, "not_found"));
});

app.use(errorHandler);

export { app };
export default app;
