process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/splittrip?schema=public";
process.env.SUPABASE_JWT_SECRET = "test-supabase-secret";
process.env.SUPABASE_WEBHOOK_SECRET = "test-webhook-secret";
process.env.PORT = "3000";
