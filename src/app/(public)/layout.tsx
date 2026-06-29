import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HandmadeRibbon } from "@/components/handmade-ribbon";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { BackToTop } from "@/components/motion/back-to-top";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollProgress />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <HandmadeRibbon />
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
