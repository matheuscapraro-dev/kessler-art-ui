"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Heart, LayoutDashboard, LogOut, Package, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { clearAccessTokenCache } from "@/lib/session-token";

/** Iniciais para o avatar (sem foto ou como fallback). */
function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Área de conta no header: "Entrar" deslogado, avatar + menu logado. */
export function UserMenu() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (status !== "authenticated") {
    return (
      <Button asChild variant="ghost" size="sm">
        {/* Depois do login, volta para onde a pessoa estava. */}
        <Link href={`/entrar?callbackUrl=${encodeURIComponent(pathname)}`}>
          <UserRound className="size-4" /> Entrar
        </Link>
      </Button>
    );
  }

  const isAdmin = session.user.role === "Admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Minha conta"
          className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xs font-semibold text-primary ring-offset-background transition-shadow hover:ring-2 hover:ring-primary/40 hover:ring-offset-1"
        >
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            initials(session.user.name)
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{session.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/conta">
            <UserRound className="size-4" /> Minha conta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/conta/pedidos">
            <Package className="size-4" /> Meus pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/conta/favoritos">
            <Heart className="size-4" /> Favoritos
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <LayoutDashboard className="size-4" /> Painel da artista
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            clearAccessTokenCache();
            void signOut({ callbackUrl: "/" });
          }}
        >
          <LogOut className="size-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
