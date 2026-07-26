"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Calculator, FileText, LayoutDashboard, LayoutGrid, LogOut, MoreHorizontal, Package, ShoppingBag, Sparkles, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { clearAccessTokenCache } from "@/lib/session-token";

// `mobile: true` marca os itens do dia a dia que vão para a tab bar inferior;
// o restante fica no sheet "Mais".
const nav = [
  { href: "/admin", label: "Início", icon: LayoutDashboard, exact: true, mobile: true },
  { href: "/admin/produtos", label: "Peças", icon: Package, mobile: true },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, mobile: true },
  { href: "/admin/encomendas", label: "Ateliê", icon: Sparkles, mobile: true },
  { href: "/admin/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/admin/grafico", label: "Gráficos", icon: LayoutGrid },
  { href: "/admin/conteudo", label: "Conteúdo", icon: FileText },
];

const tabNav = nav.filter((item) => item.mobile);
const moreNav = nav.filter((item) => !item.mobile);

const tabClass = (active: boolean) =>
  cn(
    "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium transition-colors",
    active ? "text-primary" : "text-muted-foreground"
  );

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  // O middleware já barra no edge; este guard cobre navegação client-side e expiração.
  const { data: session, status } = useSession();
  const authorized = status === "authenticated" && session.user.role === "Admin";

  useEffect(() => {
    if (!isLogin && status !== "loading" && !authorized) {
      router.replace("/admin/login");
    }
  }, [isLogin, status, authorized, router]);

  if (isLogin) return <>{children}</>;
  if (!authorized) return null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const moreActive = moreNav.some(({ href }) => pathname.startsWith(href));

  const logout = () => {
    clearAccessTokenCache();
    void signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <div className="flex min-h-dvh bg-secondary/20">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="px-6 py-5">
          <p className="font-heading text-lg font-semibold leading-none">Kessler</p>
          <p className="text-xs text-muted-foreground">painel da artista</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 overflow-x-hidden">
        <main>
          <Container className="py-8 pb-28 md:pb-8">{children}</Container>
        </main>
      </div>

      {/* Tab bar mobile: itens do dia a dia na zona do polegar + "Mais" com o resto. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {tabNav.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={tabClass(active)}
              >
                <Icon className="size-5" /> {label}
              </Link>
            );
          })}

          <Sheet>
            <SheetTrigger className={tabClass(moreActive)} aria-label="Mais opções do painel">
              <MoreHorizontal className="size-5" /> Mais
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            >
              <SheetHeader>
                <SheetTitle className="font-heading">Mais do painel</SheetTitle>
              </SheetHeader>
              <nav className="grid grid-cols-2 gap-2 px-4">
                {moreNav.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <SheetClose asChild key={href}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                          active
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="size-4" /> {label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
              <Button
                variant="ghost"
                className="mx-4 mt-1 justify-start text-muted-foreground"
                onClick={logout}
              >
                <LogOut className="size-4" /> Sair
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
