import { OrgRole } from "generated/prisma";

export interface AffiliationEditDTO {
  readonly orgkey?:  string,
  readonly userkey?: string,
  readonly role?:    OrgRole,
}