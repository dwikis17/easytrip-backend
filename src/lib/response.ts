import type { Response } from "express";

type ErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta: Record<string, unknown> | null = null,
) {
  return res.status(statusCode).json({
    data,
    error: null,
    meta,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  error: ErrorBody,
  meta: Record<string, unknown> | null = null,
) {
  return res.status(statusCode).json({
    data: null,
    error,
    meta,
  });
}
