import { Router } from "express";
import { handleSupabaseWebhook } from "./handlers";

const router = Router();

router.post("/supabase", handleSupabaseWebhook);

export default router;
