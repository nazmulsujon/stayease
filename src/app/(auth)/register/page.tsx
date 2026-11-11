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
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth/dal";
import { postLoginRedirect, safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <Suspense fallback={<AuthCardSkeleton fields={5} />}>
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterContent({
  searchParams,
}: {
  searchParams: PageProps<"/register">["searchParams"];
}) {
  const { next } = await searchParams;
  const safeNext = safeRedirectPath(next) ?? undefined;

  const user = await getCurrentUser();
  if (user) redirect(postLoginRedirect(user.role, safeNext));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Register to book rooms and keep track of your reservations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm next={safeNext} />
      </CardContent>
    </Card>
  );
}
