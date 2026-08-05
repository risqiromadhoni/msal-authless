import { isTokenValid } from "#/schema.ts";
import { authStore } from "#/stores/auth.ts";
import { useSelector } from "@tanstack/react-form";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(dashboard)")({
  component: RouteComponent,
});

function RouteComponent() {
  const isAuthenticated = useSelector(authStore, isTokenValid);
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return (
    <main className="mx-auto w-full max-w-container px-4 pt-14 pb-8">
      <Outlet />
    </main>
  );
}
