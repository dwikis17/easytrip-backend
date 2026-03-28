import rateLimit from "express-rate-limit";
import { sendError } from "../lib/response";

function createLimiter(max: number) {
  return rateLimit({
    windowMs: 60_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      sendError(res, 429, {
        code: "rate_limit",
        message: "Too many requests",
      });
    },
  });
}

export const globalLimiter = createLimiter(100);
export const authLimiter = createLimiter(20);
export const webhookLimiter = createLimiter(20);
