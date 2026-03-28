import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeHandlers } from "./helpers/runHandlers";
import { createTestToken } from "./helpers/token";

type StoredUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  subscriptionTier: "FREE" | "PRO";
  preferredCurrency: string;
  createdAt: Date;
  updatedAt: Date;
};

function selectRecord(record: StoredUser | null, select?: Record<string, boolean>) {
  if (!record) {
    return null;
  }

  if (!select) {
    return record;
  }

  return Object.fromEntries(
    Object.keys(select)
      .filter((key) => select[key])
      .map((key) => [key, (record as Record<string, unknown>)[key]]),
  );
}

function createMockPrisma() {
  const users = new Map<string, StoredUser>();

  return {
    users,
    client: {
      user: {
        findUnique: vi.fn(async ({ where, select }: any) => {
          const record = users.get(where.id) ?? null;
          return selectRecord(record, select);
        }),
        upsert: vi.fn(async ({ where, update, create }: any) => {
          const existing = users.get(where.id);

          if (existing) {
            const updated: StoredUser = {
              ...existing,
              ...update,
              updatedAt: new Date(),
            };
            users.set(where.id, updated);
            return updated;
          }

          const created: StoredUser = {
            id: create.id,
            email: create.email,
            displayName: create.displayName,
            avatarUrl: null,
            subscriptionTier: create.subscriptionTier,
            preferredCurrency: create.preferredCurrency,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          users.set(where.id, created);
          return created;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const existing = users.get(where.id);
          if (!existing) {
            return null;
          }

          const updated: StoredUser = {
            ...existing,
            ...data,
            updatedAt: new Date(),
          };
          users.set(where.id, updated);
          return updated;
        }),
      },
    },
  };
}

describe("phase 1 auth and user APIs", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates a user on auth sync and stays idempotent on repeated syncs", async () => {
    const mockPrisma = createMockPrisma();

    vi.doMock("../src/config/prisma", () => ({
      prisma: mockPrisma.client,
      default: mockPrisma.client,
    }));

    const { verifyJWT } = await import("../src/middleware/verifyJWT");
    const { syncCurrentUser } = await import("../src/modules/auth/handlers");
    const token = await createTestToken(
      { user_metadata: { name: "Dwiki" } },
      "00000000-0000-0000-0000-000000000001",
    );

    const firstResponse = await executeHandlers({
      method: "POST",
      url: "/api/v1/auth/sync",
      headers: {
        authorization: `Bearer ${token}`,
      },
      handlers: [verifyJWT, syncCurrentUser],
    });

    const secondResponse = await executeHandlers({
      method: "POST",
      url: "/api/v1/auth/sync",
      headers: {
        authorization: `Bearer ${token}`,
      },
      handlers: [verifyJWT, syncCurrentUser],
    });

    expect(firstResponse.status).toBe(200);
    expect((firstResponse.body as { data: { display_name: string } }).data.display_name).toBe(
      "Dwiki",
    );
    expect(secondResponse.status).toBe(200);
    expect(mockPrisma.users.size).toBe(1);
  });

  it("returns the current user after auth sync", async () => {
    const mockPrisma = createMockPrisma();

    vi.doMock("../src/config/prisma", () => ({
      prisma: mockPrisma.client,
      default: mockPrisma.client,
    }));

    const { verifyJWT } = await import("../src/middleware/verifyJWT");
    const { syncCurrentUser } = await import("../src/modules/auth/handlers");
    const { getCurrentUser } = await import("../src/modules/users/handlers");
    const token = await createTestToken();

    await executeHandlers({
      method: "POST",
      url: "/api/v1/auth/sync",
      headers: {
        authorization: `Bearer ${token}`,
      },
      handlers: [verifyJWT, syncCurrentUser],
    });

    const response = await executeHandlers({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${token}`,
      },
      handlers: [verifyJWT, getCurrentUser],
    });

    expect(response.status).toBe(200);
    expect((response.body as { data: { email: string } }).data.email).toBe(
      "traveler@example.com",
    );
  });

  it("persists PATCH /users/me updates", async () => {
    const mockPrisma = createMockPrisma();

    vi.doMock("../src/config/prisma", () => ({
      prisma: mockPrisma.client,
      default: mockPrisma.client,
    }));

    const { verifyJWT } = await import("../src/middleware/verifyJWT");
    const { syncCurrentUser } = await import("../src/modules/auth/handlers");
    const { updateCurrentUser } = await import("../src/modules/users/handlers");
    const { validateBody } = await import("../src/middleware/validateBody");
    const { updateCurrentUserSchema } = await import("../src/modules/users/schema");
    const token = await createTestToken();

    await executeHandlers({
      method: "POST",
      url: "/api/v1/auth/sync",
      headers: {
        authorization: `Bearer ${token}`,
      },
      handlers: [verifyJWT, syncCurrentUser],
    });

    const response = await executeHandlers({
      method: "PATCH",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        display_name: "Updated Traveler",
        preferred_currency: "idr",
      },
      handlers: [verifyJWT, validateBody(updateCurrentUserSchema), updateCurrentUser],
    });

    expect(response.status).toBe(200);
    expect((response.body as { data: { display_name: string } }).data.display_name).toBe(
      "Updated Traveler",
    );
    expect(
      (response.body as { data: { preferred_currency: string } }).data.preferred_currency,
    ).toBe("IDR");
  });

  it("rejects Supabase webhook calls with a bad secret and accepts a valid one", async () => {
    const mockPrisma = createMockPrisma();

    vi.doMock("../src/config/prisma", () => ({
      prisma: mockPrisma.client,
      default: mockPrisma.client,
    }));

    const { handleSupabaseWebhook } = await import("../src/modules/webhooks/handlers");
    const payload = {
      record: {
        id: "00000000-0000-0000-0000-000000000002",
        email: "webhook@example.com",
        user_metadata: {
          name: "Webhook User",
        },
      },
    };

    await expect(
      executeHandlers({
        method: "POST",
        url: "/api/v1/webhooks/supabase",
        body: payload,
        handlers: [handleSupabaseWebhook],
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "invalid_webhook_secret",
    });

    const goodResponse = await executeHandlers({
      method: "POST",
      url: "/api/v1/webhooks/supabase",
      headers: {
        "x-supabase-webhook-secret": process.env.SUPABASE_WEBHOOK_SECRET!,
      },
      body: payload,
      handlers: [handleSupabaseWebhook],
    });

    expect(goodResponse.status).toBe(200);
    expect((goodResponse.body as { data: { email: string } }).data.email).toBe(
      "webhook@example.com",
    );
  });
});
