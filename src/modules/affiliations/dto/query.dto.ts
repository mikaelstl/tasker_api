import { OrgRole } from "generated/prisma";

export interface AffiliationQuery {
  readonly id?:      string,
  readonly orgkey?:  string,
  readonly userkey?: string,
  readonly role?:    OrgRole,
}