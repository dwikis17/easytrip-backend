import type { ErrorRequestHandler } from "express";
import { isAppError } from "../lib/errors";
import logger from "../lib/logger";
import { sendError } from "../lib/response";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (isAppError(error)) {
    if (error.statusCode >= 500) {
      logger.error({
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack,
      });
    }

    return sendError(res, error.statusCode, {
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  logger.error({
    message: error instanceof Error ? error.message : "Unexpected error",
    stack: error instanceof Error ? error.stack : undefined,
  });

  return sendError(res, 500, {
    code: "internal_error",
    message: "Internal server error",
  });
};
