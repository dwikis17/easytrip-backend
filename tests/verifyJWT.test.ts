import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeHandlers } from "./helpers/runHandlers";
import { createTestToken } from "./helpers/token";

describe("verifyJWT middleware", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("accepts a valid Supabase bearer token", async () => {
    const { verifyJWT } = await import("../src/middleware/verifyJWT");
    const token = await createTestToken();
    const response = await executeHandlers({
      method: "GET",
      url: "/protected",
      headers: {
        authorization: `Bearer ${token}`,
      },
      handlers: [
        verifyJWT,
        (req, res) => {
          res.status(200).json({ user: req.user });
        },
      ],
    });

    expect(response.status).toBe(200);
    expect((response.body as { user: unknown }).user).toEqual({
      id: "00000000-0000-0000-0000-000000000001",
      email: "traveler@example.com",
    });
  });

  it("rejects a request with no bearer token", async () => {
    const { verifyJWT } = await import("../src/middleware/verifyJWT");
    await expect(
      executeHandlers({
        method: "GET",
        url: "/protected",
        handlers: [verifyJWT],
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "unauthenticated",
    });
  });

  it("rejects a request with an invalid bearer token", async () => {
    const { verifyJWT } = await import("../src/middleware/verifyJWT");
    await expect(
      executeHandlers({
        method: "GET",
        url: "/protected",
        headers: {
          authorization: "Bearer not-a-real-jwt",
        },
        handlers: [verifyJWT],
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "invalid_token",
    });
  });
});
