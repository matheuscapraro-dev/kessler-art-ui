export interface AuthResult {
  token: string;
  expiresAtUtc: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminUser {
  name: string;
  email: string;
}
