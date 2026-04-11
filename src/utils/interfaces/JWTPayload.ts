import { OrgRole } from "generated/prisma";

export interface JWTPayload {
  readonly sub: string,
  readonly username: string
};