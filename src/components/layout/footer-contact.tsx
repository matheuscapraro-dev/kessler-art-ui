"use client";

import { whatsappLink } from "@/lib/config";
import { useSiteContent } from "@/components/content-provider";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/** Links de contato do rodapé — WhatsApp e Instagram vêm do conteúdo gerenciável. */
export function FooterContact() {
  const content = useSiteContent();
  const instagram = content?.instagramUrl?.trim();

  return (
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
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-secondary-foreground/75 hover:text-secondary-foreground"
        >
          <InstagramIcon className="size-4" /> Instagram
        </a>
      )}
    </div>
  );
}
