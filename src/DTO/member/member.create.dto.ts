import { $Enums } from "generated/prisma";

export interface DefineMemberDTO {
  readonly project: string;
  readonly user: string;
  readonly role?: $Enums.MemberRole;
}