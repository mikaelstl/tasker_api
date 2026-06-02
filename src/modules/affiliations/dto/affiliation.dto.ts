import { OrganizationDTO } from "@modules/organization/dto/organization.dto";
import { OrgRole } from "generated/prisma";

export interface AffiliationDTO {
  readonly id:      string,
  readonly orgkey:  string,
  readonly userkey: string,
  readonly org?: OrganizationDTO,
  readonly user?: OrganizationDTO,
  role:    OrgRole,
}