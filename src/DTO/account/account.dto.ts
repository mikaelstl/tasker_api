import { AccountRole } from "generated/prisma";

export interface AccountDTO {
  readonly id?: string;
  readonly email: string;
  readonly password: string;
  readonly role: AccountRole
}