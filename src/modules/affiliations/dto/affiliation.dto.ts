import { OrgRole } from "generated/prisma";

export type AffiliationDTO = {
  id:      string,
  orgkey:  string,
  userkey: string,
  role:    OrgRole,
}