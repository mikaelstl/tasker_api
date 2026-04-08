import { OrgRole } from "generated/prisma";

export type JWTPayload = {
  sub: string,
  username: string,
  role: OrgRole | null
};