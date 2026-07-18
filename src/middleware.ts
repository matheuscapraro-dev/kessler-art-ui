import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

/**
 * Proteção de rotas no edge (antes de renderizar qualquer página):
 * - /conta/**            → exige sessão;
 * - /admin/**            → exige sessão com papel Admin (exceto /admin/login);
 * - /entrar, /cadastrar  → quem já está logado não vê tela de login;
 * - /admin/login         → admin logado vai direto ao painel.
 * A API valida o JWT de novo em cada chamada — aqui é só UX/roteamento.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith("/conta")) {
    if (!token) {
      const login = new URL("/entrar", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  if (pathname === "/entrar" || pathname === "/cadastrar") {
    if (token) {
      const dest = safeCallbackUrl(searchParams.get("callbackUrl"));
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    if (token?.role === "Admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "Admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/conta/:path*", "/admin/:path*", "/entrar", "/cadastrar"],
};
