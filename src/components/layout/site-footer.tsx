import Link from "next/link";
import { config, whatsappLink } from "@/lib/config";

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
    <footer className="mt-16 border-t border-border/60 bg-secondary/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="font-heading text-lg font-semibold">Kessler Art Crochê</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Peças feitas à mão, com alma e tempo. Amigurumis, mantas e decoração —
            prontos ou sob encomenda.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Navegar</span>
          <Link href="/galeria" className="text-muted-foreground hover:text-foreground">Galeria</Link>
          <Link href="/loja" className="text-muted-foreground hover:text-foreground">Loja</Link>
          <Link href="/encomendar" className="text-muted-foreground hover:text-foreground">Fazer encomenda</Link>
          <Link href="/sobre" className="text-muted-foreground hover:text-foreground">Sobre</Link>
        </nav>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Fale comigo</span>
          <a
            href={whatsappLink("Olá! Vim pelo site e gostaria de saber mais.")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            WhatsApp
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <InstagramIcon className="size-4" /> Instagram
          </a>
        </div>
      </div>

      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Kessler Art Crochê · feito à mão {config.whatsapp ? "" : ""}
      </div>
    </footer>
  );
}
