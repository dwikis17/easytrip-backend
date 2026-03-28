import { z } from "zod";

const currencyCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "preferred_currency must be a 3-letter ISO currency code")
  .transform((value) => value.toUpperCase());

export const updateCurrentUserSchema = z
  .object({
    display_name: z.string().trim().min(1, "display_name cannot be empty").max(80).optional(),
    preferred_currency: currencyCodeSchema.optional(),
  })
  .refine(
    (value) =>
      value.display_name !== undefined || value.preferred_currency !== undefined,
    {
      message: "At least one field must be provided",
      path: ["body"],
    },
  );
