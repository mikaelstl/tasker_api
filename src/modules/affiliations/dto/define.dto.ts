import { OrgRole } from "generated/prisma"

export interface DefineAffiliationDTO {
  orgkey: string
  userkey: string
  role?: OrgRole
}