export const STORE_KEYS = {
  CREDENTIAL: "credential",
  AUTH: "auth",
} as const;

export type StoreKeys = (typeof STORE_KEYS)[keyof typeof STORE_KEYS];
