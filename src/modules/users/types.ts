export type UserIdentityInput = {
  id: string;
  email: string;
  userMetadata?: Record<string, unknown> | null;
};

export type PublicUser = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  subscription_tier: "FREE" | "PRO";
  preferred_currency: string;
  created_at: string;
  updated_at: string;
};

export type UpdateUserInput = {
  display_name?: string;
  preferred_currency?: string;
};
