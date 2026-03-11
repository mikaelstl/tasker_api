import { AccountRole } from "generated/prisma";

export type JWTPayload = {
  sub: string,
  username: string,
  role: AccountRole
};