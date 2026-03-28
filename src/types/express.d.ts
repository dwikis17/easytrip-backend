import type { SupabaseJwtPayload } from "../middleware/verifyJWT";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      authPayload?: SupabaseJwtPayload;
    }
  }
}

export {};
