import { SubscriptionTier } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { upsertUserFromIdentity } from "../src/modules/users/service";

describe("upsertUserFromIdentity", () => {
  it("creates a user with metadata display_name and default tier settings", async () => {
    const mockDb = {
      user: {
        findUnique: async () => null,
        upsert: async ({ create }: any) => ({
          id: create.id,
          email: create.email,
          displayName: create.displayName,
          avatarUrl: null,
          subscriptionTier: create.subscriptionTier,
          preferredCurrency: create.preferredCurrency,
          createdAt: new Date("2026-03-28T12:00:00.000Z"),
          updatedAt: new Date("2026-03-28T12:00:00.000Z"),
        }),
      },
    } as any;

    const user = await upsertUserFromIdentity(
      {
        id: "00000000-0000-0000-0000-000000000001",
        email: "traveler@example.com",
        userMetadata: { name: "Dwiki" },
      },
      mockDb,
    );

    expect(user.display_name).toBe("Dwiki");
    expect(user.subscription_tier).toBe(SubscriptionTier.FREE);
    expect(user.preferred_currency).toBe("USD");
  });

  it("preserves an existing explicit display_name on repeated syncs", async () => {
    const mockDb = {
      user: {
        findUnique: async () => ({ displayName: "Custom Name" }),
        upsert: async ({ update }: any) => ({
          id: "00000000-0000-0000-0000-000000000001",
          email: update.email,
          displayName: update.displayName,
          avatarUrl: null,
          subscriptionTier: SubscriptionTier.FREE,
          preferredCurrency: "USD",
          createdAt: new Date("2026-03-28T12:00:00.000Z"),
          updatedAt: new Date("2026-03-28T12:10:00.000Z"),
        }),
      },
    } as any;

    const user = await upsertUserFromIdentity(
      {
        id: "00000000-0000-0000-0000-000000000001",
        email: "traveler@example.com",
        userMetadata: { name: "Changed Name" },
      },
      mockDb,
    );

    expect(user.display_name).toBe("Custom Name");
  });
});
