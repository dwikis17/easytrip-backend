import type { RequestHandler } from "express";
import { sendSuccess } from "../../lib/response";
import { getUserById, updateUserById } from "./service";

export const getCurrentUser: RequestHandler = async (req, res) => {
  const user = await getUserById(req.user!.id);
  return sendSuccess(res, user);
};

export const updateCurrentUser: RequestHandler = async (req, res) => {
  const user = await updateUserById(req.user!.id, req.body);
  return sendSuccess(res, user);
};
