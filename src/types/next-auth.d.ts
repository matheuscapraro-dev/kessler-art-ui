import type { DefaultSession } from "next-auth";
import type { AuthUser } from "./auth";

/** Campos extras que o callback jwt/session injeta na sessão do NextAuth. */
declare module "next-auth" {
  interface Session {
    /** JWT do backend .NET — vai no Authorization das chamadas à API. */
    accessToken?: string;
    /** Expiração do accessToken em epoch (segundos) — guia o cache do api-client. */
    accessTokenExpiresAt?: number;
    /** Setado quando o refresh falhou — o cliente deve encerrar a sessão. */
    error?: "RefreshTokenExpired" | "BackendAuthError";
    user: DefaultSession["user"] & Pick<AuthUser, "id" | "phone" | "role" | "emailVerified">;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    userId?: string;
    role?: AuthUser["role"];
    phone?: string | null;
    emailVerified?: boolean;
    error?: "RefreshTokenExpired" | "BackendAuthError";
  }
}
