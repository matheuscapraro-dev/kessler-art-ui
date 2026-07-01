import Link from "next/link";
import { CrochetTrim, YarnBall } from "@/components/decor";
import { FooterContact } from "@/components/layout/footer-contact";

export function SiteFooter() {
  return (
    <footer className="mt-20">
      {/* casquinha de crochê */}
      <CrochetTrim className="text-secondary" />

      <div className="bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-10 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-heading text-lg font-semibold">
              <YarnBall className="size-5 text-primary" /> Kessler Art Crochê
            </p>
            <p className="mt-2 max-w-xs text-sm text-secondary-foreground/75">
              Peças feitas à mão, com alma e tempo. Amigurumis, mantas e decoração —
              prontos ou sob encomenda.
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Navegar</span>
            <Link href="/galeria" className="text-secondary-foreground/75 hover:text-secondary-foreground">Galeria</Link>
            <Link href="/loja" className="text-secondary-foreground/75 hover:text-secondary-foreground">Loja</Link>
            <Link href="/encomendar" className="text-secondary-foreground/75 hover:text-secondary-foreground">Fazer encomenda</Link>
            <Link href="/sobre" className="text-secondary-foreground/75 hover:text-secondary-foreground">Sobre</Link>
          </nav>

          <FooterContact />
        </div>

        <div className="border-t border-foreground/10 py-4 text-center text-xs text-secondary-foreground/60">
          © {new Date().getFullYear()} Kessler Art Crochê · feito à mão com 🧶
        </div>
      </div>
    </footer>
  );
}
