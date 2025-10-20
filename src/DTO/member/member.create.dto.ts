import { $Enums } from "generated/prisma";

export interface DefineProjectMember {
  readonly project: string;
  readonly user: string;
  readonly role?: $Enums.MemberRole;
}