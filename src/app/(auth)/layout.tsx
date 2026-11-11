import { Logo } from "@/components/shared/logo";

/** Minimal centered layout for the login and registration pages. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-linear-to-b from-primary/10 to-background px-4 py-12">
      <Logo className="mb-8" />
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
