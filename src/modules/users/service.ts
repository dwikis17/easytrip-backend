import { SubscriptionTier, type PrismaClient, type User } from "@prisma/client";
import prisma from "../../config/prisma";
import { AppError } from "../../lib/errors";
import type { PublicUser, UpdateUserInput, UserIdentityInput } from "./types";

type UserStore = Pick<PrismaClient, "user">;

function getMetadataDisplayName(userMetadata?: Record<string, unknown> | null) {
  const candidateKeys = ["display_name", "full_name", "name", "user_name"];

  for (const key of candidateKeys) {
    const value = userMetadata?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function getEmailDisplayName(email: string) {
  const [localPart] = email.split("@");
  return localPart || email;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    avatar_url: user.avatarUrl,
    subscription_tier: user.subscriptionTier,
    preferred_currency: user.preferredCurrency,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function upsertUserFromIdentity(
  identity: UserIdentityInput,
  db: UserStore = prisma,
) {
  const existingUser = await db.user.findUnique({
    where: { id: identity.id },
    select: { displayName: true },
  });

  const displayName =
    existingUser?.displayName ??
    getMetadataDisplayName(identity.userMetadata) ??
    getEmailDisplayName(identity.email);

  const user = await db.user.upsert({
    where: { id: identity.id },
    update: {
      email: identity.email,
      displayName,
    },
    create: {
      id: identity.id,
      email: identity.email,
      displayName,
      subscriptionTier: SubscriptionTier.FREE,
      preferredCurrency: "USD",
    },
  });

  return toPublicUser(user);
}

export async function getUserById(userId: string, db: UserStore = prisma) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404, "user_not_found");
  }

  return toPublicUser(user);
}

export async function updateUserById(
  userId: string,
  input: UpdateUserInput,
  db: UserStore = prisma,
) {
  const existingUser = await db.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new AppError("User not found", 404, "user_not_found");
  }

  const user = await db.user.update({
    where: { id: userId },
    data: {
      ...(input.display_name !== undefined ? { displayName: input.display_name } : {}),
      ...(input.preferred_currency !== undefined
        ? { preferredCurrency: input.preferred_currency }
        : {}),
    },
  });

  return toPublicUser(user);
}
