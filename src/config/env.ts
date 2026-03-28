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
  return envSchema.parse(source);
}

export const env = getEnv();
