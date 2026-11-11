import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <Logo />
      <EmptyState
        icon={MapPinOff}
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
        action={
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        }
        className="w-full max-w-md"
      />
    </main>
  );
}
