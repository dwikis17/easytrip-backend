import { Router } from "express";
import { verifyJWT } from "../../middleware/verifyJWT";
import { syncCurrentUser } from "./handlers";

const router = Router();

router.post("/sync", verifyJWT, syncCurrentUser);

export default router;
