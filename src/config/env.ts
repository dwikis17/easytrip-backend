import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  SUPABASE_WEBHOOK_SECRET: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return 3000;
      }

      return Number(value);
    })
    .pipe(z.number().int().positive())
    .default(3000),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  try {
    return envSchema.parse(source);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const missingKeys = error.issues.map((issue: z.ZodIssue) => issue.path.join(".")).join(", ");
      throw new Error(`Invalid or missing environment variables: ${missingKeys}`);
    }

    throw error;
  }
}


export const env = getEnv();
