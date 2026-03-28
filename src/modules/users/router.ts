import { Router } from "express";
import { validateBody } from "../../middleware/validateBody";
import { verifyJWT } from "../../middleware/verifyJWT";
import { getCurrentUser, updateCurrentUser } from "./handlers";
import { updateCurrentUserSchema } from "./schema";

const router = Router();

router.get("/me", verifyJWT, getCurrentUser);

router.patch("/me", verifyJWT, validateBody(updateCurrentUserSchema), updateCurrentUser);

export default router;
