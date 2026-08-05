import { Store } from "@tanstack/store";
import { del, get, set } from "idb-keyval";
import { STORE_KEYS } from "./constant";
import { credentialStore, EMPTY_CREDENTIAL } from "./credential";
import type { AuthenticationResult } from "@azure/msal-node";

export const authStore = new Store<AuthenticationResult | null>(null);

// idb-keyval needs a browser, and this module is imported during SSR too.
if (!import.meta.env.SSR) {
  // Subscribe only once hydration has settled, so the empty initial state can
  // never be written back over a saved token.
  void get(STORE_KEYS.AUTH)
    .then((saved) => {
      if (saved) {
        authStore.setState(() => saved);
      }
    })
    .finally(() => {
      authStore.subscribe((value) => {
        void set(STORE_KEYS.AUTH, value);
      });
    });
}

/**
 * There is no server session to end, so signing out means dropping the local
 * token and credentials. The store subscriptions persist the cleared state; the
 * deletes remove the keys outright.
 */
export async function signOut(): Promise<void> {
  authStore.setState(() => null);
  credentialStore.setState(() => EMPTY_CREDENTIAL);

  if (!import.meta.env.SSR) {
    await Promise.all([del(STORE_KEYS.AUTH), del(STORE_KEYS.CREDENTIAL)]);
  }
}
