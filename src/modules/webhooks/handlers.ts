import type { RequestHandler } from "express";
import { env } from "../../config/env";
import { AppError } from "../../lib/errors";
import { sendSuccess } from "../../lib/response";
import type { UserIdentityInput } from "../users/types";
import { upsertUserFromIdentity } from "../users/service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWebhookUser(input: unknown): UserIdentityInput {
  const candidate = isRecord(input)
    ? isRecord(input.record)
      ? input.record
      : isRecord(input.user)
        ? input.user
        : input
    : null;

  if (!candidate || typeof candidate.id !== "string" || candidate.id.length === 0) {
    throw new AppError("Invalid Supabase webhook payload", 400, "invalid_webhook_payload");
  }

  if (typeof candidate.email !== "string" || candidate.email.length === 0) {
    throw new AppError("Invalid Supabase webhook payload", 400, "invalid_webhook_payload");
  }

  return {
    id: candidate.id,
    email: candidate.email,
    userMetadata: isRecord(candidate.user_metadata) ? candidate.user_metadata : null,
  };
}

export const handleSupabaseWebhook: RequestHandler = async (req, res) => {
  const webhookSecret = req.header("x-supabase-webhook-secret");

  if (webhookSecret !== env.SUPABASE_WEBHOOK_SECRET) {
    throw new AppError("Invalid webhook secret", 401, "invalid_webhook_secret");
  }

  const userIdentity = normalizeWebhookUser(req.body);
  const user = await upsertUserFromIdentity(userIdentity);

  return sendSuccess(res, user);
};
