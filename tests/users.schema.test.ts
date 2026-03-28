import { describe, expect, it } from "vitest";
import { updateCurrentUserSchema } from "../src/modules/users/schema";

describe("updateCurrentUserSchema", () => {
  it("rejects blank display names", async () => {
    await expect(
      updateCurrentUserSchema.parseAsync({
        display_name: "   ",
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid preferred_currency values", async () => {
    await expect(
      updateCurrentUserSchema.parseAsync({
        preferred_currency: "USDT",
      }),
    ).rejects.toThrow();
  });
});
