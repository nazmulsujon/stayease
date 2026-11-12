import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthCardSkeleton } from "@/components/auth/auth-card-skeleton";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/dal";
import { postLoginRedirect, safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { next } = await searchParams;
  const safeNext = safeRedirectPath(next) ?? undefined;

  // Already logged in (verified against the database) → skip the form.
  const user = await getCurrentUser();
  if (user) redirect(postLoginRedirect(user.role, safeNext));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          {safeNext
            ? "Please log in to continue."
            : "Log in to manage your bookings."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm next={safeNext} />
      </CardContent>
    </Card>
  );
}
