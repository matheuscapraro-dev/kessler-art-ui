"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Heart, LogOut, Package, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { clearAccessTokenCache } from "@/lib/session-token";

const nav = [
  { href: "/conta", label: "Meu perfil", icon: UserRound, exact: true },
  { href: "/conta/pedidos", label: "Meus pedidos", icon: Package },
  { href: "/conta/favoritos", label: "Favoritos", icon: Heart },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      <PageHeader
        title="Minha conta"
        subtitle={session?.user?.name ? `Olá, ${session.user.name.split(" ")[0]}! 🧶` : undefined}
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 pb-16 md:grid-cols-[220px_1fr]">
        <aside className="h-fit space-y-1 md:sticky md:top-24">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {nav.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" /> {label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => {
              clearAccessTokenCache();
              void signOut({ callbackUrl: "/" });
            }}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
