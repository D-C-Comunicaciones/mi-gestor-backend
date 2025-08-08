export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  permissions: string[];
  jti: string;
}