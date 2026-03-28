import { SignJWT } from "jose";

export async function createTestToken(
  payload: Record<string, unknown> = {},
  subject = "00000000-0000-0000-0000-000000000001",
) {
  return new SignJWT({
    email: "traveler@example.com",
    ...payload,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!));
}
