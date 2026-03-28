import type { RequestHandler } from "express";
import { jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env";
import { AppError } from "../lib/errors";

export type SupabaseJwtPayload = JWTPayload & {
  sub: string;
  email: string;
  user_metadata?: Record<string, unknown> | null;
};

function getJwtSecret() {
  return new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
}

function extractBearerToken(header?: string) {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePayload(payload: JWTPayload): SupabaseJwtPayload {
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new AppError("Invalid token payload", 401, "invalid_token");
  }

  if (typeof payload.email !== "string" || payload.email.length === 0) {
    throw new AppError("Invalid token payload", 401, "invalid_token");
  }

  return {
    ...payload,
    sub: payload.sub,
    email: payload.email,
    user_metadata: isRecord(payload.user_metadata) ? payload.user_metadata : null,
  };
}

export async function verifyAccessToken(token: string): Promise<SupabaseJwtPayload> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    return parsePayload(payload);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid or expired token", 401, "invalid_token");
  }
}

export const verifyJWT: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.header("authorization"));

    if (!token) {
      throw new AppError("Missing bearer token", 401, "unauthenticated");
    }

    const payload = await verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    req.authPayload = payload;

    next();
  } catch (error) {
    next(error);
  }
};
