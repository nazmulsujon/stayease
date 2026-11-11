import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/dal";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

/**
 * Account area of the header. Reads the session, so it must be rendered
 * inside <Suspense> (the rest of the header stays in the static shell).
 */
export async function HeaderAccount() {
  const user = await getCurrentUser();

  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        {user ? (
          <UserMenu user={user} />
        ) : (
          <>
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Create account</Link>
            </Button>
          </>
        )}
      </div>
      <div className="md:hidden">
        <MobileNav user={user} />
      </div>
    </>
  );
}

export function HeaderAccountSkeleton() {
  return (
    <>
      <Skeleton className="hidden h-8 w-44 md:block" />
      <Skeleton className="size-8 md:hidden" />
    </>
  );
}
