import { useRouter } from "@tanstack/react-router";
import { RouterProvider as ReactAriaRouterProvider } from "react-aria-components";

import type { NavigateOptions } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: Omit<NavigateOptions, "to">;
  }
}

/**
 * React Aria hands `navigate`/`useHref` a plain string path, while TanStack's
 * route-tree generics narrow `to` to the union of known routes.
 */
type To = NavigateOptions["to"];

/**
 * Untitled UI has no `Link` component — its `Button` renders React Aria's `Link`
 * whenever `href` is present. React Aria only performs client-side navigation
 * through a `RouterProvider`, so without this every `<Button href>` would trigger
 * a full page reload.
 */
export function AriaRouterProvider({ children }: PropsWithChildren) {
  const router = useRouter();

  return (
    <ReactAriaRouterProvider
      navigate={(to, options) => {
        void router.navigate({ to: to as To, ...options });
      }}
      useHref={(to) => router.buildLocation({ to: to as To }).href}
    >
      {children}
    </ReactAriaRouterProvider>
  );
}
