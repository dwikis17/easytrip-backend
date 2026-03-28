import type { RequestHandler } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { AppError } from "../lib/errors";

export function validateBody(schema: ZodTypeAny): RequestHandler {
  return async (req, _res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(
            "Request body validation failed",
            400,
            "validation_error",
            error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          ),
        );
        return;
      }

      next(error);
    }
  };
}
