import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { AuthResult } from "@/types/auth";

// Chamadas servidor→API usam INTERNAL_API_URL quando definida (loopback no VPS,
// sem passar pelo nginx); em dev cai na URL pública.
const API_URL =
  process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5120";

/** Converte a resposta do backend nos campos que guardamos no JWT do NextAuth. */
function tokenFromAuthResult(token: JWT, auth: AuthResult): JWT {
  return {
    ...token,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    accessTokenExpiresAt: Math.floor(new Date(auth.expiresAtUtc).getTime() / 1000),
    userId: auth.user.id,
    name: auth.user.name,
    email: auth.user.email,
    picture: auth.user.profilePictureUrl,
    role: auth.user.role,
    phone: auth.user.phone,
    emailVerified: auth.user.emailVerified,
    error: undefined,
  };
}

async function postAuth(path: string, body: unknown): Promise<AuthResult | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`Auth backend falhou (${path}): ${res.status}`);
      return null;
    }
    return (await res.json()) as AuthResult;
  } catch (error) {
    console.error(`Sem resposta do backend em ${path} — a API está no ar?`, error);
    return null;
  }
}

/** Sincroniza nome/telefone/verificação com o backend (gatilho update() do useSession). */
async function fetchCurrentUser(accessToken: string) {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok ? ((await res.json()) as AuthResult["user"]) : null;
  } catch {
    return null;
  }
}

// Sem credenciais do Google configuradas, o provider nem é registrado — e o
// front esconde o botão (via getProviders) em vez de mandar o clique pro erro.
const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: AuthOptions = {
  providers: [
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: { params: { scope: "openid email profile" } },
          }),
        ]
      : []),
    CredentialsProvider({
      id: "email-password",
      name: "E-mail e senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const res = await fetch(`${API_URL}/api/auth/email/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        });

        if (res.status === 429) {
          throw new Error("Muitas tentativas. Aguarde um minuto e tente de novo.");
        }
        if (!res.ok) {
          const problem = await res.json().catch(() => null);
          throw new Error(problem?.detail ?? "E-mail ou senha inválidos.");
        }

        const auth = (await res.json()) as AuthResult;
        // O objeto retornado chega ao callback jwt como `user`.
        return { id: auth.user.id, email: auth.user.email, name: auth.user.name, auth } as never;
      },
    }),
  ],
  pages: {
    signIn: "/entrar",
    error: "/entrar",
  },
  events: {
    // signOut destrói o cookie do NextAuth; aqui revogamos também a sessão no backend.
    async signOut({ token }) {
      if (!token.refreshToken) return;
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      }).catch(() => undefined); // melhor esforço — o token expira sozinho
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 24 * 60 * 60, // 60 dias — mesma vida do refresh token do backend
  },
  callbacks: {
    async jwt({ token, account, user, trigger }) {
      // ── Login Google: troca o id_token pelo par de tokens do backend ──
      if (account?.provider === "google" && account.id_token) {
        const auth = await postAuth("/api/auth/external", {
          provider: "Google",
          token: account.id_token,
        });
        return auth ? tokenFromAuthResult(token, auth) : { ...token, error: "BackendAuthError" as const };
      }

      // ── Login e-mail+senha: o authorize já trouxe os tokens ──────────
      if (account?.provider === "email-password" && user) {
        const auth = (user as unknown as { auth: AuthResult }).auth;
        return tokenFromAuthResult(token, auth);
      }

      // ── update() do cliente: ressincroniza perfil/verificação ────────
      if (trigger === "update" && token.accessToken) {
        const me = await fetchCurrentUser(token.accessToken);
        if (me) {
          token.name = me.name;
          token.phone = me.phone;
          token.picture = me.profilePictureUrl;
          token.emailVerified = me.emailVerified;
        }
        return token;
      }

      // ── Requests seguintes: renova o accessToken perto de expirar ────
      const expiresAt = token.accessTokenExpiresAt ?? 0;
      const shouldRefresh = Math.floor(Date.now() / 1000) >= expiresAt - 120; // buffer de 2 min
      if (token.refreshToken && shouldRefresh && !token.error) {
        const auth = await postAuth("/api/auth/refresh", { refreshToken: token.refreshToken });
        return auth ? tokenFromAuthResult(token, auth) : { ...token, error: "RefreshTokenExpired" as const };
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.accessTokenExpiresAt = token.accessTokenExpiresAt;
      session.error = token.error;
      if (session.user) {
        session.user.id = token.userId ?? "";
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.role = token.role ?? "Customer";
        session.user.phone = token.phone ?? null;
        session.user.emailVerified = token.emailVerified ?? false;
      }
      return session;
    },
  },
};
