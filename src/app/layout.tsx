import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const sans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Serif de display para títulos — dá o ar artesanal/elegante.
const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Kessler Art Crochê — peças feitas à mão",
    template: "%s · Kessler Art Crochê",
  },
  description:
    "Peças de crochê feitas à mão por Kessler: amigurumis, mantas e decoração. Compre prontos ou faça uma encomenda sob medida.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Kessler Art Crochê",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${sans.variable} ${heading.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
