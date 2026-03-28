import type { RequestHandler } from "express";
import { sendSuccess } from "../../lib/response";
import { upsertUserFromIdentity } from "../users/service";

export const syncCurrentUser: RequestHandler = async (req, res) => {
  const user = await upsertUserFromIdentity({
    id: req.user!.id,
    email: req.user!.email,
    userMetadata: req.authPayload?.user_metadata ?? null,
  });

  return sendSuccess(res, user);
};
