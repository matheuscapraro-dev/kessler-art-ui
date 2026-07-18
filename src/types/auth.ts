/** Usuário autenticado, como o backend expõe em /api/auth/me (AuthUserDto). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profilePictureUrl: string | null;
  role: "Customer" | "Admin";
  emailVerified: boolean;
  hasPassword: boolean;
}

/** Resposta de login/registro/refresh do backend (AuthResultDto). */
export interface AuthResult {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken: string;
  user: AuthUser;
}
