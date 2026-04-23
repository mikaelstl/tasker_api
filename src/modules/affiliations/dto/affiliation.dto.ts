import { OrgRole } from "generated/prisma";

export interface AffiliationDTO {
  readonly id:      string,
  readonly orgkey:  string,
  readonly userkey: string,
  role:    OrgRole,
}