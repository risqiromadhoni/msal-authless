import { Button } from "./base/buttons/button";
import { TwitterLogo } from "./base/buttons/social-logos";
import GitHubIcon from "./foundations/integration-icons/github-icon";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-secondary px-4 pt-10 pb-14 text-tertiary">
      <div className="mx-auto flex w-full max-w-container flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">&copy; {year} Your name here. All rights reserved.</p>
        <p className="m-0 text-xs font-semibold tracking-wider text-brand-secondary uppercase">
          Built with TanStack Start
        </p>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <Button
          href="https://x.com/tan_stack"
          target="_blank"
          rel="noreferrer"
          color="tertiary"
          size="md"
          aria-label="Follow TanStack on X"
          iconLeading={TwitterLogo}
        />
        <Button
          href="https://github.com/TanStack"
          target="_blank"
          rel="noreferrer"
          color="tertiary"
          size="md"
          aria-label="Go to TanStack GitHub"
          iconLeading={<GitHubIcon data-icon="leading" grayscale />}
        />
      </div>
    </footer>
  );
}
