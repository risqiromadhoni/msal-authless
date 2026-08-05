import { credentialSchema, type CredentialType } from "#/schema";
import { Store } from "@tanstack/store";
import { get, set } from "idb-keyval";
import { STORE_KEYS } from "./constant";

export const EMPTY_CREDENTIAL: CredentialType = {
  clientId: "",
  tenantId: "",
  clientSecret: "",
};

export const credentialStore = new Store<CredentialType>(EMPTY_CREDENTIAL);

// idb-keyval needs a browser, and this module is imported during SSR too.
if (!import.meta.env.SSR) {
  // Subscribe only once hydration has settled, so the empty initial state can
  // never be written back over saved credentials.
  void get(STORE_KEYS.CREDENTIAL)
    .then((saved) => {
      const parsed = credentialSchema.safeParse(saved);
      if (parsed.success) {
        credentialStore.setState(() => parsed.data);
      }
    })
    .finally(() => {
      credentialStore.subscribe((value) => {
        void set(STORE_KEYS.CREDENTIAL, value);
      });
    });
}
