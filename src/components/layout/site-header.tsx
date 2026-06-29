"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Menu, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { YarnBall } from "@/components/decor";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/galeria", label: "Galeria" },
  { href: "/loja", label: "Loja" },
  { href: "/encomendar", label: "Encomendar" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <YarnBall className="size-7 shrink-0 text-primary" />
          <span className="flex flex-col leading-none">
            <span className="font-heading text-xl font-semibold tracking-tight text-foreground">
              Kessler
            </span>
            <span className="text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">
              art crochê
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith(link.href) && "text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="Carrinho">
            <Link href="/carrinho">
              <ShoppingBag />
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground"
                >
                  {count}
                </motion.span>
              )}
            </Link>
          </Button>

          <Button asChild className="hidden md:inline-flex">
            <Link href="/encomendar">Fazer encomenda</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-heading">Kessler Art Crochê</SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
                <Button asChild className="mt-3">
                  <Link href="/encomendar">Fazer encomenda</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
