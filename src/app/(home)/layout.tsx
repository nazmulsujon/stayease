import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/** Home page layout: the header floats over the full-bleed hero. */
export default function HomeLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader overlay />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
