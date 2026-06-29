import Link from "next/link";
import { whatsappLink } from "@/lib/config";
import { CrochetTrim, YarnBall } from "@/components/decor";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

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

          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Fale comigo</span>
            <a
              href={whatsappLink("Olá! Vim pelo site e gostaria de saber mais.")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary-foreground/75 hover:text-secondary-foreground"
            >
              WhatsApp
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-secondary-foreground/75 hover:text-secondary-foreground"
            >
              <InstagramIcon className="size-4" /> Instagram
            </a>
          </div>
        </div>

        <div className="border-t border-foreground/10 py-4 text-center text-xs text-secondary-foreground/60">
          © {new Date().getFullYear()} Kessler Art Crochê · feito à mão com 🧶
        </div>
      </div>
    </footer>
  );
}
