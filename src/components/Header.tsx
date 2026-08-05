import { isTokenValid } from "#/schema";
import { authStore, signOut } from "#/stores/auth";
import { Link } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import { Button } from "./base/buttons/button";
import GitHubIcon from "./foundations/integration-icons/github-icon";
import { LogOut01 } from "@untitledui/icons";
import ThemeToggle from "./ThemeToggle";
import { useMutation } from "@tanstack/react-query";

const NAV_LINKS = [
  { to: "/profile", label: "Tenant Profile" },
  { to: "/users", label: "Tenant Users" },
] as const;

export default function Header() {
  const isAuthenticated = useSelector(authStore, isTokenValid);

  const { mutate: onSignOut, isPending } = useMutation({
    mutationFn: () => signOut(),
  });

  return (
    <header className="sticky top-0 z-50 border-b border-secondary bg-primary/80 px-4 backdrop-blur-lg">
      <nav className="mx-auto flex w-full max-w-container flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-primary ring-1 ring-secondary ring-inset hover:bg-primary_hover sm:px-3 sm:py-2"
          >
            <span className="size-2 rounded-full bg-brand-solid" />
            TanStack Start
          </Link>
        </h2>

        {isAuthenticated && (
          <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-none sm:w-auto sm:flex-nowrap sm:pb-0">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-tertiary transition hover:text-primary"
                activeProps={{ className: "text-brand-secondary" }}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button
            href="https://github.com/TanStack"
            target="_blank"
            rel="noreferrer"
            color="tertiary"
            size="sm"
            aria-label="Go to TanStack GitHub"
            className="hidden sm:flex"
            iconLeading={<GitHubIcon data-icon="leading" grayscale />}
          />
          <ThemeToggle />
          {isAuthenticated ? (
            <Button
              onClick={() => onSignOut()}
              color="primary-destructive"
              size="sm"
              aria-label="Sign out"
              iconLeading={<LogOut01 data-icon />}
              isLoading={isPending}
              isDisabled={isPending}
            >
              Sign out
            </Button>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
